import { useState, useEffect } from "react";
import { ShoppingCart, Package, CheckCircle, Truck, XCircle, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getOrdersWithItems } from "../lib/orderService";
import { productService } from "../lib/supabase";
import { getStockStatus } from "../lib/pricing";

interface OperationalStats {
  new_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  rejected_orders: number;
  out_of_stock: number;
  low_stock: number;
  total_active_products: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  order_items?: any[];
}

const STATUS_LABEL: Record<string, string> = {
  new: "Nouvelle", confirmed: "Confirmée", preparing: "En préparation",
  shipped: "Expédiée", delivered: "Livrée", rejected: "Rejetée", cancelled: "Annulée",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  preparing: "bg-amber-50 text-amber-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-gray-50 text-gray-600",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function EmployeeDashboard() {
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orders, products] = await Promise.all([
        getOrdersWithItems(),
        productService.getAllProducts(),
      ]);

      const s: OperationalStats = {
        new_orders: orders.filter((o: any) => o.status === "new").length,
        confirmed_orders: orders.filter((o: any) => o.status === "confirmed").length,
        preparing_orders: orders.filter((o: any) => o.status === "preparing").length,
        shipped_orders: orders.filter((o: any) => o.status === "shipped").length,
        delivered_orders: orders.filter((o: any) => o.status === "delivered").length,
        rejected_orders: orders.filter((o: any) => o.status === "rejected").length,
        out_of_stock: products.filter((p: any) => (p.stock ?? 0) === 0 && p.active).length,
        low_stock: products.filter((p: any) => getStockStatus(p.stock ?? 0).status === "low-stock" && p.active).length,
        total_active_products: products.filter((p: any) => p.active).length,
      };
      setStats(s);
      setRecentOrders(orders.slice(0, 8) as RecentOrder[]);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tableau de bord opérationnel</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble des commandes et du stock</p>
        </div>
        <button onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Orders stats */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Commandes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Nouvelles" value={stats?.new_orders ?? 0} icon={ShoppingCart} color="bg-blue-50 text-blue-600" />
          <StatCard label="À confirmer" value={stats?.confirmed_orders ?? 0} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="En prép." value={stats?.preparing_orders ?? 0} icon={Clock} color="bg-amber-50 text-amber-600" />
          <StatCard label="Expédiées" value={stats?.shipped_orders ?? 0} icon={Truck} color="bg-violet-50 text-violet-600" />
          <StatCard label="Livrées" value={stats?.delivered_orders ?? 0} icon={CheckCircle} color="bg-green-50 text-green-600" />
          <StatCard label="Rejetées" value={stats?.rejected_orders ?? 0} icon={XCircle} color="bg-red-50 text-red-600" />
        </div>
      </div>

      {/* Stock stats */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stock</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Produits actifs" value={stats?.total_active_products ?? 0} icon={Package} color="bg-gray-100 text-gray-600" />
          <StatCard label="Stock faible" value={stats?.low_stock ?? 0} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
          <StatCard label="Rupture de stock" value={stats?.out_of_stock ?? 0} icon={XCircle} color="bg-red-50 text-red-600" />
        </div>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dernières commandes</h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Numéro</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{o.firstName} {o.lastName}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[o.status] ?? "bg-gray-50 text-gray-600"}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
