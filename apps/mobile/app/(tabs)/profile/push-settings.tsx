import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';
import { payloadClient } from '~/lib/api/PayloadClient';

type PushPreferences = {
  marketing: boolean;
  communityAlerts: boolean;
  listingActivity: boolean;
  deviceRegistered: boolean;
};

const DEFAULT_PUSH_PREFS: PushPreferences = {
  marketing: false,
  communityAlerts: true,
  listingActivity: true,
  deviceRegistered: false,
};

export default function PushSettingsScreen() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PushPreferences>(DEFAULT_PUSH_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await payloadClient.findById('users', user.id, 0);
        if (!error && data?.pushPreferences) {
          setPrefs({
            ...DEFAULT_PUSH_PREFS,
            ...data.pushPreferences,
          });
        }
      } catch (error) {
        console.warn('[PushSettings] Failed to load preferences', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const toggle = (key: keyof PushPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await payloadClient.update('users', user.id, {
        pushPreferences: prefs,
      });
      if (error) {
        throw new Error(error.message || 'Kon pushmeldingen niet opslaan.');
      }
      Alert.alert('Opgeslagen', 'Je pushinstellingen zijn bijgewerkt.');
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
      <Text style={styles.heading}>Pushmeldingen</Text>
      <Text style={styles.description}>
        Pas je notificaties aan. Voor pushmeldingen via de app moet het toestel geregistreerd zijn. We werken aan een
        nieuwe opt-in flow; tot die tijd kun je hieronder alvast aangeven welke notificaties je wilt ontvangen wanneer
        push beschikbaar is.
      </Text>

      <PreferenceRow
        title="Community alerts"
        description="Pushmeldingen bij nieuwe items in jouw buurt of reacties op jouw posts."
        value={prefs.communityAlerts}
        onValueChange={() => toggle('communityAlerts')}
      />

      <PreferenceRow
        title="Mijn listings"
        description="Krijg een notificatie als iemand een review schrijft of een foto instuurt."
        value={prefs.listingActivity}
        onValueChange={() => toggle('listingActivity')}
      />

      <PreferenceRow
        title="Nieuws & campagnes"
        description="Af en toe een update over nieuwe features of events."
        value={prefs.marketing}
        onValueChange={() => toggle('marketing')}
      />

      <PreferenceRow
        title="Toestel geregistreerd"
        description="Deelbaar kan pushmeldingen versturen naar dit device."
        value={prefs.deviceRegistered}
        disabled
      />

      <View style={styles.saveBar}>
        <Text style={styles.saveHint}>Opslaan synchroniseert je voorkeuren met de server.</Text>
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
        trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
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



