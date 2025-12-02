import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import MenuItem from '../components/MenuItem';
import Cart from '../components/Cart';
import { Loader2, AlertCircle } from 'lucide-react';

interface MenuItemType {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url: string | null;
  available: boolean;
}

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function OrderingPage() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    const tok = params.get('token');

    setTableId(table);
    setToken(tok);

    if (!table || !tok) {
      setError('Invalid table or token. Please use a valid order link.');
      setLoading(false);
      return;
    }

    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      if (fetchError) throw fetchError;
      setMenuItems(data || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.itemId !== itemId));
    } else {
      const existingItem = cart.find(item => item.itemId === itemId);
      if (existingItem) {
        setCart(cart.map(item =>
          item.itemId === itemId ? { ...item, quantity } : item
        ));
      } else {
        const menuItem = menuItems.find(item => item.id === itemId);
        if (menuItem) {
          setCart([...cart, {
            itemId,
            name: menuItem.name,
            price: menuItem.price,
            quantity
          }]);
        }
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        tableId,
        token,
        items: cart.map(item => ({
          itemId: item.itemId,
          name: item.name,
          qty: item.quantity
        }))
      };

      const response = await fetch(
        'https://n8n-ninja.app.n8n.cloud/webhook-test/order-create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error('Failed to place order');

      const data = await response.json();
      alert(`Order Placed! Order ID: ${data.orderId || 'Confirmed'}`);
      setCart([]);
    } catch (err) {
      console.error('Order submission error:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-slate-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full flex flex-col gap-4 items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold text-slate-900">Error</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-32">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Food Ordering</h1>
              <p className="text-sm text-slate-600">Table {tableId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Order for</p>
              <p className="font-semibold text-slate-700">{tableId}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              quantity={cart.find(c => c.itemId === item.id)?.quantity || 0}
              onQuantityChange={(qty) => updateQuantity(item.id, qty)}
            />
          ))}
        </div>
      </main>

      <Cart
        items={cart}
        onPlaceOrder={handlePlaceOrder}
        submitting={submitting}
      />
    </div>
  );
}
