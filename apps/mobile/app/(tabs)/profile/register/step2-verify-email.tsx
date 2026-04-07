import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StepContainer from '~/components/StepContainer';
import EmailVerificationInput from '~/components/EmailVerificationInput';
import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';

export default function Step2VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const password = params.password as string;

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Start cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Voer een geldige 6-cijferige code in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await payloadClient.verifyEmail(verificationCode);

      if (verifyError) {
        setError(verifyError.message || 'Verificatie mislukt. Controleer de code en probeer opnieuw.');
        return;
      }

      // Email verified successfully, proceed to address step
      router.push({
        pathname: '/(tabs)/profile/register/step3-address',
        params: {
          email,
          password,
        },
      });
    } catch (error) {
      console.error('Verification error:', error);
      setError('Er ging iets mis bij de verificatie. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError(null);

    try {
      // For now, use forgot-password as a workaround to resend verification
      // In a production app, you might want to implement a proper resend endpoint
      const { error: resendError } = await payloadClient.forgotPassword(email);

      if (resendError) {
        Alert.alert('Fout', resendError.message || 'Er ging iets mis bij het versturen van de email.');
        return;
      }

      // Start 60 second cooldown
      setResendCooldown(60);
      Alert.alert('Email verzonden', 'Er is een nieuwe verificatie email naar je emailadres gestuurd.');
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het versturen van de email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const stepLabels = [
    'Account aanmaken',
    'Email verifiëren',
    'Adresgegevens',
    'Profiel instellen'
  ];

  return (
    <StepContainer
      title="Email verifiëren"
      subtitle={`We hebben een verificatiecode gestuurd naar ${email}`}
      currentStep={2}
      totalSteps={4}
      stepLabels={stepLabels}
      onBack={handleBack}
      nextButton={{
        title: 'Verifiëren',
        onPress: handleVerify,
        loading,
        disabled: loading || verificationCode.length !== 6,
      }}
    >
      <View style={styles.content}>
        <View style={styles.emailInfo}>
          <Ionicons name="mail-outline" size={48} color={Colors.primary} />
          <Text style={styles.emailText}>
            Verificatiecode verzonden naar:
          </Text>
          <Text style={styles.emailAddress}>{email}</Text>
        </View>

        <View style={styles.verificationSection}>
          <Text style={styles.instructionText}>
            Voer de 6-cijferige code in die je per email hebt ontvangen:
          </Text>

          <EmailVerificationInput
            value={verificationCode}
            onChange={setVerificationCode}
            error={error || undefined}
            disabled={loading}
          />
        </View>

        <View style={styles.resendSection}>
          <Text style={styles.resendText}>
            Geen email ontvangen?
          </Text>
          <TouchableOpacity
            style={[
              styles.resendButton,
              (resendLoading || resendCooldown > 0) && styles.resendButtonDisabled,
            ]}
            onPress={handleResendCode}
            disabled={resendLoading || resendCooldown > 0}
          >
            <Text style={styles.resendButtonText}>
              {resendLoading
                ? 'Bezig met verzenden...'
                : resendCooldown > 0
                ? `Opnieuw verzenden (${resendCooldown}s)`
                : 'Code opnieuw verzenden'
              }
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Hulp nodig?</Text>
          <Text style={styles.helpText}>
            Controleer je spamfolder als je de email niet kunt vinden.
            De code verloopt over 24 uur.
          </Text>
        </View>
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 24,
  },
  emailInfo: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  emailText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emailAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  verificationSection: {
    alignItems: 'center',
    gap: 16,
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
  resendSection: {
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  helpSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
