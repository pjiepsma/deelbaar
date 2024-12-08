import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-ui-datepicker';
interface BirthdateInputProps {
  birthdate: Date;
  setBirthdate: (date: Date) => void;
}

const BirthdateInput: React.FC<BirthdateInputProps> = ({
  birthdate,
  setBirthdate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        value={birthdate.toDateString()}
        editable={false}
        style={styles.inputField}
      />
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.iconContainer}>
        <Ionicons name="calendar" size={24} color="black" />
      </TouchableOpacity>
      <Modal
        transparent={true}
        visible={showDatePicker}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <DateTimePicker
            mode="single"
            date={birthdate}
            onChange={params => {
              if (params.date) {
                setBirthdate(new Date(params.date as string));
              }
              setShowDatePicker(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
  },
  inputField: {
    flex: 1,
    height: 40,
  },
  iconContainer: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
});

export default BirthdateInput;
