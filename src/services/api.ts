/**
 * API Service
 * Centralized service for all API calls with retry logic and error handling
 */

interface AppConfig {
  N8N_BASE: string;
  ENDPOINTS: Record<string, string>;
  WEBHOOK_SECRET: string;
  RETRY_ATTEMPTS: number;
  RETRY_DELAY_MS: number;
  getWebhookUrl: (endpoint: string) => string;
}

declare global {
  interface Window {
    APP_CONFIG: AppConfig;
  }
}

const getConfig = (): AppConfig => {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    return window.APP_CONFIG;
  }

  return {
    N8N_BASE: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-ninja.app.n8n.cloud',
    ENDPOINTS: {
      ORDER_CREATE: '/webhook/order-create',
      KITCHEN_UPDATE: '/webhook/kitchen-update',
      ORDER_SERVED: '/webhook/order-served',
      GENERATE_BILL: '/webhook/generate-bill',
      STRIPE_WEBHOOK: '/webhook/stripe-webhook'
    },
    WEBHOOK_SECRET: import.meta.env.VITE_WEBHOOK_SECRET || 'demo-secret-change-in-production',
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 1000,
    getWebhookUrl: function(endpoint: string) {
      return `${this.N8N_BASE}${this.ENDPOINTS[endpoint]}`;
    }
  };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = getConfig();
  const {
    attempts = config.RETRY_ATTEMPTS,
    delayMs = config.RETRY_DELAY_MS,
    exponentialBackoff = true
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok || response.status === 400) {
        return response;
      }

      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1}/${attempts + 1} failed:`, error);

      if (attempt < attempts) {
        const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt) : delayMs;
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed after ${attempts + 1} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

export interface OrderItem {
  itemId: string;
  name: string;
  qty: number;
}

export interface CreateOrderPayload {
  tableId: string;
  token: string;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  orderId: string;
  message?: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const config = getConfig();
  const url = config.getWebhookUrl('ORDER_CREATE');

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': config.WEBHOOK_SECRET
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create order' }));
    throw new Error(error.message || 'Failed to create order');
  }

  return response.json();
}

export interface KitchenUpdateItem {
  orderItemId: string;
  status: 'preparing' | 'ready';
}

export interface KitchenUpdatePayload {
  orderId: string;
  updates: KitchenUpdateItem[];
}

export async function updateKitchenStatus(payload: KitchenUpdatePayload): Promise<void> {
  const config = getConfig();
  const url = config.getWebhookUrl('KITCHEN_UPDATE');

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': config.WEBHOOK_SECRET
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update kitchen status' }));
    throw new Error(error.message || 'Failed to update kitchen status');
  }
}

export interface OrderServedPayload {
  orderId: string;
  servedItems: string[];
  timestamp: string;
}

export async function markOrderServed(payload: OrderServedPayload): Promise<void> {
  const config = getConfig();
  const url = config.getWebhookUrl('ORDER_SERVED');

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': config.WEBHOOK_SECRET
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to mark order as served' }));
    throw new Error(error.message || 'Failed to mark order as served');
  }
}

export interface GenerateBillPayload {
  orderId: string;
}

export interface GenerateBillResponse {
  checkoutUrl: string;
}

export async function generateBill(payload: GenerateBillPayload): Promise<GenerateBillResponse> {
  const config = getConfig();
  const url = config.getWebhookUrl('GENERATE_BILL');

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': config.WEBHOOK_SECRET
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate bill' }));
    throw new Error(error.message || 'Failed to generate bill');
  }

  return response.json();
}
