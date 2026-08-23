"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types/business";
import { formatPrice } from "@/lib/format";
import {
  adminCreateProduct,
  adminDeleteProduct,
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
  /** false en el Editor rápido (profesional): el catálogo es compartido
   *  (ver actions.ts), así que un profesional puede crear/editar, pero
   *  el pedido de Editor rápido no incluye eliminar productos — se oculta
   *  el botón acá; el editor completo (dueño) no cambia (default true). */
  canDelete?: boolean;
}

const buttonPrimary =
  "section-eyebrow text-xs px-4 py-2.5 radius-sm bg-brass text-ink font-semibold w-fit disabled:opacity-50";
const buttonSecondary =
  "section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone-muted w-fit";

/**
 * Catálogo — grilla visual de productos (foto/nombre/precio), NO una
 * tabla administrativa (pedido explícito). Reutiliza exactamente el
 * mismo patrón que ServicesManager/ProfessionalsManager (edición in-line
 * por card, useAsyncStatus, confirm() nativo para borrar) — solo cambia
 * la presentación de lista a grilla. El interruptor "mostrar catálogo"
 * no vive acá: es el mismo toggle ON/OFF que ya tiene cualquier sección
 * en "Página → Orden de secciones" (ver SectionsManager).
 */
export default function ProductsManager({
  businessId,
  products,
  canDelete = true,
}: ProductsManagerProps) {
  const router = useRouter();
  const { target, select, refreshPreview } = useEditorSelection();
  const [items, setItems] = useState(products);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  async function handleDelete(productId: string) {
    if (!confirm("¿Eliminar este producto?\n\nEsta acción no se puede deshacer."))
      return;
    setDeletingId(productId);
    const result = await adminDeleteProduct(businessId, productId);
    setDeletingId(null);
    if (result.success) {
      setItems((prev) => prev.filter((p) => p.id !== productId));
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
            required
            className={adminInputClassesCompact}
            placeholder="Precio"
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

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title="Tu catálogo está vacío."
            hint="Agregá tu primer producto para comenzar."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) =>
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
                    defaultValue={product.price}
                    required
                    className={adminInputClassesCompact}
                    placeholder="Precio"
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
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() =>
                          select({ category: "productos", itemId: product.id })
                        }
                        className="text-xs text-bone-muted hover:text-brass transition-colors"
                      >
                        Editar
                      </button>
                      {canDelete ? (
                        <button
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="text-xs text-bone-muted hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {deletingId === product.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
