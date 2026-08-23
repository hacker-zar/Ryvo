"use server";

import { supabase } from "@/lib/supabase";

export interface CreateAcademyInterestInput {
  business_id: string;
  academy_category_id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * Único punto de entrada público para dejar una solicitud de interés en
 * la Academia — sin sesión, cualquier visitante puede llamarla (mismo
 * criterio que submitBooking). Usa el cliente `supabase` (anon, respeta
 * RLS: "public insert academy interests", sin ninguna política de
 * lectura) — nunca supabaseAdmin, para que quede estructuralmente
 * imposible que esta acción devuelva solicitudes ajenas.
 *
 * Sin `.select().single()` encadenado al insert a propósito: Supabase
 * necesita leer de vuelta la fila insertada para eso, lo que exige una
 * política de SELECT — y `academy_interests` deliberadamente no tiene
 * ninguna (ver migración). Como el modal de éxito no necesita el id
 * (a diferencia de "Gestionar mi turno" en Turnos), un insert liso evita
 * el conflicto sin abrir ninguna lectura pública.
 */
export async function submitAcademyInterest(
  input: CreateAcademyInterestInput
): Promise<{ success: boolean; error?: string }> {
  if (
    !input.business_id ||
    !input.academy_category_id ||
    !input.name.trim() ||
    !input.phone.trim()
  ) {
    return { success: false, error: "Completá todos los campos." };
  }

  if (!supabase) {
    return { success: false, error: "No se pudo enviar la solicitud." };
  }

  const { error } = await supabase.from("academy_interests").insert({
    business_id: input.business_id,
    academy_category_id: input.academy_category_id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    status: "new",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
