import Link from "next/link";

type NavKey =
  | "editor"
  | "turnos"
  | "clientes"
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
  { key: "estadisticas", label: "Estadísticas", suffix: "/estadisticas" },
  { key: "oportunidades", label: "Oportunidades", suffix: "/oportunidades" },
  { key: "cuenta", label: "Configuración", suffix: "/cuenta" },
];

/**
 * Tabs compartidos entre las 6 páginas del negocio (Editor/Turnos/
 * Clientes/Estadísticas/Oportunidades/Configuración) — reemplaza los
 * links sueltos "Turnos →"/"Cuenta →" que antes solo existían en el
 * editor. Mismos destinos que el menú desplegable del sitio público (ver
 * PublicSiteAdminBar).
 */
export default function BusinessNav({ businessId, active }: BusinessNavProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap border-b border-ink-line pb-4 mb-8">
      {TABS.map((tab) => (
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
