import { CheckCircle, Phone, Home } from "lucide-react";

interface OrderConfirmationProps {
  orderNumber: string;
  onBackToHome: () => void;
}

export function OrderConfirmation({ orderNumber, onBackToHome }: OrderConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8 inline-block bg-green-100 rounded-full p-6">
        <svg
          className="w-24 h-24 text-green-600 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-3xl mb-4">Commande confirmée !</h2>
      <p className="text-xl text-gray-600 mb-8">
        Votre commande a été enregistrée avec succès.
      </p>
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <p className="text-gray-700 mb-4">
          <strong>Numéro de commande :</strong>
        </p>
        <p className="text-2xl text-blue-600 mb-6">{orderNumber}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-800">
            <strong>Nous vous contacterons par téléphone pour la confirmation.</strong>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Vous recevrez un appel dans les prochaines heures pour confirmer votre commande et convenir des détails de livraison.
          </p>
        </div>
      </div>
      <button
        onClick={onBackToHome}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}