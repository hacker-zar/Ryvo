"use client";

import { createContext, useContext, useState, ReactNode } from "react";

/** Precarga del modal — set cuando se hace clic en "Me interesa" desde
 *  una categoría concreta (ver Academy.tsx). Vacío ({}) = CTA general,
 *  el modal arranca en el paso "category" mostrando el picker. */
export interface AcademyInterestSeed {
  categoryId?: string;
}

interface AcademyInterestModalContextValue {
  isOpen: boolean;
  /** Mismo truco que BookingModal: se usa como `key` para remontar el
   *  wizard limpio en cada apertura, sin depender de Date.now(). */
  openCount: number;
  seed: AcademyInterestSeed | null;
  openFor: (seed: AcademyInterestSeed) => void;
  close: () => void;
}

const AcademyInterestModalContext =
  createContext<AcademyInterestModalContextValue | null>(null);

export function AcademyInterestModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [seed, setSeed] = useState<AcademyInterestSeed | null>(null);

  return (
    <AcademyInterestModalContext.Provider
      value={{
        isOpen,
        openCount,
        seed,
        openFor: (s) => {
          setSeed(s);
          setOpenCount((c) => c + 1);
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </AcademyInterestModalContext.Provider>
  );
}

export function useAcademyInterestModal() {
  const ctx = useContext(AcademyInterestModalContext);
  if (!ctx) {
    throw new Error(
      "useAcademyInterestModal debe usarse dentro de <AcademyInterestModalProvider>"
    );
  }
  return ctx;
}
