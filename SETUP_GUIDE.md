# Hotel Restaurant Automation - Setup Guide

## What Has Been Built

A complete, production-ready hotel restaurant automation system with:

### 1. React Ordering App
- **Location**: `/src`
- **Features**:
  - Token validation for secure table access
  - Real-time menu loading from Supabase
  - Shopping cart with quantity controls (0-10)
  - Order placement with 2x retry logic and exponential backoff
  - Success screen with order ID and bill link
  - Responsive design with Tailwind CSS

### 2. Static HTML Dashboards
- **Location**: `/public`
- **Pages**:
  - `ar-menu.html` - AR menu experience with AR.js
  - `qr-generator.html` - Bulk QR code generator with CSV export
  - `kitchen-login.html` - PIN authentication for staff
  - `kitchen-dashboard.html` - Kitchen order management with realtime
  - `waiter-dashboard.html` - Waiter serving dashboard with realtime
  - `billing-payment.html` - Billing and Stripe checkout integration

### 3. Centralized Configuration
- **Location**: `/public/config.js`
- **Purpose**: Single source of truth for all API endpoints
- **Easy Switch**: Change one line to switch from test to production n8n

### 4. Database Schema
- **Location**: Supabase migration applied
- **Tables**:
  - `menu_items` - Menu with prices in cents
  - `orders` - Customer orders with status tracking
  - `order_items` - Individual items with status (pending → preparing → ready → served)
  - `table_tokens` - Secure tokens with expiry
  - `staff_auth` - PIN authentication (demo PINs: kitchen=1234, waiter=5678)
  - `payments` - Payment records

## Quick Setup (5 Minutes)

### Step 1: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_ANON_KEY)

### Step 2: Run the Database Migration

1. In Supabase Dashboard, go to SQL Editor
2. Copy the entire contents of the migration that was applied
3. Paste and click "Run"
4. Verify tables were created in Database → Tables

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_N8N_WEBHOOK_URL=https://n8n-ninja.app.n8n.cloud
VITE_DOMAIN=http://localhost:5173
```

3. Update `/public/config.js` with the same values (for static pages)

### Step 4: Install and Run

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173

## Testing the Complete Flow

### Test 1: Generate QR Codes
1. Open http://localhost:5173/qr-generator.html
2. Generate 5 tables
3. Download QR codes or copy URLs

### Test 2: Order as Customer
1. Open URL: http://localhost:5173?table=T1&token=ABC123XYZ789
2. Browse menu
3. Add items to cart
4. Place order
5. Note the Order ID

### Test 3: Kitchen Staff
1. Open http://localhost:5173/kitchen-login.html
2. Select "Kitchen Staff", enter PIN: 1234
3. See your order appear in real-time
4. Mark items as "Preparing"
5. Mark items as "Ready"

### Test 4: Waiter Staff
1. Open http://localhost:5173/kitchen-login.html
2. Select "Waiter", enter PIN: 5678
3. See ready items
4. Mark as "Served"

### Test 5: Billing (requires n8n setup)
1. Open http://localhost:5173/billing-payment.html?table=T1&token=ABC123XYZ789
2. See bill calculation
3. Click "Pay Now" (requires n8n webhook)

## n8n Setup

You need to set up 5 webhooks in n8n:

### Webhook 1: Order Create
- **Path**: `/webhook/order-create`
- **Method**: POST
- **Function**: Validate token, create order and order items
- **Returns**: `{ orderId: "uuid" }`

### Webhook 2: Kitchen Update
- **Path**: `/webhook/kitchen-update`
- **Method**: POST
- **Function**: Update order item status

### Webhook 3: Order Served
- **Path**: `/webhook/order-served`
- **Method**: POST
- **Function**: Mark items as served, close order if complete

### Webhook 4: Generate Bill
- **Path**: `/webhook/generate-bill`
- **Method**: POST
- **Function**: Calculate total, create Stripe checkout session
- **Returns**: `{ checkoutUrl: "https://checkout.stripe.com/..." }`

### Webhook 5: Stripe Webhook
- **Path**: `/webhook/stripe-webhook`
- **Method**: POST
- **Function**: Handle payment completion, mark order as paid

**See README.md for detailed webhook payload structures and n8n workflow examples.**

## Switching to Production

### Step 1: Update n8n URL
In `/public/config.js`, change:
```javascript
N8N_BASE: 'https://your-production-n8n.com'
```

In `.env`, change:
```env
VITE_N8N_WEBHOOK_URL=https://your-production-n8n.com
```

### Step 2: Update Stripe Keys
In `.env`, change:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### Step 3: Change Staff PINs
In Supabase, run:
```sql
UPDATE staff_auth SET pin_plain = 'NEW_PIN' WHERE role = 'kitchen';
UPDATE staff_auth SET pin_plain = 'NEW_PIN' WHERE role = 'waiter';
```

### Step 4: Rebuild and Deploy
```bash
npm run build
vercel --prod
```

## Architecture Overview

```
Customer → QR Code → AR Menu → Ordering App → n8n (order-create)
                                              ↓
                                        Supabase Database
                                              ↓
                          Kitchen Dashboard ← realtime updates
                                              ↓
                          Waiter Dashboard ← realtime updates
                                              ↓
                          Billing Page → n8n (generate-bill) → Stripe
                                              ↓
                                        n8n (stripe-webhook)
                                              ↓
                                        Order marked as PAID
