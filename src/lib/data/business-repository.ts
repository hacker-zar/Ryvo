import { cache } from "react";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  supabase,
  supabaseAdmin,
} from "@/lib/supabase";
import {
  Booking,
  Business,
  BusinessProfile,
  BusinessStats,
  Client,
  ClientBookingHistoryItem,
  ClientProfile,
  Location,
  Opportunity,
  Product,
  Professional,
  ProfessionalWithServices,
  Service,
  Template,
} from "@/types/business";
import {
  demoBookings,
  demoBusiness,
  demoClients,
  demoLocations,
  demoProducts,
  demoProfessionalServiceIds,
  demoProfessionals,
  demoReviews,
  demoServices,
} from "@/lib/data/demo-business";
import {
  intervalsOverlap,
  timeToMinutes,
  virtualLocationFromBusiness,
} from "@/lib/availability";
import { computeBusinessStats } from "@/lib/stats";
import { detectOpportunities } from "@/lib/opportunities";

// Todas las columnas públicas de `businesses`, es decir todas MENOS
// admin_password_hash. Se usa en cualquier lectura cuyo resultado pueda
// terminar como prop de un Client Component (formularios del admin, sitio
// público) — nunca hay que hacer select("*") sobre businesses fuera de las
// funciones de autenticación de más abajo, porque el hash terminaría
// serializado en el HTML/RSC payload aunque ningún componente lo muestre.
const BUSINESS_PUBLIC_COLUMNS =
  "id, name, slug, description, logo, primary_color, secondary_color, whatsapp, instagram, address, phone, email, city, hero_image, gallery, about_image, opening_hours, background_color, text_color, typography_preset, button_style, business_type, onboarding_step, published, favicon, hero_video, hero_video_enabled, hero_video_position, single_specialist_mode, section_order, animation_preset, template_id, template_layout, palette_id, created_at";

/**
 * Punto único de acceso a datos de negocio.
 *
 * Si Supabase está configurado (variables de entorno presentes), consulta
 * la base de datos real. Si no, devuelve los datos de demostración locales.
 * Así el resto de la app (páginas y componentes) no necesita saber de
 * dónde vienen los datos.
 */
export async function getBusinessProfile(
  slug: string
): Promise<BusinessProfile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(BUSINESS_PUBLIC_COLUMNS)
      .eq("slug", slug)
      .single();

    if (businessError || !business) return null;

    const [
      { data: services },
      { data: reviews },
      { data: locations },
      { data: professionals },
      { data: products },
    ] = await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("business_id", business.id)
        .eq("active", true),
      supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("locations")
        .select("*")
        .eq("business_id", business.id)
        .order("is_primary", { ascending: false }),
      // Trae professional_services embebido en la misma consulta (en vez
      // de una segunda query aparte, ver mapProfessionalsWithServices) —
      // evita un round-trip extra a Supabase que antes se pagaba en cada
      // carga del sitio público de cada negocio.
      supabase
        .from("professionals")
        .select("*, professional_services(service_id)")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
      // Mismo criterio que servicios/profesionales: la web pública solo
      // muestra productos activos (ver Product.active, sumado junto con
      // el Editor rápido) — listProductsByBusiness (admin) trae todos,
      // activos e inactivos, para poder reactivarlos.
      supabase
        .from("products")
        .select("*")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("created_at", { ascending: true }),
    ]);

    return {
      business,
      services: services ?? [],
      reviews: reviews ?? [],
      // Si el negocio todavía no cargó locales explícitos, usamos su
      // horario legado como un único local virtual, para no romper
      // negocios existentes creados antes de esta funcionalidad.
      locations:
        locations && locations.length > 0
          ? locations
          : [virtualLocationFromBusiness(business)],
      professionals: mapProfessionalsWithServices(professionals ?? []),
      products: products ?? [],
    };
  }

  // Modo demo: solo respondemos para el slug de demostración.
  if (slug === demoBusiness.slug) {
    return {
      business: demoBusiness,
      services: demoServices,
      reviews: demoReviews,
      locations: demoLocations,
      professionals: demoProfessionals.map((p) => ({
        ...p,
        service_ids: demoProfessionalServiceIds[p.id] ?? [],
      })),
      products: demoProducts,
    };
  }

  return null;
}

/** Reordena la fila que devuelve Supabase con `professional_services`
 *  embebido (`select("*, professional_services(service_id)")`) a la forma
 *  `ProfessionalWithServices` que usa el resto de la app — sin ningún
 *  round-trip propio, ya viene todo en la misma consulta. Vacío = califica
 *  para todos los servicios (ver regla de compatibilidad en la migración). */
