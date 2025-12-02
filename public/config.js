/**
 * Centralized Application Configuration
 *
 * This file provides a single source of truth for all API endpoints and configuration.
 *
 * PRODUCTION DEPLOYMENT:
 * To switch from test to production n8n:
 * 1. Update N8N_BASE to your production n8n instance URL
 * 2. Update SUPABASE_URL and SUPABASE_KEY with your production values
 * 3. Update DOMAIN_ORIGIN if deploying to a custom domain
 */

window.APP_CONFIG = {
  // n8n Webhook Base URL
  // DEFAULT: Test instance (https://n8n-ninja.app.n8n.cloud)
  // PRODUCTION: Replace with your production n8n instance
  N8N_BASE: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_N8N_WEBHOOK_URL : '') || 'https://n8n-ninja.app.n8n.cloud',

  // n8n Webhook Endpoints
  // These paths are appended to N8N_BASE to form complete URLs
  ENDPOINTS: {
    ORDER_CREATE: '/webhook/order-create',
    KITCHEN_UPDATE: '/webhook/kitchen-update',
    ORDER_SERVED: '/webhook/order-served',
    GENERATE_BILL: '/webhook/generate-bill',
    STRIPE_WEBHOOK: '/webhook/stripe-webhook'
  },

  // Supabase Configuration
  SUPABASE_URL: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '') || 'REPLACE_WITH_SUPABASE_URL',
  SUPABASE_KEY: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '') || 'REPLACE_WITH_SUPABASE_ANON_KEY',

  // Application Domain
  DOMAIN_ORIGIN: window.location.origin,

  // Webhook Security
  // TODO: In production, implement proper webhook secret validation
  WEBHOOK_SECRET: 'demo-secret-change-in-production',

  // Session Configuration
  SESSION_TIMEOUT_HOURS: 8,

  // Retry Configuration
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 1000,

  // Helper function to build full webhook URLs
  getWebhookUrl: function(endpoint) {
    return `${this.N8N_BASE}${this.ENDPOINTS[endpoint]}`;
  }
};

// Expose a helper for React app (if needed)
if (typeof window !== 'undefined') {
  window.getWebhookUrl = window.APP_CONFIG.getWebhookUrl.bind(window.APP_CONFIG);
}
