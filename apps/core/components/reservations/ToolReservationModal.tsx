import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';

interface ToolReservationModalProps {
  toolId: string;
  toolName: string;
  toolDescription?: string;
  usageInstructions?: string;
  onClose: () => void;
  onReserve: (reservationData: {
    toolId: string;
    startDate: Date;
    duration: number; // in hours
    notes?: string;
  }) => void;
}

export default function ToolReservationModal({
  toolId,
  toolName,
  toolDescription,
  usageInstructions,
  onClose,
  onReserve,
}: ToolReservationModalProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(new Date());
  const [duration, setDuration] = useState(1); // default 1 hour
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  const isLoggedIn = !!user;

  const handleReserve = async () => {
    if (!isLoggedIn) {
      Alert.alert('Inloggen vereist', 'Log in om gereedschap te reserveren.');
      return;
    }

    if (startDate < new Date()) {
      Alert.alert('Ongeldige datum', 'Kies een tijdstip in de toekomst.');
      return;
    }

    setIsReserving(true);

    try {
      await onReserve({
        toolId,
        startDate,
        duration,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Reservatie bevestigd! 🔧',
        `Je hebt "${toolName}" gereserveerd voor ${startDate.toLocaleDateString('nl-NL')} om ${startDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} voor ${duration} uur.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Fout', 'Kon reservatie niet maken. Probeer het opnieuw.');
    } finally {
      setIsReserving(false);
    }
  };

  const durationOptions = [1, 2, 3, 4, 6, 8]; // in hours

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reservatie vereist</Text>
        </View>

        <View style={styles.loginRequired}>
          <Ionicons name="log-in-outline" size={48} color="#d1d5db" />
          <Text style={styles.loginTitle}>Log in om te reserveren</Text>
          <Text style={styles.loginDescription}>
            Maak een account aan om gereedschap te reserveren bij dit Repair Café.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservatie maken</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toolInfo}>
          <Text style={styles.toolTitle}>{toolName}</Text>
          {toolDescription && <Text style={styles.toolDescription}>{toolDescription}</Text>}
          {usageInstructions && (
            <View style={styles.instructionsBox}>
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
              <Text style={styles.instructionsText}>{usageInstructions}</Text>
            </View>
          )}
        </View>

        <View style={styles.reservationForm}>
          <Text style={styles.sectionTitle}>📅 Kies tijdstip</Text>

          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateButtonText}>
              {startDate.toLocaleDateString('nl-NL')} om{' '}
              {startDate.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          <Text style={styles.sectionTitle}>⏱️ Kies duur</Text>
          <View style={styles.durationOptions}>
            {durationOptions.map((hours) => (
              <TouchableOpacity
                key={hours}
                style={[styles.durationButton, duration === hours && styles.durationButtonActive]}
                onPress={() => setDuration(hours)}>
                <Text
                  style={[
                    styles.durationButtonText,
                    duration === hours && styles.durationButtonTextActive,
                  ]}>
                  {hours}u
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>📝 Extra informatie (optioneel)</Text>
          <Text style={styles.notesDescription}>
            Laat weten waarvoor je het gereedschap nodig hebt, zodat het Repair Café zich kan
            voorbereiden.
          </Text>

          <TouchableOpacity
            style={styles.reserveButton}
            onPress={handleReserve}
            disabled={isReserving}>
            {isReserving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.reserveButtonText}>Reserveer voor €{duration * 2},00</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  toolInfo: {
    paddingVertical: 20,
  },
  toolTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  reservationForm: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    minWidth: 60,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  notesDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 24,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
