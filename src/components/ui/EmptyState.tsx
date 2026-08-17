interface EmptyStateProps {
  title: string;
  /** Qué falta y qué puede hacer el dueño — no solo "sin datos". */
  hint?: string;
}

/**
 * Reemplaza los `<p>Todavía no hay X cargado.</p>` sueltos del admin.
 * Deliberadamente sin ícono/ilustración — el pedido es consistencia y
 * claridad, no decoración.
 */
export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="py-6">
      <p className="text-sm text-bone-muted">{title}</p>
      {hint ? (
        <p className="text-xs text-bone-muted/70 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
