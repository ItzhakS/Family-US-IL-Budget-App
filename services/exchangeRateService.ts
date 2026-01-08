import { supabase } from '../supabaseClient';

const OPEN_EXCHANGE_RATES_API_KEY = '6fde696385c042f9a59d474ccaee3ff6';
const API_BASE_URL = 'https://openexchangerates.org/api';

export interface ExchangeRate {
  usdToIls: number; // 1 USD = X ILS
  ilsToUsd: number; // 1 ILS = X USD
  date: string; // YYYY-MM-DD
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
      .single();

    if (existingRate && !fetchError) {
      // Return cached rate
      return {
        usdToIls: existingRate.usd_to_ils,
        ilsToUsd: existingRate.ils_to_usd,
        date: existingRate.date,
      };
    }

    // No rate for today, fetch from API
    const rate = await fetchExchangeRateFromAPI();

    // Store in database (global, shared by all families)
    const { error: insertError } = await supabase
      .from('exchange_rates')
      .insert({
        date: rate.date,
        usd_to_ils: rate.usdToIls,
        ils_to_usd: rate.ilsToUsd,
      });

    if (insertError) {
      // If insert fails (e.g., race condition where another user just inserted it),
      // try to fetch it again
      if (insertError.code === '23505') { // Unique violation
        const { data: retryRate } = await supabase
          .from('exchange_rates')
          .select('*')
          .eq('date', today)
          .single();
        
        if (retryRate) {
          return {
            usdToIls: retryRate.usd_to_ils,
            ilsToUsd: retryRate.ils_to_usd,
            date: retryRate.date,
          };
        }
      }
      console.error('Error storing exchange rate:', insertError);
      // Still return the rate even if storage fails
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
      .single();

    if (fallbackRate) {
      return {
        usdToIls: fallbackRate.usd_to_ils,
        ilsToUsd: fallbackRate.ils_to_usd,
        date: fallbackRate.date,
      };
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

