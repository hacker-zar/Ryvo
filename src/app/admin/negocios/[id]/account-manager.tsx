"use client";

import { useState } from "react";
import { Account } from "@/types/business";
import {
  adminChangeAccountPassword,
  adminCreateAccount,
  adminUpdateAccount,
} from "@/lib/admin/actions";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

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
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminCreateAccount(businessId, formData);
    if (result.success) {
      window.location.reload();
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo crear la cuenta.");
    }
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
        <input id="name" name="name" required className={inputClasses} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="username" className="text-xs text-bone-muted">
          Usuario
        </label>
        <input id="username" name="username" required className={inputClasses} />
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
          className={inputClasses}
        />
      </div>
      {status === "error" ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {status === "submitting" ? "Creando..." : "Crear cuenta"}
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
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleUpdate(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminUpdateAccount(businessId, account.id, formData);
    if (result.success) {
      setStatus("saved");
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar.");
    }
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
            className={inputClasses}
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
            className={inputClasses}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input name="active" type="checkbox" defaultChecked={account.active} />
          Cuenta activa
        </label>

        {status === "error" ? <p className="text-sm text-red-400">{error}</p> : null}
        {status === "saved" ? (
          <p className="text-sm text-brass">Guardado.</p>
        ) : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
        >
          {status === "submitting" ? "Guardando..." : "Guardar cuenta"}
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
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    if (password !== confirm) {
      setStatus("error");
      setError("Las contraseñas no coinciden.");
      return;
    }
    setStatus("submitting");
    setError("");
    const result = await adminChangeAccountPassword(businessId, accountId, formData);
    if (result.success) {
      setStatus("saved");
      setPassword("");
      setConfirm("");
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo cambiar la contraseña.");
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
          className={inputClasses}
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
          className={inputClasses}
        />
      </div>
      {status === "error" ? <p className="text-sm text-red-400">{error}</p> : null}
      {status === "saved" ? (
        <p className="text-sm text-brass">Contraseña actualizada.</p>
      ) : null}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {status === "submitting" ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
