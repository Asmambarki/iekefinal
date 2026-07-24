import { useState, useEffect } from "react";
import { Product, productService } from "../lib/supabase";
import { ProductForm } from "./ProductForm";
import { AdminLayout, AdminView } from "./AdminLayout";
import { Dashboard } from "./Dashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { OrdersList } from "./OrdersList";
import { OrderDetail } from "./OrderDetail";
import { UsersManagement } from "./UsersManagement";
import { MyProfile } from "./MyProfile";
import { Plus, Edit, Trash2, Eye, EyeOff, Minus, PlusIcon } from "lucide-react";
import { formatPrice, getStockStatus, hasActiveDiscount } from "../lib/pricing";
import { useAuth } from "../lib/authContext";
import { logActivity } from "../lib/userService";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout: _onLogout }: AdminDashboardProps) {
  const { profile, isAdmin } = useAuth();

  const [currentView, setCurrentView] = useState<AdminView>(isAdmin ? "dashboard" : "orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [stockUpdateLoading, setStockUpdateLoading] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (currentView === "products") loadProducts();
  }, [currentView]);

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data || []);
    } catch {
      showNotification("Erreur lors du chargement des produits", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFormSubmit = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        if (profile) logActivity({
          user_id: profile.id, user_name: profile.full_name, user_role: profile.role,
          action: "update_product", entity_type: "product", entity_id: editingProduct.id,
          description: `Modification du produit "${productData.name ?? editingProduct.name}"`,
        });
        showNotification("Produit modifié avec succès", "success");
      } else {
        const created = await productService.createProduct(productData as any);
        if (profile) logActivity({
          user_id: profile.id, user_name: profile.full_name, user_role: profile.role,
          action: "create_product", entity_type: "product", entity_id: created?.id,
          description: `Création du produit "${productData.name}"`,
        });
        showNotification("Produit ajouté avec succès", "success");
      }
      setShowForm(false);
      setEditingProduct(null);
      await loadProducts();
    } catch {
      showNotification("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    try {
      const prod = products.find((p) => p.id === id);
      await productService.deleteProduct(id);
      if (profile && prod) logActivity({
        user_id: profile.id, user_name: profile.full_name, user_role: profile.role,
        action: "delete_product", entity_type: "product", entity_id: id,
        description: `Suppression du produit "${prod.name}"`,
      });
      showNotification("Produit supprimé avec succès", "success");
      setDeleteConfirm(null);
      await loadProducts();
    } catch {
      showNotification("Erreur lors de la suppression", "error");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productService.updateProduct(product.id, { active: !product.active });
      if (profile) logActivity({
        user_id: profile.id, user_name: profile.full_name, user_role: profile.role,
        action: product.active ? "hide_product" : "show_product", entity_type: "product", entity_id: product.id,
        description: `Produit "${product.name}" ${product.active ? "masqué" : "rendu visible"}`,
      });
      await loadProducts();
      showNotification(product.active ? "Produit masqué" : "Produit visible", "success");
    } catch {
      showNotification("Erreur lors de la modification", "error");
    }
  };

  const handleStockUpdate = async (product: Product, change: number) => {
    const newStock = Math.max(0, (product.stock || 0) + change);
    setStockUpdateLoading(product.id);
    try {
      await productService.updateProduct(product.id, { stock: newStock });
      if (profile) logActivity({
        user_id: profile.id, user_name: profile.full_name, user_role: profile.role,
        action: "update_stock", entity_type: "product", entity_id: product.id,
        description: `Stock de "${product.name}" : ${product.stock ?? 0} → ${newStock}`,
        old_values: { stock: product.stock ?? 0 }, new_values: { stock: newStock },
      });
      await loadProducts();
    } catch {
      showNotification("Erreur lors de la mise à jour du stock", "error");
    } finally {
      setStockUpdateLoading(null);
    }
  };

  const handleViewChange = (view: AdminView) => {
    // Guard: employees cannot access users or dashboard (financial)
    if (!isAdmin && (view === "users" || view === "dashboard")) return;
    setCurrentView(view);
    setSelectedOrderId(null);
    setShowForm(false);
  };

  const renderContent = () => {
    // Profile (any role)
    if (currentView === "profile") return <MyProfile />;

    // Admin-only: users management
    if (currentView === "users") {
      if (!isAdmin) return <div className="text-red-600 p-8">Accès refusé.</div>;
      return <UsersManagement />;
    }

    // Dashboard — role-split
    if (currentView === "dashboard") {
      if (!isAdmin) return <EmployeeDashboard />;
      return <Dashboard />;
    }

    // Orders
    if (currentView === "orders") {
      if (selectedOrderId) {
        return <OrderDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />;
      }
      return <OrdersList onViewOrder={setSelectedOrderId} />;
    }

    // Products
    if (showForm) {
      return (
        <ProductForm
          product={editingProduct}
          onSuccess={async () => { setShowForm(false); setEditingProduct(null); await loadProducts(); }}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      );
    }

    const totalProducts = products.length;
    const visibleProducts = products.filter((p) => p.active).length;
    const hiddenProducts = products.filter((p) => !p.active).length;
    const lowStockProducts = products.filter((p) => getStockStatus(p.stock || 0).status === "low-stock").length;
    const outOfStockProducts = products.filter((p) => (p.stock || 0) === 0).length;

    return (
      <div className="space-y-6">
        {notification && (
          <div className={`p-4 rounded-xl ${notification.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: totalProducts, color: "text-gray-900" },
            { label: "Visibles", value: visibleProducts, color: "text-green-600" },
            { label: "Masqués", value: hiddenProducts, color: "text-gray-500" },
            { label: "Stock faible", value: lowStockProducts, color: "text-orange-600" },
            { label: "Rupture", value: outOfStockProducts, color: "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Chargement…</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <p className="text-gray-400 mb-3">Aucun produit</p>
            <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="text-blue-600 text-sm hover:underline">
              Ajouter votre premier produit
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Produit", "Prix", "Stock", "Statut", "Actions"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const stockInfo = getStockStatus(product.stock || 0);
                  const hasDiscount = hasActiveDiscount(product.discountPercentage || 0);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-400 line-clamp-1">{product.description}</div>
                            <div className="text-xs text-gray-300">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {hasDiscount ? (
                          <div>
                            <div className="text-xs line-through text-gray-400">{formatPrice(product.initialPrice || 0)}</div>
                            <div className="font-semibold text-green-600">{formatPrice(product.salePrice || 0)}</div>
                            <div className="text-xs text-red-500">-{(product.discountPercentage || 0).toFixed(0)}%</div>
                          </div>
                        ) : (
                          <div className="font-semibold">{formatPrice(product.salePrice || product.initialPrice || 0)}</div>
                        )}
                        {/* Cost price: admin only */}
                        {isAdmin && product.costPrice != null && (
                          <div className="text-xs text-gray-400 mt-0.5">Coût : {formatPrice(product.costPrice)}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleStockUpdate(product, -1)}
                            disabled={stockUpdateLoading === product.id || (product.stock || 0) === 0}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="min-w-[52px] text-center">
                            <div className="font-semibold">{product.stock || 0}</div>
                            <div className={`text-xs px-1.5 py-0.5 rounded inline-block ${
                              stockInfo.status === "in-stock" ? "bg-green-100 text-green-700"
                              : stockInfo.status === "low-stock" ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                            }`}>{stockInfo.label}</div>
                          </div>
                          <button onClick={() => handleStockUpdate(product, 1)}
                            disabled={stockUpdateLoading === product.id}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleToggleActive(product)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            product.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}>
                          {product.active ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Masqué</>}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingProduct(product); setShowForm(true); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)}
                            className={`p-1.5 rounded-md transition-colors ${deleteConfirm === product.id ? "bg-red-600 text-white" : "text-red-500 hover:bg-red-50"}`}
                            title={deleteConfirm === product.id ? "Confirmer" : "Supprimer"}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {deleteConfirm === product.id && (
                          <p className="text-xs text-red-500 mt-1">Cliquez à nouveau pour confirmer</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout currentView={currentView} onViewChange={handleViewChange}>
      {renderContent()}
    </AdminLayout>
  );
}
