import { Plus, Minus } from 'lucide-react';

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image_url: string | null;
  };
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export default function MenuItem({ item, quantity, onQuantityChange }: MenuItemProps) {
  const handleIncrement = () => {
    if (quantity < 10) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {item.image_url && (
        <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{item.category}</p>
        </div>

        {item.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-600">₹{item.price}</div>

          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={handleDecrement}
              disabled={quantity === 0}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Decrease quantity"
            >
              <Minus className="w-4 h-4 text-slate-700" />
            </button>

            <span className="w-8 text-center font-semibold text-slate-900">
              {quantity}
            </span>

            <button
              onClick={handleIncrement}
              disabled={quantity >= 10}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Increase quantity"
            >
              <Plus className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
