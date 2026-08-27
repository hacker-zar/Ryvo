import { adminThemeDataAttrs, adminThemeStyle } from "@/lib/ui-classes";
import GoogleCallbackClient from "./callback-client";

/**
 * Retorno del handshake OAuth de Google, compartido por los 3 flujos
 * (login admin, vincular Google, login customer) — ver callback-client.tsx.
 * Mismo tema visual que /admin/login (graphite/porcelain/signal): es
 * software de RYVO, no la web de un negocio.
 */
export default function GoogleCallbackPage() {
  return (
    <main
      className="flex-1 flex items-center justify-center px-4 bg-ink min-h-screen"
      style={adminThemeStyle}
      {...adminThemeDataAttrs}
    >
      <GoogleCallbackClient />
    </main>
  );
}
