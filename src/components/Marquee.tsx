// Banda de texto en loop horizontal — exclusiva de las plantillas Noir y
// Bold (ver LAYOUT_BLUEPRINTS). Animación CSS pura (transform, sin
// listener de scroll ni JS por frame — mismo criterio de performance que
// useScrollReveal), pausada si el usuario prefiere menos movimiento.
interface MarqueeProps {
  businessName: string;
  accentColor: string;
}

export default function Marquee({ businessName, accentColor }: MarqueeProps) {
  const phrase = `${businessName.toUpperCase()} — RESERVÁ TU TURNO ONLINE`;
  // Se repite varias veces en una sola tira; el CSS desplaza la tira
  // -50% (la mitad exacta, gracias a duplicar el contenido dos veces)
  // para que el loop sea perfectamente continuo sin salto visible.
  const items = Array.from({ length: 6 }, () => phrase);

  return (
    <div
      className="overflow-hidden border-y border-ink-line py-4 bg-ink-elevated"
      aria-hidden="true"
    >
      <div className="marquee-track flex whitespace-nowrap">
        {[...items, ...items].map((text, i) => (
          <span
            key={i}
            className="section-title text-lg md:text-2xl px-6 shrink-0"
            style={{ color: i % 2 === 0 ? accentColor : "var(--text-muted)" }}
          >
            {text} ✦
          </span>
        ))}
      </div>
    </div>
  );
}
