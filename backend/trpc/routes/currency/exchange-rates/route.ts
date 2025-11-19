import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: {
    AED: 3.67, EUR: 0.92, GBP: 0.79, SAR: 3.75, QAR: 3.64,
    OMR: 0.38, KWD: 0.31, BHD: 0.38, INR: 83.12, PKR: 278.50, PHP: 56.35, USD: 1
  },
  AED: {
    USD: 0.27, EUR: 0.25, GBP: 0.21, SAR: 1.02, QAR: 0.99,
    OMR: 0.10, KWD: 0.08, BHD: 0.10, INR: 22.65, PKR: 75.89, PHP: 15.35, AED: 1
  },
  EUR: {
    USD: 1.09, AED: 4.00, GBP: 0.86, SAR: 4.08, QAR: 3.97,
    OMR: 0.42, KWD: 0.33, BHD: 0.41, INR: 90.50, PKR: 303.15, PHP: 61.35, EUR: 1
  },
  GBP: {
    USD: 1.27, AED: 4.66, EUR: 1.16, SAR: 4.76, QAR: 4.62,
    OMR: 0.49, KWD: 0.39, BHD: 0.48, INR: 105.50, PKR: 353.50, PHP: 71.55, GBP: 1
  },
  INR: {
    USD: 0.012, AED: 0.044, EUR: 0.011, GBP: 0.0095, SAR: 0.045,
    QAR: 0.044, OMR: 0.0046, KWD: 0.0037, BHD: 0.0046, PKR: 3.35, PHP: 0.68, INR: 1
  },
  SAR: {
    USD: 0.27, AED: 0.98, EUR: 0.25, GBP: 0.21, QAR: 0.97,
    OMR: 0.10, KWD: 0.08, BHD: 0.10, INR: 22.17, PKR: 74.27, PHP: 15.03, SAR: 1
  },
  QAR: {
    USD: 0.27, AED: 1.01, EUR: 0.25, GBP: 0.22, SAR: 1.03,
    OMR: 0.10, KWD: 0.08, BHD: 0.10, INR: 22.84, PKR: 76.51, PHP: 15.48, QAR: 1
  },
  OMR: {
    USD: 2.60, AED: 9.55, EUR: 2.38, GBP: 2.04, SAR: 9.75,
    QAR: 9.46, KWD: 0.81, BHD: 0.98, INR: 216.10, PKR: 724.10, PHP: 146.51, OMR: 1
  },
  KWD: {
    USD: 3.25, AED: 11.94, EUR: 2.98, GBP: 2.56, SAR: 12.19,
    QAR: 11.83, OMR: 1.25, BHD: 1.23, INR: 270.39, PKR: 905.63, PHP: 183.14, KWD: 1
  },
  BHD: {
    USD: 2.65, AED: 9.73, EUR: 2.43, GBP: 2.08, SAR: 9.94,
    QAR: 9.65, OMR: 1.02, KWD: 0.81, INR: 220.32, PKR: 738.33, PHP: 149.33, BHD: 1
  },
  PKR: {
    USD: 0.0036, AED: 0.013, EUR: 0.0033, GBP: 0.0028, SAR: 0.013,
    QAR: 0.013, OMR: 0.0014, KWD: 0.0011, BHD: 0.0014, INR: 0.30, PHP: 0.20, PKR: 1
  },
  PHP: {
    USD: 0.018, AED: 0.065, EUR: 0.016, GBP: 0.014, SAR: 0.067,
    QAR: 0.065, OMR: 0.0068, KWD: 0.0055, BHD: 0.0067, INR: 1.47, PKR: 4.94, PHP: 1
  },
};

const API_ENDPOINTS = [
  'https://api.exchangerate.host/latest',
  'https://api.frankfurter.app/latest',
  'https://api.exchangerate-api.com/v4/latest',
  'https://open.er-api.com/v6/latest',
];

const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const getExchangeRatesProcedure = publicProcedure
  .input(
    z.object({
      baseCurrency: z.string(),
      supportedCurrencies: z.array(z.string()).optional(),
    })
  )
  .query(async ({ input }) => {
    console.log('[Backend] Fetching exchange rates for', input.baseCurrency);
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetchWithTimeout(`${endpoint}/${input.baseCurrency}`, TIMEOUT_MS);
        
        if (response.ok) {
          const data = await response.json();
          const base = data.base || data.base_code || input.baseCurrency;
          const date = data.date || data.time_last_update_utc || new Date().toISOString().split('T')[0];
          const rates = data.rates as Record<string, number>;
          
          if (rates && Object.keys(rates).length > 0) {
            console.log('[Backend] Successfully fetched rates from', endpoint);
            
            let filteredRates = rates;
            if (input.supportedCurrencies && input.supportedCurrencies.length > 0) {
              filteredRates = {};
              input.supportedCurrencies.forEach((currency) => {
                if (currency === base) {
                  filteredRates[currency] = 1;
                } else if (rates[currency]) {
                  filteredRates[currency] = rates[currency];
                }
              });
            }
            
            return {
              base,
              date,
              rates: filteredRates,
              source: 'live',
            };
          }
        }
      } catch (error) {
        console.log(`[Backend] Failed to fetch from ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (FALLBACK_RATES[input.baseCurrency]) {
      console.log('[Backend] Using fallback exchange rates for', input.baseCurrency);
      return {
        base: input.baseCurrency,
        date: new Date().toISOString().split('T')[0],
        rates: FALLBACK_RATES[input.baseCurrency],
        source: 'fallback',
      };
    }

    console.error('[Backend] Failed to fetch exchange rates from all sources');
    throw new Error(`Exchange rates unavailable for ${input.baseCurrency}`);
  });

export const convertCurrencyProcedure = publicProcedure
  .input(
    z.object({
      amount: z.number(),
      fromCurrency: z.string(),
      toCurrency: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log('[Backend] Converting', input.amount, 'from', input.fromCurrency, 'to', input.toCurrency);
    
    if (input.fromCurrency === input.toCurrency) {
      return {
        originalAmount: input.amount,
        convertedAmount: input.amount,
        rate: 1,
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        source: 'same-currency',
      };
    }

    let rate: number | undefined;
    let source = 'live';

    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetchWithTimeout(`${endpoint}/${input.fromCurrency}`, TIMEOUT_MS);
        
        if (response.ok) {
          const data = await response.json();
          rate = data.rates?.[input.toCurrency];
          if (rate) {
            console.log('[Backend] Got conversion rate from', endpoint);
            break;
          }
        }
      } catch (error) {
        console.log(`[Backend] Failed conversion from ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (!rate && FALLBACK_RATES[input.fromCurrency]) {
      rate = FALLBACK_RATES[input.fromCurrency][input.toCurrency];
      source = 'fallback';
      console.log('[Backend] Using fallback rate for conversion');
    }
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${input.fromCurrency} to ${input.toCurrency}`);
    }

    const convertedAmount = Math.round(input.amount * rate * 100) / 100;
    
    return {
      originalAmount: input.amount,
      convertedAmount,
      rate,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      source,
    };
  });
