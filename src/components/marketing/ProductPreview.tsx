/**
 * Representación visual del producto: un mockup abstracto de navegador
 * mostrando la forma de la web pública de un negocio (header + hero +
 * botón de reserva), la misma estructura real que arma
 * src/app/[slug]/page.tsx. No es una captura real ni usa datos de ningún
 * negocio en particular — es deliberadamente genérico.
 */
export default function ProductPreview() {
  return (
    <section id="producto" className="mx-auto max-w-3xl px-4 pb-24 md:pb-32">
      <div className="rounded-2xl border border-graphite-line bg-graphite-elevated shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] overflow-hidden animate-[slideUp_0.25s_ease-out]">
        {/* Barra de navegador */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-graphite-line">
          <span className="h-2.5 w-2.5 rounded-full bg-graphite-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-graphite-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-graphite-line" />
          <div className="ml-3 flex-1 max-w-56 rounded-full bg-graphite px-3 py-1 text-[11px] text-porcelain-muted truncate">
            tu-negocio.com.ar
          </div>
        </div>

        {/* Contenido del mockup: header + hero de un negocio genérico */}
        <div className="p-6 md:p-10">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-full bg-porcelain/80" />
            <div className="h-3 w-14 rounded-full bg-signal/70" />
          </div>

          <div className="mt-10 flex flex-col items-center text-center gap-3">
            <div className="h-2 w-28 rounded-full bg-signal/50" />
            <div className="h-5 w-64 max-w-full rounded-full bg-porcelain/90" />
            <div className="h-2 w-44 rounded-full bg-porcelain-muted/50" />
            <div className="mt-4 h-9 w-36 rounded-full bg-porcelain/90" />
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3">
            <div className="h-16 rounded-lg bg-graphite border border-graphite-line" />
            <div className="h-16 rounded-lg bg-graphite border border-graphite-line" />
            <div className="h-16 rounded-lg bg-graphite border border-graphite-line" />
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-porcelain-muted">
        Así se ve la web que le armamos a tu negocio.
      </p>
    </section>
  );
}
