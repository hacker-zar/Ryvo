import Image from "next/image";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-graphite-line py-8">
      <div className="mx-auto max-w-5xl px-4 flex flex-col items-center gap-3 text-center text-xs text-porcelain-muted/70">
        <Image
          src="/ryvo-logo-light.png"
          alt="RYVO"
          width={307}
          height={204}
          className="h-5 w-auto opacity-80"
        />
        © {new Date().getFullYear()} RYVO — software para peluquerías y
        barberías.
      </div>
    </footer>
  );
}
