"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAdmin } from "@/lib/admin/auth-actions";
import { adminThemeDataAttrs, adminThemeStyle } from "@/lib/ui-classes";

interface PublicSiteAdminBarProps {
  businessId: string;
  businessName: string;
  slug: string;
}

/**
 * Barra de administración superpuesta sobre el sitio público — solo se
 * renderiza (ver [slug]/page.tsx) si hay sesión autorizada sobre ESE
 * negocio puntual. Paleta de RYVO como producto (misma que AdminChrome),
 * no la del negocio: deja claro que es una herramienta de RYVO, no parte
 * del sitio del dueño, y evita cualquier choque con los colores que el
 * negocio haya elegido.
 */
export default function PublicSiteAdminBar({
  businessId,
  businessName,
  slug,
}: PublicSiteAdminBarProps) {
  const [open, setOpen] = useState(false);

  const items = [
    { label: "Ver página", href: `/${slug}` },
    { label: "Turnos", href: `/admin/negocios/${businessId}/turnos` },
    { label: "Clientes", href: `/admin/negocios/${businessId}/clientes` },
    { label: "Estadísticas", href: `/admin/negocios/${businessId}/estadisticas` },
    { label: "Editor", href: `/admin/negocios/${businessId}` },
    { label: "Configuración", href: `/admin/negocios/${businessId}/cuenta` },
  ];

  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] border-b border-ink-line bg-ink"
      style={adminThemeStyle}
      {...adminThemeDataAttrs}
    >
      <div className="mx-auto max-w-5xl px-4 py-2.5 relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="section-eyebrow text-xs text-bone hover:text-brass transition-colors flex items-center gap-1.5"
        >
          <span className="truncate max-w-[50vw]">{businessName}</span>
          <span aria-hidden="true">▾</span>
        </button>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[199] cursor-default"
            />
            <div className="absolute left-4 top-full mt-1 z-[201] w-48 rounded-sm border border-ink-line bg-ink-elevated py-1.5 shadow-lg">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-3.5 py-2 text-xs text-bone hover:text-brass hover:bg-ink transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="w-full text-left px-3.5 py-2 text-xs text-bone-muted hover:text-red-400 transition-colors"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