function mapProfessionalsWithServices(
  rows: (Professional & { professional_services?: { service_id: string }[] | null })[]
): ProfessionalWithServices[] {
  return rows.map((row) => {
    const { professional_services, ...professional } = row;
    return {
      ...professional,
      service_ids: (professional_services ?? []).map((link) => link.service_id),
    };
  });
}

/**
 * Devuelve las reservas activas (no canceladas) para un negocio/local/fecha,
 * usadas para calcular qué horarios ya están ocupados.
 *
 * `professionalId`, si se pasa, acota a las reservas de ESE profesional (o
 * sin profesional asignado — el "OR IS NULL" es un puente de compatibilidad:
 * una reserva vieja sin professional_id bloquea conservadoramente a
 * cualquier profesional, hasta que pase su fecha o se cancele). Sin
 * `professionalId`, el comportamiento es idéntico al de siempre.
 *
 * `excludeBookingId`, si se pasa, excluye esa reserva puntual — usado por
 * reprogramar, para que el propio horario actual no se vea como ocupado.
 */
export async function getBookedSlots(
  businessId: string,
  locationId: string | null,
  date: string,
  professionalId?: string,
  excludeBookingId?: string
): Promise<Pick<Booking, "time" | "status" | "duration_min">[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("bookings")
      .select("time, status, duration_min")
      .eq("business_id", businessId)
      .eq("date", date)
      .neq("status", "cancelled");

    // location_id puede ser null (negocio sin locales explícitos todavía);
    // en ese caso solo hay un local virtual y comparamos por null.
    query = locationId
      ? query.eq("location_id", locationId)
      : query.is("location_id", null);

    if (professionalId) {
      query = query.or(
        `professional_id.eq.${professionalId},professional_id.is.null`
      );
    }
    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { data } = await query;
    return data ?? [];
  }

  // Modo demo: la disponibilidad de reserva se mantiene siempre abierta a
  // propósito (igual que hoy) — demoBookings existe para estadísticas/CRM,
  // no para bloquear horarios de un visitante probando el wizard.
  return [];
}

/** Variante de `getBookedSlots` para "cualquiera disponible": una sola
 *  consulta (no N) que arma un mapa profesional→sus reservas del día,
 *  para poder unir disponibilidades sin round-trips por profesional. */
export async function getBookedSlotsForProfessionals(
  businessId: string,
  locationId: string | null,
  date: string,
  professionalIds: string[]
): Promise<Map<string, Pick<Booking, "time" | "status" | "duration_min">[]>> {
  const result = new Map<string, Pick<Booking, "time" | "status" | "duration_min">[]>();
  if (professionalIds.length === 0) return result;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("bookings")
      .select("time, status, duration_min, professional_id")
      .eq("business_id", businessId)
      .eq("date", date)
      .neq("status", "cancelled");
    query = locationId
      ? query.eq("location_id", locationId)
      : query.is("location_id", null);

    const { data } = await query;
    const rows = data ?? [];
    // Una reserva sin profesional asignado bloquea conservadoramente a
    // todos — mismo criterio que el "OR IS NULL" de getBookedSlots.
    const untagged = rows.filter((r) => !r.professional_id);
    for (const id of professionalIds) {
      const own = rows.filter((r) => r.professional_id === id);
      result.set(id, [...own, ...untagged]);
    }
    return result;
  }

  for (const id of professionalIds) result.set(id, []);
  return result;
}

/** ¿`professionalId` puede realizar `serviceId`? Mismo criterio de
 *  compatibilidad que `listQualifiedProfessionals`: sin ninguna fila en
 *  `professional_services`, califica para todo. Usada por
 *  `adminUpdateService` para autorizar a una cuenta "worker" (Editor
 *  rápido) — nunca confiar en qué servicios dice mostrar la UI, esto es
 *  la verificación real contra la base. */
export async function isProfessionalQualifiedForService(
  professionalId: string,
  serviceId: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from("professional_services")
    .select("service_id")
    .eq("professional_id", professionalId);
  const ids = (data ?? []).map((row) => row.service_id);
  return ids.length === 0 || ids.includes(serviceId);
}

/** Servicios que un profesional puntual tiene asignados — para el Editor
 *  rápido (categoría Servicios). Mismo criterio de compatibilidad que
 *  arriba: sin ninguna fila explícita, se le muestran TODOS los
 *  servicios del negocio (calificado para todo). */
export async function listServicesForProfessional(
  businessId: string,
  professionalId: string
): Promise<Service[]> {
  const services = await listServicesByBusiness(businessId);
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return services;
  const { data } = await supabaseAdmin
    .from("professional_services")
    .select("service_id")
    .eq("professional_id", professionalId);
  const assignedIds = (data ?? []).map((row) => row.service_id);
  if (assignedIds.length === 0) return services;
  return services.filter((s) => assignedIds.includes(s.id));
}

