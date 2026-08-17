"use client";

import { useState } from "react";
import { Account } from "@/types/business";
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
}

/**
 * Reemplaza al viejo "Contraseña del panel" (una contraseña por negocio) —
 * ahora es una cuenta real (usuario + contraseña + estado). Hoy un negocio
 * tiene como máximo 1 cuenta en la práctica, pero el componente no asume
 * eso: si en algún momento hay más de una, las lista todas.
 */
export default function AccountManager({
  businessId,
  accounts,
}: AccountManagerProps) {
  if (accounts.length === 0) {
    return <CreateAccountForm businessId={businessId} />;
  }

  return (
    <div className="grid gap-8">
      {accounts.map((account) => (
        <ExistingAccount key={account.id} businessId={businessId} account={account} />
      ))}
    </div>
  );
}

function CreateAccountForm({ businessId }: { businessId: string }) {
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleSubmit(formData: FormData) {
    const result = await run(() => adminCreateAccount(businessId, formData));
    if (result.success) window.location.reload();
  }

  return (
    <form action={handleSubmit} className="grid gap-3 max-w-sm">
      <p className="text-sm text-bone-muted">
        Este negocio todavía no tiene una cuenta de acceso. Sin una, solo
        RYVO puede gestionarlo.
      </p>
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
      <SaveStatus status={status} error={error} />
      <button
        type="submit"
        disabled={isPending}
        className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {isPending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}

function ExistingAccount({
  businessId,
  account,
}: {
  businessId: string;
  account: Account;
}) {
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleUpdate(formData: FormData) {
    await run(() => adminUpdateAccount(businessId, account.id, formData));
  }

  return (
    <div className="grid gap-4 max-w-sm">
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
          className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
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
        className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {isPending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
