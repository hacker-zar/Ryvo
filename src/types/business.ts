// Tipos del dominio. Reflejan 1:1 el esquema de base de datos definido
// en supabase/schema.sql. Cualquier cambio de columnas debe reflejarse
// en ambos lugares.

export type TypographyPreset = "clasica" | "moderna" | "elegante";
export type ButtonStyle = "redondeado" | "suave" | "recto";
export type HeroVideoPosition = "center" | "top" | "bottom";
export type AnimationPreset = "ninguna" | "sutil" | "dinamica" | "revelado" | "escalonada";

// Estilo visual de las fotos públicas (Galería/Profesionales/Productos/
// contenido de plantilla) — mismo mecanismo de presets cerrados que
// ButtonStyle/AnimationPreset (data-attribute en AppearanceScope + CSS en
// globals.css), nunca CSS libre. "recto"/"ninguna" son el default y
// reproducen exactamente el aspecto histórico (sin radio, sin sombra).
export type ImageRadiusPreset = "recto" | "suave" | "redondeado" | "muy-redondeado";
export type ImageShadowPreset = "ninguna" | "suave" | "media" | "marcada";

// Cómo se presenta la galería pública (ver components/Gallery.tsx y sus
// variantes en components/gallery/*) — independiente de la plantilla:
// las 5 variantes reciben el MISMO array de fotos (business.gallery), no
// hay copias por variante. "editorial" es el fallback para negocios sin
// este campo cargado (comportamiento histórico, sin cambios visuales).
export type GalleryLayoutId =
  | "editorial"
  | "movimiento"
  | "filmstrip"
  | "masonry"
  | "showcase";

// Secciones reordenables/activables del sitio público. "hero" queda
// deliberadamente fuera de este union — es estructural (siempre primera,
// siempre visible), igual que Header/Footer, no forma parte del orden
// configurable. Ver src/lib/section-order.ts y BusinessSite.tsx.
export type SectionId =
  | "services"
  | "professionals"
  | "gallery"
  | "about"
  | "reviews"
  | "contact"
  | "products";

export interface SectionConfig {
  id: SectionId;
  enabled: boolean;
}

// Sistema de plantillas. Una plantilla es una CAPA DE DISEÑO (layout +
// paleta + estilo de botón + preset de animación + orden por defecto de
// secciones) — nunca contenido del negocio. Ver src/lib/palette-presets.ts
// y src/lib/templates/blueprints.ts.
export type TemplateLayoutId = "atelier" | "noir" | "studio" | "editorial" | "bold";