/** Profesionales activos que pueden realizar `serviceId` — sin ninguna fila
 *  en `professional_services` califica para todo (compatibilidad hacia
 *  atrás, ver comentario de la migración). Ordenados por display_order. */
export async function listQualifiedProfessionals(
  businessId: string,
  serviceId: string
): Promise<Professional[]> {
  if (isSupabaseConfigured && supabase) {
    // Mismo embed que listProfessionalsByBusiness/getBusinessProfile — una
    // sola consulta en vez de profesionales + professional_services por
    // separado. Esta función está en el camino crítico de la reserva
    // pública (paso "profesional" y resolveAnyProfessional), así que el
    // round-trip extra se sentía en cada click, no solo en el admin.
    const { data: professionals } = await supabase
      .from("professionals")
      .select("*, professional_services(service_id)")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (!professionals || professionals.length === 0) return [];

    return professionals
      .filter((p) => {
        const ids = (p.professional_services ?? []).map(
          (link: { service_id: string }) => link.service_id
        );
        return ids.length === 0 || ids.includes(serviceId);
      })
      .map((p) => {
        const { professional_services, ...rest } = p;
        void professional_services;
        return rest;
      });
  }

  const demoQualified = demoProfessionals
    .filter((p) => p.active)
    .filter((p) => {
      const ids = demoProfessionalServiceIds[p.id] ?? [];
      return ids.length === 0 || ids.includes(serviceId);
    });
  return businessId === demoBusiness.id ? demoQualified : [];
}

/** Duración real de un servicio (minutos), con fallback conservador si no
 *  se encuentra — usada al persistir/chequear reservas server-side, nunca
 *  confiando en un valor que pudiera mandar el cliente. */
async function getServiceDuration(serviceId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 30;
  const { data } = await supabase
    .from("services")
    .select("duration")
    .eq("id", serviceId)
    .maybeSingle();
  return data?.duration ?? 30;
}

/** Resuelve "cualquiera disponible" a UN profesional real, server-side, en
 *  el momento de confirmar — nunca se inserta una reserva con un
 *  profesional ambiguo. Primer calificado libre en ese horario exacto (sin
 *  que su intervalo real se solape con ninguna reserva existente), por
 *  display_order. Si dos clientes compiten por el mismo horario/último
 *  profesional libre, el segundo insert choca contra el constraint de
 *  exclusión de la base y usa el mismo manejo de conflicto que ya existe
 *  en createBooking. */
export async function resolveAnyProfessional(
  businessId: string,
  serviceId: string,
  locationId: string | null,
  date: string,
  time: string
): Promise<string | null> {
  const [qualified, durationMin] = await Promise.all([
    listQualifiedProfessionals(businessId, serviceId),
    getServiceDuration(serviceId),
  ]);
  const startMin = timeToMinutes(time);
  for (const professional of qualified) {
    const booked = await getBookedSlots(
      businessId,
      locationId,
      date,
      professional.id
    );
    const taken = booked.some((b) =>
      intervalsOverlap(
        startMin,
        durationMin,
        timeToMinutes(b.time.slice(0, 5)),
        b.duration_min
      )
    );
    if (!taken) return professional.id;
  }
  return null;
}

/** Crea o actualiza el registro de `clients` correspondiente a esta
 *  reserva (match por business_id+customer_phone). Usa supabaseAdmin
 *  aunque la reserva en sí se inserte con el cliente anon público —
 *  excepción deliberada y documentada al patrón "solo admin toca
 *  clients": el dato (nombre/teléfono/email) ya fluye igual de expuesto
 *  a `bookings` bajo la misma política pública hoy, así que espejarlo acá
 *  no abre superficie nueva. Nunca debe romper la reserva si falla. */
async function upsertClientForBooking(input: {
  business_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
}): Promise<string | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id, name, email")
      .eq("business_id", input.business_id)
      .eq("phone", input.customer_phone)
      .maybeSingle();

    if (existingClient) {
      if (
        existingClient.name !== input.customer_name ||
        existingClient.email !== (input.customer_email ?? null)
      ) {
        await supabaseAdmin
          .from("clients")
          .update({
            name: input.customer_name,
            email: input.customer_email ?? null,
          })
          .eq("id", existingClient.id);
      }
      return existingClient.id;
    }

    const { data: created } = await supabaseAdmin
      .from("clients")
      .insert({
        business_id: input.business_id,
        name: input.customer_name,
        phone: input.customer_phone,
        email: input.customer_email ?? null,
      })
      .select("id")
      .single();
    return created?.id ?? null;
  } catch {
    return null;
  }
}

