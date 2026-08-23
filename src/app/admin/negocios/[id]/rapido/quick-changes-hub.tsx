import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface QuickChangesHubProps {
  businessId: string;
}

interface QuickChangeCard {
  label: string;
  hint: string;
  href: string;
}

// "Turnos" no tiene sub-ruta propia acá — enlaza directo a la Agenda/
// Lista ya existente (/admin/negocios/[id]/turnos). Reconstruir esa
// pantalla adentro de /rapido sería exactamente la segunda
// implementación paralela que el pedido dice evitar.
function cardsFor(businessId: string): QuickChangeCard[] {
  const base = `/admin/negocios/${businessId}/rapido`;
  return [
    { label: "Servicios", hint: "Crear, editar, borrar y activar/desactivar", href: `${base}/servicios` },
    { label: "Profesionales", hint: "Alta, edición, orden y activar/desactivar", href: `${base}/profesionales` },
    { label: "Locales", hint: "Direcciones, horarios y datos básicos", href: `${base}/locales` },
    { label: "Fotos", hint: "Subir, borrar y reordenar la galería", href: `${base}/fotos` },
    { label: "Catálogo", hint: "Productos, precio, descripción y foto", href: `${base}/catalogo` },
    { label: "Turnos", hint: "Ver y gestionar los turnos del negocio", href: `/admin/negocios/${businessId}/turnos` },
    { label: "Información del negocio", hint: "Nombre, descripción, dirección y redes", href: `${base}/informacion` },
  ];
}

/**
 * Cambios rápidos — accesos directos, sin el panel de doble columna con
 * preview en vivo del editor completo (ver editor-shell.tsx). Cada
 * tarjeta lleva a una sub-ruta que renderiza EL MISMO manager que ya usa
 * el editor completo (ServicesManager, ProfessionalsManager, etc.), sin
 * segunda implementación.
 */
export default function QuickChangesHub({ businessId }: QuickChangesHubProps) {
  return (
    <div>
      <p className="section-eyebrow text-brass">Cambios rápidos</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        Modificá lo que necesités sin entrar al editor completo
      </h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {cardsFor(businessId).map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex items-center justify-between gap-4 radius-sm border border-ink-line p-5 hover:border-brass transition-colors group"
          >
            <div>
              <p className="text-bone font-medium group-hover:text-brass transition-colors">
                {card.label}
              </p>
              <p className="text-xs text-bone-muted mt-1">{card.hint}</p>
            </div>
            <Icon name="arrow" size={16} className="shrink-0 text-bone-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
