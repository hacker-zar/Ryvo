import { listProductsByBusiness } from "@/lib/data/business-repository";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import { requireQuickChangesAccess } from "../require-quick-access";
import QuickChangesPageHeader from "../quick-changes-page-header";
import ProductsManager from "../../(chrome)/products-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuickCatalogPage({ params }: PageProps) {
  const { id } = await params;
  const { business } = await requireQuickChangesAccess(id);
  const products = await listProductsByBusiness(id);

  return (
    <div>
      <QuickChangesPageHeader businessId={business.id} title="Catálogo" />
      <EditorSelectionProvider>
        <ProductsManager businessId={business.id} products={products} />
      </EditorSelectionProvider>
    </div>
  );
}
