"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getGoogleOAuthClient } from "@/lib/google-oauth-client";
import { unlinkGoogleFromOwnAccount } from "@/lib/admin/google-auth-actions";

interface GoogleLinkPanelProps {
  linkedEmail: string | null;
  /** A dónde volver tras vincular — se sanea contra /admin/ en el
   *  callback, así que un valor fuera de ese prefijo cae al fallback. */
  nextPath: string;
}

/**
 * Vincular/desvincular Google para la cuenta de la sesión ACTUAL — nunca
 * opera sobre otra cuenta (ver linkGoogleToOwnAccount/
 * unlinkGoogleFromOwnAccount en google-auth-actions.ts, que derivan el
 * accountId de la sesión, nunca de acá). Compartido por Owner
 * ((chrome)/cuenta) y Worker (rapido/page.tsx, sección "Mi cuenta").
 */
export default function GoogleLinkPanel({ linkedEmail, nextPath }: GoogleLinkPanelProps) {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState("");

  async function handleLink() {
    const client = getGoogleOAuthClient();
    if (!client) {
      setError("Google no está configurado en este entorno.");
      return;
    }
    setConnecting(true);
    setError("");
    const redirectTo = `${window.location.origin}/auth/callback?flow=admin-link&next=${encodeURIComponent(nextPath)}`;
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setError("No se pudo conectar con Google.");
      setConnecting(false);
    }
  }

  async function handleUnlink() {
    setUnlinking(true);
    setError("");
    const result = await unlinkGoogleFromOwnAccount();
    setUnlinking(false);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "No se pudo desvincular.");
    }
  }

  return (
    <div className="max-w-lg radius-sm border border-ink-line p-4">
      <p className="text-sm text-bone font-medium">Google</p>
      {linkedEmail ? (
        <>
          <p className="text-xs text-bone-muted mt-1">
            Vinculada: {linkedEmail}. Ya podés usar &quot;Continuar con
            Google&quot; para entrar sin contraseña.
          </p>
          <button
            type="button"
            onClick={handleUnlink}
            disabled={unlinking}
            className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone-muted hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-50 mt-3"
          >
            {unlinking ? "Desvinculando..." : "Desvincular"}
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-bone-muted mt-1">
            Vinculá tu cuenta de Google para poder entrar sin usuario ni
            contraseña la próxima vez.
          </p>
          <button
            type="button"
            onClick={handleLink}
            disabled={connecting}
            className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 mt-3"
          >
            {connecting ? "Conectando con Google..." : "Vincular con Google"}
          </button>
        </>
      )}
      {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
    </div>
  );
}
