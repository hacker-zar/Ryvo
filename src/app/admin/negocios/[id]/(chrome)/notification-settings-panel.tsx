"use client";

import { useEffect, useRef } from "react";
import { adminUpdateNotificationSettings } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";

// Clave estable de este panel en el registro de guardado global — mismo
// mecanismo que el resto del editor (fotos-panel/appearance-form/etc.),
// ver EditorSelectionContext.setFormDirty/setFormSaveHandler. Ningún
// botón "Guardar" propio: se integra con "Guardar cambios"/Ctrl+S.
const FORM_KEY = "notificaciones";

interface NotificationSettingsPanelProps {
  businessId: string;
  whatsappEnabled: boolean;
  reminder24hEnabled: boolean;
}

/**
 * Notification Engine — toggles de envío automático por WhatsApp. Sin
 * campo de texto libre a propósito: los mensajes son presets fijos de
 * RYVO (ver lib/notifications/messages.ts), el negocio solo elige SI se
 * mandan, no qué dicen — mismo criterio de "presets controlados" que
 * Estilo de galería/Estilo de imágenes.
 */
export default function NotificationSettingsPanel({
  businessId,
  whatsappEnabled,
  reminder24hEnabled,
}: NotificationSettingsPanelProps) {
  const { refreshPreview, setFormDirty, setFormSaveHandler } = useEditorSelection();
  const { run, dirty, markDirty } = useAsyncStatus();
  const formRef = useRef<HTMLFormElement>(null);

  async function save(formData: FormData) {
    const result = await run(() => adminUpdateNotificationSettings(businessId, formData));
    if (result.success) refreshPreview();
    return result.success;
  }

  useEffect(() => {
    setFormDirty(FORM_KEY, dirty);
  }, [dirty, setFormDirty]);

  useEffect(() => {
    setFormSaveHandler(FORM_KEY, async () => {
      if (!formRef.current) return false;
      return save(new FormData(formRef.current));
    });
    return () => setFormSaveHandler(FORM_KEY, null);
  });

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await save(formData);
      }}
      onChange={markDirty}
      className="grid gap-4 max-w-sm"
    >
      <p className="text-xs text-bone-muted -mt-1">
        RYVO le avisa al cliente por WhatsApp cuando reserva, confirmás o
        cancelás su turno — con el mismo texto para todos los negocios,
        para que el mensaje siempre se lea profesional.
      </p>

      <label className="flex items-start gap-3 rounded-sm border border-ink-line p-3 cursor-pointer">
        <input
          type="checkbox"
          name="notify_whatsapp_enabled"
          defaultChecked={whatsappEnabled}
          className="mt-0.5"
        />
        <span>
          <span className="block text-sm text-bone">Avisos automáticos por WhatsApp</span>
          <span className="block text-xs text-bone-muted mt-0.5">
            Turno creado, confirmado, cancelado o reprogramado.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-sm border border-ink-line p-3 cursor-pointer">
        <input
          type="checkbox"
          name="notify_reminder_24h_enabled"
          defaultChecked={reminder24hEnabled}
          className="mt-0.5"
        />
        <span>
          <span className="block text-sm text-bone">Recordatorio 24hs antes</span>
          <span className="block text-xs text-bone-muted mt-0.5">
            Solo si los avisos automáticos están activados arriba.
          </span>
        </span>
      </label>
    </form>
  );
}
