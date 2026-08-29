"use client";

import { ReactNode, useCallback, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel?: string;
  /** Por defecto true — casi todos los usos son borrados. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Reemplazo de `confirm()` para acciones destructivas, en un solo lugar.
 *
 * Un componente llama `ask({ title, description, onConfirm })` donde
 * antes hacía `if (!confirm(...)) return;`, y renderiza `{dialog}` una
 * vez. La diferencia con el nativo, además de que se ve como el resto del
 * producto: el `onConfirm` puede ser asíncrono y el diálogo se queda
 * abierto y deshabilitado mientras corre, en vez de cerrarse dejando al
 * usuario sin saber si la acción salió.
 *
 * El estado vive por componente (no hay un provider global) a propósito:
 * cada manager confirma sus propias acciones y nunca hay dos diálogos
 * compitiendo.
 */
export function useConfirm(): {
  ask: (request: ConfirmRequest) => void;
  dialog: ReactNode;
} {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [pending, setPending] = useState(false);

  const ask = useCallback((next: ConfirmRequest) => {
    setPending(false);
    setRequest(next);
  }, []);

  const close = useCallback(() => {
    setRequest(null);
    setPending(false);
  }, []);

  async function handleConfirm() {
    if (!request) return;
    setPending(true);
    try {
      await request.onConfirm();
    } finally {
      // Se cierra pase lo que pase: si la acción falló, el error lo
      // muestra la pantalla de abajo (cada manager ya tiene su propio
      // SaveStatus / mensaje), no este diálogo — dejarlo abierto
      // atraparía al usuario sin poder leerlo.
      close();
    }
  }

  return {
    ask,
    dialog: (
      <ConfirmDialog
        open={request !== null}
        title={request?.title ?? ""}
        description={request?.description ?? ""}
        confirmLabel={request?.confirmLabel}
        destructive={request?.destructive ?? true}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={pending ? () => {} : close}
      />
    ),
  };
}
