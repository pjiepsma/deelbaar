import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebView } from 'react-native-webview';

import Colors from '~/constants/Colors';
import { AppConfig } from '~/lib/config/AppConfig';
import {
  useCreateStripeAccountSession,
  useDisconnectStripeAccount,
  useStripeAccountStatus,
} from '~/lib/hooks/useStripeConnect';
import type { StripeAccountStatus } from '~/lib/types/stripe';

type WebViewBridgeMessage =
  | { type: 'ON_EXIT' }
  | { type: 'ON_READY' }
  | { type: 'STEP'; step?: string }
  | { type: 'ERROR'; message?: string }
  | { type: string; [key: string]: unknown };

const STRIPE_CONNECT_HTML = (publishableKey: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f8fafc;
      }
      #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://js.stripe.com/v3/"></script>
    <script src="https://connect-js.stripe.com/v1"></script>
    <script>
      const publishableKey = ${JSON.stringify(publishableKey)};
      let connectInstance;

      async function startOnboarding(clientSecret) {
        try {
          if (!clientSecret) {
            throw new Error('Stripe client secret ontbreekt');
          }

          if (typeof loadConnectAndInitialize !== 'function') {
            throw new Error('Stripe Connect.js kon niet laden');
          }

          connectInstance = await loadConnectAndInitialize({
            publishableKey,
            clientSecret,
          });

          const accountOnboarding = connectInstance.create('account-onboarding');

          accountOnboarding.setOnExit(() => {
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({ type: 'ON_EXIT' })
            );
          });

          accountOnboarding.setOnReady(() => {
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({ type: 'ON_READY' })
            );
          });

          accountOnboarding.setOnStepChange((event) => {
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({ type: 'STEP', step: event?.step })
            );
          });

          const mountNode = document.getElementById('root');
          if (mountNode) {
            mountNode.innerHTML = '';
          }
          accountOnboarding.mount('#root');
        } catch (error) {
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              type: 'ERROR',
              message:
                (error && error.message) ||
                'Kon Stripe onboarding niet laden. Probeer het opnieuw.',
            })
          );
        }
      }

      document.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data || '{}');
          if (data.type === 'START_ONBOARDING') {
            startOnboarding(data.clientSecret);
          }
        } catch (error) {
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              type: 'ERROR',
              message:
                (error && error.message) ||
                'Onbekend bericht ontvangen in WebView.',
            })
          );
        }
      });
    </script>
  </body>
