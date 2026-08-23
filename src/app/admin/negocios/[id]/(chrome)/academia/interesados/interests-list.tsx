"use client";

import Icon from "@/components/ui/Icon";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AcademyInterestStatus, AcademyInterestWithCategory } from "@/types/business";
import { adminInputClasses } from "@/lib/ui-classes";
import EmptyState from "@/components/ui/EmptyState";
import {
  ACADEMY_INTEREST_STATUS_LABELS,
  ACADEMY_INTEREST_STATUS_ORDER,
} from "../interest-status";

interface InterestsListProps {
  businessId: string;
  interests: AcademyInterestWithCategory[];
}

export default function InterestsList({ businessId, interests }: InterestsListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AcademyInterestStatus | "todos">("todos");

  const filtered = useMemo(() => {
    return interests.filter((interest) => {
      if (statusFilter !== "todos" && interest.status !== statusFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        interest.name.toLowerCase().includes(q) ||
        interest.phone.toLowerCase().includes(q) ||
        (interest.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [interests, query, statusFilter]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email"
          className={`${adminInputClasses} max-w-sm`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AcademyInterestStatus | "todos")}
          className={adminInputClasses}
        >
          <option value="todos">Todos los estados</option>
          {ACADEMY_INTEREST_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {ACADEMY_INTEREST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 divide-y divide-ink-line border-t border-b border-ink-line">
        {interests.length === 0 ? (
          <EmptyState
            title="Todavía no hay interesados."
            hint="En cuanto alguien complete 'Me interesa' en Academia, va a aparecer acá."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Ningún interesado coincide con este filtro." />
        ) : (
          filtered.map((interest) => (
            <Link
              key={interest.id}
              href={`/admin/negocios/${businessId}/academia/interesados/${interest.id}`}
              className="py-4 flex items-center justify-between gap-4 hover:bg-ink-elevated -mx-2 px-2 transition-colors"
            >
              <div>
                <p className="text-bone font-medium text-sm">{interest.name}</p>
                <p className="text-xs text-bone-muted mt-1">
                  {interest.category_name ?? "Categoría eliminada"} · {interest.phone}
                  {interest.email ? ` · ${interest.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-bone-muted">
                  {ACADEMY_INTEREST_STATUS_LABELS[interest.status]}
                </span>
                <Icon name="arrow" size={16} className="shrink-0 text-bone-muted" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
