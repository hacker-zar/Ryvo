"use client";

import { useRouter } from "next/navigation";
import { AcademyInterestStatus, AcademyInterestWithCategory } from "@/types/business";
import { adminUpdateAcademyInterestStatus } from "@/lib/admin/actions";
import { whatsappLink } from "@/lib/format";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import SaveStatus from "@/components/ui/SaveStatus";
import {
  ACADEMY_INTEREST_STATUS_LABELS,
  ACADEMY_INTEREST_STATUS_ORDER,
} from "../../interest-status";

interface InterestDetailProps {
  businessId: string;
  interest: AcademyInterestWithCategory;
}

export default function InterestDetail({ businessId, interest }: InterestDetailProps) {
  const router = useRouter();
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleChangeStatus(next: AcademyInterestStatus) {
    if (next === interest.status) return;
    const result = await run(() =>
      adminUpdateAcademyInterestStatus(businessId, interest.id, next)
    );
    if (result.success) router.refresh();
  }

  return (
    <div className="mt-8 grid gap-8 max-w-lg">
      <div className="radius-sm border border-ink-line p-5 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-bone-muted">Nombre</span>
          <span className="text-bone">{interest.name}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone-muted">Categoría</span>
          <span className="text-bone">{interest.category_name ?? "Categoría eliminada"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone-muted">Teléfono</span>
          <span className="ticket-number text-bone">{interest.phone}</span>
        </div>
        {interest.email ? (
          <div className="flex justify-between gap-4">
            <span className="text-bone-muted">Email</span>
            <span className="text-bone">{interest.email}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <span className="text-bone-muted">Fecha</span>
          <span className="text-bone">
            {new Date(interest.created_at).toLocaleDateString("es-AR")}
          </span>
        </div>
      </div>

      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Estado</p>
        <div className="flex flex-wrap gap-2">
          {ACADEMY_INTEREST_STATUS_ORDER.map((s) => {
            const isActive = s === interest.status;
            return (
              <button
                key={s}
                type="button"
                disabled={isPending}
                onClick={() => handleChangeStatus(s)}
                className="section-eyebrow text-xs px-4 py-2.5 radius-sm border transition-colors disabled:opacity-50"
                style={{
                  borderColor: isActive ? "var(--brass)" : "var(--ink-line)",
                  color: isActive ? "var(--brass)" : "var(--bone-muted)",
                }}
              >
                {ACADEMY_INTEREST_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
        <SaveStatus status={status} error={error} className="mt-3" />
      </div>

      <a
        href={whatsappLink(
          interest.phone,
          `Hola ${interest.name}! Te escribimos por tu interés en la Academia${
            interest.category_name ? ` (${interest.category_name})` : ""
          }.`
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="section-eyebrow radius-sm bg-brass text-ink font-semibold px-6 py-3.5 text-xs hover:opacity-90 transition-opacity w-fit"
      >
        Contactar por WhatsApp
      </a>
    </div>
  );
}
