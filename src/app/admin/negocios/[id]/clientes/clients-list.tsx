"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Client } from "@/types/business";
import { adminInputClasses } from "@/lib/ui-classes";
import EmptyState from "@/components/ui/EmptyState";

interface ClientsListProps {
  businessId: string;
  clients: Client[];
}

export default function ClientsList({ businessId, clients }: ClientsListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <div className="mt-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, teléfono o email"
        className={`${adminInputClasses} max-w-sm`}
      />

      <div className="mt-6 divide-y divide-ink-line border-t border-b border-ink-line">
        {clients.length === 0 ? (
          <EmptyState
            title="Todavía no tenés clientes."
            hint="En cuanto alguien reserve un turno desde tu web, va a aparecer acá."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No encontramos ningún cliente con esa búsqueda." />
        ) : (
          filtered.map((client) => (
            <Link
              key={client.id}
              href={`/admin/negocios/${businessId}/clientes/${client.id}`}
              className="py-4 flex items-center justify-between gap-4 hover:bg-ink-elevated -mx-2 px-2 transition-colors"
            >
              <div>
                <p className="text-bone font-medium text-sm">{client.name}</p>
                <p className="text-xs text-bone-muted mt-1">
                  {client.phone}
                  {client.email ? ` · ${client.email}` : ""}
                </p>
              </div>
              <span className="text-xs text-bone-muted shrink-0">Ver ficha →</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
