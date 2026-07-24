import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/authContext";
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Bell,
  X,
  FileText,
  Save,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  getOrdersWithItems,
  exportOrdersToCSV,
  getStatusLabel,
  getStatusColor,
  subscribeToNewOrders,
  updateOrderStatus,
} from "../lib/orderService";
import { formatPrice } from "../lib/pricing";

interface OrdersListProps {
  onViewOrder: (orderId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new:       { label: "Nouvelle",        dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  confirmed: { label: "Confirmée",       dot: "bg-emerald-500",badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  preparing: { label: "En préparation",  dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  shipped:   { label: "Expédiée",        dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 ring-violet-200" },
  delivered: { label: "Livrée",          dot: "bg-green-600",  badge: "bg-green-50 text-green-700 ring-green-200" },
  rejected:  { label: "Rejetée",         dot: "bg-red-500",    badge: "bg-red-50 text-red-700 ring-red-200" },
  cancelled: { label: "Annulée",         dot: "bg-gray-400",   badge: "bg-gray-50 text-gray-600 ring-gray-200" },
};

const STATUS_ORDER = ["new", "confirmed", "preparing", "shipped", "delivered", "rejected", "cancelled"];

export function OrdersList({ onViewOrder }: OrdersListProps) {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "amount">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notesModal, setNotesModal] = useState<{ orderId: string; notes: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const itemsPerPage = 10;

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrdersWithItems();
      setOrders(data);
      setFilteredOrders(data);
      setNewOrdersCount(data.filter((o: any) => !o.isViewed).length);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const subscription = subscribeToNewOrders(() => {
      setShowNotification(true);
      loadOrders();
      setTimeout(() => setShowNotification(false), 5000);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = [...orders];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.firstName.toLowerCase().includes(q) ||
          o.lastName.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter((o) => o.status === statusFilter);
    if (sortBy === "recent") filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "amount") filtered.sort((a, b) => b.total - a.total);
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy, orders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch {
      alert("Erreur lors du changement de statut");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    try {
      const { error } = await supabase
        .from("orders")
        .update({ notes: notesModal.notes })
        .eq("id", notesModal.orderId);
      if (error) throw error;
      await loadOrders();
      setNotesModal(null);
    } catch {
      alert("Erreur lors de la sauvegarde des notes");
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* New order toast */}
      {showNotification && (
        <div className="fixed top-5 right-5 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl z-50 animate-slide-in">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">Nouvelle commande reçue !</span>
          <button onClick={() => setShowNotification(false)} className="ml-2 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">Commandes</h2>
            {newOrdersCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                {newOrdersCount} nouvelle{newOrdersCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""}
            {searchQuery || statusFilter !== "all" ? " filtrée(s)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
          <button
            onClick={() => exportOrdersToCSV(filteredOrders)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Numéro, nom, téléphone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Tous les statuts</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
              ))}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="recent">Plus récentes d&apos;abord</option>
            <option value="oldest">Plus anciennes d&apos;abord</option>
            <option value="amount">Montant décroissant</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {currentOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <p className="text-gray-400 text-sm">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Numéro", "Date", "Client", "Téléphone", "Articles", "Total", ...(isAdmin ? ["Bénéfice"] : []), "Statut", "Actions"].map((h, i, arr) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                        i >= 4 ? "text-center" : "text-left"
                      } ${(h === "Total" || h === "Bénéfice") ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentOrders.map((order) => {
                  const isNew = !order.isViewed;
                  return (
                    <tr
                      key={order.id}
                      className={`group transition-colors ${isNew ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-gray-50/60"}`}
                    >
                      {/* Order number */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                          <span className="font-medium text-gray-900 text-xs">{order.orderNumber}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500">
                        <div>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-800">
                        {order.firstName} {order.lastName}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline">
                          {order.phone}
                        </a>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center text-gray-600">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                          {order.order_items?.length || 0}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </td>

                      {/* Profit — admin only */}
                      {isAdmin && (
                        <td className="px-5 py-3.5 whitespace-nowrap text-right font-semibold text-emerald-600">
                          {formatPrice(order.grossProfit)}
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <StatusDropdown
                          status={order.status}
                          orderId={order.id}
                          onChange={handleStatusChange}
                          isUpdating={updatingStatus === order.id}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setNotesModal({ orderId: order.id, notes: order.notes || "" })}
                            title={order.notes ? "Voir/Modifier la note" : "Ajouter une note"}
                            className={`p-1.5 rounded-md transition-colors ${
                              order.notes
                                ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewOrder(order.id)}
                            title="Voir la commande"
                            className="p-1.5 rounded-md text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredOrders.length)} sur {filteredOrders.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notes modal */}
      {notesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Notes de commande
              </h3>
              <button onClick={() => setNotesModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={notesModal.notes}
                onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
                placeholder="Note interne (non visible par le client)…"
                rows={5}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setNotesModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDropdown({
  status,
  orderId,
  onChange,
  isUpdating,
}: {
  status: string;
  orderId: string;
  onChange: (id: string, s: string) => void;
  isUpdating: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status] ?? { label: status, dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 ring-gray-200" };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        disabled={isUpdating}
        onClick={() => !isUpdating && setIsOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition-all ${cfg.badge} ${
          isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"
        }`}
      >
        {isUpdating ? (
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        )}
        {cfg.label}
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {isOpen && !isUpdating && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-[9999]">
          {STATUS_ORDER.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => { onChange(orderId, s); setIsOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                  s === status ? "bg-gray-50 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
