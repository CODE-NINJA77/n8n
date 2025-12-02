# Hotel Restaurant Automation System

Complete end-to-end restaurant automation system with React ordering app, AR menu, kitchen/waiter dashboards, billing, and n8n webhook integration.

## Features

- Customer Ordering App with token validation and retry logic
- AR Menu Experience with fallback UI
- Kitchen Dashboard with PIN authentication and realtime updates
- Waiter Dashboard with serving notifications
- Billing & Stripe Checkout integration (test mode by default)
- QR Code Generator for table tokens
- Centralized configuration for easy test-to-production switching

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase project: https://app.supabase.com
- n8n instance (test: https://n8n-ninja.app.n8n.cloud)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_WEBHOOK_URL=https://n8n-ninja.app.n8n.cloud
VITE_DOMAIN=http://localhost:5173
```

3. Run database migration in Supabase SQL Editor

4. Start development:
```bash
npm run dev
```

## Configuration

All endpoints are centralized in `/public/config.js`.

To switch from test to production n8n:
- Update `N8N_BASE` in `/public/config.js`
- Update `VITE_N8N_WEBHOOK_URL` in `.env`
- Rebuild: `npm run build`

## n8n Webhooks Required

1. POST /webhook/order-create - Create orders
2. POST /webhook/kitchen-update - Update item status
3. POST /webhook/order-served - Mark items served
4. POST /webhook/generate-bill - Generate Stripe checkout
5. POST /webhook/stripe-webhook - Handle payment completion

See inline code comments for detailed payload structures.

## Database Schema

- menu_items: Menu with prices in cents
- orders: Customer orders
- order_items: Individual items with status tracking
- table_tokens: Valid tokens with expiry
- staff_auth: PIN authentication
- payments: Payment records

Default staff PINs (CHANGE IN PRODUCTION):
- Kitchen: 1234
- Waiter: 5678
- Admin: 9999

## Testing

Test order creation:
```bash
curl -X POST https://n8n-ninja.app.n8n.cloud/webhook/order-create \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "T1",
    "token": "ABC123XYZ789",
    "items": [{"itemId": "MENU001", "name": "Masala Dosa", "qty": 2}]
  }'
```

## Deployment

Vercel (React app):
```bash
npm run build
vercel --prod
```

Netlify (static pages):
```bash
netlify deploy --prod --dir=public
```

## Security Checklist

- Change default PINs in production
- Update WEBHOOK_SECRET in config
- Enable rate limiting
- Use HTTPS everywhere
- Rotate tokens periodically

## Built With

React, TypeScript, Tailwind CSS, Supabase, n8n, Stripe, AR.js

## License

MIT
