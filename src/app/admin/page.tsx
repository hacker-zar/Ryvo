import { redirect } from "next/navigation";
import Link from "next/link";
import { hasValidAdminSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listBusinesses } from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import NewBusinessForm from "./new-business-form";

export default async function AdminHomePage() {
  const isLoggedIn = await hasValidAdminSession();
  if (!isLoggedIn) redirect("/admin/login");

  const businesses = await listBusinesses();

  return (
    <AdminChrome>
      {!isSupabaseConfigured ? (
        <div className="mb-8 rounded-sm border border-brass/40 bg-ink-elevated p-4 text-sm text-bone-muted">
          Supabase no está configurado: estás viendo el negocio demo en modo
          solo lectura. Para crear o editar negocios, completá{" "}
          <code className="text-brass">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="text-brass">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en
          las variables de entorno.
        </div>
      ) : null}

      <p className="section-eyebrow text-brass">Negocios</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        Tus peluquerías y barberías
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
              <span className="text-bone-muted text-sm">Editar →</span>
            </Link>
          ))
        )}
      </div>

      <div className="mt-12">
        <p className="section-eyebrow text-brass">Nuevo</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Crear negocio
        </h2>
        <NewBusinessForm disabled={!isSupabaseConfigured} />
      </div>
    </AdminChrome>
  );
}
