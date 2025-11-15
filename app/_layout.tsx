import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoanProvider } from "@/contexts/LoanContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { AlertSettingsProvider } from "@/contexts/AlertSettingsContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { BackupSettingsProvider } from "@/contexts/BackupSettingsContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { MessageTemplateProvider } from "@/contexts/MessageTemplateContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { RentProvider } from "@/contexts/RentContext";
import { trpc, trpcClient } from "@/lib/trpc";


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(rent-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="module-selection" options={{ headerShown: false }} />
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
      <Stack.Screen 
        name="edit-loan" 
        options={{ 
          presentation: "card",
          title: "Edit Loan"
        }} 
      />
      <Stack.Screen 
        name="paywall" 
        options={{ 
          presentation: "modal",
          title: "Upgrade to Premium"
        }} 
      />
      <Stack.Screen 
        name="message-templates" 
        options={{ 
          presentation: "card",
          title: "Message Templates"
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          presentation: "card",
          title: "Notifications"
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
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <SubscriptionProvider>
          <CurrencyProvider>
            <AlertSettingsProvider>
              <MessageTemplateProvider>
                <NotificationProvider>
                  <BackupSettingsProvider>
                    <CustomerProvider>
                      <LoanProvider>
                        <RentProvider>
                          <GestureHandlerRootView style={{ flex: 1 }}>
                            <RootLayoutNav />
                          </GestureHandlerRootView>
                        </RentProvider>
                      </LoanProvider>
                    </CustomerProvider>
                  </BackupSettingsProvider>
                </NotificationProvider>
              </MessageTemplateProvider>
            </AlertSettingsProvider>
          </CurrencyProvider>
        </SubscriptionProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
