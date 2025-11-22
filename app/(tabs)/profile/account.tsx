import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useOnboarding } from '~/lib/providers/OnboardingProvider';
import { usePendingApprovalsCount } from '~/lib/hooks/useProductOfferings';
import { NotificationBadge } from '~/components/NotificationBadge';

type AccountLink = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  badgeCount?: number;
};

const profileLinks: AccountLink[] = [
  {
    label: 'Persoonlijke gegevens',
    description: 'Beheer naam, adres en profielfoto',
    icon: 'person-circle-outline',
    href: '/(tabs)/profile/personal-details',
  },
  {
    label: 'Inloggegevens',
    description: 'Wijzig je wachtwoord of herstelopties',
    icon: 'lock-closed-outline',
    href: '/(tabs)/profile/login-settings',
  },
];

const notificationLinks: AccountLink[] = [
  {
    label: 'E-mail instellingen',
    description: 'Bepaal welke updates je per mail krijgt',
    icon: 'mail-outline',
    href: '/(tabs)/profile/email-settings',
  },
  {
    label: 'Pushmeldingen',
    description: 'Kies welke meldingen je ontvangt',
    icon: 'notifications-outline',
    href: '/(tabs)/profile/push-settings',
  },
];

const supportLinks: AccountLink[] = [
  {
    label: 'Veelgestelde vragen',
    description: 'Lees antwoorden op populaire vragen',
    icon: 'help-circle-outline',
    href: '/(tabs)/profile/faq',
  },
  {
    label: 'App introductie',
    description: 'Bekijk opnieuw hoe de app werkt',
    icon: 'school-outline',
    href: 'onboarding',
  },
  {
    label: 'Voorwaarden & beleid',
    description: 'Bekijk de communityregels en privacy',
    icon: 'document-text-outline',
    href: '/(tabs)/profile/terms',
  },
];

const getExtrasLinks = (pendingApprovalsCount: number): AccountLink[] => [
  {
    label: 'Goedkeuringen',
    description: 'Beoordeel community inzendingen voor je kasten',
    icon: 'checkmark-circle-outline',
    href: '/(tabs)/my-home',
    badgeCount: pendingApprovalsCount,
  },
  {
    label: 'Boek wensen',
    description: 'Bekijk gemeenschappelijke wensen en beheer je eigen wensen',
    icon: 'heart-outline',
    href: '/(tabs)/wishlist',
  },
  {
    label: 'Statistieken',
    description: 'Inzicht in views en bijdragen (binnenkort)',
    icon: 'bar-chart-outline',
    href: '/(tabs)/profile/stats',
  },
  {
    label: 'Admin tools',
    description: 'Moderatie en beheer voor admins',
    icon: 'construct-outline',
    href: '/(tabs)/profile/admin',
  },
  {
    label: 'Beheer mijn listings',
    description: 'Pas je eigen locaties aan',
    icon: 'create-outline',
    href: '/(tabs)/profile/manage-listings',
  },
];

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { startOnboarding } = useOnboarding();
  const { data: pendingApprovalsCount } = usePendingApprovalsCount();

  const navigate = (href: string) => {
    if (href === 'onboarding') {
      startOnboarding();
    } else {
      router.push(href);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>
            {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'D'}
          </Text>
        </View>
        <Text style={styles.greeting}>Welkom terug</Text>
        <Text style={styles.subtitle}>{user?.email ?? 'gast gebruiker'}</Text>
      </View>

      <AccountSection title="Profiel" links={profileLinks} onNavigate={navigate} />
      <AccountSection title="Meldingen" links={notificationLinks} onNavigate={navigate} />
      <AccountSection title="Support" links={supportLinks} onNavigate={navigate} />
      <AccountSection title="Extra" links={getExtrasLinks(pendingApprovalsCount || 0)} onNavigate={navigate} />

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Log uit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function AccountSection({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: AccountLink[];
  onNavigate: (href: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {links.map((item) => (
        <TouchableOpacity key={item.href} style={styles.cardRow} onPress={() => onNavigate(item.href)}>
          <View style={styles.rowLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
              {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                <NotificationBadge count={item.badgeCount} size="small" />
              ) : null}
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDescription}>{item.description}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d9ddc2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1d4a6c',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
  },
  rowTextContainer: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  rowDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f87171',
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

