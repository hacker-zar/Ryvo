import type { Metadata } from "next";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingHero from "@/components/marketing/MarketingHero";
import ProductPreview from "@/components/marketing/ProductPreview";
import MarketingFeatures from "@/components/marketing/MarketingFeatures";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// Entrada principal de RYVO como plataforma (no la página de un negocio
// puntual). Las peluquerías/barberías individuales viven en /[slug], que
// arma su propia página con getBusinessProfile(slug). Esta ruta presenta
// RYVO como producto y dirige al dueño hacia /admin/login, que es el
// mismo punto de acceso que ya usa el link "¿Trabajás aquí?" de cada
// sitio de negocio.
export const metadata: Metadata = {
  title: "RYVO — Software para peluquerías y barberías",
  description:
    "RYVO le da a tu peluquería o barbería una web propia con reservas online y un panel simple para gestionarla.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-graphite">
      <MarketingHeader />
      <main className="flex-1">
        <MarketingHero />
        <ProductPreview />
        <MarketingFeatures />
      </main>
      <MarketingFooter />
    </div>
  );
}
