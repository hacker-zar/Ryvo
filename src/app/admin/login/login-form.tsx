"use client";

import { useState } from "react";
import { loginAdmin } from "@/lib/admin/auth-actions";
import { adminInputClasses } from "@/lib/ui-classes";
import { getGoogleOAuthClient } from "@/lib/google-oauth-client";

interface LoginFormProps {
  /** true = login de dueño de negocio (usuario + contraseña, contra una
   *  cuenta real). false = login de superadmin RYVO (solo contraseña,
   *  contra ADMIN_PASSWORD) — flujo independiente, sin usuario. */
  isOwnerLogin: boolean;
  /** Solo para el botón de Google: vuelve a `/admin/login?business=` si
   *  el login falla. Partner/Superadmin quedan fuera de Google login por
   *  ahora, por eso el botón nunca se muestra sin isOwnerLogin. */
  businessSlug?: string;
}

export default function LoginForm({ isOwnerLogin, businessSlug }: LoginFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

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

  async function handleGoogleLogin() {
    const client = getGoogleOAuthClient();
    if (!client) {
      setGoogleError("Google no está configurado en este entorno.");
      return;
    }
    setGoogleLoading(true);
    setGoogleError("");
    const redirectTo = `${window.location.origin}/auth/callback?flow=admin-login${
      businessSlug ? `&business=${encodeURIComponent(businessSlug)}` : ""
    }`;
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setGoogleError("No se pudo conectar con Google.");
      setGoogleLoading(false);
    }
    // Si no hubo error, el navegador ya está navegando hacia Google.
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

      {isOwnerLogin ? (
        <>
          <div className="flex items-center gap-3 text-[11px] text-bone-muted/70">
            <span className="h-px flex-1 bg-ink-line" />
            o
            <span className="h-px flex-1 bg-ink-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="section-eyebrow radius-sm border border-ink-line text-bone text-xs px-6 py-3.5 hover:border-brass transition-colors disabled:opacity-60"
          >
            {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
          </button>
          {googleError ? <p className="text-sm text-red-400">{googleError}</p> : null}
        </>
      ) : null}
    </form>
  );
}
