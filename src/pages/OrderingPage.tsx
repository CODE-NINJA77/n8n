import { useEffect, useState } from 'react';
import MenuItem from '../components/MenuItem';
import Cart from '../components/Cart';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { validateToken, getAvailableMenuItems, MenuItem as MenuItemType } from '../services/supabase';
import { createOrder, OrderItem } from '../services/api';

interface CartItem {
  itemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

interface OrderSuccess {
  orderId: string;
  tableId: string;
}

export default function OrderingPage() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingToken, setValidatingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    const tok = params.get('token');

    setTableId(table);
    setToken(tok);

    if (!table || !tok) {
      setError('Invalid table or token. Please scan the QR code at your table to get started.');
      setLoading(false);
      setValidatingToken(false);
      return;
    }

    validateAndLoadMenu(table, tok);
  }, []);

  const validateAndLoadMenu = async (table: string, tok: string) => {
    try {
      setValidatingToken(true);
      const isValid = await validateToken(table, tok);

      if (!isValid) {
        setError('Invalid or expired token. Please scan the QR code at your table again.');
        setValidatingToken(false);
        setLoading(false);
        return;
      }

      setValidatingToken(false);
      await fetchMenuItems();
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate token. Please try again.');
      setValidatingToken(false);
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getAvailableMenuItems();
      setMenuItems(items);
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
        const menuItem = menuItems.find(item => item.menu_item_id === itemId);
        if (menuItem) {
          setCart([...cart, {
            itemId,
            name: menuItem.name,
            priceCents: menuItem.price_cents,
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

    if (!tableId || !token) {
      alert('Invalid session. Please scan the QR code again.');
      return;
    }

    try {
      setSubmitting(true);
      const orderItems: OrderItem[] = cart.map(item => ({
        itemId: item.itemId,
        name: item.name,
        qty: item.quantity
      }));

      const response = await createOrder({
        tableId,
        token,
        items: orderItems
      });

      setOrderSuccess({
        orderId: response.orderId,
        tableId
      });
      setCart([]);
    } catch (err) {
      console.error('Order submission error:', err);
      alert(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-slate-600 font-medium">Validating token...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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
          <h2 className="text-xl font-bold text-slate-900">Access Error</h2>
          <p className="text-slate-600">{error}</p>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg text-left w-full">
            <p className="text-sm font-semibold text-slate-700 mb-2">Need help?</p>
            <p className="text-xs text-slate-600">Please scan the QR code on your table to access the menu.</p>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col gap-4 items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully</h2>
          <div className="bg-slate-50 rounded-lg p-4 w-full">
            <p className="text-sm text-slate-600 mb-1">Order ID</p>
            <p className="text-lg font-bold text-slate-900">{orderSuccess.orderId}</p>
            <p className="text-sm text-slate-600 mt-2">Table {orderSuccess.tableId}</p>
          </div>
          <p className="text-slate-600">Your order has been sent to the kitchen. We will serve it shortly.</p>
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={() => setOrderSuccess(null)}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Order More
            </button>
            <a
              href={`/billing-payment.html?table=${orderSuccess.tableId}&token=${token}`}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              View Bill
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
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
              key={item.menu_item_id}
              item={{
                id: item.menu_item_id,
                name: item.name,
                price: item.price_cents / 100,
                description: item.description || '',
                category: item.category || '',
                image_url: item.image_url,
                available: item.available
              }}
              quantity={cart.find(c => c.itemId === item.menu_item_id)?.quantity || 0}
              onQuantityChange={(qty) => updateQuantity(item.menu_item_id, qty)}
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
