// Esta ruta ("/") va a mostrar la página de una peluquería específica,
// de la misma forma en que hoy lo hace src/app/[slug]/page.tsx: trayendo
// su perfil con getBusinessProfile(slug) y renderizando los componentes
// (Header, Hero, Services, Gallery, Reviews, Contact, Footer, BookingModal)
// con esos datos.
//
// Todavía no está conectada a un negocio puntual — cuando se defina cuál
// (por slug fijo, dominio, o variable de entorno), se completa acá.
export default function Home() {
  return null;
}