export async function createBooking(
  booking: Omit<
    Booking,
    "id" | "created_at" | "updated_at" | "status" | "client_id" | "duration_min"
  >
): Promise<{
  success: boolean;
  error?: string;
  conflict?: boolean;
  id?: string;
}> {
  if (isSupabaseConfigured && supabase) {
    // La duración se busca server-side por service_id — nunca se confía
    // en un valor de duración que pudiera mandar el cliente (un valor
    // falso podría colar una reserva que en los hechos ocupa más tiempo
    // del que declara, rompiendo la garantía de no-solapamiento para
    // TODOS los demás).
    const durationMin = await getServiceDuration(booking.service_id);
    const startMin = timeToMinutes(booking.time);

    // Chequeo de disponibilidad antes de insertar, ahora por intervalo
    // real [inicio, fin) y no solo por hora exacta. No es 100% atómico
    // (podría haber una carrera entre el check y el insert), por eso el
    // schema también tiene un constraint de exclusión (bookings_no_overlap)
    // que rechaza el solapamiento a nivel de base de datos como defensa
    // final. `conflict: true` distingue este caso puntual de cualquier
    // otro error — el wizard de reserva lo usa para volver a elegir
    // horario en vez de solo mostrar un mensaje genérico.
    const existing = await getBookedSlots(
      booking.business_id,
      booking.location_id,
      booking.date,
      booking.professional_id ?? undefined
    );
    const alreadyTaken = existing.some((b) =>
      intervalsOverlap(
        startMin,
        durationMin,
        timeToMinutes(b.time.slice(0, 5)),
        b.duration_min
      )
    );
    if (alreadyTaken) {
      return {
        success: false,
        conflict: true,
        error: "Ese horario ya fue reservado. Elegí otro.",
      };
    }

    const clientId = await upsertClientForBooking({
      business_id: booking.business_id,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email,
    });

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...booking,
        duration_min: durationMin,
        status: "pending",
        client_id: clientId,
      })
      .select("id")
      .single();

    if (error) {
      // 23505 = unique_violation (legado), 23P01 = exclusion_violation
      // (bookings_no_overlap) — cualquiera de los dos significa que, pese
      // al chequeo previo, otra reserva ganó la carrera.
      if (error.code === "23505" || error.code === "23P01") {
        return {
          success: false,
          conflict: true,
          error: "Ese horario ya fue reservado. Elegí otro.",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  }

  // Modo demo: no hay persistencia real, simulamos éxito.
  console.log("[demo] Reserva simulada:", booking);
  return { success: true, id: `demo-${Date.now()}` };
}

// ---------------------------------------------------------------------
// Operaciones de administración (usadas por /admin).
// Usan supabaseAdmin (service role key) porque estas escrituras están
// protegidas por la sesión de admin (contraseña), no por RLS — RLS solo
// permite lectura pública y creación de bookings/reviews desde el sitio.
// Requieren Supabase configurado: en modo demo no hay dónde persistir.
// ---------------------------------------------------------------------

export async function listBusinesses(): Promise<Business[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("businesses")
      .select(BUSINESS_PUBLIC_COLUMNS)
      .order("created_at", { ascending: false });
    return data ?? [];
  }
  return [demoBusiness];
}

// cache() dedupea llamadas con el mismo id dentro de un mismo request —
// el layout de /admin/negocios/[id] y cada page.tsx debajo llaman a esta
// misma función; sin el wrapper, cada navegación pagaba esta consulta
// (una de las más lentas medidas: ~250-850ms) dos veces.
export const getBusinessById = cache(
  async (id: string): Promise<Business | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from("businesses")
        .select(BUSINESS_PUBLIC_COLUMNS)
        .eq("id", id)
        .single();
      return data ?? null;
    }
    return id === demoBusiness.id ? demoBusiness : null;
  }
);

/** Lookup mínimo (id + name), público, usado para el flujo de login
 *  escopeado a un negocio ("¿Trabajás aquí?" → /admin/entrar?from=slug). */
export async function getBusinessIdBySlug(
  slug: string
): Promise<{ id: string; name: string } | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("slug", slug)
      .single();
    return data ?? null;
  }
  return slug === demoBusiness.slug
    ? { id: demoBusiness.id, name: demoBusiness.name }
    : null;
}

// La autenticación por negocio (admin_password_hash) fue reemplazada por el
// sistema de cuentas — ver src/lib/data/accounts-repository.ts. La columna
// admin_password_hash queda deprecada en la base (sin dropear, migración no
// destructiva) pero ningún código nuevo debe leerla ni escribirla.

export async function listServicesByBusiness(
  businessId: string
): Promise<Service[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .order("name", { ascending: true });
    return data ?? [];
  }
  return businessId === demoBusiness.id ? demoServices : [];
}

export type BusinessInput = Omit<Business, "id" | "created_at">;

export async function createBusiness(
  input: BusinessInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder crear negocios.",
    };
  }
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .insert(input)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function updateBusiness(
  id: string,
  input: Partial<BusinessInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder editar negocios.",
    };
  }
  const { error } = await supabaseAdmin
    .from("businesses")
    .update(input)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export type ServiceInput = Omit<Service, "id">;

