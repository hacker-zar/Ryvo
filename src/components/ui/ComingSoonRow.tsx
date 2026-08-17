interface ComingSoonRowProps {
  label: string;
}

/** Fila deshabilitada para funciones ya nombradas en la reorganización del
 *  editor pero todavía sin construir (Productos, Automatizaciones) — dejan
 *  la estructura lista sin simular una función que no existe. */
export default function ComingSoonRow({ label }: ComingSoonRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-line last:border-b-0">
      <span className="text-sm text-bone-muted">{label}</span>
      <span className="section-eyebrow text-[10px] px-2 py-0.5 rounded-sm border border-ink-line text-bone-muted/70">
        Próximamente
      </span>
    </div>
  );
}
