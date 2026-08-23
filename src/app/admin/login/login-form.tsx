"use client";

import { useState } from "react";
import { loginAdmin } from "@/lib/admin/auth-actions";
import { adminInputClasses } from "@/lib/ui-classes";

interface LoginFormProps {
  /** true = login de dueño de negocio (usuario + contraseña, contra una
   *  cuenta real). false = login de superadmin RYVO (solo contraseña,
   *  contra ADMIN_PASSWORD) — flujo independiente, sin usuario. */
  isOwnerLogin: boolean;
}

export default function LoginForm({ isOwnerLogin }: LoginFormProps) {
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
      {isOwnerLogin ? (
        <div className="grid gap-1.5">
          <label htmlFor="username" className="text-xs text-bone-muted">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            autoFocus
            className={adminInputClasses}
          />
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-xs text-bone-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus={!isOwnerLogin}
          className={adminInputClasses}
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="section-eyebrow radius-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
