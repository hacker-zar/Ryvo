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
  Service,
} from "@/types/business";
import {
  demoBusiness,
  demoLocations,
  demoReviews,
  demoServices,
} from "@/lib/data/demo-business";
import { virtualLocationFromBusiness } from "@/lib/availability";

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
      .select("*")
      .eq("slug", slug)
      .single();

    if (businessError || !business) return null;

    const [{ data: services }, { data: reviews }, { data: locations }] =
      await Promise.all([
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
    };
  }

  // Modo demo: solo respondemos para el slug de demostración.
  if (slug === demoBusiness.slug) {
    return {
      business: demoBusiness,
      services: demoServices,
      reviews: demoReviews,
      locations: demoLocations,
    };
  }

  return null;
}

/**
 * Devuelve las reservas activas (no canceladas) para un negocio/local/fecha,
 * usadas para calcular qué horarios ya están ocupados.
 */
export async function getBookedSlots(
  businessId: string,
  locationId: string | null,
  date: string
): Promise<Pick<Booking, "time" | "status">[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("bookings")
      .select("time, status")
      .eq("business_id", businessId)
      .eq("date", date)
      .neq("status", "cancelled");

    // location_id puede ser null (negocio sin locales explícitos todavía);
    // en ese caso solo hay un local virtual y comparamos por null.
    query = locationId
      ? query.eq("location_id", locationId)
      : query.is("location_id", null);

    const { data } = await query;
    return data ?? [];
  }

  // Modo demo: no hay reservas reales persistidas, así que no hay ocupados.
  return [];
}

export async function createBooking(
  booking: Omit<Booking, "id" | "created_at" | "status">
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    // Chequeo de disponibilidad antes de insertar. No es 100% atómico
    // (podría haber una carrera entre el check y el insert), por eso el
    // schema también tiene un índice único que rechaza el duplicado a
    // nivel de base de datos como defensa final.
    const existing = await getBookedSlots(
      booking.business_id,
      booking.location_id,
      booking.date
    );
    const alreadyTaken = existing.some(
      (b) => b.time.slice(0, 5) === booking.time
    );
    if (alreadyTaken) {
      return {
        success: false,
        error: "Ese horario ya fue reservado. Elegí otro.",
      };
    }

    const { error } = await supabase.from("bookings").insert({
      ...booking,
      status: "pending",
    });

    if (error) {
      // El índice único de la base de datos devuelve este código si,
      // pese al chequeo previo, otra reserva ganó la carrera.
      if (error.code === "23505") {
        return {
          success: false,
          error: "Ese horario ya fue reservado. Elegí otro.",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Modo demo: no hay persistencia real, simulamos éxito.
  console.log("[demo] Reserva simulada:", booking);
  return { success: true };
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
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  }
  return [demoBusiness];
}

export async function getBusinessById(id: string): Promise<Business | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();
    return data ?? null;
  }
  return id === demoBusiness.id ? demoBusiness : null;
}

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
    // Modo demo: no hay reservas reales persistidas.
    return [];
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
  status: "confirmed" | "cancelled"
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
