import { CartItem } from "../main";
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle } from "lucide-react";
import { formatPrice, hasActiveDiscount } from "../lib/pricing";

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
  total: number;
}

export function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceedToCheckout,
  total,
}: CartProps) {
  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl mb-8">Panier</h2>
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl text-gray-600 mb-6">Votre panier est vide</h3>
          <button
            onClick={onContinueShopping}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl mb-8">Panier</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cart items */}
        <div className="divide-y">
          {cart.map((item) => {
            const hasDiscount = hasActiveDiscount(item.product.discountPercentage);
            const isOverStock = item.quantity > item.product.stock;
            
            return (
              <div key={item.product.id} className="p-6 flex flex-col sm:flex-row gap-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full sm:w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="text-lg mb-1">{item.product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-1">{item.product.description}</p>
                  
                  {/* Prix avec promotion */}
                  {hasDiscount ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 line-through text-sm">
                        {formatPrice(item.product.initialPrice)}
                      </span>
                      <span className="text-blue-600 font-medium">
                        {formatPrice(item.product.salePrice)}
                      </span>
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                        -{item.product.discountPercentage.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-blue-600 font-medium mb-2">
                      {formatPrice(item.product.price)}
                    </p>
                  )}
                  
                  {/* Avertissement stock */}
                  {isOverStock && (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Stock disponible: {item.product.stock}</span>
                    </div>
                  )}
                  {item.product.stock <= 5 && !isOverStock && (
                    <div className="text-orange-600 text-sm">
                      Plus que {item.product.stock} en stock
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Supprimer du panier"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total and actions */}
        <div className="bg-gray-50 p-6 border-t">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl">Total</span>
            <span className="text-3xl text-blue-600 font-semibold">{formatPrice(total)}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onContinueShopping}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
            >
              Continuer mes achats
            </button>
            <button
              onClick={onProceedToCheckout}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Passer la commande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}