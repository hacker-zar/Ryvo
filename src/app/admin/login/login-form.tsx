"use client";

import { useState } from "react";
import { loginAdmin } from "@/lib/admin/auth-actions";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await loginAdmin(formData);
    // Si loginAdmin tuvo éxito, hace redirect() y esta línea no se alcanza.
    if (result && !result.success) {
      setError(result.error ?? "No se pudo iniciar sesión.");
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="mt-8 grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-xs text-bone-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-brass transition-colors"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="section-eyebrow rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
