"use client";

import { createContext, useContext, useState, ReactNode } from "react";

/** Precarga del wizard — usado por rebooking ("¿Querés reservar de
 *  nuevo?" desde /turno/[id]) y por "Reservar con {nombre}" desde el
 *  perfil público de un profesional. */
export interface BookingSeed {
  serviceId?: string;
  locationId?: string;
  professionalId?: string;
}

interface BookingModalContextValue {
  isOpen: boolean;
  /** Se incrementa cada vez que se abre el modal. Sirve como `key` para
   *  remontar el wizard limpio, sin depender de valores impuros como
   *  Date.now() durante el render. */
  openCount: number;
  seed: BookingSeed | null;
  open: () => void;
  /** Abre el modal precargado — método SEPARADO de `open()` a propósito:
   *  los 4 lugares que ya hacen `onClick={open}` (Header, Hero, Services,
   *  MobileBookingBar) le pasarían el evento del click en silencio si
   *  `open()` aceptara un argumento (JS no exige aridad, TS no lo
   *  detecta acá). */
  openFor: (seed: BookingSeed) => void;
  close: () => void;
}

const BookingModalContext = createContext<BookingModalContextValue | null>(
  null
);

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [seed, setSeed] = useState<BookingSeed | null>(null);

  return (
    <BookingModalContext.Provider
      value={{
        isOpen,
        openCount,
        seed,
        open: () => {
          setSeed(null);
          setOpenCount((c) => c + 1);
          setIsOpen(true);
        },
        openFor: (s) => {
          setSeed(s);
          setOpenCount((c) => c + 1);
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  const ctx = useContext(BookingModalContext);
  if (!ctx) {
    throw new Error(
      "useBookingModal debe usarse dentro de <BookingModalProvider>"
    );
  }
  return ctx;
}
