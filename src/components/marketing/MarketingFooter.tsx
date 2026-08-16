export default function MarketingFooter() {
  return (
    <footer className="border-t border-graphite-line py-8">
      <div className="mx-auto max-w-5xl px-4 text-center text-xs text-porcelain-muted/70">
        © {new Date().getFullYear()} RYVO — software para peluquerías y
        barberías.
      </div>
    </footer>
  );
}
