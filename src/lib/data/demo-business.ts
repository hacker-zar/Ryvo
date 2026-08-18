import {
  Booking,
  BookingStatus,
  Business,
  Client,
  Location,
  Professional,
  Review,
  Service,
} from "@/types/business";

// Datos de demostración de una peluquería ficticia.
// Sirven como fixture para desarrollo local y como referencia de forma
// de datos para cuando se cargue un negocio real en Supabase.

export const demoBusiness: Business = {
  id: "demo-business-id",
  name: "Bella Vista Peluquería",
  slug: "bella-vista",
  description:
    "Peluquería y barbería de barrio con más de 10 años de experiencia. Cortes modernos, coloración y tratamientos capilares en un ambiente cálido y profesional.",
  logo: "/demo/logo.png",
  primary_color: "#8B4513",
  secondary_color: "#F5E6D3",
  whatsapp: "5493411234567",
  instagram: "bellavista.peluqueria",
  address: "Av. Pellegrini 1234, Rosario, Santa Fe",
  phone: "+54 9 341 123-4567",
  email: "hola@bellavista.com.ar",
  city: "Rosario, Santa Fe",
  hero_image: "/demo/hero.png",
  gallery: [
    "/demo/gallery-1.png",
    "/demo/gallery-2.png",
    "/demo/gallery-3.png",
    "/demo/gallery-4.png",
    "/demo/gallery-5.png",
    "/demo/gallery-6.png",
  ],
  opening_hours: [
    { day: "lun", open: "09:00", close: "19:00" },
    { day: "mar", open: "09:00", close: "19:00" },
    { day: "mie", open: "09:00", close: "19:00" },
    { day: "jue", open: "09:00", close: "19:00" },
    { day: "vie", open: "09:00", close: "20:00" },
    { day: "sab", open: "09:00", close: "14:00" },
    { day: "dom", open: "", close: "", closed: true },
  ],
  onboarding_step: 5,
  published: true,
  hero_video: "",
  hero_video_enabled: false,
  hero_video_position: "center",
  single_specialist_mode: false,
  section_order: [
    { id: "services", enabled: true },
    { id: "professionals", enabled: true },
    { id: "gallery", enabled: true },
    { id: "about", enabled: true },
    { id: "reviews", enabled: true },
    { id: "contact", enabled: true },
  ],
  animation_preset: "sutil",
  created_at: "2024-01-15T00:00:00.000Z",
};

// Local único del negocio demo. La plantilla también soporta negocios con
// varios locales (ver /admin → Locales): en ese caso simplemente se agregan
// más filas acá con is_primary: false en las adicionales.
export const demoLocations: Location[] = [
  {
    id: "loc1",
    business_id: "demo-business-id",
    name: "Bella Vista Centro",
    address: "Av. Pellegrini 1234, Rosario, Santa Fe",
    opening_hours: [
      { day: "lun", open: "09:00", close: "19:00" },
      { day: "mar", open: "09:00", close: "19:00" },
      { day: "mie", open: "09:00", close: "19:00" },
      { day: "jue", open: "09:00", close: "19:00" },
      { day: "vie", open: "09:00", close: "20:00" },
      { day: "sab", open: "09:00", close: "14:00" },
      { day: "dom", open: "", close: "", closed: true },
    ],
    is_primary: true,
    created_at: "2024-01-15T00:00:00.000Z",
  },
];

export const demoServices: Service[] = [
  {
    id: "s1",
    business_id: "demo-business-id",
    name: "Corte clásico",
    description: "Corte a tijera o máquina, incluye lavado y peinado.",
    price: 8000,
    duration: 30,
    active: true,
  },
  {
    id: "s2",
    business_id: "demo-business-id",
    name: "Corte + Barba",
    description: "Corte completo más arreglo y perfilado de barba.",
    price: 12000,
    duration: 45,
    active: true,
  },
  {
    id: "s3",
    business_id: "demo-business-id",
    name: "Coloración",
    description: "Color completo con productos profesionales.",
    price: 18000,
    duration: 90,
    active: true,
  },
  {
    id: "s4",
    business_id: "demo-business-id",
    name: "Tratamiento capilar",
    description: "Hidratación profunda y reparación de puntas.",
    price: 10000,
    duration: 40,
    active: true,
  },
  {
    id: "s5",
    business_id: "demo-business-id",
    name: "Peinado para eventos",
    description: "Peinado profesional para ocasiones especiales.",
    price: 9000,
    duration: 50,
    active: true,
  },
];

