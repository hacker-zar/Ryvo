import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessById, listProfessionalsByBusiness } from "@/lib/data/business-repository";
import { getAccountGoogleLink, listAccountsByBusiness } from "@/lib/data/accounts-repository";
import { logoutAdmin } from "@/lib/admin/auth-actions";
import { getAdminSession } from "@/lib/admin/session";
import GoogleLinkPanel from "@/components/admin/GoogleLinkPanel";
import AccountManager from "../account-manager";
import BusinessNav from "../business-nav";
import PublishToggle from "../publish-toggle";
import NotificationSettingsPanel from "../notification-settings-panel";
import GlobalSaveBar from "../global-save-bar";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Separada del editor de negocio a propósito: la cuenta (usuario +
 * contraseña de acceso) no es contenido del sitio del negocio, es
 * configuración de acceso al panel — no debe vivir mezclada con
 * Información/Servicios/etc.
 */
export default async function AccountPage({ params }: PageProps) {
  const { id } = await params;

  const [business, accounts, professionals, session] = await Promise.all([
    getBusinessById(id),
    listAccountsByBusiness(id),
    listProfessionalsByBusiness(id),
    getAdminSession(),
  ]);
  if (!business) notFound();

  // Google login es autoservicio: solo se vincula la cuenta de la sesión
  // ACTUAL (nunca otra). "owner" acá cubre tanto al dueño real como a un
  // Barber — pero un Barber jamás llega a esta página (el layout de
  // (chrome)/* ya lo redirige a /rapido antes), así que en la práctica
  // esto solo se resuelve para el dueño.
  const googleLink =
    session?.role === "owner" ? await getAccountGoogleLink(session.accountId) : null;

  return (
    <>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver al editor
      </Link>

      <p className="section-eyebrow text-brass mt-6">Configuración</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>

      <div className="mt-8">
        <BusinessNav businessId={business.id} active="cuenta" />
      </div>

      <p className="section-eyebrow text-bone-muted">Estado de la web</p>
      <div className="mt-3 mb-10">
        <PublishToggle
          businessId={business.id}
          slug={business.slug}
          published={business.published !== false}
        />
      </div>

      {/* Los avisos automáticos son un ajuste operativo del negocio, no
          una decisión de diseño — vivían en el editor completo, que es
          exclusivo de RYVO/Partner, así que el dueño no podía encender
          los avisos de su propio negocio. */}
      <p className="section-eyebrow text-bone-muted">Avisos automáticos</p>
      {/* NotificationSettingsPanel se registra en el guardado global (usa
          useEditorSelection), así que necesita su propio Provider acá —
          mismo patrón que las sub-páginas de /rapido. Sin esto la página
          entera crashea, y es un error de runtime que ni el build ni el
          typecheck detectan. */}
      <div className="mt-3 mb-10">
        <EditorSelectionProvider>
          <GlobalSaveBar />
          <NotificationSettingsPanel
            businessId={business.id}
            whatsappEnabled={business.notify_whatsapp_enabled ?? false}
            reminder24hEnabled={business.notify_reminder_24h_enabled ?? false}
          />
        </EditorSelectionProvider>
      </div>

      <p className="section-eyebrow text-bone-muted">Acceso</p>
      <p className="text-xs text-bone-muted mt-2 max-w-md">
        Cuentas de acceso a {business.name} — el dueño entra directo al
        editor completo; un Barbero vinculado entra a /rapido, donde solo
        puede ver sus propios turnos.
      </p>

      <div className="mt-6">
        <AccountManager
          businessId={business.id}
          accounts={accounts}
          professionals={professionals}
        />
      </div>

      {session?.role === "owner" ? (
        <div className="mt-12 border-t border-ink-line pt-6">
          <p className="section-eyebrow text-brass mb-4">Mi cuenta</p>
          <GoogleLinkPanel
            linkedEmail={googleLink?.googleEmail ?? null}
            nextPath={`/admin/negocios/${business.id}/cuenta`}
          />
        </div>
      ) : null}

      <div className="mt-12 border-t border-ink-line pt-6">
        <p className="section-eyebrow text-brass">Sesión</p>
        <p className="text-xs text-bone-muted mt-2 max-w-md">
          Para probar con otra cuenta (otro negocio, u otro rol de acceso)
          cerrá esta sesión primero.
        </p>
        <form action={logoutAdmin} className="mt-4">
          <button
            type="submit"
            className="section-eyebrow text-xs px-4 py-2 radius-sm border border-ink-line text-bone hover:border-brass hover:text-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}
