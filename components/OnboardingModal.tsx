import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';

import Colors from '~/constants/Colors';
import { useOnboarding, OnboardingStep } from '~/lib/providers/OnboardingProvider';

const { width, height } = Dimensions.get('window');

interface OnboardingStepData {
  title: string;
  description: string;
  icon: string;
  highlight?: string;
}

const onboardingSteps: Record<OnboardingStep, OnboardingStepData> = {
  welcome: {
    title: 'Welkom bij Deelbaar! 🎉',
    description:
      'Ontdek buurtkasten - speciale kastjes op straat waar iedereen gratis spullen kan nemen of brengen. Van boeken tot voedsel, altijd toegankelijk voor iedereen in de buurt.',
    icon: 'business',
  },
  explore: {
    title: 'Verken kasten op de kaart',
    description:
      'Bekijk de kaart om kasten in jouw buurt te vinden. Tik op een kast om te zien wat erin zit en hoe je er komt.',
    icon: 'map',
    highlight: 'Zoeken tab',
  },
  filter: {
    title: 'Filter op wat je nodig hebt',
    description:
      'Gebruik slimme filters om precies de juiste kast te vinden. Zoek op type (boeken, voedsel), voorzieningen (rolstoeltoegankelijk) of locatie (bij OV).',
    icon: 'filter',
    highlight: 'Filters uitproberen',
  },
  contribute: {
    title: 'Draag bij aan de gemeenschap',
    description:
      'Zet spullen in een kast of neem wat je nodig hebt. Voeg foto\'s toe om anderen te helpen, of registreer een nieuwe kast in jouw buurt.',
    icon: 'people',
  },
  account: {
    title: 'Maak een account aan',
    description:
      'Met een account kun je kasten beheren, favorieten bewaren en bijdragen aan de gemeenschap. Het is gratis en neemt maar een minuutje!',
    icon: 'person-add',
  },
  complete: {
    title: 'Start je ontdekking! 🚀',
    description:
      'Je bent er klaar voor! Verken de kasten in jouw buurt, draag bij waar je kunt, en help mee aan een betere buurt voor iedereen.',
    icon: 'checkmark-circle',
  },
};

export default function OnboardingModal() {
  const { state, nextStep, skipOnboarding, completeOnboarding } = useOnboarding();
  const router = useRouter();
  const isVisible = !!state.currentStep;
  const currentStep = state.currentStep;

  if (!isVisible || !currentStep) return null;

  const stepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === 'complete';

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  const handleCreateAccount = () => {
    // Skip onboarding and navigate to auth
    skipOnboarding();
    router.push('/(tabs)/profile');
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Overslaan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={stepData.icon as any} size={80} color={Colors.primary} />
            </View>

            <Text style={styles.title}>{stepData.title}</Text>
            <Text style={styles.description}>{stepData.description}</Text>

            {/* Special interactive element for welcome step - show cabinet types */}
            {currentStep === 'welcome' && (
              <View style={styles.cabinetTypes}>
                <Text style={styles.cabinetTypesTitle}>Wat vind je in kasten?</Text>
                <View style={styles.cabinetGrid}>
                  <View style={styles.cabinetType}>
                    <View style={[styles.cabinetIcon, { backgroundColor: '#3B82F6' }]}>
                      <Ionicons name="library" size={20} color="#fff" />
                    </View>
                    <Text style={styles.cabinetTypeText}>Boeken</Text>
                  </View>
                  <View style={styles.cabinetType}>
                    <View style={[styles.cabinetIcon, { backgroundColor: '#EF4444' }]}>
                      <Ionicons name="storefront" size={20} color="#fff" />
                    </View>
                    <Text style={styles.cabinetTypeText}>Voedsel</Text>
                  </View>
                  <View style={styles.cabinetType}>
                    <View style={[styles.cabinetIcon, { backgroundColor: '#EC4899' }]}>
                      <Ionicons name="medical" size={20} color="#fff" />
                    </View>
                    <Text style={styles.cabinetTypeText}>Hygiëne</Text>
                  </View>
                  <View style={styles.cabinetType}>
                    <View style={[styles.cabinetIcon, { backgroundColor: '#22C55E' }]}>
                      <Ionicons name="restaurant" size={20} color="#fff" />
                    </View>
                    <Text style={styles.cabinetTypeText}>Gemeenschap</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Special interactive element for filter step */}
            {currentStep === 'filter' && (
              <View style={styles.filterDemo}>
                <Text style={styles.filterDemoTitle}>Voorbeeld filters:</Text>
                <View style={styles.filterChips}>
                  <View style={styles.demoChip}>
                    <Ionicons name="library" size={14} color={Colors.primary} />
                    <Text style={styles.demoChipText}>Boekenkast</Text>
                  </View>
                  <View style={styles.demoChip}>
                    <Ionicons name="accessibility-outline" size={14} color="#22C55E" />
                    <Text style={styles.demoChipText}>Rolstoeltoegankelijk</Text>
                  </View>
                  <View style={styles.demoChip}>
                    <Ionicons name="bus-outline" size={14} color="#F59E0B" />
                    <Text style={styles.demoChipText}>Bij OV</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Special element for account step */}
            {currentStep === 'account' && (
              <View style={styles.accountPrompt}>
                <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
                <Text style={styles.accountPromptText}>
                  Gratis account • Geen spam • Alleen voor kast beheer
                </Text>
                <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.createAccountButtonText}>Account aanmaken</Text>
                </TouchableOpacity>
              </View>
            )}

            {stepData.highlight && (
              <View style={styles.highlightContainer}>
                <Ionicons name="information-circle" size={16} color={Colors.primary} />
                <Text style={styles.highlightText}>💡 {stepData.highlight}</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.progressContainer}>
              {Object.keys(onboardingSteps).map((step, index) => (
                <View
                  key={step}
                  style={[styles.progressDot, currentStep === step && styles.progressDotActive]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>{isLastStep ? 'Aan de slag!' : 'Volgende'}</Text>
              {!isLastStep && <Ionicons name="chevron-forward" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    minHeight: height * 0.6,
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: '#64748b',
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 50,
    backgroundColor: '#f0f9ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  highlightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  highlightText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cabinetTypes: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cabinetTypesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  cabinetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  cabinetType: {
    alignItems: 'center',
    minWidth: 60,
  },
  cabinetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cabinetTypeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterDemo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterDemoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  accountPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  accountPromptText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
    flex: 1,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    marginTop: 12,
  },
  createAccountButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
