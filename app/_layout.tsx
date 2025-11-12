import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoanProvider } from "@/contexts/LoanContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { AlertSettingsProvider } from "@/contexts/AlertSettingsContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-loan" 
        options={{ 
          presentation: "modal",
          title: "New Loan"
        }} 
      />
      <Stack.Screen 
        name="loan-details" 
        options={{ 
          presentation: "card",
          title: "Loan Details"
        }} 
      />
      <Stack.Screen 
        name="add-payment" 
        options={{ 
          presentation: "modal",
          title: "Record Payment"
        }} 
      />
      <Stack.Screen 
        name="add-customer" 
        options={{ 
          presentation: "modal",
          title: "New Customer"
        }} 
      />
      <Stack.Screen 
        name="edit-customer" 
        options={{ 
          presentation: "card",
          title: "Edit Customer"
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <AlertSettingsProvider>
            <CustomerProvider>
              <LoanProvider>
                <GestureHandlerRootView>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </LoanProvider>
            </CustomerProvider>
          </AlertSettingsProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
