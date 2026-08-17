"use client";

import { useState } from "react";
import { adminSetBusinessPassword } from "@/lib/admin/actions";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

interface AdminPasswordFormProps {
  businessId: string;
  hasPassword: boolean;
}

export default function AdminPasswordForm({
  businessId,
  hasPassword,
}: AdminPasswordFormProps) {
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
    const result = await adminSetBusinessPassword(businessId, formData);
    if (result.success) {
      setStatus("saved");
      setPassword("");
      setConfirm("");
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar.");
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-3 max-w-sm">
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-xs text-bone-muted">
          {hasPassword ? "Nueva contraseña" : "Contraseña"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClasses}
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password_confirm" className="text-xs text-bone-muted">
          Repetir contraseña
        </label>
        <input
          id="password_confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClasses}
        />
      </div>

      {status === "error" ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
      {status === "saved" ? (
        <p className="text-sm text-brass">Contraseña guardada.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 w-fit"
      >
        {status === "submitting"
          ? "Guardando..."
          : hasPassword
            ? "Cambiar contraseña"
            : "Asignar contraseña"}
      </button>
    </form>
  );
}
