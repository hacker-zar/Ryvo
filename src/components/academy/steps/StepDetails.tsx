"use client";

import { useState } from "react";
import { Business } from "@/types/business";
import { composeCustomerPhone, isLikelyPhone, suggestAreaCode } from "@/lib/format";

interface StepDetailsProps {
  business: Pick<Business, "whatsapp">;
  primaryColor: Business["primary_color"];
  name: string;
  phone: string;
  email: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeEmail: (v: string) => void;
}

const inputClasses =
  "radius-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

// Nada de "Resumen" acá (a diferencia de StepDetails de turnos) — el
// resumen de Academia es su propio paso siguiente (StepConfirm), pedido
// explícito como paso separado.
export default function StepDetails({
  business,
  primaryColor,
  name,
  phone,
  email,
  onChangeName,
  onChangePhone,
  onChangeEmail,
}: StepDetailsProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInvalid = phoneTouched && phone.trim().length > 0 && !isLikelyPhone(phone);

  // Mismo split área+número que el wizard de turnos, mismos helpers.
  const [areaCode, setAreaCode] = useState(() => suggestAreaCode(business.whatsapp));
  const [localNumber, setLocalNumber] = useState("");

  function handleAreaCodeChange(v: string) {
    setAreaCode(v);
    onChangePhone(composeCustomerPhone(v, localNumber));
  }

  function handleLocalNumberChange(v: string) {
    setLocalNumber(v);
    onChangePhone(composeCustomerPhone(areaCode, v));
  }

  return (
    <div>
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Paso 2
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">Tus datos</h3>

      <div className="mt-6 grid gap-3.5">
        <div className="grid gap-1.5">
          <label htmlFor="academy_name" className="text-xs text-bone-muted">
            Nombre y apellido
          </label>
          <input
            id="academy_name"
            type="text"
            required
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className={inputClasses}
            placeholder="Tu nombre"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="academy_phone" className="text-xs text-bone-muted">
            WhatsApp / Teléfono
          </label>
          <div className="flex gap-2">
            <input
              id="academy_area_code"
              type="tel"
              inputMode="numeric"
              aria-label="Código de área"
              value={areaCode}
              onChange={(e) => handleAreaCodeChange(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              className={`${inputClasses} w-20 text-center`}
              placeholder="341"
            />
            <input
              id="academy_phone_number"
              type="tel"
              inputMode="numeric"
              required
              aria-label="Número de teléfono"
              value={localNumber}
              onChange={(e) => handleLocalNumberChange(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              aria-invalid={phoneInvalid}
              className={`${inputClasses} flex-1 min-w-0 ${phoneInvalid ? "border-red-400" : ""}`}
              placeholder="1234-5678"
            />
          </div>
          {phoneInvalid ? (
            <p className="text-xs text-red-400">Revisá tu número de teléfono.</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="academy_email" className="text-xs text-bone-muted">
            Email (opcional)
          </label>
          <input
            id="academy_email"
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            className={inputClasses}
            placeholder="tu@email.com"
          />
        </div>
      </div>
    </div>
  );
}