export async function createService(
  input: ServiceInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder crear servicios.",
    };
  }
  const { error } = await supabaseAdmin.from("services").insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateService(
  id: string,
  input: Partial<ServiceInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder editar servicios.",
    };
  }
  const { error } = await supabaseAdmin
    .from("services")
    .update(input)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder borrar servicios.",
    };
  }
  const { error } = await supabaseAdmin.from("services").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------
// Catálogo de productos — gestionado desde /admin, mismo criterio que
// Servicios (RLS de solo lectura pública, toda escritura vía
// supabaseAdmin). Usado tanto por el panel del editor (lista completa,
// sin filtro) como, indirectamente, por getBusinessProfile de arriba
// (que trae los mismos datos pero como parte de una sola consulta
// paralela — ver comentario ahí).
// ---------------------------------------------------------------------

export async function listProductsByBusiness(
  businessId: string
): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });
    return data ?? [];
  }
  return businessId === demoBusiness.id ? demoProducts : [];
}

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

export async function createProduct(
  input: ProductInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder crear productos.",
    };
  }
  const { error } = await supabaseAdmin.from("products").insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder editar productos.",
    };
  }
  // No hay trigger de `updated_at` en este esquema (ver convención del
  // resto de las tablas) — se setea acá a mano, en cada escritura real.
  const { error } = await supabaseAdmin
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder borrar productos.",
    };
  }
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------
// Profesionales (equipo), gestionados desde /admin. Ligados al flujo de
// reservas vía Booking.professional_id y a servicios vía
// professional_services (ver attachServiceIds/listQualifiedProfessionals).
// ---------------------------------------------------------------------

export async function listProfessionalsByBusiness(
  businessId: string
): Promise<ProfessionalWithServices[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("professionals")
      .select("*, professional_services(service_id)")
      .eq("business_id", businessId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    return mapProfessionalsWithServices(data ?? []);
  }
  return businessId === demoBusiness.id
    ? demoProfessionals.map((p) => ({
        ...p,
        service_ids: demoProfessionalServiceIds[p.id] ?? [],
      }))
    : [];
}

export type ProfessionalInput = Omit<
  Professional,
  "id" | "created_at" | "display_order"
>;

/** Reemplaza las filas de `professional_services` de un profesional por el
 *  set nuevo — borra e inserta, simple y correcto para un checklist chico
 *  (no hace falta diff). */
async function replaceProfessionalServices(
  professionalId: string,
  serviceIds: string[]
) {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId);
  if (serviceIds.length > 0) {
    await supabaseAdmin.from("professional_services").insert(
      serviceIds.map((service_id) => ({
        professional_id: professionalId,
        service_id,
      }))
    );
  }
}

export async function createProfessional(
  input: ProfessionalInput,
  serviceIds: string[] = []
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder crear profesionales.",
    };
  }
  const { data: maxOrderRow } = await supabaseAdmin
    .from("professionals")
    .select("display_order")
    .eq("business_id", input.business_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const displayOrder = (maxOrderRow?.display_order ?? -1) + 1;

  const { data: created, error } = await supabaseAdmin
    .from("professionals")
    .insert({ ...input, display_order: displayOrder })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  await replaceProfessionalServices(created.id, serviceIds);
  return { success: true };
}

export async function updateProfessional(
  id: string,
  input: Partial<ProfessionalInput>,
  serviceIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder editar profesionales.",
    };
  }
  const { error } = await supabaseAdmin
    .from("professionals")
    .update(input)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  if (serviceIds) await replaceProfessionalServices(id, serviceIds);
  return { success: true };
}

/** Sube o baja un profesional en el orden de aparición, intercambiando
 *  display_order con el vecino inmediato — sin drag-and-drop. */
export async function reorderProfessional(
  businessId: string,
  professionalId: string,
  direction: "up" | "down"
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder reordenar profesionales.",
    };
  }
  const { data: professionals } = await supabaseAdmin
    .from("professionals")
    .select("id, display_order")
    .eq("business_id", businessId)
    .order("display_order", { ascending: true });
  if (!professionals) return { success: false, error: "No se encontraron profesionales." };

  const index = professionals.findIndex((p) => p.id === professionalId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= professionals.length) {
    return { success: true }; // ya está en el extremo, no hay nada que hacer
  }

  const current = professionals[index];
  const neighbor = professionals[swapIndex];
  await Promise.all([
    supabaseAdmin
      .from("professionals")
      .update({ display_order: neighbor.display_order })
      .eq("id", current.id),
    supabaseAdmin
      .from("professionals")
      .update({ display_order: current.display_order })
      .eq("id", neighbor.id),
  ]);
  return { success: true };
}

