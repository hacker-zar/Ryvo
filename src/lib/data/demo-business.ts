import { Business, Location, Professional, Review, Service } from "@/types/business";

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
    active: true,
    created_at: "2024-01-15T00:00:00.000Z",
  },
];

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