</html>
`;

const formatStatusDescription = (status?: StripeAccountStatus | null) => {
  if (!status) {
    return 'Start de onboarding om uitbetalingen te ontvangen.';
  }

  if (status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted) {
    return 'Je account is volledig klaar voor betalingen en uitbetalingen.';
  }

  if (status.requirementsDue?.length) {
    return `Er zijn ${status.requirementsDue.length} vereiste stappen die nog moeten worden afgerond.`;
  }

  return 'Je onboarding is gestart. Voltooi de resterende stappen om uitbetalingen te ontvangen.';
};

export default function StripeOnboardingModal() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const [webMessage, setWebMessage] = useState<string | null>(null);

  const {
    data: stripeStatus,
    isPending: isStatusLoading,
    refetch: refetchStatus,
  } = useStripeAccountStatus();
  const createSession = useCreateStripeAccountSession();
  const disconnectAccount = useDisconnectStripeAccount();

  const publishableKey = AppConfig.STRIPE_PUBLISHABLE_KEY;
  const connectHtml = useMemo(
    () => (publishableKey ? STRIPE_CONNECT_HTML(publishableKey) : null),
    [publishableKey]
  );

  useEffect(() => {
    if (clientSecret && isWebViewLoaded) {
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'START_ONBOARDING', clientSecret })
      );
    }
  }, [clientSecret, isWebViewLoaded]);

  const handleCreateSession = useCallback(async () => {
    try {
      setWebMessage(null);
      const response = await createSession.mutateAsync();
      setClientSecret(response.clientSecret);
      setIsWebViewLoaded(false);
      setWebViewKey((prev) => prev + 1);
    } catch (error: any) {
      setWebMessage(error?.message || 'Kon Stripe onboarding niet starten.');
    }
  }, [createSession]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectAccount.mutateAsync();
      await refetchStatus();
      setWebMessage('Stripe account is losgekoppeld.');
    } catch (error: any) {
      setWebMessage(error?.message || 'Kon Stripe account niet loskoppelen.');
    }
  }, [disconnectAccount, refetchStatus]);

  const handleWebViewMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const data: WebViewBridgeMessage = JSON.parse(event.nativeEvent.data || '{}');
        switch (data.type) {
          case 'ON_EXIT':
            setClientSecret(null);
            setIsWebViewLoaded(false);
            setWebMessage('Onboarding gesloten. Controleer je status hieronder.');
            await refetchStatus();
            break;
          case 'ON_READY':
            setWebMessage('Stripe onboarding is geladen.');
            break;
          case 'STEP':
            if (data.step) {
              setWebMessage(`Stap: ${data.step}`);
            }
            break;
          case 'ERROR':
            setWebMessage(
              data.message || 'Onbekende fout vanuit Stripe onboarding.'
            );
            break;
          default:
            break;
        }
      } catch (error: any) {
        setWebMessage(error?.message || 'Kon bericht van Stripe niet verwerken.');
      }
    },
    [refetchStatus]
  );

  const isConnected = Boolean(stripeStatus?.connected);
  const statusDescription = formatStatusDescription(stripeStatus?.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: 'Stripe onboarding',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Beheer je Stripe uitbetalingen</Text>
          <Text style={styles.subtitle}>
            Voltooi de onboarding om betalingen te ontvangen en uitbetalingen te laten doen via Stripe.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Huidige status</Text>
          {isStatusLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <View
                style={[
                  styles.statusBadge,
                  isConnected ? styles.statusBadgeSuccess : styles.statusBadgePending,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    isConnected ? styles.statusBadgeTextSuccess : styles.statusBadgeTextPending,
                  ]}>
                  {isConnected ? 'Actief' : 'Actie vereist'}
                </Text>
              </View>
              <Text style={styles.statusDescription}>{statusDescription}</Text>

              {stripeStatus?.status?.requirementsDue?.length ? (
                <View style={styles.requirementsList}>
                  {stripeStatus.status.requirementsDue.map((req) => (
                    <View key={req} style={styles.requirementItem}>
                      <View style={styles.dot} />
                      <Text style={styles.requirementText}>{req}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => refetchStatus()}
                disabled={isStatusLoading}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.refreshText}>Status vernieuwen</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {webMessage ? <Text style={styles.webMessage}>{webMessage}</Text> : null}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, createSession.isPending && styles.buttonDisabled]}
            onPress={handleCreateSession}
            disabled={createSession.isPending || !publishableKey}>
            {createSession.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isConnected ? 'Onboarding opnieuw starten' : 'Start Stripe onboarding'}
              </Text>
            )}
          </TouchableOpacity>

          {isConnected ? (
            <TouchableOpacity
              style={[styles.secondaryButton, disconnectAccount.isPending && styles.buttonDisabled]}
              onPress={handleDisconnect}
              disabled={disconnectAccount.isPending}>
              {disconnectAccount.isPending ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Stripe account loskoppelen</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {!publishableKey ? (
          <View style={styles.alertBox}>
            <Ionicons name="warning" size={18} color="#b45309" />
            <Text style={styles.alertText}>
              Geen Stripe publishable key gevonden. Voeg {`'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'`} toe aan je
              .env bestand en start de app opnieuw.
            </Text>
          </View>
        ) : null}

        {clientSecret && connectHtml ? (
          <View style={styles.webViewContainer}>
            <Text style={styles.webViewTitle}>Stripe onboarding</Text>
            <View style={styles.webViewWrapper}>
              <WebView
                key={webViewKey}
                ref={webViewRef}
                originWhitelist={['*']}
                onLoadEnd={() => setIsWebViewLoaded(true)}
                onMessage={handleWebViewMessage}
                source={{ html: connectHtml }}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.webViewLoadingText}>Stripe laden…</Text>
                  </View>
                )}
                javaScriptEnabled
                incognito
                style={styles.webView}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeTextSuccess: {
    color: '#16a34a',
  },
  statusBadgeTextPending: {
    color: '#b91c1c',
  },
  statusDescription: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  requirementsList: {
    gap: 8,
    marginTop: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  requirementText: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
  },
  refreshButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f8fbff',
  },
  refreshText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  webMessage: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertText: {
    flex: 1,
    color: '#92400e',
    fontSize: 14,
    lineHeight: 20,
  },
  webViewContainer: {
    gap: 12,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  webViewWrapper: {
    height: 520,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5f5',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  webViewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  webViewLoadingText: {
    color: '#334155',
    fontSize: 14,
  },
  closeButton: {
    padding: 6,
    borderRadius: 999,
  },
});







