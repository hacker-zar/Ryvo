"use client";

import { useConfirm } from "@/lib/useConfirm";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types/business";
import { formatPrice } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminReorderProduct,
  adminUpdateProduct,
} from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClassesCompact } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";
import EmptyState from "@/components/ui/EmptyState";
import ImageUploadField from "@/components/admin/ImageUploadField";

interface ProductsManagerProps {
  businessId: string;
  products: Product[];
}

const buttonPrimary =
  "section-eyebrow text-xs px-4 py-2.5 radius-sm bg-brass text-ink font-semibold w-fit disabled:opacity-50";
const buttonSecondary =
  "section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone-muted w-fit";

/**
 * Catálogo — grilla visual de productos (foto/nombre/precio), NO una
 * tabla administrativa (pedido explícito). Reutiliza exactamente el
 * mismo patrón que ServicesManager/ProfessionalsManager (edición in-line
 * por card, useAsyncStatus, ConfirmDialog para borrar) — solo cambia
 * la presentación de lista a grilla. El interruptor "mostrar catálogo"
 * no vive acá: es el mismo toggle ON/OFF que ya tiene cualquier sección
 * en "Página → Orden de secciones" (ver SectionsManager).
 */
export default function ProductsManager({
  businessId,
  products,
}: ProductsManagerProps) {
  const router = useRouter();
  const { target, select, refreshPreview } = useEditorSelection();
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState(products);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const editingId =
    target?.category === "productos" ? target.itemId ?? null : null;

  const createStatus = useAsyncStatus();
  const updateStatus = useAsyncStatus();

  async function handleCreate(formData: FormData) {
    const result = await createStatus.run(() =>
      adminCreateProduct(businessId, formData)
    );
    if (result.success) {
      setCreating(false);
      router.refresh();
      refreshPreview();
    }
  }

  async function handleUpdate(productId: string, formData: FormData) {
    const result = await updateStatus.run(() =>
      adminUpdateProduct(businessId, productId, formData)
    );
    if (result.success) {
      select({ category: "productos" });
      router.refresh();
      refreshPreview();
    }
  }

  function handleDelete(productId: string) {
    const product = items.find((p) => p.id === productId);
    ask({
      title: "¿Eliminar este producto?",
      description: `${
        product ? product.name : "Este producto"
      } deja de aparecer en tu catálogo. No se puede deshacer.`,
      confirmLabel: "Eliminar producto",
      onConfirm: () => removeProduct(productId),
    });
  }

  async function removeProduct(productId: string) {
    setDeletingId(productId);
    const result = await adminDeleteProduct(businessId, productId);
    setDeletingId(null);
    if (result.success) {
      setItems((prev) => prev.filter((p) => p.id !== productId));
      refreshPreview();
    }
  }

  async function handleReorder(productId: string, direction: "up" | "down") {
    setReorderingId(productId);
    const result = await adminReorderProduct(businessId, productId, direction);
    setReorderingId(null);
    if (result.success) {
      router.refresh();
      refreshPreview();
    }
  }

  return (
    <div className="mt-2">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-bone-muted max-w-sm">
          Fotos, nombre y precio de lo que vendés — aparece como una
          sección más de tu página (activala u ordenala desde
          &quot;Página&quot; → Orden de secciones).
        </p>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone hover:border-brass transition-colors shrink-0"
        >
          {creating ? "Cancelar" : "+ Agregar producto"}
        </button>
      </div>

      {creating ? (
        <form
          action={handleCreate}
          className="mt-4 grid gap-3 max-w-sm border border-ink-line radius-sm p-4"
        >
          <ImageUploadField folder={businessId} label="Foto" name="image" />
          <input
            name="name"
            required
            className={adminInputClassesCompact}
            placeholder="Nombre (ej: Pomada Matte)"
          />
          <input
            name="price"
            type="number"
            step="1"
            min="0"
            className={adminInputClassesCompact}
            placeholder="Precio (opcional)"
          />
          <textarea
            name="description"
            rows={2}
            className={adminInputClassesCompact}
            placeholder="Descripción (opcional)"
          />
          <label className="flex items-center gap-2 text-xs text-bone-muted">
            <input name="active" type="checkbox" defaultChecked />
            Activo
          </label>
          <SaveStatus status={createStatus.status} error={createStatus.error} />
          <button type="submit" disabled={createStatus.isPending} className={buttonPrimary}>
            {createStatus.isPending ? "Guardando..." : "Guardar producto"}
          </button>
        </form>
      ) : null}

      {/* `@container` + breakpoints `@…` (del contenedor, no del viewport):
          este mismo componente se monta en dos anchos muy distintos — la
          columna de configuración del editor, que mide 400px fijos (ver
          TwoColumnLayout), y la página del Editor rápido, que ocupa el
          max-w-5xl entero de AdminChrome. Con `sm:`/`lg:` (viewport) el
          panel de 400px terminaba pintando TRES columnas de ~122px en
          cualquier pantalla de escritorio, y el formulario de edición
          (miniatura de 56px shrink-0 + botón "Cambiar" ≈ 150px) no entra:
          se derramaba encima de la tarjeta vecina. Midiendo el contenedor
          real, el panel angosto queda en una sola columna y la página
          ancha conserva sus tres. */}
      <div className="mt-6 @container">
        {items.length === 0 ? (
          <EmptyState
            title="Tu catálogo está vacío."
            hint="Agregá tu primer producto para comenzar."
          />
        ) : (
          <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {items.map((product, index) =>
              editingId === product.id ? (
                <form
                  key={product.id}
                  action={(fd) => handleUpdate(product.id, fd)}
                  className="border border-ink-line radius-sm p-4 grid gap-3"
                >
                  <ImageUploadField
                    folder={businessId}
                    label="Foto"
                    name="image"
                    defaultValue={product.image}
                  />
                  <input
                    name="name"
                    defaultValue={product.name}
                    required
                    className={adminInputClassesCompact}
                    placeholder="Nombre"
                  />
                  <input
                    name="price"
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={product.price ?? ""}
                    className={adminInputClassesCompact}
                    placeholder="Precio (opcional)"
                  />
                  <textarea
                    name="description"
                    defaultValue={product.description}
                    rows={2}
                    className={adminInputClassesCompact}
                    placeholder="Descripción (opcional)"
                  />
                  <label className="flex items-center gap-2 text-xs text-bone-muted">
                    <input name="active" type="checkbox" defaultChecked={product.active} />
                    Activo
                  </label>
                  <SaveStatus status={updateStatus.status} error={updateStatus.error} />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={updateStatus.isPending}
                      className={buttonPrimary}
                    >
                      {updateStatus.isPending ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => select({ category: "productos" })}
                      className={buttonSecondary}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  key={product.id}
                  className="border border-ink-line radius-sm overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-square bg-ink-elevated">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-bone-muted text-xs">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-bone font-medium truncate">
                      {product.name}
                      {!product.active ? (
                        <span className="ml-2 text-xs text-bone-muted">(inactivo)</span>
                      ) : null}
                    </p>
                    <p className="ticket-number text-sm text-brass mt-1">
                      {formatPrice(product.price)}
                    </p>
                    {product.description ? (
                      <p className="text-xs text-bone-muted mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={index === 0 || reorderingId === product.id}
                        onClick={() => handleReorder(product.id, "up")}
                        aria-label="Subir"
                        className="text-bone-muted hover:text-brass disabled:opacity-30 transition-colors"
                      >
                        <Icon name="chevron" size={16} rotate={180} />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1 || reorderingId === product.id}
                        onClick={() => handleReorder(product.id, "down")}
                        aria-label="Bajar"
                        className="text-bone-muted hover:text-brass disabled:opacity-30 transition-colors"
                      >
                        <Icon name="chevron" size={16} />
                      </button>
                      <button
                        onClick={() =>
                          select({ category: "productos", itemId: product.id })
                        }
                        className="text-xs text-bone-muted hover:text-brass transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product.id)}
                        className="text-xs text-bone-muted hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