export const demoProfessionals: Professional[] = [
  {
    id: "p1",
    business_id: "demo-business-id",
    name: "Bella Fernández",
    role: "Estilista y colorista",
    bio: "Más de 10 años especializada en color y tratamientos capilares.",
    photo: "",
    experience: "12 años de experiencia",
    display_order: 0,
    active: true,
    created_at: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "p2",
    business_id: "demo-business-id",
    name: "Martín Sosa",
    role: "Barbero",
    bio: "Cortes clásicos y arreglo de barba, formado en Buenos Aires.",
    photo: "",
    experience: "6 años de experiencia",
    display_order: 1,
    active: true,
    created_at: "2024-01-15T00:00:00.000Z",
  },
];

// Bella (p1) es generalista — service_ids: [] la deja calificada para
// todo (misma regla de compatibilidad que un negocio real recién
// migrado). Martín (p2) es barbero — solo corte y corte+barba, para que
// el modo demo muestre de verdad "algunos profesionales no hacen todo".
export const demoProfessionalServiceIds: Record<string, string[]> = {
  p1: [],
  p2: ["s1", "s2"],
};

export const demoReviews: Review[] = [
  {
    id: "r1",
    business_id: "demo-business-id",
    customer_name: "Marina G.",
    rating: 5,
    comment:
      "Excelente atención, me encantó cómo quedó el corte. Volveré seguro.",
    created_at: "2026-06-10T00:00:00.000Z",
  },
  {
    id: "r2",
    business_id: "demo-business-id",
    customer_name: "Facundo R.",
    rating: 5,
    comment: "El mejor lugar para arreglarse la barba. Muy prolijos.",
    created_at: "2026-05-22T00:00:00.000Z",
  },
  {
    id: "r3",
    business_id: "demo-business-id",
    customer_name: "Julieta P.",
    rating: 4,
    comment: "Muy buena onda y puntualidad. El local está muy lindo.",
    created_at: "2026-04-30T00:00:00.000Z",
  },
];

// === Clientes y turnos de demostración ===
// A diferencia de lo anterior (negocio/servicios/profesionales), estos dos
// no tienen tabla real que "reemplazar después" salvo por su forma — están
// pensados para que el modo demo (sin Supabase configurado) muestre un
// dashboard de estadísticas/CRM/oportunidades coherente y no vacío. Las
// fechas se calculan como offset de días desde HOY (no fechas de
// calendario fijas) para que el demo nunca se vea "viejo". Cubren
// deliberadamente las 5 categorías de oportunidades y los 5 estados de
// turno — ver src/lib/opportunities.ts para los umbrales exactos.
function offsetDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

function offsetDateTime(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString();
}

interface DemoClientSeed {
  id: string;
  name: string;
  phone: string;
  email: string;
  firstVisitOffset: number; // días desde hoy de su primera reserva
}