export async function deleteProfessional(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder borrar profesionales.",
    };
  }
  const { error } = await supabaseAdmin
    .from("professionals")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------
// Locales (locations) — horarios y sucursales, gestionados desde /admin.
// ---------------------------------------------------------------------

export async function listLocationsByBusiness(
  businessId: string
): Promise<Location[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("business_id", businessId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    return data ?? [];
  }
  return businessId === demoBusiness.id ? demoLocations : [];
}

export type LocationInput = Omit<Location, "id" | "created_at">;

export async function createLocation(
  input: LocationInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder crear locales.",
    };
  }
  const { error } = await supabaseAdmin.from("locations").insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateLocation(
  id: string,
  input: Partial<LocationInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder editar locales.",
    };
  }
  const { error } = await supabaseAdmin
    .from("locations")
    .update(input)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteLocation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder borrar locales.",
    };
  }
  const { error } = await supabaseAdmin.from("locations").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------
// Turnos (bookings) — vistos y gestionados desde /admin.
// ---------------------------------------------------------------------

/** Una reserva con el nombre del servicio y del local ya resueltos, lista
 *  para mostrar en la lista de turnos del admin sin otro round-trip. */
export interface BookingWithDetails extends Booking {
  service_name: string;
  location_name: string;
}

export async function listBookingsByBusiness(
  businessId: string,
  date?: string
): Promise<BookingWithDetails[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    if (businessId !== demoBusiness.id) return [];
    const serviceNames = new Map(demoServices.map((s) => [s.id, s.name]));
    const locationNames = new Map(demoLocations.map((l) => [l.id, l.name]));
    return demoBookings
      .filter((b) => !date || b.date === date)
      .map((b) => ({
        ...b,
        service_name: serviceNames.get(b.service_id) ?? "Servicio eliminado",
        location_name: b.location_id
          ? (locationNames.get(b.location_id) ?? "Local eliminado")
          : "Local único",
      }));
  }

  let query = supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (date) query = query.eq("date", date);

  const { data: bookings } = await query;
  if (!bookings || bookings.length === 0) return [];

  const [{ data: services }, { data: locations }] = await Promise.all([
    supabaseAdmin
      .from("services")
      .select("id, name")
      .eq("business_id", businessId),
    supabaseAdmin
      .from("locations")
      .select("id, name")
      .eq("business_id", businessId),
  ]);

  const serviceNames = new Map(
    (services ?? []).map((s: { id: string; name: string }) => [s.id, s.name])
  );
  const locationNames = new Map(
    (locations ?? []).map((l: { id: string; name: string }) => [l.id, l.name])
  );

  return bookings.map((b) => ({
    ...b,
    service_name: serviceNames.get(b.service_id) ?? "Servicio eliminado",
    location_name: b.location_id
      ? (locationNames.get(b.location_id) ?? "Local eliminado")
      : "Local único",
  }));
}

export async function updateBookingStatus(
  id: string,
  status: "confirmed" | "completed" | "cancelled" | "no_show"
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder gestionar turnos.",
    };
  }
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------
// Gestión pública de un turno puntual — cancelar/reprogramar. El `id` de
// la reserva (UUID, no adivinable) es el único token de acceso: no hay
// sesión de cliente, así que poseer el link ES la autorización, igual que
// hoy no existe ninguna otra forma de referenciar una reserva ajena.
// Usan supabaseAdmin porque no hay política pública de UPDATE en bookings.
// ---------------------------------------------------------------------

export interface PublicBooking extends Booking {
  business_slug: string;
  business_name: string;
  service_name: string;
  service_duration: number;
  professional_name: string | null;
}

/** Búsqueda pública de una reserva por id, con el negocio/servicio/
 *  profesional ya resueltos para no requerir otro round-trip en la página
 *  de gestión del turno. `null` si no existe. */
