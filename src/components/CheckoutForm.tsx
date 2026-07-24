import { useState } from "react";
import { CartItem } from "../main";
import { ArrowLeft, AlertCircle, Loader } from "lucide-react";
import { formatPrice, hasActiveDiscount } from "../lib/pricing";
import { createOrderSecure } from "../lib/orderService";

interface CheckoutFormProps {
  cart: CartItem[];
  total: number;
  onSuccess: (orderNumber: string, total: number) => void;
  onBack: () => void;
}

// 24 regions of Tunisia
const TUNISIA_REGIONS = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Medenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

export function CheckoutForm({ cart, total, onSuccess, onBack }: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError("");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est obligatoire";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est obligatoire";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Le numéro de téléphone est obligatoire";
    } else if (!/^[0-9+\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Le numéro de téléphone n'est pas valide";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Veuillez sélectionner une région";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse complète est obligatoire";
    }

    // Check if cart has items
    if (cart.length === 0) {
      newErrors.cart = "Le panier est vide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous submit error
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données pour la fonction serveur Supabase
      const orderData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      // Appeler la fonction serveur sécurisée
      const result = await createOrderSecure(orderData);

      // Vérifier le résultat
      if (result && result.success) {
        // Commande créée avec succès
        onSuccess(result.orderNumber, result.total);
      } else {
        throw new Error(result?.error || "Erreur lors de la création de la commande");
      }
      
    } catch (error: any) {
      console.error("Error submitting order:", error);
      
      // Afficher un message d'erreur clair selon le type d'erreur
      let errorMessage = "Une erreur est survenue lors de l'envoi de votre commande.";
      
      if (error.message) {
        if (error.message.includes('Stock insuffisant')) {
          errorMessage = error.message + ". Veuillez vérifier votre panier.";
        } else if (error.message.includes('non trouvé') || error.message.includes('inactif')) {
          errorMessage = "Un ou plusieurs produits de votre panier ne sont plus disponibles.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        disabled={isSubmitting}
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au panier
      </button>

      <h2 className="text-3xl mb-8">Finaliser la commande</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl mb-6">Informations de livraison</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm mb-2">
                Prénom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.firstName}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm mb-2">
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.lastName}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm mb-2">
                Numéro de téléphone <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ex: 06 12 34 56 78"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm mb-2">
                Région (Gouvernorat) <span className="text-red-600">*</span>
              </label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.city ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              >
                <option value="">-- Sélectionner une région --</option>
                {TUNISIA_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              {errors.city && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.city}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm mb-2">
                Adresse complète <span className="text-red-600">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={4}
                placeholder="Numéro, rue, code postal, quartier..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.address && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.address}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm mb-2">
                Notes (facultatif)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Instructions de livraison, commentaires..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={isSubmitting}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Enregistrement de votre commande…</span>
                  </>
                ) : (
                  "Confirmer la commande"
                )}
              </button>
            </div>
            
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">{submitError}</p>
              </div>
            )}
          </form>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h3 className="text-xl mb-6">Récapitulatif</h3>
          <div className="space-y-4 mb-6">
            {cart.map((item) => {
              const hasDiscount = hasActiveDiscount(item.product.discountPercentage);
              return (
                <div key={item.product.id} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-gray-600">Quantité: {item.quantity}</p>
                    {hasDiscount && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(item.product.initialPrice)}
                        </span>
                        <span className="text-xs text-red-600">
                          -{item.product.discountPercentage.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                    {hasDiscount && (
                      <p className="text-xs text-green-600">
                        Économie: {formatPrice((item.product.initialPrice - item.product.salePrice) * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl">Total</span>
              <span className="text-2xl text-blue-600 font-semibold">{formatPrice(total)}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Paiement à la livraison</strong>
              </p>
              <p className="text-xs text-blue-800 mt-2">
                Vous paierez lors de la réception de votre commande. Nous vous contacterons par téléphone pour la confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
