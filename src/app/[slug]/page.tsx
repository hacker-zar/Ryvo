import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/data/business-repository";
import { BookingModalProvider } from "@/lib/booking-modal-context";
import AppearanceScope from "@/components/AppearanceScope";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import BookingModal from "@/components/booking/BookingModal";
import BookingQueryParamTrigger from "@/components/booking/BookingQueryParamTrigger";
import MobileBookingBar from "@/components/booking/MobileBookingBar";
import Gallery from "@/components/Gallery";
import Professionals from "@/components/Professionals";
import About from "@/components/About";
import Reviews from "@/components/Reviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);
  if (!profile) return {};

  return {
    title: profile.business.name,
    description: profile.business.description,
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);

  if (!profile) notFound();

  const { business, services, reviews, locations, professionals } = profile;

  // URL a la que apunta el QR: la página principal con un parámetro que
  // abre el modal de reserva automáticamente al cargar.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const bookingUrl = `${siteUrl}/${business.slug}?reservar=1`;

  return (
    <AppearanceScope
      business={{
        typography_preset: business.typography_preset,
        button_style: business.button_style,
        background_color: business.background_color,
        text_color: business.text_color,
        primary_color: business.primary_color,
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
        />
        <Hero
          business={{
            name: business.name,
            description: business.description,
            hero_image: business.hero_image,
            primary_color: business.primary_color,
          }}
        />
        <Services services={services} primaryColor={business.primary_color} />
        <Professionals
          professionals={professionals}
          primaryColor={business.primary_color}
        />
        <Gallery
          images={business.gallery ?? []}
          businessName={business.name}
          primaryColor={business.primary_color}
        />
        <About
          business={{
            name: business.name,
            description: business.description,
            city: business.city,
            gallery: business.gallery,
            primary_color: business.primary_color,
          }}
        />
        <Reviews reviews={reviews} primaryColor={business.primary_color} />
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
        <Footer business={{ name: business.name, slug: business.slug }} />

        <BookingModal
          business={{ id: business.id, primary_color: business.primary_color }}
          services={services}
          locations={locations}
        />
        <BookingQueryParamTrigger />
        <MobileBookingBar business={{ primary_color: business.primary_color }} />
      </BookingModalProvider>
    </AppearanceScope>
  );
}
