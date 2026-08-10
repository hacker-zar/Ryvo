"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BookingModalContextValue {
  isOpen: boolean;
  /** Se incrementa cada vez que se abre el modal. Sirve como `key` para
   *  remontar el wizard limpio, sin depender de valores impuros como
   *  Date.now() durante el render. */
  openCount: number;
  open: () => void;
  close: () => void;
}

const BookingModalContext = createContext<BookingModalContextValue | null>(
  null
);

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  return (
    <BookingModalContext.Provider
      value={{
        isOpen,
        openCount,
        open: () => {
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
