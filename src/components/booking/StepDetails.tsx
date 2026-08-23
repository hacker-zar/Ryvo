"use client";

import { useState } from "react";
import { Business, Location, Service } from "@/types/business";
import { composeCustomerPhone, formatPrice, isLikelyPhone, suggestAreaCode } from "@/lib/format";

interface StepDetailsProps {
  business: Pick<Business, "primary_color" | "whatsapp">;
  service: Service;
  location: Location;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeEmail: (v: string) => void;
}

const inputClasses =
  "radius-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
}

export default function StepDetails({
  business,
  service,
  location,
  date,
  time,
  customerName,
  customerPhone,
  customerEmail,
  onChangeName,
  onChangePhone,
  onChangeEmail,
}: StepDetailsProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInvalid =
    phoneTouched && customerPhone.trim().length > 0 && !isLikelyPhone(customerPhone);

  // Código de área y número por separado (pedido explícito: el cliente
  // no debería tener que acordarse de anteponer el código de área él
  // mismo). Se sugiere el del propio negocio (nunca por geolocalización
  // del cliente) pero queda editable — si no se puede sugerir, arranca
  // vacío. Estado local: `customerPhone` (el string combinado que ya
  // maneja el wizard) es la única fuente de verdad para submit/validación,
  // estos dos campos solo existen para la UX de carga.
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
      <p className="section-eyebrow" style={{ color: business.primary_color }}>
        Paso 3
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">Tus datos</h3>

      <div className="mt-6 grid gap-3.5">
        <div className="grid gap-1.5">
          <label htmlFor="booking_name" className="text-xs text-bone-muted">
            Nombre
          </label>
          <input
            id="booking_name"
            type="text"
            required
            value={customerName}
            onChange={(e) => onChangeName(e.target.value)}
            className={inputClasses}
            placeholder="Tu nombre"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="booking_phone" className="text-xs text-bone-muted">
            WhatsApp / Teléfono
          </label>
          <div className="flex gap-2">
            <input
              id="booking_area_code"
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
              id="booking_phone"
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
          <p className="text-[11px] text-bone-muted/70">
            Código de área + número. Lo vamos a usar por WhatsApp para confirmar tu turno.
          </p>
          {phoneInvalid ? (
            <p className="text-xs text-red-400">Revisá tu número de teléfono.</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="booking_email" className="text-xs text-bone-muted">
            Email (opcional)
          </label>
          <input
            id="booking_email"
            type="email"
            value={customerEmail}
            onChange={(e) => onChangeEmail(e.target.value)}
            className={inputClasses}
            placeholder="tu@email.com"
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-6 radius-sm border border-ink-line bg-ink-elevated p-4">
        <p className="section-eyebrow text-bone-muted mb-2.5">Resumen</p>
        <dl className="grid gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-bone-muted">Servicio</dt>
            <dd className="text-bone">{service.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bone-muted">Fecha</dt>
            <dd className="text-bone">{formatDateLong(date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bone-muted">Hora</dt>
            <dd className="ticket-number text-bone">{time}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bone-muted">Local</dt>
            <dd className="text-bone">{location.name}</dd>
          </div>
          <div className="flex justify-between pt-1.5 mt-1.5 border-t border-ink-line">
            <dt className="text-bone-muted">Precio</dt>
            <dd
              className="ticket-number font-medium"
              style={{ color: business.primary_color }}
            >
              {formatPrice(service.price)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