const DEMO_CLIENT_SEEDS: DemoClientSeed[] = [
  { id: "c1", name: "Marina Gómez", phone: "5493411000001", email: "marina.gomez@example.com", firstVisitOffset: -84 },
  { id: "c2", name: "Facundo Romero", phone: "5493411000002", email: "facundo.romero@example.com", firstVisitOffset: -63 },
  { id: "c3", name: "Julieta Paredes", phone: "5493411000003", email: "julieta.paredes@example.com", firstVisitOffset: -60 },
  { id: "c4", name: "Nicolás Duarte", phone: "5493411000004", email: "nicolas.duarte@example.com", firstVisitOffset: -60 },
  { id: "c5", name: "Camila Suárez", phone: "5493411000005", email: "camila.suarez@example.com", firstVisitOffset: -10 },
  { id: "c6", name: "Bruno Ledesma", phone: "5493411000006", email: "bruno.ledesma@example.com", firstVisitOffset: -2 },
  { id: "c7", name: "Valentina Ríos", phone: "5493411000007", email: "valentina.rios@example.com", firstVisitOffset: -5 },
  { id: "c8", name: "Agustín Molina", phone: "5493411000008", email: "agustin.molina@example.com", firstVisitOffset: 3 },
  { id: "c9", name: "Sofía Herrera", phone: "5493411000009", email: "sofia.herrera@example.com", firstVisitOffset: -70 },
  { id: "c10", name: "Tomás Acosta", phone: "5493411000010", email: "tomas.acosta@example.com", firstVisitOffset: -80 },
  { id: "c11", name: "Lucía Fernández", phone: "5493411000011", email: "lucia.fernandez@example.com", firstVisitOffset: -75 },
  { id: "c12", name: "Ramiro Paz", phone: "5493411000012", email: "ramiro.paz@example.com", firstVisitOffset: -50 },
  { id: "c13", name: "Milagros Cabrera", phone: "5493411000013", email: "milagros.cabrera@example.com", firstVisitOffset: -90 },
  { id: "c14", name: "Ezequiel Torres", phone: "5493411000014", email: "ezequiel.torres@example.com", firstVisitOffset: -80 },
  { id: "c15", name: "Antonella Vega", phone: "5493411000015", email: "antonella.vega@example.com", firstVisitOffset: -5 },
  { id: "c16", name: "Ignacio Bravo", phone: "5493411000016", email: "ignacio.bravo@example.com", firstVisitOffset: -6 },
  { id: "c17", name: "Rocío Medina", phone: "5493411000017", email: "rocio.medina@example.com", firstVisitOffset: -15 },
  { id: "c18", name: "Federico Luna", phone: "5493411000018", email: "federico.luna@example.com", firstVisitOffset: -8 },
  { id: "c19", name: "Pilar Suárez", phone: "5493411000019", email: "pilar.suarez@example.com", firstVisitOffset: -18 },
];

export const demoClients: Client[] = DEMO_CLIENT_SEEDS.map((c) => ({
  id: c.id,
  business_id: "demo-business-id",
  name: c.name,
  phone: c.phone,
  email: c.email,
  notes: "",
  created_at: offsetDateTime(c.firstVisitOffset),
  updated_at: offsetDateTime(c.firstVisitOffset),
}));

const clientsById = new Map(DEMO_CLIENT_SEEDS.map((c) => [c.id, c]));
const demoServiceDurationById = new Map(
  demoServices.map((s) => [s.id, s.duration])
);

function booking(
  id: string,
  clientId: string,
  serviceId: string,
  professionalId: string | null,
  dayOffset: number,
  time: string,
  status: BookingStatus,
  updatedAtOffset: number = dayOffset
): Booking {
  const client = clientsById.get(clientId)!;
  return {
    id,
    business_id: "demo-business-id",
    service_id: serviceId,
    location_id: "loc1",
    professional_id: professionalId,
    client_id: clientId,
    customer_name: client.name,
    customer_phone: client.phone,
    customer_email: client.email,
    date: offsetDate(dayOffset),
    time,
    duration_min: demoServiceDurationById.get(serviceId) ?? 30,
    status,
    created_at: offsetDateTime(Math.min(dayOffset, updatedAtOffset)),
    updated_at: offsetDateTime(updatedAtOffset),
  };
}

