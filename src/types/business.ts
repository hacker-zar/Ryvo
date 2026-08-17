// Tipos del dominio. Reflejan 1:1 el esquema de base de datos definido
// en supabase/schema.sql. Cualquier cambio de columnas debe reflejarse
// en ambos lugares.

export type TypographyPreset = "clasica" | "moderna" | "elegante";
export type ButtonStyle = "redondeado" | "suave" | "recto";

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
  opening_hours?: OpeningHours[];
  // Apariencia: colores adicionales de fondo/texto, y presets controlados
  // (no libertad total) de tipografía y estilo de botones.
  background_color?: string;
  text_color?: string;
  typography_preset?: TypographyPreset;
  button_style?: ButtonStyle;
  // Onboarding self-service: tipo de negocio (texto libre, sin enum
  // cerrado), en qué paso del onboarding quedó (0-5), y si ya es visible
  // en /[slug]. Los negocios creados por el flujo del superadmin
  // (adminCreateBusiness) nunca pasan por onboarding — quedan
  // published=true de entrada (ver supabase/schema.sql).
  business_type?: string;
  onboarding_step?: number;
  published?: boolean;
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
  price: number;
  duration: number; // minutos
  active: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  location_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: BookingStatus;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  customer_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

// Equipo del negocio — señal de confianza en la web pública. Deliberadamente
// NO está ligado al flujo de reservas (no hay "elegir profesional" en el
// wizard): es solo presentación.
export interface Professional {
  id: string;
  business_id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  active: boolean;
  created_at: string;
}

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
  professionals: Professional[];
}
