"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Product } from "@/types/business";

const QUERY_PARAM = "producto";
// pushState/replaceState no disparan "popstate" — este evento propio es
// lo que le avisa a useSyncExternalStore que la URL cambió por una
// llamada de open/goTo/close, no solo por el botón atrás del navegador.
const LOCATION_CHANGE_EVENT = "catalog:producto-change";

// Se maneja la URL a mano (history.pushState/replaceState + useSyncExternalStore)
// en vez de useSearchParams()/useRouter() de next/navigation a propósito:
// useSearchParams() exige envolver en <Suspense> para no forzar la ruta
// entera a renderizado dinámico — acá no hace falta nada de eso, y este
// mecanismo da control directo sobre cuándo es push (abrir, entra al
// historial) y cuándo es replace (cambiar de producto o cerrar, no
// acumula historial). useSyncExternalStore (no useState+useEffect) es a
// propósito: leer/escribir un store externo (la URL del navegador) es
// exactamente el caso que separa de un efecto normal, y evita el
// setState síncrono dentro de un efecto.
function readProductIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(QUERY_PARAM);
}

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(LOCATION_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(LOCATION_CHANGE_EVENT, callback);
  };
}

function getServerSnapshot(): string | null {
  return null;
}

function buildUrl(productId: string | null): string {
  const url = new URL(window.location.href);
  if (productId) url.searchParams.set(QUERY_PARAM, productId);
  else url.searchParams.delete(QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Estado + sincronización con `?producto=<id>` del detalle de un
 * producto — un hook, no un contexto: cada renderer (CatalogList/
 * CatalogGrid/CatalogFeatured) lo llama con SU propia lista de
 * productos, sin compartir estado entre ellos (nunca hay más de un
 * renderer montado al mismo tiempo en una página real, así que no hace
 * falta coordinarlos).
 *
 * `products` ya llega filtrada a activos (ver getBusinessProfile) — un
 * id inexistente o de un producto inactivo simplemente no aparece en la
 * lista, así que `openProduct` da `null` y no se abre nada, sin
 * necesidad de un chequeo aparte.
 */
export function useProductDetail(products: Product[]) {
  const openId = useSyncExternalStore(subscribe, readProductIdFromUrl, getServerSnapshot);

  const openIndex = openId ? products.findIndex((p) => p.id === openId) : -1;
  const openProduct = openIndex >= 0 ? products[openIndex] : null;

  const open = useCallback((id: string) => {
    window.history.pushState({}, "", buildUrl(id));
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  }, []);

  const goTo = useCallback((id: string) => {
    window.history.replaceState({}, "", buildUrl(id));
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  }, []);

  // replaceState (no pushState): cerrar nunca debe depender de cuántas
  // entradas de historial existan (alguien puede llegar directo con
  // ?producto=<id> desde un link compartido, sin ningún estado previo
  // "cerrado" al que volver) — el botón de cerrar/Escape/overlay siempre
  // tiene que funcionar, sea cual sea el historial.
  const close = useCallback(() => {
    window.history.replaceState({}, "", buildUrl(null));
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  }, []);

  const goPrev = openIndex > 0 ? () => goTo(products[openIndex - 1].id) : null;
  const goNext =
    openIndex >= 0 && openIndex < products.length - 1
      ? () => goTo(products[openIndex + 1].id)
      : null;

  return { openProduct, open, close, goPrev, goNext };
}
