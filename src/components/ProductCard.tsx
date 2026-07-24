import { useState } from "react";
import { Product } from "../main";
import { formatPrice, hasActiveDiscount, getStockStatus } from "../lib/pricing";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ImageWithFallback(props: any) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, ...rest } = props;

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=="
          alt="Error loading image"
          {...rest}
          data-original-url={src}
        />
      </div>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const hasDiscount = hasActiveDiscount(product.discountPercentage || 0);
  const stockInfo = getStockStatus(product.stock !== undefined ? product.stock : 100);
  const isOutOfStock = product.stock === 0;

  // Si les champs de prix ne sont pas définis, afficher un message d'avertissement
  const needsUpdate = product.initialPrice === undefined || product.initialPrice === 0;

  if (needsUpdate) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-md overflow-hidden p-6">
        <div className="text-center">
          <h3 className="text-xl mb-3 text-gray-800">{product.name}</h3>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 mb-2">
              ⚠️ <strong>Base de données à mettre à jour</strong>
            </p>
            <p className="text-xs text-yellow-700">
              Exécutez le script <code className="bg-yellow-200 px-1 rounded">UPDATE_PRODUCTS_TABLE.sql</code> dans Supabase
            </p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Consultez <strong>INSTALL_STOCK_PROMO.md</strong> pour les instructions complètes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow relative">
      {/* Badge de promotion */}
      {hasDiscount && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10 shadow-lg">
          -{product.discountPercentage.toFixed(0)}%
        </div>
      )}

      <ImageWithFallback
        src={product.image}
        alt={product.name}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-4 min-h-[48px] line-clamp-2">{product.description}</p>
        
        {/* Indicateur de stock */}
        <div className="mb-4">
          {stockInfo.status === 'out-of-stock' && (
            <span className="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded font-medium">
              {stockInfo.label}
            </span>
          )}
          {stockInfo.status === 'low-stock' && (
            <span className="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded font-medium">
              {stockInfo.label}
            </span>
          )}
          {stockInfo.status === 'in-stock' && (
            <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded font-medium">
              {stockInfo.label}
            </span>
          )}
        </div>

        {/* Prix */}
        <div className="mb-4">
          {hasDiscount ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 line-through text-base">
                  {formatPrice(product.initialPrice)}
                </span>
              </div>
              <p className="text-2xl text-blue-600 font-semibold">
                {formatPrice(product.salePrice)}
              </p>
              <p className="text-sm text-green-600">
                Économisez {formatPrice(product.initialPrice - product.salePrice)}
              </p>
            </div>
          ) : (
            <p className="text-2xl text-blue-600 font-semibold">
              {formatPrice(product.initialPrice)}
            </p>
          )}
        </div>

        {/* Bouton d'ajout au panier */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
        </button>
      </div>
    </div>
  );
}