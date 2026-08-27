import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import { PageRequest, PageRequestStatus, PageRequestWithBusiness } from "@/types/business";

function mapPageRequestWithBusiness(
  row: PageRequest & {
    businesses?: { published: boolean; slug: string } | { published: boolean; slug: string }[] | null;
  }
): PageRequestWithBusiness {
  const { businesses, ...request } = row;
  const business = Array.isArray(businesses) ? businesses[0] : businesses;
  return {
    ...request,
    business_published: business?.published ?? null,
    business_slug: business?.slug ?? null,
  };
}

/** Embebe published/slug del negocio vinculado (join sobre business_id,
 *  ver PageRequestWithBusiness) — así /admin/solicitudes puede mostrar
 *  "Continuar con la página" vs "Ir al negocio" sin una segunda consulta
 *  por fila. */
export async function listPageRequests(): Promise<PageRequestWithBusiness[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("page_requests")
    .select("*, businesses(published, slug)")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapPageRequestWithBusiness);
}

export async function updatePageRequestStatus(
  id: string,
  status: PageRequestStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const { error } = await supabaseAdmin
    .from("page_requests")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

type ClaimResult =
  | { success: true; request: PageRequest; previousStatus: PageRequestStatus }
  | { success: false; error: string };

/**
 * Primer paso de "Convertir en negocio" — reserva la solicitud para ESTA
 * llamada antes de crear nada. La defensa real contra dos clics
 * rápidos/llamadas concurrentes es el UPDATE de abajo: su WHERE
 * (`business_id is null` + `status in (new, contacted)`) hace que, entre
 * dos llamadas simultáneas para la misma solicitud, como mucho UNA
 * afecte una fila — Postgres serializa updates sobre la misma fila, así
 * que no hay ventana para que ambas "ganen". El SELECT previo es solo
 * para poder devolver un mensaje específico (no encontrada / ya
 * convertida / descartada); si pierde la carrera contra otro proceso, el
 * UPDATE de abajo lo detecta igual y devuelve el error genérico.
 *
 * Si el negocio no llega a crearse después de este claim, el caller debe
 * llamar revertPageRequestClaim con el `previousStatus` devuelto acá —
 * si no, la solicitud queda "converted" sin negocio, un estado roto.
 */
export async function claimPageRequestForConversion(id: string): Promise<ClaimResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { success: false, error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY." };
  }

  const { data: existing } = await supabaseAdmin
    .from("page_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { success: false, error: "Solicitud no encontrada." };
  if (existing.business_id) return { success: false, error: "Esta solicitud ya fue convertida." };
  if (existing.status === "discarded") {
    return { success: false, error: "Esta solicitud fue descartada." };
  }
  if (existing.status === "converted") {
    return { success: false, error: "Esta solicitud ya fue convertida." };
  }

  const { data: claimed, error } = await supabaseAdmin
    .from("page_requests")
    .update({ status: "converted" })
    .eq("id", id)
    .is("business_id", null)
    .in("status", ["new", "contacted"])
    .select("*")
    .single();

  if (error || !claimed) {
    return {
      success: false,
      error: "Esta solicitud ya está siendo convertida (o ya fue convertida).",
    };
  }

  return { success: true, request: existing, previousStatus: existing.status };
}

/** Deshace un claim cuando la creación del negocio falla por completo
 *  (ver adminConvertPageRequestToBusiness) — vuelve al estado anterior
 *  para que la solicitud sea reintentable. `is("business_id", null)`
 *  como defensa: nunca revierte una fila que ya llegó a linkearse. */
export async function revertPageRequestClaim(
  id: string,
  previousStatus: PageRequestStatus
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  await supabaseAdmin
    .from("page_requests")
    .update({ status: previousStatus })
    .eq("id", id)
    .is("business_id", null);
}

export async function linkPageRequestToBusiness(id: string, businessId: string): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  await supabaseAdmin.from("page_requests").update({ business_id: businessId }).eq("id", id);
}
