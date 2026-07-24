import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle,
  Loader
} from "lucide-react";
import { 
  getOrderWithItems, 
  updateOrderStatus, 
  markOrderAsViewed,
  getStatusLabel,
  getStatusColor 
} from "../lib/orderService";
import { formatPrice } from "../lib/pricing";

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

export function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrderWithItems(orderId);
      setOrder(data);
      setNewStatus(data.status);
      setAdminNotes(data.adminNotes || "");
      setRejectionReason(data.rejectionReason || "");
      
      // Marquer comme consultée
      if (!data.isViewed) {
        await markOrderAsViewed(orderId);
      }
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleSave = async () => {
    // Vérifier si le motif de rejet est nécessaire
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      alert("Le motif de rejet est obligatoire");
      return;
    }

    // Confirmation pour rejet ou annulation
    if ((newStatus === "rejected" || newStatus === "cancelled") && newStatus !== order.status) {
      setShowConfirmation(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      await updateOrderStatus(orderId, newStatus, rejectionReason);
      setSaveMessage("Modifications enregistrées avec succès");
      setTimeout(() => setSaveMessage(""), 3000);
      await loadOrder();
    } catch (error) {
      console.error("Error saving order:", error);
      setSaveMessage("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
      setShowConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-900">Commande non trouvée</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const statusOptions = [
    { value: "new", label: "Nouvelle" },
    { value: "confirmed", label: "Confirmée" },
    { value: "preparing", label: "En préparation" },
    { value: "shipped", label: "Expédiée" },
    { value: "delivered", label: "Livrée" },
    { value: "rejected", label: "Rejetée" },
    { value: "cancelled", label: "Annulée" },
  ];

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmer l'action</h3>
            <p className="text-gray-600 mb-6">
              {newStatus === "rejected" 
                ? "Êtes-vous sûr de vouloir rejeter cette commande ? Le stock sera automatiquement restauré."
                : "Êtes-vous sûr de vouloir annuler cette commande ? Le stock sera automatiquement restauré."
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={performSave}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl mb-2">Commande {order.orderNumber}</h2>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          saveMessage.includes("succès") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          <CheckCircle className="w-5 h-5" />
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations client */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Informations client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Prénom</label>
                <p className="font-medium">{order.firstName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Nom</label>
                <p className="font-medium">{order.lastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone
                </label>
                <a
                  href={`tel:${order.phone}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {order.phone}
                </a>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse
                </label>
                <p className="font-medium">{order.address}</p>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Notes du client</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Produits commandés */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produits commandés
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Qté
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Remise
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Sous-total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Coût
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Bénéfice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.order_items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.productImageUrl && (
                            <img
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            {item.discountPercentage > 0 && (
                              <div className="text-xs text-red-600">
                                -{item.discountPercentage.toFixed(0)}% de remise
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        {item.discountPercentage > 0 ? (
                          <div>
                            <div className="text-sm line-through text-gray-500">
                              {formatPrice(item.initialPrice)}
                            </div>
                            <div className="font-medium text-green-600">
                              {formatPrice(item.salePrice)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">{formatPrice(item.salePrice)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">
                        {item.discountPercentage > 0 
                          ? formatPrice((item.initialPrice - item.salePrice) * item.quantity)
                          : "-"
                        }
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatPrice(item.lineTotal)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatPrice(item.lineCost)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        {formatPrice(item.lineProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Résumé financier
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total initial</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remises totales</span>
                  <span className="font-medium text-red-600">-{formatPrice(order.discountTotal)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total payé</span>
                <span className="text-xl font-semibold text-blue-600">{formatPrice(order.total)}</span>
              </div>
              <div className="border-t pt-3 bg-gray-50 -mx-6 px-6 py-3 mt-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Coût total</span>
                  <span className="font-medium">{formatPrice(order.costTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-green-900">Bénéfice brut</span>
                  <span className="text-xl font-semibold text-green-600">
                    {formatPrice(order.grossProfit)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  Marge: {order.total > 0 ? ((order.grossProfit / order.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale - Gestion */}
        <div className="space-y-6">
          {/* Statut */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Statut de la commande</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Changer le statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motif de rejet */}
              {newStatus === "rejected" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif de rejet <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Expliquez pourquoi cette commande est rejetée..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              {/* Afficher le motif de rejet si déjà rempli */}
              {order.rejectionReason && newStatus !== "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-900 mb-1">Motif de rejet :</p>
                  <p className="text-sm text-red-800">{order.rejectionReason}</p>
                </div>
              )}

              {/* Info restauration stock */}
              {order.stockRestored && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    ℹ️ Le stock a été restauré pour cette commande
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes admin */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Notes administratives</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={6}
              placeholder="Notes internes, rappels, informations supplémentaires..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ces notes sont visibles uniquement par les administrateurs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
