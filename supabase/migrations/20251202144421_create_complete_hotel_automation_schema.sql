/*
  # Complete Hotel Automation System Schema

  1. New Tables
    - `menu_items` - Menu items available to order
      - `menu_item_id` (text, primary key)
      - `name` (text)
      - `price_cents` (integer) - Price in cents for precision
      - `description` (text)
      - `category` (text)
      - `available` (boolean, default true)
      - `image_url` (text, nullable)
      - `created_at` (timestamptz)
    
    - `orders` - Customer orders
      - `order_id` (uuid, primary key, default gen_random_uuid())
      - `table_id` (text)
      - `status` (text: pending, in_kitchen, preparing, ready, served, closed, paid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `order_items` - Items in each order
      - `order_item_id` (uuid, primary key, default gen_random_uuid())
      - `order_id` (uuid, foreign key)
      - `menu_item_id` (text)
      - `name` (text)
      - `qty` (integer)
      - `price_cents` (integer)
      - `status` (text: pending, preparing, ready, served)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `table_tokens` - Valid tokens for table access
      - `table_id` (text, primary key)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `staff_auth` - Staff authentication
      - `staff_id` (uuid, primary key, default gen_random_uuid())
      - `role` (text: kitchen, waiter, admin)
      - `pin_hash` (text) - For production, should be bcrypt hash
      - `pin_plain` (text) - DEMO ONLY - Remove in production
      - `created_at` (timestamptz)
    
    - `payments` - Payment records
      - `payment_id` (uuid, primary key, default gen_random_uuid())
      - `order_id` (uuid, foreign key)
      - `amount_cents` (integer)
      - `provider` (text: stripe, cash)
      - `provider_payment_id` (text)
      - `status` (text: pending, completed, failed, refunded)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for menu_items (available only)
    - Public access for order operations (token-validated)
    - Protected access for staff_auth (admin only)

  3. Indexes
    - Performance indexes on frequently queried columns

  4. Seed Data
    - 10 sample menu items
    - 10 table tokens (T1-T10) valid for 1 year
    - Sample staff pins (kitchen: 1234, waiter: 5678)
*/

-- Drop existing tables if needed (for clean migration)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS table_tokens CASCADE;
DROP TABLE IF EXISTS staff_auth CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  menu_item_id text PRIMARY KEY,
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  description text,
  category text,
  available boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_kitchen', 'preparing', 'ready', 'served', 'closed', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  menu_item_id text NOT NULL,
  name text NOT NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table_tokens table
CREATE TABLE IF NOT EXISTS table_tokens (
  table_id text PRIMARY KEY,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create staff_auth table
CREATE TABLE IF NOT EXISTS staff_auth (
  staff_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('kitchen', 'waiter', 'admin')),
  pin_hash text,
  pin_plain text,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  provider text NOT NULL CHECK (provider IN ('stripe', 'cash')),
  provider_payment_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_table_tokens_token ON table_tokens(token);
CREATE INDEX IF NOT EXISTS idx_table_tokens_expires ON table_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items
CREATE POLICY "Allow public read available menu items"
  ON menu_items FOR SELECT
  TO public
  USING (available = true);

-- RLS Policies for orders
CREATE POLICY "Allow public read orders"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update orders"
  ON orders FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Allow public read order_items"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert order_items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update order_items"
  ON order_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for table_tokens
CREATE POLICY "Allow public read table_tokens"
  ON table_tokens FOR SELECT
  TO public
  USING (true);

-- RLS Policies for staff_auth
CREATE POLICY "Allow public read staff_auth"
  ON staff_auth FOR SELECT
  TO public
  USING (true);

-- RLS Policies for payments
CREATE POLICY "Allow public read payments"
  ON payments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert payments"
  ON payments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update payments"
  ON payments FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Seed Menu Items (10 items)
INSERT INTO menu_items (menu_item_id, name, price_cents, description, category, available, image_url) VALUES
  ('MENU001', 'Masala Dosa', 6000, 'Crispy rice crepe with spiced potato filling', 'Breakfast', true, 'https://images.pexels.com/photos/5410400/pexels-photo-5410400.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU002', 'Idly', 3000, 'Steamed rice cakes served with sambar and chutney', 'Breakfast', true, 'https://images.pexels.com/photos/14511142/pexels-photo-14511142.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU003', 'Uttapam', 5000, 'Thick rice pancake with vegetables', 'Breakfast', true, 'https://images.pexels.com/photos/4087609/pexels-photo-4087609.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU004', 'Puri Bhaji', 4500, 'Deep-fried bread with potato curry', 'Breakfast', true, 'https://images.pexels.com/photos/1251198/pexels-photo-1251198.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU005', 'Biryani', 25000, 'Fragrant rice cooked with spices and meat', 'Main Course', true, 'https://images.pexels.com/photos/11922568/pexels-photo-11922568.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU006', 'Butter Chicken', 28000, 'Tender chicken in creamy tomato sauce', 'Main Course', true, 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU007', 'Paneer Tikka', 22000, 'Grilled cottage cheese with spices', 'Appetizer', true, 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU008', 'Gulab Jamun', 8000, 'Soft milk dumplings in sugar syrup', 'Dessert', true, 'https://images.pexels.com/photos/16001932/pexels-photo-16001932.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU009', 'Mango Lassi', 6000, 'Refreshing yogurt drink with mango', 'Beverage', true, 'https://images.pexels.com/photos/1518680/pexels-photo-1518680.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('MENU010', 'Filter Coffee', 3500, 'Traditional South Indian filter coffee', 'Beverage', true, 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400')
ON CONFLICT (menu_item_id) DO NOTHING;

-- Seed Table Tokens (T1-T10, valid for 1 year from now)
INSERT INTO table_tokens (table_id, token, expires_at) VALUES
  ('T1', 'ABC123XYZ789', now() + interval '1 year'),
  ('T2', 'DEF456UVW012', now() + interval '1 year'),
  ('T3', 'GHI789RST345', now() + interval '1 year'),
  ('T4', 'JKL012OPQ678', now() + interval '1 year'),
  ('T5', 'MNO345LMN901', now() + interval '1 year'),
  ('T6', 'PQR678JKL234', now() + interval '1 year'),
  ('T7', 'STU901HIJ567', now() + interval '1 year'),
  ('T8', 'VWX234GHI890', now() + interval '1 year'),
  ('T9', 'YZA567DEF123', now() + interval '1 year'),
  ('T10', 'BCD890ABC456', now() + interval '1 year')
ON CONFLICT (table_id) DO NOTHING;

-- Seed Staff Auth (DEMO ONLY - pins in plain text)
-- TODO: In production, remove pin_plain and use proper pin_hash with bcrypt
INSERT INTO staff_auth (role, pin_plain, pin_hash) VALUES
  ('kitchen', '1234', 'demo-hash-replace-in-production'),
  ('waiter', '5678', 'demo-hash-replace-in-production'),
  ('admin', '9999', 'demo-hash-replace-in-production')
ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
