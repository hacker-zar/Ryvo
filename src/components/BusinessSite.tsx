import { Fragment } from "react";
import { BusinessProfile, SectionId } from "@/types/business";
import { BookingModalProvider } from "@/lib/booking-modal-context";
import { sanitizeSectionOrder } from "@/lib/section-order";
import AppearanceScope from "@/components/AppearanceScope";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import BookingModal from "@/components/booking/BookingModalLazy";
import BookingQueryParamTrigger from "@/components/booking/BookingQueryParamTrigger";
import MobileBookingBar from "@/components/booking/MobileBookingBar";
import Gallery from "@/components/Gallery";
import Professionals from "@/components/Professionals";
import About from "@/components/About";
import Reviews from "@/components/Reviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface BusinessSiteProps {
  profile: BusinessProfile;
  slug: string;
}

/**
 * Árbol completo del sitio público de un negocio. Extraído de
 * `/[slug]/page.tsx` para poder reutilizarlo tal cual (mismos componentes,
 * mismos datos) en la preview del editor — ver
 * `/admin/negocios/[id]/preview`. Cualquier cambio acá afecta a ambos.
 */
export default function BusinessSite({ profile, slug }: BusinessSiteProps) {
  const { business, services, reviews, locations, professionals } = profile;

  // URL a la que apunta el QR: la página principal con un parámetro que
  // abre el modal de reserva automáticamente al cargar.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const bookingUrl = `${siteUrl}/${slug}?reservar=1`;

  // "hero" queda fuera de este registro a propósito — es estructural
  // (siempre primera, siempre visible, igual que Header/Footer), no
  // forma parte del orden configurable. Ver SectionId en types/business.ts.
  const SECTION_COMPONENTS: Record<SectionId, () => React.ReactNode> = {
    services: () => (
      <Services services={services} primaryColor={business.primary_color} />
    ),
    professionals: () => (
      <Professionals
        professionals={professionals}
        primaryColor={business.primary_color}
        slug={slug}
        singleSpecialistMode={business.single_specialist_mode ?? false}
      />
    ),
    gallery: () => (
      <Gallery
        images={business.gallery ?? []}
        businessName={business.name}
        primaryColor={business.primary_color}
      />
    ),
    about: () => (
      <About
        business={{
          name: business.name,
          description: business.description,
          city: business.city,
          gallery: business.gallery,
          primary_color: business.primary_color,
        }}
      />
    ),
    reviews: () => (
      <Reviews reviews={reviews} primaryColor={business.primary_color} />
    ),
    contact: () => (
      <Contact
        business={{
          name: business.name,
          whatsapp: business.whatsapp,
          instagram: business.instagram,
          address: business.address,
          phone: business.phone,
          email: business.email,
          opening_hours: business.opening_hours,
          primary_color: business.primary_color,
          slug: business.slug,
        }}
        bookingUrl={bookingUrl}
      />
    ),
  };

  const sectionOrder = sanitizeSectionOrder(business.section_order);
  const enabledSectionIds = sectionOrder
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
        <Hero
          business={{
            name: business.name,
            description: business.description,
            hero_image: business.hero_image,
            primary_color: business.primary_color,
            hero_video: business.hero_video,
            hero_video_enabled: business.hero_video_enabled,
            hero_video_position: business.hero_video_position,
          }}
        />
        {sectionOrder
          .filter((s) => s.enabled)
          .map((s) => (
            <Fragment key={s.id}>{SECTION_COMPONENTS[s.id]()}</Fragment>
          ))}
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
        <BookingQueryParamTrigger />
        <MobileBookingBar business={{ primary_color: business.primary_color }} />
      </BookingModalProvider>
    </AppearanceScope>
  );
}