export async function getBookingById(
  id: string
): Promise<PublicBooking | null> {
  if (!isSupabaseConfigured || !supabase) {
    const demo = demoBookings.find((b) => b.id === id);
    if (!demo) return null;
    const service = demoServices.find((s) => s.id === demo.service_id);
    const professional = demoProfessionals.find(
      (p) => p.id === demo.professional_id
    );
    return {
      ...demo,
      business_slug: demoBusiness.slug,
      business_name: demoBusiness.name,
      service_name: service?.name ?? "Servicio eliminado",
      service_duration: service?.duration ?? 30,
      professional_name: professional?.name ?? null,
    };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return null;

  const [{ data: business }, { data: service }, { data: professional }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("slug, name")
        .eq("id", booking.business_id)
        .maybeSingle(),
      supabase
        .from("services")
        .select("name, duration")
        .eq("id", booking.service_id)
        .maybeSingle(),
      booking.professional_id
        ? supabase
            .from("professionals")
            .select("name")
            .eq("id", booking.professional_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  if (!business) return null;

  return {
    ...booking,
    business_slug: business.slug,
    business_name: business.name,
    service_name: service?.name ?? "Servicio eliminado",
    service_duration: service?.duration ?? 30,
    professional_name: professional?.name ?? null,
  };
}

export async function cancelBookingById(
  id: string
): Promise<{ success: boolean; error?: string }> {
  // Modo demo real (sin Supabase configurado en absoluto): no hay nada
  // que cancelar de verdad, simulamos éxito — mismo criterio que
  // createBooking. Pero si HAY Supabase real conectado y solo falta la
  // service role key, no podemos escribir: hay que decirlo, no fingir
  // éxito — lo contrario dejaría al cliente creyendo que canceló un
  // turno que en realidad sigue activo en la base.
  if (!isSupabaseConfigured) {
    return { success: true };
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder cancelar turnos.",
    };
  }
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rescheduleBookingById(
  id: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string; conflict?: boolean }> {
  if (!isSupabaseConfigured) {
    return { success: true }; // modo demo real
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder reprogramar turnos.",
    };
  }
  const booking = await getBookingById(id);
  if (!booking) return { success: false, error: "Turno no encontrado." };

  // Usa la duración YA PERSISTIDA de la propia reserva (no la duración
  // actual del servicio) — reprogramar conserva la duración original con
  // la que se reservó, coherente con que duration_min es inmutable desde
  // la creación.
  const existing = await getBookedSlots(
    booking.business_id,
    booking.location_id,
    date,
    booking.professional_id ?? undefined,
    id
  );
  const startMin = timeToMinutes(time);
  const alreadyTaken = existing.some((b) =>
    intervalsOverlap(
      startMin,
      booking.duration_min,
      timeToMinutes(b.time.slice(0, 5)),
      b.duration_min
    )
  );
  if (alreadyTaken) {
    return {
      success: false,
      conflict: true,
      error: "Ese horario ya fue reservado. Elegí otro.",
    };
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ date, time })
    .eq("id", id);
  if (error) {
    // 23505 = unique_violation (legado), 23P01 = exclusion_violation
    // (bookings_no_overlap).
    if (error.code === "23505" || error.code === "23P01") {
      return {
        success: false,
        conflict: true,
        error: "Ese horario ya fue reservado. Elegí otro.",
      };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ---------------------------------------------------------------------
// Clientes (CRM) — gestionados desde /admin. Se arman automáticamente al
// crear cada reserva (ver upsertClientForBooking); acá solo se leen y se
// editan las notas.
// ---------------------------------------------------------------------

export async function listClientsByBusiness(
  businessId: string
): Promise<Client[]> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false });
    return data ?? [];
  }
  return businessId === demoBusiness.id ? demoClients : [];
}