export const demoBookings: Booking[] = [
  // c1 Marina Gómez — recurrente, frecuencia ~28 días, "próxima a volver".
  booking("b1", "c1", "s3", "p1", -84, "10:00", "completed"),
  booking("b2", "c1", "s1", "p2", -56, "10:30", "completed"),
  booking("b3", "c1", "s4", "p1", -26, "10:00", "completed"),

  // c2 Facundo Romero — frecuencia ~21 días, "próxima a volver".
  booking("b4", "c2", "s2", "p2", -63, "11:00", "completed"),
  booking("b5", "c2", "s1", "p2", -42, "09:30", "completed"),
  booking("b6", "c2", "s2", "p2", -21, "10:30", "completed"),

  // c3 Julieta Paredes — frecuencia ~15 días, "demorada" (última hace 30d).
  booking("b7", "c3", "s3", "p1", -60, "14:00", "completed"),
  booking("b8", "c3", "s4", "p1", -45, "15:00", "completed"),
  booking("b9", "c3", "s1", "p2", -30, "14:30", "completed"),

  // c4 Nicolás Duarte — 1 sola visita hace 60 días, "no volvió".
  booking("b10", "c4", "s2", "p2", -60, "16:00", "completed"),

  // c5 Camila Suárez — 1 sola visita reciente, no es oportunidad todavía.
  booking("b11", "c5", "s1", "p1", -10, "10:00", "completed"),

  // c6 Bruno Ledesma — turno cancelado esta semana.
  booking("b12", "c6", "s1", "p2", 5, "12:00", "cancelled", -2),

  // c7 Valentina Ríos — no asistió.
  booking("b13", "c7", "s1", "p2", -5, "17:00", "no_show"),

  // c8 Agustín Molina — turno confirmado próximo, caso normal.
  booking("b14", "c8", "s2", "p2", 3, "11:30", "confirmed"),

  // c9 Sofía Herrera — frecuencia ~35 días, "próxima a volver".
  booking("b15", "c9", "s3", "p1", -70, "15:30", "completed"),
  booking("b16", "c9", "s5", "p1", -35, "16:30", "completed"),

  // c10 Tomás Acosta — frecuencia ~40 días, "próxima a volver".
  booking("b17", "c10", "s4", "p1", -80, "13:00", "completed"),
  booking("b18", "c10", "s1", "p2", -40, "13:30", "completed"),

  // c11 Lucía Fernández — recurrente PERO ya tiene turno futuro agendado:
  // no debe aparecer en "próxima a volver" ni en "demorada".
  booking("b19", "c11", "s3", "p1", -75, "17:30", "completed"),
  booking("b20", "c11", "s1", "p2", -50, "18:00", "completed"),
  booking("b21", "c11", "s2", "p2", -25, "18:30", "completed"),
  booking("b22", "c11", "s1", "p2", 6, "12:30", "confirmed"),

  // c12/c13 — 1 sola visita antigua, "no volvieron".
  booking("b23", "c12", "s5", "p1", -50, "19:00", "completed"),
  booking("b24", "c13", "s1", "p2", -90, "12:00", "completed"),

  // c14 Ezequiel Torres — cliente frecuente (4 visitas), "próxima a volver".
  booking("b25", "c14", "s2", "p2", -80, "10:00", "completed"),
  booking("b26", "c14", "s1", "p2", -60, "10:30", "completed"),
  booking("b27", "c14", "s2", "p2", -40, "09:30", "completed"),
  booking("b28", "c14", "s1", "p2", -20, "11:00", "completed"),

  // c15/c16 — más cancelados esta semana (junto con c6, completan el
  // ejemplo "3 turnos fueron cancelados esta semana").
  booking("b29", "c15", "s2", "p1", 4, "13:00", "cancelled", -5),
  booking("b30", "c16", "s1", "p2", 6, "09:00", "cancelled", -6),

  // c17/c18/c19 — relleno de los últimos 28 días, concentrado a la mañana,
  // para que "baja ocupación" tenga con qué comparar contra las tardes.
  booking("b31", "c17", "s1", "p2", -15, "09:30", "completed"),
  booking("b32", "c18", "s2", "p1", -8, "10:00", "completed"),
  booking("b33", "c19", "s1", "p1", -18, "11:30", "completed"),
];
