import { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Colors from '~/constants/Colors';

interface EmailVerificationInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function EmailVerificationInput({
  value,
  onChange,
  error,
  disabled = false
}: EmailVerificationInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');

    if (digit.length > 0) {
      // Update the value at this position
      const newValue = value.split('');
      newValue[index] = digit;
      const updatedValue = newValue.join('');
      onChange(updatedValue);

      // Auto-focus next input
      if (index < 5 && digit.length === 1) {
        inputsRef.current[index + 1]?.focus();
      }
    } else if (text === '') {
      // Handle backspace
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));

      // Focus previous input on backspace
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Clear the current input when focused if it has a value (allows re-entry)
    const currentValue = value[index] || '';
    if (currentValue) {
      setTimeout(() => {
        inputsRef.current[index]?.setNativeProps({ text: '' });
      }, 10);
    }
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  // Auto-focus first input on mount
  useEffect(() => {
    if (!disabled) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [disabled]);

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref)}
            style={[
              styles.input,
              focusedIndex === index && styles.inputFocused,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            value={value[index] || ''}
            onChangeText={(text) => handleChange(text, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={1}
            editable={!disabled}
            selectTextOnFocus
            autoComplete="one-time-code"
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: '#fafafa',
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});









