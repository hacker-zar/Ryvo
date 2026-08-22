import { Fragment, ReactNode } from "react";
import { BusinessProfile, SectionId } from "@/types/business";
import { BookingModalProvider } from "@/lib/booking-modal-context";
import { sanitizeSectionOrder } from "@/lib/section-order";
import { LAYOUT_BLUEPRINTS, BlueprintSlot } from "@/lib/templates/blueprints";
import AppearanceScope from "@/components/AppearanceScope";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import BookingModal from "@/components/booking/BookingModalLazy";
import BookingQueryParamTrigger from "@/components/booking/BookingQueryParamTrigger";
import MobileBookingBar from "@/components/booking/MobileBookingBar";
import Gallery from "@/components/Gallery";
import Products from "@/components/Products";
import Professionals from "@/components/Professionals";
import About from "@/components/About";
import Reviews from "@/components/Reviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import Statement from "@/components/Statement";
import BeforeAfter from "@/components/BeforeAfter";
import SocialGrid from "@/components/SocialGrid";

interface BusinessSiteProps {
  profile: BusinessProfile;
  slug: string;
}

/**
 * Árbol completo del sitio público de un negocio. Extraído de
 * `/[slug]/page.tsx` para poder reutilizarlo tal cual (mismos componentes,
 * mismos datos) en la preview del editor — ver
 * `/admin/negocios/[id]/preview`. Cualquier cambio acá afecta a ambos.
 *
 * Sistema de plantillas: sin `template_layout` (negocio sin plantilla
 * elegida, o "Página en blanco"), la composición es EXACTAMENTE la de
 * siempre — secciones reordenables en su orden configurado, sin nada
 * extra. Con `template_layout`, se resuelve el blueprint de esa plantilla
 * (LAYOUT_BLUEPRINTS) y se intercalan sus secciones exclusivas (Marquee/
 * Statement/BeforeAfter/SocialGrid) alrededor de las mismas secciones
 * reordenables de siempre — el sistema de orden/activación
 * (sanitizeSectionOrder/SectionsManager) no cambia en absoluto.
 */
export default function BusinessSite({ profile, slug }: BusinessSiteProps) {
  const { business, services, reviews, locations, professionals, products } = profile;
  const layout = business.template_layout ?? undefined;

  // "hero" queda fuera de este registro a propósito — es estructural
  // (siempre primera, siempre visible, igual que Header/Footer), no
  // forma parte del orden configurable. Ver SectionId en types/business.ts.
  const SECTION_COMPONENTS: Record<SectionId, () => ReactNode> = {
    services: () => (
      <Services services={services} primaryColor={business.primary_color} layout={layout} />
    ),
    professionals: () => (
      <Professionals
        professionals={professionals}
        primaryColor={business.primary_color}
        slug={slug}
        singleSpecialistMode={business.single_specialist_mode ?? false}
        layout={layout}
      />
    ),
    gallery: () => (
      <Gallery
        images={business.gallery ?? []}
        businessName={business.name}
        primaryColor={business.primary_color}
        layout={layout}
        galleryLayout={business.gallery_layout}
      />
    ),
    products: () => (
      <Products products={products} primaryColor={business.primary_color} layout={layout} />
    ),
    about: () => (
      <About
        business={{
          name: business.name,
          description: business.description,
          city: business.city,
          gallery: business.gallery,
          about_image: business.about_image,
          primary_color: business.primary_color,
        }}
        layout={layout}
      />
    ),
    reviews: () => (
      <Reviews reviews={reviews} primaryColor={business.primary_color} layout={layout} />
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
      />
    ),
  };

  const sectionOrder = sanitizeSectionOrder(business.section_order);
  const enabledSectionIds = sectionOrder
    .filter((s) => s.enabled)
    .map((s) => s.id);

  // Renderiza las secciones reordenables de siempre — opcionalmente
  // restringidas a un subconjunto (`ids`), para blueprints que las
  // reparten en más de un bloque (p. ej. Editorial: servicios/galería/
  // equipo antes del Antes-Después, reseñas/contacto después). Sin `ids`,
  // es EXACTAMENTE el `.map()` que este archivo ya tenía.
  function renderCoreSections(ids?: SectionId[]) {
    const list = sectionOrder.filter(
      (s) => s.enabled && (!ids || ids.includes(s.id))
    );
    return list.map((s) => (
      <Fragment key={s.id}>{SECTION_COMPONENTS[s.id]()}</Fragment>
    ));
  }

  function renderSlot(slot: BlueprintSlot, index: number): ReactNode {
    switch (slot.type) {
      case "core":
        return <Fragment key={index}>{renderCoreSections(slot.ids)}</Fragment>;
      case "marquee":
        return (
          <Marquee key={index} businessName={business.name} accentColor={business.primary_color} />
        );
      case "statement":
        return (
          <Statement key={index} description={business.description} accentColor={business.primary_color} />
        );
      case "beforeafter":
        return (
          <BeforeAfter key={index} images={business.gallery ?? []} accentColor={business.primary_color} />
        );
      case "social":
        return (
          <SocialGrid
            key={index}
            images={business.gallery ?? []}
            instagram={business.instagram}
            accentColor={business.primary_color}
            businessName={business.name}
          />
        );
    }
  }

  const blueprint = layout ? LAYOUT_BLUEPRINTS[layout] : null;

  return (
    <AppearanceScope
      business={{
        typography_preset: business.typography_preset,
        button_style: business.button_style,
        background_color: business.background_color,
        text_color: business.text_color,
        primary_color: business.primary_color,
        animation_preset: business.animation_preset,
        template_layout: business.template_layout,
        palette_id: business.palette_id,
        image_radius: business.image_radius,
        image_shadow: business.image_shadow,
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
          layout={layout}
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
          layout={layout}
        />
        {blueprint
          ? blueprint.slots.map((slot, i) => renderSlot(slot, i))
          : renderCoreSections()}
        <Footer business={{ name: business.name, slug: business.slug }} layout={layout} />

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
