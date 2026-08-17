import { AsyncStatus } from "@/lib/useAsyncStatus";

interface SaveStatusProps {
  status: AsyncStatus;
  error?: string;
  savedLabel?: string;
  /** Color del mensaje de éxito — por defecto el brass del sistema, pero
   *  Apariencia lo pisa con el primary_color recién elegido (mismo
   *  comportamiento que tenía antes de extraer este componente). */
  successColor?: string;
  className?: string;
}

/**
 * El "Guardando.../Guardado./mensaje de error en rojo" repetido en cada
 * form del admin — ahora un solo componente. No maneja el botón (cada
 * form ya tiene su propio texto/disabled), solo el mensaje debajo.
 */
export default function SaveStatus({
  status,
  error,
  savedLabel = "Guardado.",
  successColor,
  className,
}: SaveStatusProps) {
  if (status === "error") {
    return (
      <p className={`text-sm text-red-400 ${className ?? ""}`}>{error}</p>
    );
  }
  if (status === "success") {
    return (
      <p
        className={`text-sm ${successColor ? "" : "text-brass"} ${className ?? ""}`}
        style={successColor ? { color: successColor } : undefined}
      >
        {savedLabel}
      </p>
    );
  }
  return null;
}
