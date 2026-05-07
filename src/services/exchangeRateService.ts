import { supabase } from '../lib/supabaseClient';

const OPEN_EXCHANGE_RATES_API_KEY = '6fde696385c042f9a59d474ccaee3ff6';
const API_BASE_URL = 'https://openexchangerates.org/api';

export interface ExchangeRate {
  usdToIls: number; // 1 USD = X ILS
  ilsToUsd: number; // 1 ILS = X USD
  date: string; // YYYY-MM-DD
}

type ExchangeRateRow = {
  date: string;
  usd_to_ils: number;
  ils_to_usd: number;
};

function mapExchangeRateRow(row: ExchangeRateRow): ExchangeRate {
  return {
    usdToIls: Number(row.usd_to_ils),
    ilsToUsd: Number(row.ils_to_usd),
    date: row.date,
  };
}

/**
 * Fetches the current USD/ILS exchange rate from Open Exchange Rates API
 */
async function fetchExchangeRateFromAPI(): Promise<ExchangeRate> {
  const response = await fetch(
    `${API_BASE_URL}/latest.json?app_id=${OPEN_EXCHANGE_RATES_API_KEY}&base=USD&symbols=ILS`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.rates || !data.rates.ILS) {
    throw new Error('ILS rate not found in API response');
  }

  const usdToIls = data.rates.ILS;
  const ilsToUsd = 1 / usdToIls;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return {
    usdToIls,
    ilsToUsd,
    date: today,
  };
}

const DEMO_FX_SESSION_PREFIX = 'family-budget-demo-fx-';

/**
 * USD/ILS rate without Supabase (demo mode or no DB). Caches per calendar day in sessionStorage.
 */
export async function getExchangeRateOffline(): Promise<ExchangeRate | null> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `${DEMO_FX_SESSION_PREFIX}${today}`;

  if (typeof sessionStorage !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as ExchangeRate;
        if (
          typeof parsed?.usdToIls === 'number' &&
          typeof parsed?.ilsToUsd === 'number' &&
          typeof parsed?.date === 'string'
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore bad cache
    }
  }

  try {
    const rate = await fetchExchangeRateFromAPI();
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(rate));
      } catch {
        // quota / private mode
      }
    }
    return rate;
  } catch (e) {
    console.error('getExchangeRateOffline failed:', e);
    return null;
  }
}

/**
 * Gets the exchange rate, fetching from API if needed (once per day for entire app)
 */
export async function getExchangeRate(): Promise<ExchangeRate | null> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Check if we have a rate for today (global, not per family)
    const { data: existingRate, error: fetchError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (fetchError) {
      console.error('Error reading cached exchange rate:', fetchError);
    }

    if (existingRate) {
      // Return cached rate
      return mapExchangeRateRow(existingRate as ExchangeRateRow);
    }

    // No rate for today, fetch from API
    const rate = await fetchExchangeRateFromAPI();

    // Store in database (global, shared by all families). The date unique key makes this
    // safe when multiple clients fetch the first rate of the day at the same time.
    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert({
        date: rate.date,
        usd_to_ils: rate.usdToIls,
        ils_to_usd: rate.ilsToUsd,
      }, {
        onConflict: 'date',
        ignoreDuplicates: true,
      });

    if (upsertError) {
      console.error('Error storing exchange rate:', upsertError);
      // Still return the rate even if storage fails
      return rate;
    }

    const { data: savedRate, error: savedError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (savedError) {
      console.error('Error reading saved exchange rate:', savedError);
    }

    if (savedRate) {
      return mapExchangeRateRow(savedRate as ExchangeRateRow);
    }

    return rate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    
    // Try to get the most recent rate from DB as fallback
    const { data: fallbackRate } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackRate) {
      return mapExchangeRateRow(fallbackRate as ExchangeRateRow);
    }

    return null;
  }
}

/**
 * Converts an amount from one currency to another using the exchange rate
 */
export function convertCurrency(
  amount: number,
  fromCurrency: 'USD' | 'ILS',
  toCurrency: 'USD' | 'ILS',
  exchangeRate: ExchangeRate | null
): number {
  if (!exchangeRate || fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'ILS') {
    return amount * exchangeRate.usdToIls;
  }

  if (fromCurrency === 'ILS' && toCurrency === 'USD') {
    return amount * exchangeRate.ilsToUsd;
  }

  return amount;
}

