"use client";

import { useState } from "react";
import { Account, AccountRole, ProfessionalWithServices } from "@/types/business";
import {
  adminChangeAccountPassword,
  adminCreateAccount,
  adminUpdateAccount,
} from "@/lib/admin/actions";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";

interface AccountManagerProps {
  businessId: string;
  accounts: Account[];
  professionals: ProfessionalWithServices[];
}

// Nombre visible del rol — "worker" sigue siendo el valor interno
// (AccountRole, DB), pero de cara al usuario siempre se muestra como
// "Barbero".
const ROLE_LABELS: Record<AccountRole, string> = {
  owner: "Dueño",
  worker: "Barbero",
  // No se ofrece como opción en este form (ver ACCOUNT_ROLES en
  // actions.ts) — una cuenta "partner" nunca está atada a un solo
  // negocio, se crea desde el panel global del superadmin
  // (/admin/usuarios). Solo acá para que el Record quede exhaustivo.
  partner: "Partner",
};

/**
 * Reemplaza al viejo "Contraseña del panel" (una contraseña por negocio) —
 * ahora es una cuenta real (usuario + contraseña + rol + estado). Un
 * negocio puede tener varias cuentas: una de dueño y, opcionalmente, una
 * por cada profesional con acceso al Editor rápido.
 */
export default function AccountManager({
  businessId,
  accounts,
  professionals,
}: AccountManagerProps) {
  return (
    <div className="grid gap-8">
      {accounts.map((account) => (
        <ExistingAccount
          key={account.id}
          businessId={businessId}
          account={account}
          professionals={professionals}
        />
      ))}
      <CreateAccountForm businessId={businessId} professionals={professionals} />
    </div>
  );
}

function CreateAccountForm({
  businessId,
  professionals,
}: {
  businessId: string;
  professionals: ProfessionalWithServices[];
}) {
  const { status, error, run, isPending } = useAsyncStatus();
  const [role, setRole] = useState<AccountRole>("owner");

  async function handleSubmit(formData: FormData) {
    const result = await run(() => adminCreateAccount(businessId, formData));
    if (result.success) window.location.reload();
  }

  return (
    <form action={handleSubmit} className="grid gap-3 max-w-sm">
      <p className="section-eyebrow text-bone-muted">Nueva cuenta</p>
      <div className="grid gap-1.5">
        <label htmlFor="name" className="text-xs text-bone-muted">
          Nombre
        </label>
        <input id="name" name="name" required className={adminInputClasses} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="username" className="text-xs text-bone-muted">
          Usuario
        </label>
        <input id="username" name="username" required className={adminInputClasses} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-xs text-bone-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className={adminInputClasses}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="role" className="text-xs text-bone-muted">
          Tipo de acceso
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as AccountRole)}
          className={adminInputClasses}
        >
          <option value="owner">{ROLE_LABELS.owner} — editor completo</option>
          <option value="worker">{ROLE_LABELS.worker} — solo sus turnos</option>
        </select>
      </div>
      {role === "worker" ? (
        professionals.length === 0 ? (
          <p className="text-xs text-amber-400/90">
            Todavía no hay profesionales cargados — agregá uno primero en
            &quot;Profesionales&quot; para poder vincularle una cuenta.
          </p>
        ) : (
          <div className="grid gap-1.5">
            <label htmlFor="professional_id" className="text-xs text-bone-muted">
              Profesional vinculado
            </label>
            <select
              id="professional_id"
              name="professional_id"
              required
              defaultValue=""
              className={adminInputClasses}
            >
              <option value="" disabled>
                Elegí un profesional
              </option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-bone-muted/70">
              Esta cuenta solo va a poder ver sus propios turnos en
              /rapido — no puede editar servicios, precios, fotos,
              profesionales, locales ni ningún otro dato del negocio.
            </p>
          </div>
        )
      ) : null}
      <SaveStatus status={status} error={error} />
      <button
        type="submit"
        disabled={isPending || (role === "worker" && professionals.length === 0)}
        className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {isPending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}

function ExistingAccount({
  businessId,
  account,
  professionals,
}: {
  businessId: string;
  account: Account;
  professionals: ProfessionalWithServices[];
}) {
  const { status, error, run, isPending } = useAsyncStatus();
  const linkedProfessional = account.professional_id
    ? professionals.find((p) => p.id === account.professional_id)
    : null;

  async function handleUpdate(formData: FormData) {
    await run(() => adminUpdateAccount(businessId, account.id, formData));
  }

  return (
    <div className="grid gap-4 max-w-sm border-t border-ink-line pt-6 first:border-t-0 first:pt-0">
      <div>
        <span className="section-eyebrow text-[10px] px-2 py-0.5 radius-sm border border-ink-line text-bone-muted">
          {ROLE_LABELS[account.role]}
        </span>
        {linkedProfessional ? (
          <span className="ml-2 text-xs text-bone-muted">
            → {linkedProfessional.name}
          </span>
        ) : null}
      </div>
      <form action={handleUpdate} className="grid gap-3">
        <div className="grid gap-1.5">
          <label htmlFor={`name-${account.id}`} className="text-xs text-bone-muted">
            Nombre
          </label>
          <input
            id={`name-${account.id}`}
            name="name"
            defaultValue={account.name}
            required
            className={adminInputClasses}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`username-${account.id}`} className="text-xs text-bone-muted">
            Usuario
          </label>
          <input
            id={`username-${account.id}`}
            name="username"
            defaultValue={account.username}
            required
            className={adminInputClasses}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input name="active" type="checkbox" defaultChecked={account.active} />
          Cuenta activa
        </label>

        <SaveStatus status={status} error={error} />

        <button
          type="submit"
          disabled={isPending}
          className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
        >
          {isPending ? "Guardando..." : "Guardar cuenta"}
        </button>
      </form>

      <ChangePasswordForm businessId={businessId} accountId={account.id} />
    </div>
  );
}

function ChangePasswordForm({
  businessId,
  accountId,
}: {
  businessId: string;
  accountId: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleSubmit(formData: FormData) {
    const result = await run(async () => {
      if (password !== confirm) {
        return { success: false, error: "Las contraseñas no coinciden." };
      }
      return adminChangeAccountPassword(businessId, accountId, formData);
    });
    if (result.success) {
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-3 pt-4 border-t border-ink-line">
      <p className="section-eyebrow text-bone-muted">Cambiar contraseña</p>
      <div className="grid gap-1.5">
        <label htmlFor={`pw-${accountId}`} className="text-xs text-bone-muted">
          Nueva contraseña
        </label>
        <input
          id={`pw-${accountId}`}
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className={adminInputClasses}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`pw-confirm-${accountId}`} className="text-xs text-bone-muted">
          Repetir contraseña
        </label>
        <input
          id={`pw-confirm-${accountId}`}
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={adminInputClasses}
        />
      </div>
      <SaveStatus status={status} error={error} savedLabel="Contraseña actualizada." />
      <button
        type="submit"
        disabled={isPending}
        className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {isPending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
