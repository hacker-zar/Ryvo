import { Business } from "@/types/business";

interface FooterProps {
  business: Pick<Business, "name">;
}

export default function Footer({ business }: FooterProps) {
  return (
    <footer className="border-t border-ink-line py-8">
      <div className="mx-auto max-w-5xl px-4 text-center text-xs text-bone-muted/70">
        © {new Date().getFullYear()} {business.name}
      </div>
    </footer>
  );
}
