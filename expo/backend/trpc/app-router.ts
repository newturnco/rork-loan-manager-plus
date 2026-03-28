import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getExchangeRatesProcedure, convertCurrencyProcedure } from "./routes/currency/exchange-rates/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  currency: createTRPCRouter({
    getExchangeRates: getExchangeRatesProcedure,
    convertCurrency: convertCurrencyProcedure,
  }),
});

export type AppRouter = typeof appRouter;
