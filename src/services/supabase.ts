/**
 * Supabase Service
 * Centralized service for all Supabase database operations
 */

import { supabase } from '../lib/supabase';

export interface MenuItem {
  menu_item_id: string;
  name: string;
  price_cents: number;
  description: string | null;
  category: string | null;
  available: boolean;
  image_url: string | null;
}

export interface Order {
  order_id: string;
  table_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  qty: number;
  price_cents: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TableToken {
  table_id: string;
  token: string;
  expires_at: string;
}

export async function validateToken(tableId: string, token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('table_tokens')
      .select('*')
      .eq('table_id', tableId)
      .eq('token', token)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    return expiresAt > now;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('category', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }

  return data || [];
}

export async function getOrderByTable(tableId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableId)
    .in('status', ['pending', 'in_kitchen', 'preparing', 'ready', 'served'])
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch order: ${error.message}`);
  }

  return data;
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch order items: ${error.message}`);
  }

  return data || [];
}

export async function updateOrderItemStatus(
  orderItemId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('order_items')
    .update({ status })
    .eq('order_item_id', orderItemId);

  if (error) {
    throw new Error(`Failed to update order item status: ${error.message}`);
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_id', orderId);

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

export async function getOrdersWithItems(statusFilters: string[]) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      order_id,
      table_id,
      status,
      created_at,
      updated_at,
      order_items (
        order_item_id,
        menu_item_id,
        name,
        qty,
        price_cents,
        status
      )
    `)
    .in('status', statusFilters)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data || [];
}

export async function verifyStaffPin(role: string, pin: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('staff_auth')
      .select('pin_plain, pin_hash')
      .eq('role', role)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    if (data.pin_plain) {
      return data.pin_plain === pin;
    }

    return false;
  } catch (error) {
    console.error('PIN verification error:', error);
    return false;
  }
}

export function subscribeToOrderUpdates(
  callback: (payload: any) => void
): () => void {
  const channel = supabase
    .channel('order-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items'
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
