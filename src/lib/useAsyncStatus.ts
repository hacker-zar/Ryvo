"use client";

import { useCallback, useState } from "react";

export type AsyncStatus = "idle" | "pending" | "success" | "error";

interface AsyncResult {
  success: boolean;
  error?: string;
}

/**
 * El "idle/submitting/saved/error" que se repetía casi textual en cada
 * form del admin (informacion-panel, fotos-panel, appearance-form,
 * account-manager...), ahora en un solo lugar. `run` envuelve cualquier
 * Server Action con la forma `{success, error?}` que ya usa todo el
 * admin — no cambia esa forma, solo evita repetir el manejo de estado
 * alrededor de cada llamada.
 *
 * `dirty`/`markDirty` extienden el mismo hook para el patrón de "cambios
 * sin guardar": un panel llama `markDirty()` en su `onChange` y queda
 * `dirty: true` hasta el próximo `run()` exitoso, que lo vuelve a limpiar
 * automáticamente — un solo lugar de verdad en vez de otro estado
 * aislado por componente.
 */
export function useAsyncStatus() {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const run = useCallback(async <T extends AsyncResult>(fn: () => Promise<T>) => {
    setStatus("pending");
    setError("");
    const result = await fn();
    if (result.success) {
      setStatus("success");
      setDirty(false);
    } else {
      setStatus("error");
      setError(result.error ?? "Ocurrió un error.");
    }
    return result;
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError("");
  }, []);

  const markDirty = useCallback(() => setDirty(true), []);

  return {
    status,
    error,
    run,
    reset,
    isPending: status === "pending",
    dirty,
    markDirty,
  };
}
