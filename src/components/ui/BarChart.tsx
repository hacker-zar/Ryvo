interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  formatValue?: (value: number) => string;
}

/**
 * Barras horizontales hechas a mano con CSS (sin librería de gráficos —
 * el proyecto no tiene una instalada y se decidió no sumarla). Usa
 * únicamente los tokens de diseño existentes.
 */
export default function BarChart({ items, formatValue }: BarChartProps) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-xs text-bone-muted mb-1">
            <span>{item.label}</span>
            <span className="ticket-number">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
          <div className="h-2 rounded-full bg-ink-line overflow-hidden">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? "var(--brass)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
