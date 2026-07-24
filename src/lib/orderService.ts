import { supabase, type CreateOrderParams } from './supabase';

/**
 * Créer une commande de manière sécurisée via la fonction serveur Supabase
 */
export async function createOrderSecure(params: CreateOrderParams) {
  try {
    // Appeler la fonction serveur qui gère toute la logique
    const { data, error } = await supabase.rpc('create_order', {
      p_first_name: params.firstName,
      p_last_name: params.lastName,
      p_phone: params.phone,
      p_address: params.address,
      p_notes: params.notes || '',
      p_items: params.items // Envoyer directement le tableau, pas JSON.stringify
    });

    if (error) {
      console.error('Error creating order:', error);
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }

    // Vérifier si la fonction a retourné une erreur
    if (data && typeof data === 'object' && 'success' in data && !data.success) {
      throw new Error(data.error || 'Erreur inconnue lors de la création de la commande');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createOrderSecure:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les commandes avec leurs articles
 */
export async function getOrdersWithItems() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

/**
 * Récupérer une commande avec ses articles
 */
export async function getOrderWithItems(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Mettre à jour le statut d'une commande
 */
export async function updateOrderStatus(orderId: string, status: string, rejectionReason?: string) {
  try {
    const updates: any = { status };
    
    if (status === 'rejected' && rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Marquer une commande comme consultée
 */
export async function markOrderAsViewed(orderId: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ isViewed: true })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking order as viewed:', error);
  }
}

/**
 * Récupérer les statistiques des commandes
 */
export async function getOrderStatistics(startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('orders')
      .select('status, total, costTotal, grossProfit, createdAt');

    if (startDate) {
      query = query.gte('createdAt', startDate);
    }
    if (endDate) {
      query = query.lte('createdAt', endDate);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Calculer les statistiques
    const stats = {
      new_orders: 0,
      confirmed_orders: 0,
      preparing_orders: 0,
      shipped_orders: 0,
      delivered_orders: 0,
      rejected_orders: 0,
      cancelled_orders: 0,
      total_orders: orders?.length || 0,
      revenue: 0,
      total_cost: 0,
      gross_profit: 0,
      avg_order_value: 0,
      pending_revenue: 0,
    };

    orders?.forEach(order => {
      // Compter par statut
      if (order.status === 'new') stats.new_orders++;
      else if (order.status === 'confirmed') stats.confirmed_orders++;
      else if (order.status === 'preparing') stats.preparing_orders++;
      else if (order.status === 'shipped') stats.shipped_orders++;
      else if (order.status === 'delivered') stats.delivered_orders++;
      else if (order.status === 'rejected') stats.rejected_orders++;
      else if (order.status === 'cancelled') stats.cancelled_orders++;

      // Calculer les montants financiers (seulement commandes livrées)
      if (order.status === 'delivered') {
        stats.revenue += order.total || 0;
        stats.total_cost += order.costTotal || 0;
        stats.gross_profit += order.grossProfit || 0;
      }

      // Revenus en attente (confirmé, en préparation, expédié)
      if (['confirmed', 'preparing', 'shipped'].includes(order.status)) {
        stats.pending_revenue += order.total || 0;
      }
    });

    // Panier moyen
    if (stats.delivered_orders > 0) {
      stats.avg_order_value = stats.revenue / stats.delivered_orders;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

/**
 * Récupérer les produits les plus vendus
 */
export async function getTopSellingProducts(limit: number = 10, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('order_items')
      .select(`
        productId,
        productName,
        productImageUrl,
        quantity,
        lineTotal,
        lineCost,
        lineProfit,
        orders!inner(status, createdAt)
      `);

    if (startDate) {
      query = query.gte('orders.createdAt', startDate);
    }
    if (endDate) {
      query = query.lte('orders.createdAt', endDate);
    }

    const { data, error } = await query.eq('orders.status', 'delivered');

    if (error) throw error;

    // Agréger par produit
    const productMap = new Map();

    data?.forEach((item: any) => {
      const productId = item.productId || item.productName;
      
      if (productMap.has(productId)) {
        const existing = productMap.get(productId);
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;
        existing.cost += item.lineCost;
        existing.profit += item.lineProfit;
      } else {
        productMap.set(productId, {
          productId: item.productId,
          productName: item.productName,
          productImageUrl: item.productImageUrl,
          quantity: item.quantity,
          revenue: item.lineTotal,
          cost: item.lineCost,
          profit: item.lineProfit,
        });
      }
    });

    // Convertir en tableau et trier par quantité
    const products = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
      .map(p => ({
        ...p,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }));

    return products;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
}

/**
 * S'abonner aux nouvelles commandes en temps réel
 */
export function subscribeToNewOrders(callback: (payload: any) => void) {
  const subscription = supabase
    .channel('new-orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      },
      callback
    )
    .subscribe();

  return subscription;
}

/**
 * Export des commandes en CSV
 */
export function exportOrdersToCSV(orders: any[]) {
  const headers = [
    'Numéro',
    'Date',
    'Prénom',
    'Nom',
    'Téléphone',
    'Adresse',
    'Statut',
    'Sous-total',
    'Remises',
    'Total',
    'Coût',
    'Bénéfice',
  ];

  const rows = orders.map(order => [
    order.orderNumber,
    new Date(order.createdAt).toLocaleString('fr-FR'),
    order.firstName,
    order.lastName,
    order.phone,
    order.address,
    getStatusLabel(order.status),
    order.subtotal.toFixed(3),
    order.discountTotal.toFixed(3),
    order.total.toFixed(3),
    order.costTotal.toFixed(3),
    order.grossProfit.toFixed(3),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Créer un fichier téléchargeable
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `commandes-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Obtenir le libellé français d'un statut
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Nouvelle',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    rejected: 'Rejetée',
    cancelled: 'Annulée',
  };

  return labels[status] || status;
}

/**
 * Obtenir la couleur d'un statut
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'blue',
    confirmed: 'green',
    preparing: 'yellow',
    shipped: 'purple',
    delivered: 'green',
    rejected: 'red',
    cancelled: 'gray',
  };

  return colors[status] || 'gray';
}