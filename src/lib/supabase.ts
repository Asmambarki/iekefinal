import { createClient } from '@supabase/supabase-js';

// Types pour les produits
export interface Product {
  id: string;
  name: string;
  description: string;
  initialPrice?: number;
  salePrice?: number;
  discountPercentage?: number;
  stock?: number;
  costPrice?: number; // Prix d'achat (admin seulement)
  imageUrl: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour les commandes
export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'rejected' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  notes?: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  total: number;
  costTotal: number;
  grossProfit: number;
  adminNotes?: string;
  rejectionReason?: string;
  stockRestored: boolean;
  isViewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  initialPrice: number;
  salePrice: number;
  discountPercentage: number;
  costPrice: number;
  lineTotal: number;
  lineCost: number;
  lineProfit: number;
  createdAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderParams {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface OrderStatistics {
  new_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  rejected_orders: number;
  cancelled_orders: number;
  total_orders: number;
  revenue: number;
  total_cost: number;
  gross_profit: number;
  avg_order_value: number;
  pending_revenue: number;
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'createdAt'>;
        Update: Partial<Omit<OrderItem, 'id' | 'createdAt'>>;
      };
    };
  };
}

// Configuration Supabase
// IMPORTANT: Remplacez ces valeurs par vos vraies clés Supabase
// Vous pouvez soit modifier directement ces constantes, soit utiliser des variables d'environnement
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://lrepkmwjkkxaeblmhyem.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZXBrbXdqa2t4YWVibG1oeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDQ5NzcsImV4cCI6MjEwMDQyMDk3N30.SPjghFAgPmDNTRCL8DyctmS_rhnIKN_rMMUZqxlIj4Q';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions pour les produits
export const productService = {
  // Récupérer tous les produits actifs (pour le public)
  async getActiveProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer tous les produits (pour l'admin)
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Créer un produit
  async createProduct(product: Database['public']['Tables']['products']['Insert']) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour un produit
  async updateProduct(id: string, updates: Database['public']['Tables']['products']['Update']) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer un produit
  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Upload d'image
  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Supprimer une image
  async deleteImage(imageUrl: string) {
    try {
      const path = imageUrl.split('/product-images/')[1];
      if (path) {
        await supabase.storage
          .from('product-images')
          .remove([path]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
};

// Helper functions pour les commandes
export const orderService = {
  // Créer une commande
  async createOrder(order: CreateOrderParams) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...order,
        orderNumber: `ORD-${Math.random().toString(36).substring(2).toUpperCase()}`,
        status: 'new',
        subtotal: 0,
        discountTotal: 0,
        total: 0,
        costTotal: 0,
        grossProfit: 0,
        stockRestored: false,
        isViewed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Ajouter des articles à une commande
  async addOrderItems(orderId: string, items: Array<{
    productId: string;
    quantity: number;
  }>) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(items.map(item => ({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        createdAt: new Date().toISOString(),
      })))
      .select();
    
    if (error) throw error;
    return data;
  },

  // Récupérer toutes les commandes (pour l'admin)
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer une commande avec ses articles
  async getOrderWithItems(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(*)`)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour une commande
  async updateOrder(id: string, updates: Database['public']['Tables']['orders']['Update']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer une commande
  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Récupérer les statistiques des commandes
  async getOrderStatistics() {
    const { data, error } = await supabase
      .rpc('get_order_statistics');
    
    if (error) throw error;
    return data;
  }
};

// Helper functions pour l'authentification
export const authService = {
  // Se connecter
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Se déconnecter
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Écouter les changements d'authentification
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
};