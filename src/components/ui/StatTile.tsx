interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
}

/** Generaliza el estilo de tile que ya usaba `today-summary.tsx`
 *  (`ticket-number text-3xl text-brass` + label) para cualquier número del
 *  dashboard de estadísticas — sin decoración extra, solo el número. */
export default function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="radius-sm border border-ink-line bg-ink-elevated px-5 py-4">
      <p className="ticket-number text-3xl text-brass">{value}</p>
      <p className="text-sm text-bone-muted mt-1">{label}</p>
      {hint ? <p className="text-xs text-bone-muted/70 mt-0.5">{hint}</p> : null}
    </div>
  );
}