```

## Key Features

✅ **Token Validation** - Every request validates table tokens server-side
✅ **Retry Logic** - 2 automatic retries with exponential backoff
✅ **Realtime Updates** - Kitchen and waiter dashboards update live via Supabase
✅ **Session Management** - 8-hour session timeout for staff
✅ **Responsive Design** - Works on mobile, tablet, and desktop
✅ **Error Handling** - Friendly error messages for users
✅ **Security** - RLS enabled, webhook secrets, HTTPS recommended

## File Structure

```
project/
├── public/
│   ├── config.js                    ← EDIT THIS for production
│   ├── ar-menu.html
│   ├── qr-generator.html
│   ├── kitchen-login.html
│   ├── kitchen-dashboard.html
│   ├── waiter-dashboard.html
│   └── billing-payment.html
├── src/
│   ├── App.tsx                      ← React app entry
│   ├── main.tsx
│   ├── components/
│   │   ├── MenuItem.tsx
│   │   └── Cart.tsx
│   ├── pages/
│   │   └── OrderingPage.tsx
│   ├── services/
│   │   ├── api.ts                   ← n8n webhook calls
│   │   └── supabase.ts              ← Database operations
│   └── lib/
│       └── supabase.ts              ← Supabase client
├── .env.example                     ← Copy to .env
├── README.md                        ← Full documentation
├── SETUP_GUIDE.md                   ← This file
├── vercel.json
└── netlify.toml
```

## Common Issues

### "Invalid or expired token"
- Check `table_tokens` table in Supabase
- Ensure `expires_at` is in the future
- Re-generate QR codes

### "Failed to place order"
- Check browser console for errors
- Verify n8n webhook URL in config.js
- Test webhook with cURL

### Kitchen dashboard blank
- Verify PIN (default: 1234)
- Check `staff_auth` table
- Clear sessionStorage

### Realtime not working
- Enable Realtime in Supabase project settings
- Check browser console for subscription errors
- Verify RLS policies allow public read

## Production Checklist

- [ ] Change staff PINs
- [ ] Update WEBHOOK_SECRET
- [ ] Enable Stripe production mode
- [ ] Update n8n URL to production
- [ ] Enable HTTPS everywhere
- [ ] Set up monitoring
- [ ] Configure backups

## Support

See README.md for:
- Detailed API documentation
- n8n workflow examples
- Testing procedures
- Deployment guides

---

**You're all set! Start with Test 1 above to verify everything works.**