export interface Template {
  id: string;
  business_id: string | null; // null = oficial de RYVO
  slug: string | null; // solo las oficiales tienen slug
  name: string;
  description: string;
  is_official: boolean;
  layout: TemplateLayoutId;
  palette_id: string;
  button_style: ButtonStyle;
  animation_preset: AnimationPreset;
  section_order: SectionConfig[];
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  whatsapp: string;
  instagram: string;
  address: string;
  // Campos adicionales mínimos, necesarios para cubrir el alcance del MVP
  // (horarios, fotos de galería y reseñas ya cubiertas por sus propias tablas).
  phone?: string;
  email?: string;
  city?: string;
  hero_image?: string;
  gallery?: string[];
  // Estilo de presentación de la galería pública — ver GalleryLayoutId.
  // Vacío/no seteado = "editorial" (ver Gallery.tsx).
  gallery_layout?: GalleryLayoutId | null;
  // Imagen de la sección "Quiénes somos", elegida explícitamente por el
  // negocio — independiente del orden de `gallery`. Vacío/no seteado =
  // usa `gallery[0]` como fallback (comportamiento histórico, ver
  // About.tsx), así que cambiar el orden de la galería nunca mueve esta
  // imagen una vez elegida.
  about_image?: string;
  opening_hours?: OpeningHours[];
  // Apariencia: colores adicionales de fondo/texto, y presets controlados
  // (no libertad total) de tipografía y estilo de botones.
  background_color?: string;
  text_color?: string;
  typography_preset?: TypographyPreset;
  button_style?: ButtonStyle;
  // Estilo visual de fotos públicas — ver ImageRadiusPreset/ImageShadowPreset.
  image_radius?: ImageRadiusPreset;
  image_shadow?: ImageShadowPreset;
  // Notification Engine (ver lib/notifications/*) — apagado por default,
  // cero envíos hasta que el dueño lo prenda explícitamente desde
  // Automatizaciones. notify_whatsapp_enabled es el interruptor general
  // (confirmación/cancelación/reprogramación de turnos); el recordatorio
  // 24h es un sub-interruptor que solo importa si el general está prendido.
  notify_whatsapp_enabled?: boolean;
  notify_reminder_24h_enabled?: boolean;
  // Onboarding self-service: tipo de negocio (texto libre, sin enum
  // cerrado), en qué paso del onboarding quedó (0-5), y si ya es visible
  // en /[slug]. Los negocios creados por el flujo del superadmin
  // (adminCreateBusiness) nunca pasan por onboarding — quedan
  // published=true de entrada (ver supabase/schema.sql).
  business_type?: string;
  onboarding_step?: number;
  published?: boolean;
  // Ícono de pestaña del navegador para /[slug]. Vacío = sin favicon
  // propio (generateMetadata cae a logo, y si tampoco hay, al ícono
  // global de RYVO — ver [slug]/page.tsx).
  favicon?: string;
  // Video de fondo del hero. hero_video_enabled es independiente de si
  // hay una URL cargada (permite subir una vez y activar/desactivar sin
  // resubir). hero_image sigue siendo la imagen de respaldo — no hay un
  // campo de fallback separado (ver Hero.tsx).
  hero_video?: string;
  hero_video_enabled?: boolean;
  hero_video_position?: HeroVideoPosition;
  // Un solo especialista: cambia la presentación de la sección
  // Profesionales (ver Professionals.tsx), NUNCA la lógica de pasos del
  // wizard de reserva (que ya se adapta sola por cantidad real de
  // profesionales calificados — ver BookingModal.tsx).
  single_specialist_mode?: boolean;
  // Orden y visibilidad de las secciones reordenables del sitio público
  // (no incluye "hero", que es fijo). Default = orden actual, todo
  // activo — ver la migración y sanitizeSectionOrder en
  // src/lib/section-order.ts.
  section_order?: SectionConfig[];
  // Preset global de animaciones de scroll-reveal. Controla solo
  // duración/curva vía CSS ([data-animation] en globals.css) — Reveal.tsx
  // / useScrollReveal.ts no cambian de comportamiento por esto.
  animation_preset?: AnimationPreset;
  // Plantilla aplicada actualmente. `template_id` es solo un puntero de
  // referencia (para saber qué fila de `templates` originó este diseño,
  // y mostrar "Plantilla actual" con datos frescos si sigue existiendo)
  // — se vuelve null solo si esa plantilla se borra, SIN afectar el
  // resto. `template_layout`/`palette_id` son la copia real que decide
  // cómo se renderiza la página: sobreviven a que la plantilla de origen
  // se borre o cambie. `template_layout` null = renderiza exactamente
  // como un negocio sin plantilla (comportamiento histórico, sin cambios).
  template_id?: string | null;
  template_layout?: TemplateLayoutId | null;
  palette_id?: string | null;
  created_at: string;
}

export interface OpeningHours {
  day: "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
  open: string; // "09:00"
  close: string; // "19:00"
  closed?: boolean;
}

export interface Location {
  id: string;
  business_id: string;
  name: string;
  address: string;
  opening_hours: OpeningHours[];
  is_primary: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string;
  // Ambos opcionales — un servicio puede publicarse sin precio y/o sin
  // duración definidos todavía (ej. "a consultar"). null = sin cargar.
  // El motor de reservas (availability.ts/business-repository.ts) nunca
  // inventa un valor por defecto para `duration`: un servicio sin
  // duración simplemente no se puede reservar online (ver createBooking).
  price: number | null;
  duration: number | null; // minutos
  active: boolean;
}

