"use client";

import dynamic from "next/dynamic";
import { Academy, AcademyCategoryWithRelations, Business } from "@/types/business";
import { useAcademyInterestModal } from "@/lib/academy-interest-modal-context";

interface AcademyInterestModalLazyProps {
  business: Pick<Business, "name" | "primary_color" | "whatsapp">;
  academy: Academy;
  categories: AcademyCategoryWithRelations[];
}

// Mismo patrón que BookingModalLazy: el gate de `isOpen` vive ACÁ,
// afuera del módulo cargado con next/dynamic — así React nunca dispara
// el import() del wizard completo si el modal está cerrado.
const AcademyInterestModal = dynamic(() => import("./AcademyInterestModal"), {
  ssr: false,
});

export default function AcademyInterestModalLazy(props: AcademyInterestModalLazyProps) {
  const { isOpen, openCount, seed } = useAcademyInterestModal();

  if (!isOpen) return null;

  return <AcademyInterestModal {...props} openCount={openCount} seed={seed} />;
}
