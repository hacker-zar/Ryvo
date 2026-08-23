import Icon from "@/components/ui/Icon";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listBusinesses,
  listBusinessesForPartner,
  listOfficialTemplates,
} from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import NewBusinessForm from "./new-business-form";

// El listado de negocios (y "crear negocio") es de superadmin/partner — un
// dueño/Barber de un negocio puntual (sesión "owner") no debe poder
// ver ni el nombre de otros negocios, así que va directo al suyo. Super ve
// TODOS los negocios; partner ve solo los que tiene asignados
// (businesses.partner_id) — mismo componente, distinto dataset.
export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role === "owner") redirect(`/admin/negocios/${session.businessId}`);

  const [businesses, officialTemplates] = await Promise.all([
    session.role === "partner"
      ? listBusinessesForPartner(session.accountId)
      : listBusinesses(),
    listOfficialTemplates(),
  ]);

  return (
    <AdminChrome>
      {!isSupabaseConfigured ? (
        <div className="mb-8 radius-sm border border-brass/40 bg-ink-elevated p-4 text-sm text-bone-muted">
          Supabase no está configurado: estás viendo el negocio demo en modo
          solo lectura. Para crear o editar negocios, completá{" "}
          <code className="text-brass">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="text-brass">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en
          las variables de entorno.
        </div>
      ) : null}

      {session.role === "super" ? (
        <Link
          href="/admin/usuarios"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-bone-muted hover:text-brass transition-colors"
        >
          Ver todos los usuarios y partners de RYVO
          <Icon name="arrow" size={16} className="shrink-0" />
        </Link>
      ) : null}

      <p className="section-eyebrow text-brass">Negocios</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {session.role === "partner" ? "Tus negocios asignados" : "Tus peluquerías y barberías"}
      </h1>

      <div className="mt-8 divide-y divide-ink-line border-t border-b border-ink-line">
        {businesses.length === 0 ? (
          <p className="py-6 text-sm text-bone-muted">
            Todavía no creaste ningún negocio.
          </p>
        ) : (
          businesses.map((business) => (
            <Link
              key={business.id}
              href={`/admin/negocios/${business.id}`}
              className="flex items-center justify-between py-4 group"
            >
              <div>
                <p className="text-bone font-medium group-hover:text-brass transition-colors">
                  {business.name}
                </p>
                <p className="text-xs text-bone-muted mt-0.5">
                  /{business.slug}
                </p>
              </div>
              <span className="text-bone-muted text-sm inline-flex items-center gap-1.5">
                Editar
                <Icon name="arrow" size={16} className="shrink-0" />
              </span>
            </Link>
          ))
        )}
      </div>

      <div className="mt-12">
        <p className="section-eyebrow text-brass">Nuevo</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Crear negocio
        </h2>
        <NewBusinessForm
          disabled={!isSupabaseConfigured}
          officialTemplates={officialTemplates}
        />
      </div>
    </AdminChrome>
  );
}
