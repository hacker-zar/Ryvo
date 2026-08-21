import Link from "next/link";
import { logoutAdmin } from "@/lib/admin/auth-actions";
import { getAdminSession } from "@/lib/admin/session";
import { adminThemeDataAttrs, adminThemeStyle } from "@/lib/ui-classes";

export default async function AdminChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const homeHref =
    session?.role === "owner"
      ? session.accountRole === "worker"
        ? `/admin/negocios/${session.businessId}/rapido`
        : `/admin/negocios/${session.businessId}`
      : "/admin";

  return (
    <div
      className="min-h-screen bg-ink"
      style={adminThemeStyle}
      {...adminThemeDataAttrs}
    >
      <header className="border-b border-ink-line">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href={homeHref} className="section-title text-sm text-bone">
            Panel de administración
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
    </div>
  );
}
