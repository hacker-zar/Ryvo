"use client";

import { useState } from "react";
import { Business, Location, Service } from "@/types/business";
import { formatPrice, isLikelyPhone } from "@/lib/format";

interface StepDetailsProps {
  business: Pick<Business, "primary_color">;
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
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

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
          <input
            id="booking_phone"
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => onChangePhone(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            aria-invalid={phoneInvalid}
            className={`${inputClasses} ${phoneInvalid ? "border-red-400" : ""}`}
            placeholder="11 1234-5678"
          />
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
      <div className="mt-6 rounded-sm border border-ink-line bg-ink-elevated p-4">
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
