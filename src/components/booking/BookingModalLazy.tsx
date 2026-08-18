"use client";

import dynamic from "next/dynamic";
import { Business, Location, ProfessionalWithServices, Service } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";

interface BookingModalLazyProps {
  business: Pick<Business, "id" | "name" | "primary_color" | "whatsapp">;
  slug: string;
  services: Service[];
  locations: Location[];
  professionals: ProfessionalWithServices[];
}

// El wizard completo (5 pasos) solo hace falta cuando el visitante lo abre
// — dynamic() con ssr:false lo separa en su propio chunk, que recién se
// pide en el momento de este import(). El gate de `isOpen` tiene que
// quedar ACÁ, no dentro del módulo cargado dinámicamente: si BookingModal
// se montara siempre (aunque devuelva null cuando está cerrado), React
// tendría que cargar igual el chunk apenas hidrata la página, y no se
// ahorraría nada.
const BookingModal = dynamic(() => import("./BookingModal"), {
  ssr: false,
});

export default function BookingModalLazy(props: BookingModalLazyProps) {
  const { isOpen, openCount, seed } = useBookingModal();

  if (!isOpen) return null;

  return <BookingModal {...props} openCount={openCount} seed={seed} />;
}
