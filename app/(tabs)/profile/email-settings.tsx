import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';
import { payloadClient } from '~/lib/api/PayloadClient';

type EmailPreferences = {
  newsletter: boolean;
  communityDigest: boolean;
  listingUpdates: boolean;
  systemAlerts: boolean;
};

const DEFAULT_PREFS: EmailPreferences = {
  newsletter: false,
  communityDigest: true,
  listingUpdates: true,
  systemAlerts: true,
};

export default function EmailSettingsScreen() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<EmailPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await payloadClient.findById('users', user.id, 0);
        if (!error && data?.emailPreferences) {
          setPrefs({
            ...DEFAULT_PREFS,
            ...data.emailPreferences,
          });
        }
      } catch (error) {
        console.warn('[EmailSettings] Failed to load preferences', error);
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, [user?.id]);

  const toggle = (key: keyof EmailPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await payloadClient.update('users', user.id, {
        emailPreferences: prefs,
      });
      if (error) {
        throw new Error(error.message || 'Kon voorkeuren niet opslaan.');
      }
      Alert.alert('Opgeslagen', 'Je e-mailvoorkeuren zijn bijgewerkt.');
    } catch (error: any) {
      Alert.alert('Fout', error.message || 'Er ging iets mis tijdens het opslaan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>E-mail instellingen</Text>
      <Text style={styles.description}>
        Kies welke e-mails je van Deelbaar ontvangt. Systeemmeldingen bevatten belangrijke serviceberichten en blijven
        ingeschakeld.
      </Text>

      <PreferenceRow
        title="Nieuwsbrief"
        description="Handige tips, nieuwe features en evenementen in je inbox."
        value={prefs.newsletter}
        onValueChange={() => toggle('newsletter')}
      />

      <PreferenceRow
        title="Community overzicht"
        description="Wekelijkse updates over nieuwe listings en activiteiten in je buurt."
        value={prefs.communityDigest}
        onValueChange={() => toggle('communityDigest')}
      />

      <PreferenceRow
        title="Mijn listings"
        description="E-mails wanneer iemand foto’s instuurt of een review schrijft."
        value={prefs.listingUpdates}
        onValueChange={() => toggle('listingUpdates')}
      />

      <PreferenceRow
        title="Systeemberichten"
        description="Essentiële meldingen over je account en beveiliging. Altijd aan."
        value={true}
        disabled
      />

      <View style={styles.saveBar}>
        <Text style={styles.saveHint}>Wijzigingen worden pas toegepast na opslaan.</Text>
        <View style={styles.actions}>
          <View style={[styles.button, saving && styles.buttonDisabled]}>
            <Text style={styles.buttonText} onPress={handleSave}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function PreferenceRow({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        thumbColor={value ? Colors.primary : '#f3f4f6'}
        trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4a6c',
  },
  description: {
    color: '#475569',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rowDescription: {
    color: '#64748b',
    fontSize: 13,
  },
  saveBar: {
    marginTop: 24,
    gap: 10,
  },
  saveHint: {
    color: '#94a3b8',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