// Un Service ya confirmado como reservable online (duration != null) — el
// wizard de reserva (BookingModal) solo llega a los pasos de fecha/hora y
// éxito una vez que este chequeo ya pasó, así esos pasos no vuelven a
// lidiar con la posibilidad de "sin duración" en su propio tipo.
export type BookableService = Service & { duration: number };

export function isBookableService(service: Service): service is BookableService {
  return service.duration != null;
}

// Catálogo de productos — capa de contenido mínima (foto + nombre +
// precio + descripción opcional), deliberadamente desacoplada de
// `bookings`/`services`: sin carrito, checkout ni stock todavía, pero
// `price` ya es numérico (no texto libre) para que un futuro sistema de
// pagos se enganche sin rehacer el modelo. Ver Products.tsx y
// products-manager.tsx.
export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  // Mismo patrón que services.active/professionals.active — Products.tsx
  // (público) solo muestra los activos, igual que Services ya hace.
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  location_id: string | null;
  // Nulo en negocios sin profesionales configurados, o en reservas
  // anteriores a esta columna — ver getBookedSlots (OR IS NULL) para
  // cómo se trata como "bloquea a cualquiera" durante la transición.
  professional_id?: string | null;
  // Nulo si el upsert en clients falló al crear la reserva (no debe
  // bloquear la reserva en sí) — ver createBooking.
  client_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  // Duración real en minutos, persistida al crear la reserva — inmutable
  // aunque después cambie `services.duration`. Junto con `time` define el
  // intervalo [time, time+duration_min) que protege el constraint de
  // exclusión `bookings_no_overlap` contra solapamientos (ver
  // src/lib/availability.ts::intervalsOverlap).
  duration_min: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// Notification Engine — outbox de envíos (ver lib/notifications/*.ts).
// Cada Server Action que muta `bookings` inserta una fila acá en vez de
// llamar al proveedor de WhatsApp directo, para que un fallo de envío
// nunca pueda romper la reserva real. Un solo canal hoy (whatsapp); el
// campo queda desde ahora para no migrar de nuevo el día que se agregue
// email.
export type NotificationEventType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "reminder_24h";

export type NotificationEventStatus = "pending" | "sent" | "failed" | "skipped";

// Snapshot inmutable de los datos que necesita el mensaje — no depende
// de que el booking/servicio/negocio sigan igual después (mismo criterio
// que duration_min en Booking).
export interface NotificationEventPayload {
  business_name: string;
  customer_name: string;
  service_name: string;
  date: string;
  time: string;
}

export interface NotificationEvent {
  id: string;
  business_id: string;
  booking_id: string | null;
  type: NotificationEventType;
  channel: "whatsapp";
  recipient: string;
  status: NotificationEventStatus;
  scheduled_for: string;
  payload: NotificationEventPayload;
  provider_message_id?: string | null;
  error?: string | null;
  created_at: string;
  sent_at?: string | null;
}