function mostFrequent(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export async function getClientProfile(
  businessId: string,
  clientId: string
): Promise<ClientProfile | null> {
  const [clients, bookings, services, professionals] = await Promise.all([
    listClientsByBusiness(businessId),
    listBookingsByBusiness(businessId),
    listServicesByBusiness(businessId),
    listProfessionalsByBusiness(businessId),
  ]);
  const client = clients.find((c) => c.id === clientId);
  if (!client) return null;

  const clientBookings = bookings.filter((b) => b.client_id === clientId);
  const servicesById = new Map(services.map((s) => [s.id, s]));
  const professionalsById = new Map(professionals.map((p) => [p.id, p]));

  const completed = clientBookings
    .filter((b) => b.status === "completed")
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const upcoming = clientBookings
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const totalSpent = completed.reduce(
    (sum, b) => sum + (servicesById.get(b.service_id)?.price ?? 0),
    0
  );

  const history: ClientBookingHistoryItem[] = [...clientBookings]
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .map((b) => ({
      id: b.id,
      date: b.date,
      time: b.time,
      status: b.status,
      service_name: servicesById.get(b.service_id)?.name ?? "Servicio eliminado",
      professional_name: b.professional_id
        ? (professionalsById.get(b.professional_id)?.name ?? null)
        : null,
      price: servicesById.get(b.service_id)?.price ?? 0,
    }));

  const next = upcoming[0];

  return {
    client,
    last_visit: completed[0]?.date ?? null,
    next_appointment: next
      ? {
          date: next.date,
          time: next.time,
          service_name: servicesById.get(next.service_id)?.name ?? "Servicio eliminado",
        }
      : null,
    visit_count: completed.length,
    total_spent: totalSpent,
    average_ticket: completed.length > 0 ? totalSpent / completed.length : 0,
    favorite_service: mostFrequent(
      completed.map((b) => servicesById.get(b.service_id)?.name).filter(Boolean) as string[]
    ),
    usual_professional: mostFrequent(
      completed
        .map((b) => (b.professional_id ? professionalsById.get(b.professional_id)?.name : null))
        .filter(Boolean) as string[]
    ),
    history,
  };
}

export async function updateClientNotes(
  clientId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder guardar notas.",
    };
  }
  const { error } = await supabaseAdmin
    .from("clients")
    .update({ notes })
    .eq("id", clientId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------
// Estadísticas y oportunidades — wrappers finos que cargan los datos
// (reales o demo) y delegan el cálculo a funciones puras en
// src/lib/stats.ts / src/lib/opportunities.ts (sin llamadas a Supabase
// adentro de esas dos, a propósito — ver comentario ahí).
// ---------------------------------------------------------------------

export async function getBusinessStats(
  businessId: string,
  rangeDays: number
): Promise<BusinessStats> {
  const [bookings, clients, services, locations] = await Promise.all([
    listBookingsByBusiness(businessId),
    listClientsByBusiness(businessId),
    listServicesByBusiness(businessId),
    listLocationsByBusiness(businessId),
  ]);
  return computeBusinessStats({
    today: new Date().toISOString().slice(0, 10),
    rangeDays,
    bookings,
    clients,
    servicesById: Object.fromEntries(services.map((s) => [s.id, s])),
    locations,
  });
}

export async function getOpportunities(
  businessId: string
): Promise<Opportunity[]> {
  const [bookings, clients, services, locations] = await Promise.all([
    listBookingsByBusiness(businessId),
    listClientsByBusiness(businessId),
    listServicesByBusiness(businessId),
    listLocationsByBusiness(businessId),
  ]);
  return detectOpportunities({
    today: new Date().toISOString().slice(0, 10),
    clients,
    bookings,
    servicesById: Object.fromEntries(services.map((s) => [s.id, s])),
    locations,
  });
}

// ---------------------------------------------------------------------
// Plantillas — capa de DISEÑO (layout + paleta + estilo de botón + preset
// de animación + orden por defecto de secciones), nunca contenido del
// negocio. Las oficiales (is_official=true) son públicamente legibles
// (RLS `is_official = true`, ver migración) porque el picker de /registro
// las necesita antes de que exista sesión. Las propias de un negocio NO
// tienen policy pública — se leen/escriben siempre con supabaseAdmin
// desde /admin, mismo criterio que `clients`.
// ---------------------------------------------------------------------

const TEMPLATE_COLUMNS =
  "id, business_id, slug, name, description, is_official, layout, palette_id, button_style, animation_preset, section_order, created_at, updated_at";

export async function listOfficialTemplates(): Promise<Template[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("templates")
      .select(TEMPLATE_COLUMNS)
      .eq("is_official", true)
      .order("name", { ascending: true });
    return data ?? [];
  }
  return [];
}

/** Resuelve una plantilla OFICIAL por id con el cliente anon (RLS
 *  `is_official = true` ya lo permite) — usada por las acciones de
 *  creación de negocio (registerBusiness, adminCreateBusiness), que
 *  corren antes de que exista cualquier sesión admin. Nunca resuelve una
 *  plantilla propia de otro negocio: el filtro `is_official` lo impide
 *  estructuralmente, no hace falta chequear ownership acá. */
export async function getOfficialTemplateById(
  id: string
): Promise<Template | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("templates")
      .select(TEMPLATE_COLUMNS)
      .eq("id", id)
      .eq("is_official", true)
      .maybeSingle();
    return data ?? null;
  }
  return null;
}

export async function listBusinessTemplates(
  businessId: string
): Promise<Template[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("templates")
    .select(TEMPLATE_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Llamada siempre desde contexto admin ya autorizado — usa supabaseAdmin
 *  para poder resolver tanto una plantilla oficial como una propia con
 *  una sola función. */
export async function getTemplateById(id: string): Promise<Template | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("templates")
    .select(TEMPLATE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export type TemplateInput = Omit<
  Template,
  "id" | "created_at" | "updated_at"
>;

export async function createTemplate(
  input: TemplateInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder crear plantillas.",
    };
  }
  const { data, error } = await supabaseAdmin
    .from("templates")
    .insert(input)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function deleteTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder borrar plantillas.",
    };
  }
  const { error } = await supabaseAdmin.from("templates").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Cuántos negocios tienen esta plantilla aplicada ahora mismo — para el
 *  aviso antes de confirmar el borrado (punto 8 del pedido: "no romper la
 *  página" se garantiza igual por el `on delete set null` de la FK, esto
 *  es solo para que el dueño sepa el impacto antes de confirmar). */
export async function countBusinessesUsingTemplate(
  templateId: string
): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const { count } = await supabaseAdmin
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);
  return count ?? 0;
}
