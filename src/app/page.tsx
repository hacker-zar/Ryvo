import type { Metadata } from "next";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingExamples from "@/components/marketing/MarketingExamples";
import MarketingHowItWorks from "@/components/marketing/MarketingHowItWorks";
import MarketingBenefits from "@/components/marketing/MarketingBenefits";
import MarketingRosario from "@/components/marketing/MarketingRosario";
import MarketingFinalCta from "@/components/marketing/MarketingFinalCta";
import MarketingFaq from "@/components/marketing/MarketingFaq";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// Entrada principal de RYVO como plataforma (no la página de un negocio
// puntual). Las peluquerías/barberías individuales viven en /[slug], que
// arma su propia página con getBusinessProfile(slug). Esta ruta presenta
// RYVO como servicio ("vos ponés tu negocio, RYVO hace el resto") — la
// conversión principal es /solicitar, no un alta de cuenta; "Iniciar
// sesión" (en MarketingHeader/Footer) sigue siendo el mismo punto de
// acceso de siempre, /admin/login.
export const metadata: Metadata = {
  title: "RYVO — Páginas web para negocios de Rosario",
  description:
    "RYVO diseña y publica páginas web profesionales para negocios de Rosario. Vos nos contás sobre tu negocio, nosotros hacemos el resto.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-graphite">
      <MarketingHeader />
      <main className="flex-1">
        <MarketingHero />
        <MarketingExamples />
        <MarketingHowItWorks />
        <MarketingBenefits />
        <MarketingRosario />
        <MarketingFinalCta />
        <MarketingFaq />
      </main>
      <MarketingFooter />
    </div>
  );
}
