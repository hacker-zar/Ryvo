"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Account, AccountRole, Business } from "@/types/business";
import {
  adminAssignBusinessToPartner,
  adminCreatePartner,
  adminUnassignBusinessFromPartner,
} from "@/lib/admin/actions";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";

interface UsersPanelProps {
  accounts: Account[];
  businesses: Business[];
}

const ROLE_LABELS: Record<AccountRole, string> = {
  owner: "Dueño",
  admin: "Administrador",
  worker: "Barber",
  partner: "Partner",
};

const ROLE_FILTERS: { value: AccountRole | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los roles" },
  { value: "partner", label: ROLE_LABELS.partner },
  { value: "owner", label: ROLE_LABELS.owner },
  { value: "admin", label: ROLE_LABELS.admin },
  { value: "worker", label: ROLE_LABELS.worker },
];

export default function UsersPanel({ accounts, businesses }: UsersPanelProps) {
  const [roleFilter, setRoleFilter] = useState<AccountRole | "todos">("todos");
  const [businessFilter, setBusinessFilter] = useState("todos");
  const [search, setSearch] = useState("");

  const businessesById = useMemo(
    () => new Map(businesses.map((b) => [b.id, b])),
    [businesses]
  );
  const partnerBusinesses = useMemo(() => {
    const map = new Map<string, Business[]>();
    for (const business of businesses) {
      if (!business.partner_id) continue;
      const list = map.get(business.partner_id) ?? [];
      list.push(business);
      map.set(business.partner_id, list);
    }
    return map;
  }, [businesses]);

  const filtered = accounts.filter((account) => {
    if (roleFilter !== "todos" && account.role !== roleFilter) return false;
    if (businessFilter !== "todos") {
      const belongsToBusiness =
        account.business_id === businessFilter ||
        (partnerBusinesses.get(account.id) ?? []).some((b) => b.id === businessFilter);
      if (!belongsToBusiness) return false;
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      if (!account.name.toLowerCase().includes(term) && !account.username.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="grid gap-10">
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as AccountRole | "todos")}
          className={adminInputClasses}
        >
          {ROLE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className={adminInputClasses}
        >
          <option value="todos">Todos los negocios</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o usuario"
          className={adminInputClasses}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-ink-line text-left text-xs text-bone-muted">
              <th className="py-2 pr-4 font-normal">Nombre</th>
              <th className="py-2 pr-4 font-normal">Usuario</th>
              <th className="py-2 pr-4 font-normal">Rol</th>
              <th className="py-2 pr-4 font-normal">Negocio(s)</th>
              <th className="py-2 pr-4 font-normal">Estado</th>
              <th className="py-2 pr-4 font-normal">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-line">
            {filtered.map((account) => {
              const ownBusiness = account.business_id
                ? businessesById.get(account.business_id)
                : null;
              const assigned = partnerBusinesses.get(account.id) ?? [];

              return (
                <tr key={account.id}>
                  <td className="py-3 pr-4 text-bone">{account.name}</td>
                  <td className="py-3 pr-4 text-bone-muted">{account.username}</td>
                  <td className="py-3 pr-4">
                    <span className="section-eyebrow text-[10px] px-2 py-0.5 radius-sm border border-ink-line text-bone-muted">
                      {ROLE_LABELS[account.role]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {ownBusiness ? (
                      <Link
                        href={`/admin/negocios/${ownBusiness.id}`}
                        className="text-bone-muted hover:text-brass transition-colors"
                      >
                        {ownBusiness.name}
                      </Link>
                    ) : assigned.length > 0 ? (
                      <span className="flex flex-wrap gap-x-2">
                        {assigned.map((b) => (
                          <Link
                            key={b.id}
                            href={`/admin/negocios/${b.id}`}
                            className="text-bone-muted hover:text-brass transition-colors"
                          >
                            {b.name}
                          </Link>
                        ))}
                      </span>
                    ) : (
                      <span className="text-bone-muted/60">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-bone-muted">
                    {account.active ? "Activa" : "Desactivada"}
                  </td>
                  <td className="py-3 pr-4 text-bone-muted">
                    {new Date(account.created_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-bone-muted">
                  Ninguna cuenta coincide con este filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="grid gap-8 pt-8 border-t border-ink-line md:grid-cols-2">
        <CreatePartnerForm />
        <AssignBusinessForm
          businesses={businesses}
          partners={accounts.filter((a) => a.role === "partner")}
        />
      </div>
    </div>
  );
}

function CreatePartnerForm() {
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleSubmit(formData: FormData) {
    const result = await run(() => adminCreatePartner(formData));
    if (result.success) window.location.reload();
  }

  return (
    <form action={handleSubmit} className="grid gap-3 max-w-sm">
      <p className="section-eyebrow text-bone-muted">Crear Partner</p>
      <div className="grid gap-1.5">
        <label htmlFor="partner_name" className="text-xs text-bone-muted">Nombre</label>
        <input id="partner_name" name="name" required className={adminInputClasses} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="partner_username" className="text-xs text-bone-muted">Usuario</label>
        <input id="partner_username" name="username" required className={adminInputClasses} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="partner_password" className="text-xs text-bone-muted">Contraseña</label>
        <input
          id="partner_password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className={adminInputClasses}
        />
      </div>
      <SaveStatus status={status} error={error} />
      <button
        type="submit"
        disabled={isPending}
        className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {isPending ? "Creando..." : "Crear Partner"}
      </button>
    </form>
  );
}

function AssignBusinessForm({
  businesses,
  partners,
}: {
  businesses: Business[];
  partners: Account[];
}) {
  const { status, error, run, isPending } = useAsyncStatus();
  const [businessId, setBusinessId] = useState("");
  const [partnerId, setPartnerId] = useState("");

  const selected = businesses.find((b) => b.id === businessId);

  async function handleAssign() {
    if (!businessId || !partnerId) return;
    const result = await run(() => adminAssignBusinessToPartner(businessId, partnerId));
    if (result.success) window.location.reload();
  }

  async function handleUnassign() {
    if (!businessId) return;
    const result = await run(() => adminUnassignBusinessFromPartner(businessId));
    if (result.success) window.location.reload();
  }

  if (partners.length === 0) {
    return (
      <div>
        <p className="section-eyebrow text-bone-muted mb-2">Asignar negocio a Partner</p>
        <p className="text-xs text-bone-muted">Creá un Partner primero.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 max-w-sm">
      <p className="section-eyebrow text-bone-muted">Asignar negocio a Partner</p>
      <div className="grid gap-1.5">
        <label htmlFor="assign_business" className="text-xs text-bone-muted">Negocio</label>
        <select
          id="assign_business"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className={adminInputClasses}
        >
          <option value="" disabled>Elegí un negocio</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}{b.partner_id ? " (ya asignado)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="assign_partner" className="text-xs text-bone-muted">Partner</label>
        <select
          id="assign_partner"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          className={adminInputClasses}
        >
          <option value="" disabled>Elegí un partner</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <SaveStatus status={status} error={error} />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending || !businessId || !partnerId}
          className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
        >
          {isPending ? "Guardando..." : "Asignar"}
        </button>
        {selected?.partner_id ? (
          <button
            type="button"
            onClick={handleUnassign}
            disabled={isPending}
            className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone-muted hover:border-red-400 transition-colors disabled:opacity-50 w-fit"
          >
            Quitar asignación
          </button>
        ) : null}
      </div>
    </div>
  );
}
