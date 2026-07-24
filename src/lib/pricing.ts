// Utilitaires pour la gestion des prix en dinars tunisiens (TND)

/**
 * Formate un prix en dinars tunisiens avec 3 décimales
 * Exemple: 79.9 => "79,900 DT"
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return "0,000 DT";
  }
  return `${price.toFixed(3).replace('.', ',')} DT`;
}

/**
 * Calcule le prix de vente à partir du prix initial et du pourcentage de remise
 */
export function calculateSalePrice(initialPrice: number, discountPercentage: number): number {
  const discount = (initialPrice * discountPercentage) / 100;
  const salePrice = initialPrice - discount;
  return roundPrice(salePrice);
}

/**
 * Calcule le pourcentage de remise à partir du prix initial et du prix de vente
 */
export function calculateDiscountPercentage(initialPrice: number, salePrice: number): number {
  if (initialPrice === 0) return 0;
  const discount = ((initialPrice - salePrice) / initialPrice) * 100;
  return roundPercentage(discount);
}

/**
 * Arrondit un prix à 3 décimales
 */
export function roundPrice(price: number): number {
  return Math.round(price * 1000) / 1000;
}

/**
 * Arrondit un pourcentage à 2 décimales
 */
export function roundPercentage(percentage: number): number {
  return Math.round(percentage * 100) / 100;
}

/**
 * Vérifie si un produit a une promotion active
 */
export function hasActiveDiscount(discountPercentage: number): boolean {
  return discountPercentage > 0;
}

/**
 * Obtient le statut du stock
 */
export function getStockStatus(stock: number): {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  label: string;
  color: string;
} {
  if (stock === 0) {
    return {
      status: 'out-of-stock',
      label: 'Rupture de stock',
      color: 'red'
    };
  } else if (stock <= 5) {
    return {
      status: 'low-stock',
      label: `Plus que ${stock} en stock`,
      color: 'orange'
    };
  } else {
    return {
      status: 'in-stock',
      label: 'En stock',
      color: 'green'
    };
  }
}

/**
 * Calcule le montant économisé
 */
export function calculateSavings(initialPrice: number, salePrice: number): number {
  return roundPrice(initialPrice - salePrice);
}