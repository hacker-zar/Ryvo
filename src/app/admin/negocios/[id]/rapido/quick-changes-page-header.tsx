import Link from "next/link";

interface QuickChangesPageHeaderProps {
  businessId: string;
  title: string;
}

/** Encabezado compartido por las 6 sub-páginas de Cambios rápidos — mismo
 *  "← Volver" + título en las 6, un solo lugar. */
export default function QuickChangesPageHeader({
  businessId,
  title,
}: QuickChangesPageHeaderProps) {
  return (
    <>
      <Link
        href={`/admin/negocios/${businessId}/rapido`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a Cambios rápidos
      </Link>

      <p className="section-eyebrow text-brass mt-6">Cambios rápidos</p>
      <h1 className="section-title mt-2 text-2xl text-bone">{title}</h1>
    </>
  );
}
