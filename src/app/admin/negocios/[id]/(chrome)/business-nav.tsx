import Link from "next/link";
import { getAcademyForAdmin } from "@/lib/data/business-repository";
import { getAdminSession } from "@/lib/admin/session";

type NavKey =
  | "editor"
  | "turnos"
  | "clientes"
  | "academia"
  | "estadisticas"
  | "oportunidades"
  | "cuenta";

interface BusinessNavProps {
  businessId: string;
  active: NavKey;
}

const TABS: { key: NavKey; label: string; suffix: string }[] = [
  { key: "editor", label: "Editor", suffix: "" },
  { key: "turnos", label: "Agenda", suffix: "/turnos" },
  { key: "clientes", label: "Clientes", suffix: "/clientes" },
  { key: "academia", label: "Academia", suffix: "/academia" },
  { key: "estadisticas", label: "Estadísticas", suffix: "/estadisticas" },
  { key: "oportunidades", label: "Oportunidades", suffix: "/oportunidades" },
  { key: "cuenta", label: "Configuración", suffix: "/cuenta" },
];

/**
 * Tabs compartidos entre las 7 páginas del negocio (Editor/Turnos/
 * Clientes/Academia/Estadísticas/Oportunidades/Configuración) — reemplaza
 * los links sueltos "Turnos →"/"Cuenta →" que antes solo existían en el
 * editor. Mismos destinos que el menú desplegable del sitio público (ver
 * PublicSiteAdminBar).
 */
export default async function BusinessNav({ businessId, active }: BusinessNavProps) {
  // Academia es una vertical que no todos los negocios tienen. Como
  // pestaña fija, para la mayoría llevaba a una pantalla de "activá
  // Academia" — y un menú con entradas que no aplican entrena a
  // ignorarlo. Mismo criterio que ya se usa para ocultar secciones sin
  // contenido en el sitio público.
  //
  // Se sigue mostrando si YA estás parado en Academia, para no hacer
  // desaparecer la pestaña de la pantalla que estás mirando mientras la
  // configurás.
  const [academy, session] = await Promise.all([
    getAcademyForAdmin(businessId),
    getAdminSession(),
  ]);

  // El editor completo es exclusivo de RYVO y Partner (ver
  // require-full-editor-access.ts). Para un dueño, la pestaña "Editor"
  // era un link muerto: lo redirigía a /rapido sin explicación, y la
  // sensación no es "tengo un plan más acotado" sino "algo se rompió".
  // Acá pasa a llamarse "Mi web" y a apuntar directo a donde él sí
  // trabaja, en vez de mandarlo a rebotar.
  const isOwner = session?.role === "owner";

  const visibleTabs = TABS.filter(
    (tab) => tab.key !== "academia" || academy !== null || active === "academia"
  ).map((tab) =>
    tab.key === "editor" && isOwner
      ? { ...tab, label: "Mi web", suffix: "/rapido" }
      : tab
  );

  return (
    <div className="flex items-center gap-4 flex-wrap border-b border-ink-line pb-4 mb-8">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/admin/negocios/${businessId}${tab.suffix}`}
          className="section-eyebrow text-xs transition-colors hover:text-brass"
          style={{
            color: active === tab.key ? "var(--brass)" : "var(--bone-muted)",
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
