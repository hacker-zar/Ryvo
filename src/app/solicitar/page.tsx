import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RequestForm from "./request-form";

export const metadata: Metadata = {
  title: "Solicitar mi página — RYVO",
  description: "Contanos sobre tu negocio en Rosario y RYVO te contacta para armar tu página.",
};

/**
 * Pantalla enfocada, sin el header/nav de la landing (mismo criterio que
 * /registro): es el paso de conversión, no queremos ninguna distracción
 * ni una segunda forma de navegar afuera de "volver al inicio".
 */
export default function SolicitarPage() {
  return (
    <main className="min-h-screen bg-graphite flex flex-col items-center px-4 py-12">
      <Link href="/" className="mb-10">
        <Image
          src="/ryvo-logo-light.png"
          alt="RYVO"
          width={307}
          height={204}
          className="h-7 w-auto"
        />
      </Link>
      <div className="w-full max-w-md">
        <RequestForm />
      </div>
    </main>
  );
}
