import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/data/business-repository";
import { BookingModalProvider } from "@/lib/booking-modal-context";
import { sanitizeSectionOrder } from "@/lib/section-order";
import AppearanceScope from "@/components/AppearanceScope";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingModal from "@/components/booking/BookingModalLazy";
import ProfessionalProfile from "@/components/ProfessionalProfile";

interface PageProps {
  params: Promise<{ slug: string; professionalId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, professionalId } = await params;
  const profile = await getBusinessProfile(slug);
  const professional = profile?.professionals.find(
    (p) => p.id === professionalId && p.active
  );
  if (!profile || profile.business.published === false || !professional) return {};

  return {
    title: `${professional.name} — ${profile.business.name}`,
    description: professional.bio || undefined,
  };
}

export default async function ProfessionalProfilePage({ params }: PageProps) {
  const { slug, professionalId } = await params;
  const profile = await getBusinessProfile(slug);
  if (!profile || profile.business.published === false) notFound();

  // También cubre profesionales borrados/desactivados — no deben ser
  // accesibles por link directo una vez que dejan el equipo.
  const professional = profile.professionals.find(
    (p) => p.id === professionalId && p.active
  );
  if (!professional) notFound();

  const { business, services, locations, professionals } = profile;
  const qualifiedServices = services.filter(
    (s) =>
      professional.service_ids.length === 0 ||
      professional.service_ids.includes(s.id)
  );
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
        <ProfessionalProfile
          professional={professional}
          services={qualifiedServices}
          primaryColor={business.primary_color}
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
