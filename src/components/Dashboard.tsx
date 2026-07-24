import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package,
  AlertCircle,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { getOrderStatistics, getTopSellingProducts } from "../lib/orderService";
import { productService } from "../lib/supabase";
import { formatPrice } from "../lib/pricing";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

type PeriodFilter = "today" | "week" | "month" | "30days" | "year" | "custom";

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("30days");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(period);
      
      // Charger les statistiques
      const statsData = await getOrderStatistics(startDate, endDate);
      setStats(statsData);

      // Charger les produits les plus vendus
      const topProductsData = await getTopSellingProducts(10, startDate, endDate);
      setTopProducts(topProductsData);

      // Charger les produits pour voir les ruptures
      const productsData = await productService.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const getPeriodDates = (period: PeriodFilter) => {
    const now = new Date();
    let startDate = "";
    let endDate = "";

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.setHours(0, 0, 0, 0)).toISOString();
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case "30days":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString();
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
      case "custom":
        if (customDates.start) startDate = new Date(customDates.start).toISOString();
        if (customDates.end) endDate = new Date(customDates.end).toISOString();
        break;
    }

    return { startDate, endDate };
  };

  const periodLabels = {
    today: "Aujourd'hui",
    week: "Cette semaine",
    month: "Ce mois",
    "30days": "30 derniers jours",
    year: "Cette année",
    custom: "Période personnalisée",
  };

  // Produits en rupture ou stock faible
  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);

  // Données pour le graphique des statuts
  const statusData = stats ? [
    { name: "Nouvelles", value: stats.new_orders, color: "#3B82F6" },
    { name: "Confirmées", value: stats.confirmed_orders, color: "#10B981" },
    { name: "En préparation", value: stats.preparing_orders, color: "#F59E0B" },
    { name: "Expédiées", value: stats.shipped_orders, color: "#8B5CF6" },
    { name: "Livrées", value: stats.delivered_orders, color: "#059669" },
    { name: "Rejetées", value: stats.rejected_orders, color: "#EF4444" },
    { name: "Annulées", value: stats.cancelled_orders, color: "#6B7280" },
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl mb-2">Tableau de bord</h2>
          <p className="text-gray-600">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Période :</span>
          {(Object.keys(periodLabels) as PeriodFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {periodLabels[key]}
            </button>
          ))}
        </div>
        
        {period === "custom" && (
          <div className="flex gap-3 mt-3">
            <input
              type="date"
              value={customDates.start}
              onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500 flex items-center">à</span>
            <input
              type="date"
              value={customDates.end}
              onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'affaires"
          value={formatPrice(stats?.revenue || 0)}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          subtitle="Commandes livrées"
        />
        
        <StatCard
          title="Bénéfice brut"
          value={formatPrice(stats?.gross_profit || 0)}
          icon={TrendingUp}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={`Marge: ${stats?.revenue > 0 ? ((stats.gross_profit / stats.revenue) * 100).toFixed(1) : 0}%`}
        />
        
        <StatCard
          title="Commandes"
          value={stats?.total_orders || 0}
          icon={ShoppingBag}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          subtitle={`${stats?.new_orders || 0} nouvelles`}
        />
        
        <StatCard
          title="Panier moyen"
          value={formatPrice(stats?.avg_order_value || 0)}
          icon={Package}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          subtitle="Par commande livrée"
        />
      </div>

      {/* Cartes secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Coût total</h3>
          <p className="text-2xl font-semibold text-gray-900">{formatPrice(stats?.total_cost || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Produits livrés</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Revenus en attente</h3>
          <p className="text-2xl font-semibold text-blue-600">{formatPrice(stats?.pending_revenue || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Confirmées non livrées</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Commandes livrées</h3>
          <p className="text-2xl font-semibold text-green-600">{stats?.delivered_orders || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.rejected_orders || 0} rejetées, {stats?.cancelled_orders || 0} annulées
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des statuts */}
        {statusData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Commandes par statut</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top produits */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Produits les plus vendus</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => value}
                  labelFormatter={(label) => `Produit: ${label}`}
                />
                <Bar dataKey="quantity" fill="#3B82F6" name="Quantité vendue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tableau des top produits avec détails */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Détails des meilleures ventes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bénéfice
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marge
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product) => (
                  <tr key={product.productId ?? product.productName} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatPrice(product.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {formatPrice(product.cost)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {formatPrice(product.profit)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span className={`font-medium ${product.margin >= 30 ? 'text-green-600' : product.margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {product.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alertes stock */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outOfStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">
                  Produits en rupture ({outOfStock.length})
                </h3>
              </div>
              <ul className="space-y-2">
                {outOfStock.map((product) => (
                  <li key={product.id} className="text-sm text-red-800">
                    • {product.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-900">
                  Stock faible ({lowStock.length})
                </h3>
              </div>
              <ul className="space-y-2">
                {lowStock.map((product) => (
                  <li key={product.id} className="text-sm text-yellow-800">
                    • {product.name} - {product.stock} restant(s)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Composant de carte statistique
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  trend?: number;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
