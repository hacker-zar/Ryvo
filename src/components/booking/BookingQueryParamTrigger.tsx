"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBookingModal } from "@/lib/booking-modal-context";

export default function BookingQueryParamTrigger() {
  const searchParams = useSearchParams();
  const { open } = useBookingModal();

  useEffect(() => {
    if (searchParams.get("reservar") === "1") {
      open();
    }
    // Solo nos interesa el valor al montar (llegada desde el QR).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
