/*
  # Hotel Automation System Schema

  1. New Tables
    - `tables` - Restaurant tables with their status
      - `table_id` (text, primary key)
      - `capacity` (integer)
      - `status` (text: available, occupied, reserved)
      - `created_at` (timestamp)
    
    - `menu_items` - Menu items available to order
      - `item_id` (text, primary key)
      - `name` (text)
      - `price` (decimal)
      - `category` (text)
      - `description` (text)
      - `is_available` (boolean)
      - `created_at` (timestamp)
    
    - `orders` - Customer orders
      - `order_id` (text, primary key)
      - `table_id` (text, foreign key)
      - `status` (text: pending, in_kitchen, preparing, ready, served, paid)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items` - Items in each order
      - `item_id` (text, primary key)
      - `order_id` (text, foreign key)
      - `name` (text)
      - `qty` (integer)
      - `price` (decimal)
      - `status` (text: pending, preparing, ready, served)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for menu_items
    - Public access for order operations (no authentication required for initial implementation)
*/

CREATE TABLE IF NOT EXISTS tables (
  table_id text PRIMARY KEY,
  capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  item_id text PRIMARY KEY,
  name text NOT NULL,
  price decimal(10, 2) NOT NULL,
  category text,
  description text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  order_id text PRIMARY KEY,
  table_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_kitchen', 'preparing', 'ready', 'served', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (table_id) REFERENCES tables(table_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  item_id text PRIMARY KEY,
  order_id text NOT NULL,
  name text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  price decimal(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on tables"
  ON tables FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read on menu_items"
  ON menu_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read on orders"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on orders"
  ON orders FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read on order_items"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on order_items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on order_items"
  ON order_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

INSERT INTO tables (table_id, capacity) VALUES
  ('T001', 2),
  ('T002', 4),
  ('T003', 6),
  ('T004', 2),
  ('T005', 8),
  ('T006', 4),
  ('T007', 2),
  ('T008', 6)
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (item_id, name, price, category, description, is_available) VALUES
  ('M001', 'Biryani', 250.00, 'Main Course', 'Fragrant rice cooked with spices', true),
  ('M002', 'Butter Chicken', 320.00, 'Main Course', 'Tender chicken in creamy tomato sauce', true),
  ('M003', 'Paneer Tikka', 280.00, 'Appetizer', 'Grilled paneer with spices', true),
  ('M004', 'Garlic Naan', 80.00, 'Bread', 'Soft bread with garlic butter', true),
  ('M005', 'Lemon Rice', 180.00, 'Rice', 'Fragrant rice with lemon', true),
  ('M006', 'Samosa', 60.00, 'Appetizer', 'Crispy potato filled pastry', true),
  ('M007', 'Gulab Jamun', 120.00, 'Dessert', 'Soft dumplings in sugar syrup', true),
  ('M008', 'Mango Lassi', 100.00, 'Beverage', 'Yogurt drink with mango', true),
  ('M009', 'Tandoori Chicken', 350.00, 'Main Course', 'Marinated and grilled chicken', true),
  ('M010', 'Dal Makhni', 200.00, 'Main Course', 'Creamy lentil curry', true)
ON CONFLICT DO NOTHING;