export interface Review {
  id: string;
  business_id: string;
  customer_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

// Equipo del negocio. Ligado al flujo de reservas vía Booking.professional_id
// y a los servicios que puede realizar vía professional_services (ver
// ProfessionalWithServices) — ya no es solo presentación.
export interface Professional {
  id: string;
  business_id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  // Texto libre, opcional — igual convención que bio/role: vacío no se
  // muestra en el perfil público.
  experience?: string;
  // Orden de aparición en el picker de reserva y en el perfil público.
  display_order: number;
  active: boolean;
  created_at: string;
}

// Profesional + qué servicios califica a realizar. service_ids vacío
// significa "sin asociación explícita configurada" — se interpreta como
// "califica para todos los servicios activos" (compatibilidad hacia
// atrás con profesionales cargados antes de esta relación existir — ver
// listQualifiedProfessionals en business-repository.ts). Puerta abierta a
// reviews por profesional en el futuro (Review.professional_id), sin
// construirlo ahora.
export interface ProfessionalWithServices extends Professional {
  service_ids: string[];
}

// Rol dentro del negocio (distinto del `role` de sesión "super"/"owner"
// de AdminSession, que es el nivel de autenticación, no el permiso
// dentro del negocio). Hoy toda cuenta es "owner" — no hay UI todavía
// para crear "admin"/"worker" — pero la estructura ya existe para
// cuando se construya gestión de equipo (ver src/lib/admin/roles.ts).
export type AccountRole = "owner" | "admin" | "worker";

// Cuenta de acceso al panel (usuario + contraseña) de un negocio. NUNCA
// incluye password_hash acá — ese campo solo existe en las funciones de
// autenticación de accounts-repository.ts, igual que admin_password_hash
// en Business antes. Hoy 1 cuenta → 1 negocio, pero business_id no es
// único: el modelo ya tolera varias cuentas por negocio a futuro.
export interface Account {
  id: string;
  business_id: string;
  name: string;
  username: string;
  role: AccountRole;
  // Solo seteado cuando role === "worker" — vincula la cuenta a UN
  // profesional puntual de este negocio (ver Editor rápido). null para
  // cuentas owner/admin, que no están atadas a ningún profesional.
  professional_id: string | null;
  active: boolean;
  created_at: string;
}

// Vista completa de un negocio, tal como la consumen los componentes de la
// plantilla. Se arma combinando las tablas anteriores.
export interface BusinessProfile {
  business: Business;
  services: Service[];
  reviews: Review[];
  locations: Location[];
  professionals: ProfessionalWithServices[];
  products: Product[];
}

// === CRM de clientes ===
// No hay tabla de clientes separada del lado de la reserva pública — se
// arma automáticamente al crear cada Booking (ver createBooking). phone
// es la clave de identidad de facto dentro de un negocio.
export interface Client {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientBookingHistoryItem {
  id: string;
  date: string;
  time: string;
  status: BookingStatus;
  service_name: string;
  professional_name: string | null;
  // null si el servicio de esa reserva ya no tiene precio cargado.
  price: number | null;
}

// Ficha del cliente — no es un simple contacto, agrega historial y
// métricas ya calculadas para la vista de perfil del admin.
export interface ClientProfile {
  client: Client;
  last_visit: string | null;
  next_appointment: { date: string; time: string; service_name: string } | null;
  visit_count: number;
  total_spent: number;
  average_ticket: number;
  favorite_service: string | null;
  usual_professional: string | null;
  history: ClientBookingHistoryItem[];
}

// === Estadísticas ===
// Todos los conteos vienen de un único pase de agregación sobre la misma
// ventana de turnos — bookings_pending + confirmed + completed +
// cancelled + no_show === bookings_total siempre, por construcción (ver
// computeBusinessStats en src/lib/stats.ts).
export interface BusinessStats {
  range_days: number;
  clients_total: number;
  clients_new: number;
  clients_returning: number;
  bookings_total: number;
  bookings_pending: number;
  bookings_confirmed: number;
  bookings_completed: number;
  bookings_cancelled: number;
  bookings_no_show: number;
  revenue_estimated: number;
  top_service: { service_id: string; name: string; count: number } | null;
  occupancy_rate: number; // 0..1
}

// === Oportunidades ===
// Tipo pensado como punto de enganche para automatizaciones futuras
// (recordatorios, recuperación de clientes, etc.) — ver
// src/lib/opportunities.ts.
export type OpportunityType =
  | "returning_soon"
  | "never_returned"
  | "cancelled_this_week"
  | "low_occupancy_slot"
  | "overdue_vs_frequency";

export interface OpportunityClientRow {
  client_id: string;
  client_name: string;
  client_phone: string;
  last_visit: string | null;
  service_name: string | null;
  days_since_last_visit: number | null;
  usual_frequency_days: number | null;
  status: BookingStatus | null;
}

export interface LowOccupancySlot {
  day_label: string;
  location_name: string;
  occupancy_rate: number;
}

export interface Opportunity {
  type: OpportunityType;
  title: string;
  count: number;
  clients?: OpportunityClientRow[];
  slots?: LowOccupancySlot[];
}
