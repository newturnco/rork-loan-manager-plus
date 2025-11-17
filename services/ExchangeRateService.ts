import AsyncStorage from '@react-native-async-storage/async-storage';
import { FALLBACK_EXCHANGE_RATES } from '../constants/exchangeRates';

export interface ExchangeRatesData {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CachedExchangeRates {
  timestamp: number;
  payload: ExchangeRatesData;
}

const CACHE_KEY_PREFIX = '@exchange-rates:';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const PRIMARY_API_URL = 'https://api.exchangerate-api.com/v4/latest';
const BACKUP_API_URL = 'https://open.er-api.com/v6/latest';

const mapRatesToSupported = (
  rates: Record<string, number>,
  supportedCodes: string[],
  base: string,
): Record<string, number> => {
  const mapped: Record<string, number> = {};

  supportedCodes.forEach((code) => {
    if (code === base) {
      mapped[code] = 1;
      return;
    }

    if (typeof rates[code] === 'number') {
      mapped[code] = rates[code];
    }
  });

  if (!mapped[base]) {
    mapped[base] = 1;
  }

  return mapped;
};

const persistRates = async (base: string, data: ExchangeRatesData) => {
  const cacheKey = `${CACHE_KEY_PREFIX}${base}`;
  const cached: CachedExchangeRates = {
    timestamp: Date.now(),
    payload: data,
  };

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.log('Failed to persist exchange rates', error);
  }
};

const readCachedRates = async (base: string): Promise<CachedExchangeRates | null> => {
  const cacheKey = `${CACHE_KEY_PREFIX}${base}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as CachedExchangeRates;
  } catch (error) {
    console.log('Failed to read cached exchange rates', error);
    return null;
  }
};

const fetchFromEndpoint = async (
  endpoint: string,
  base: string,
  supportedCodes: string[],
): Promise<ExchangeRatesData | null> => {
  try {
    const response = await fetch(`${endpoint}/${base}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const baseCurrency = (data.base || data.base_code || base) as string;
    const date = (data.date || data.time_last_update_utc || new Date().toISOString()) as string;
    const rates = data.rates as Record<string, number> | undefined;

    if (!rates) {
      return null;
    }

    const mappedRates = mapRatesToSupported(rates, supportedCodes, baseCurrency);

    if (Object.keys(mappedRates).length === 0) {
      return null;
    }

    console.log('Fetched exchange rates from', endpoint, 'for', baseCurrency);

    return {
      base: baseCurrency,
      date,
      rates: mappedRates,
    };
  } catch (error) {
    console.log('Failed fetching exchange rates from', endpoint, error);
    return null;
  }
};

const getFallbackRates = (
  base: string,
  supportedCodes: string[],
): ExchangeRatesData | null => {
  const fallbackRates = FALLBACK_EXCHANGE_RATES[base];

  if (!fallbackRates) {
    return null;
  }

  const mappedRates = mapRatesToSupported(fallbackRates, supportedCodes, base);

  console.log('Using fallback exchange rates for', base);

  return {
    base,
    date: new Date().toISOString(),
    rates: mappedRates,
  };
};

export const getExchangeRates = async (
  base: string,
  supportedCodes: string[],
): Promise<ExchangeRatesData> => {
  const cached = await readCachedRates(base);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('Serving exchange rates from cache for', base);
    return cached.payload;
  }

  const liveFromPrimary = await fetchFromEndpoint(PRIMARY_API_URL, base, supportedCodes);

  if (liveFromPrimary) {
    await persistRates(base, liveFromPrimary);
    return liveFromPrimary;
  }

  const liveFromBackup = await fetchFromEndpoint(BACKUP_API_URL, base, supportedCodes);

  if (liveFromBackup) {
    await persistRates(base, liveFromBackup);
    return liveFromBackup;
  }

  if (cached) {
    console.log('Using stale cached exchange rates for', base);
    return cached.payload;
  }

  const fallback = getFallbackRates(base, supportedCodes);

  if (fallback) {
    await persistRates(base, fallback);
    return fallback;
  }

  throw new Error('Exchange rates unavailable');
};
