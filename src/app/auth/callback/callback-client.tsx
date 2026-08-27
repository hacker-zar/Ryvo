"use client";

import { useEffect, useState } from "react";
import { getGoogleOAuthClient } from "@/lib/google-oauth-client";
import { loginAdminWithGoogle, linkGoogleToOwnAccount } from "@/lib/admin/google-auth-actions";
import { loginCustomerWithGoogle } from "@/lib/actions/customer-auth-actions";

type Status = "connecting" | "authenticating" | "error" | "unauthorized";

// "next" solo se usa para una navegación cosmética tras vincular Google —
// nunca es insumo de una decisión de identidad/permiso. Se acota a /admin/
// para descartar un open-redirect si alguien manipula la URL.
function sanitizeNext(next: string | null): string {
  if (next && next.startsWith("/admin/")) return next;
  return "/admin";
}

const STATUS_LABEL: Record<"connecting" | "authenticating", string> = {
  connecting: "Conectando con Google...",
  authenticating: "Autenticando...",
};

/**
 * Página de retorno del handshake OAuth de Google — atiende 3 flujos
 * distintos según `?flow=` (admin-login / admin-link / customer-login),
 * todos disparados desde botones "Continuar con Google"/"Vincular con
 * Google" en otras pantallas (ver login-form.tsx, GoogleLinkPanel.tsx).
 *
 * Lee los query params con `window.location.search` en vez de
 * `useSearchParams()` de next/navigation a propósito: ese hook exige
 * envolver en <Suspense> para no romper el build — acá no hace falta,
 * porque los params solo se leen una vez al montar, no en cada render.
 */
export default function GoogleCallbackClient() {
  const [status, setStatus] = useState<Status>("connecting");
  const [message, setMessage] = useState("");
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const flow = params.get("flow");
      const business = params.get("business");
      const next = params.get("next");
      setBusinessSlug(business);

      if (!code || !flow) {
        setStatus("error");
        setMessage("Falta información para completar el inicio de sesión con Google.");
        return;
      }

      const client = getGoogleOAuthClient();
      if (!client) {
        setStatus("error");
        setMessage("Google no está configurado en este entorno.");
        return;
      }

      setStatus("authenticating");
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      // Se descarta apenas se obtiene el token: la sesión de Supabase Auth
      // nunca queda viva más de un instante — la cookie propia de RYVO
      // sigue siendo la única sesión real en todo momento.
      await client.auth.signOut();

      if (error || !data.session) {
        setStatus("error");
        setMessage("No se pudo completar el inicio de sesión con Google.");
        return;
      }

      const accessToken = data.session.access_token;

      if (flow === "admin-login") {
        const result = await loginAdminWithGoogle(accessToken);
        // Si tuvo éxito, loginAdminWithGoogle ya hizo redirect() y esta
        // línea no se alcanza.
        if (result && !result.success) {
          setStatus("unauthorized");
          setMessage(result.error);
        }
        return;
      }

      if (flow === "admin-link") {
        const result = await linkGoogleToOwnAccount(accessToken);
        if (result.success) {
          window.location.href = sanitizeNext(next);
        } else {
          setStatus("error");
          setMessage(result.error ?? "No se pudo vincular la cuenta de Google.");
        }
        return;
      }

      if (flow === "customer-login") {
        const result = await loginCustomerWithGoogle(accessToken);
        if (result && !result.success) {
          setStatus("error");
          setMessage(result.error);
        }
        return;
      }

      setStatus("error");
      setMessage("Flujo de Google inválido.");
    }

    run().catch(() => {
      setStatus("error");
      setMessage("Ocurrió un error inesperado.");
    });
  }, []);

  const loginHref = businessSlug
    ? `/admin/login?business=${encodeURIComponent(businessSlug)}`
    : "/admin/login";

  return (
    <div className="w-full max-w-sm text-center">
      <p className="section-eyebrow text-brass">Google</p>

      {(status === "connecting" || status === "authenticating") ? (
        <>
          <h1 className="section-title mt-2 text-xl text-bone">
            {STATUS_LABEL[status]}
          </h1>
          <div
            className="mx-auto mt-6 h-6 w-6 rounded-full border-2 border-ink-line border-t-brass animate-spin"
            role="status"
            aria-label="Cargando"
          />
        </>
      ) : null}

      {status === "unauthorized" ? (
        <>
          <h1 className="section-title mt-2 text-xl text-bone">
            Esta cuenta de Google no tiene acceso a RYVO.
          </h1>
          <p className="mt-3 text-sm text-bone-muted">{message}</p>
          <a
            href={loginHref}
            className="section-eyebrow mt-6 inline-block radius-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity"
          >
            Volver al login
          </a>
        </>
      ) : null}

      {status === "error" ? (
        <>
          <h1 className="section-title mt-2 text-xl text-bone">
            No se pudo iniciar sesión
          </h1>
          <p className="mt-3 text-sm text-red-400">{message}</p>
          <a
            href={loginHref}
            className="section-eyebrow mt-6 inline-block radius-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity"
          >
            Volver al login
          </a>
        </>
      ) : null}
    </div>
  );
}
