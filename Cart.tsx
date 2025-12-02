import { ShoppingCart, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onPlaceOrder: () => void;
  submitting: boolean;
}

export default function Cart({ items, onPlaceOrder, submitting }: CartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-full shadow-lg p-4 hover:shadow-xl transition-shadow cursor-not-allowed opacity-50">
        <ShoppingCart className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isExpanded ? 'w-96 max-h-96' : 'w-auto'
        }`}
      >
        {isExpanded ? (
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Your Order</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-emerald-700 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-56 px-6 py-4 space-y-3">
              {items.map(item => (
                <div key={item.itemId} className="flex justify-between items-center pb-3 border-b border-slate-200 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">₹{item.price} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-emerald-600 text-lg">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600 font-medium">Subtotal ({itemCount} items)</span>
                <span className="text-2xl font-bold text-emerald-600">₹{total}</span>
              </div>

              <button
                onClick={onPlaceOrder}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full shadow-lg p-4 hover:shadow-xl transition-all hover:scale-110 relative group"
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {itemCount}
              </span>
            )}
            <div className="absolute bottom-full right-0 mb-2 bg-slate-900 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              ₹{total}
            </div>
          </button>
        )}
      </div>
    </>
  );
}
