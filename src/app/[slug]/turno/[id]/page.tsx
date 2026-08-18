import { notFound } from "next/navigation";
import {
  getBookingById,
  getBusinessProfile,
} from "@/lib/data/business-repository";
import { BookingModalProvider } from "@/lib/booking-modal-context";
import { sanitizeSectionOrder } from "@/lib/section-order";
import AppearanceScope from "@/components/AppearanceScope";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingModal from "@/components/booking/BookingModalLazy";
import ManageBookingView from "./manage-booking-view";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

/**
 * Página pública para gestionar UNA reserva puntual — a la que se llega
 * desde el link "Gestionar mi turno" de la confirmación. Sin login: el id
 * de la reserva (UUID no adivinable) es el único token de acceso, así que
 * se verifica que pertenezca al negocio del slug antes de mostrar nada
 * (evita que el id de una reserva de otro negocio se pueda probar acá).
 */
export default async function ManageBookingPage({ params }: PageProps) {
  const { slug, id } = await params;

  const booking = await getBookingById(id);
  if (!booking || booking.business_slug !== slug) notFound();

  const profile = await getBusinessProfile(slug);
  if (!profile) notFound();

  const { business, services, locations, professionals } = profile;
  const enabledSectionIds = sanitizeSectionOrder(business.section_order)
    .filter((s) => s.enabled)
    .map((s) => s.id);

  return (
    <AppearanceScope
      business={{
        typography_preset: business.typography_preset,
        button_style: business.button_style,
        background_color: business.background_color,
        text_color: business.text_color,
        primary_color: business.primary_color,
        animation_preset: business.animation_preset,
      }}
    >
      <BookingModalProvider>
        <Header
          business={{
            name: business.name,
            logo: business.logo,
            primary_color: business.primary_color,
            slug: business.slug,
          }}
          enabledSectionIds={enabledSectionIds}
        />
        <ManageBookingView
          booking={booking}
          primaryColor={business.primary_color}
          services={services}
          locations={locations}
        />
        <Footer business={{ name: business.name, slug: business.slug }} />

        <BookingModal
          business={{
            id: business.id,
            name: business.name,
            primary_color: business.primary_color,
            whatsapp: business.whatsapp,
          }}
          slug={slug}
          services={services}
          locations={locations}
          professionals={professionals}
        />
      </BookingModalProvider>
    </AppearanceScope>
  );
}
