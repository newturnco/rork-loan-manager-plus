import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

const API_URL = 'https://api.exchangerate-api.com/v4/latest';

export const getExchangeRatesProcedure = publicProcedure
  .input(
    z.object({
      baseCurrency: z.string(),
    })
  )
  .query(async ({ input }) => {
    try {
      const response = await fetch(`${API_URL}/${input.baseCurrency}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      
      return {
        base: data.base,
        date: data.date,
        rates: data.rates as Record<string, number>,
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
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
    try {
      if (input.fromCurrency === input.toCurrency) {
        return {
          originalAmount: input.amount,
          convertedAmount: input.amount,
          rate: 1,
          fromCurrency: input.fromCurrency,
          toCurrency: input.toCurrency,
        };
      }

      const response = await fetch(`${API_URL}/${input.fromCurrency}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      const rate = data.rates[input.toCurrency];
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${input.toCurrency}`);
      }

      const convertedAmount = input.amount * rate;
      
      return {
        originalAmount: input.amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate,
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      throw new Error('Failed to convert currency');
    }
  });
