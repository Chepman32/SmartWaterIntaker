import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { RootState } from '../state/store';
import { addEvent } from '../state/slices/intakeSlice';
import { IntakeEvent, Container } from '../types/models';
import { Colors } from '../constants/colors';

interface WaterLoggingBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function WaterLoggingBottomSheet({
  isVisible,
  onClose,
}: WaterLoggingBottomSheetProps) {
  const dispatch = useDispatch();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const hapticsEnabled = useSelector((state: RootState) => state.settings.settings.haptics);
  
  const containers = useSelector((state: RootState) => state.containers.items);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleLog = useCallback(() => {
    const amount = selectedContainer ? selectedContainer.sizeMl : parseInt(customAmount) || 0;
    
    if (amount <= 0) return;

    const intakeEvent: IntakeEvent = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl: amount,
      source: selectedContainer ? 'container' : 'custom',
      containerId: selectedContainer?.id,
      note: note.trim() || undefined,
    };

    dispatch(addEvent(intakeEvent));
    if (hapticsEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    
    // Reset form
    setSelectedContainer(null);
    setCustomAmount('');
    setNote('');
    onClose();
  }, [selectedContainer, customAmount, note, dispatch, onClose]);

  const quickAmounts = [100, 150, 200, 250, 300, 400, 500, 750];

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
    >
      <BottomSheetView style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>Log Water Intake</Text>
        
        {/* Container Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Container</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerScroll}>
            {containers.map((container) => (
              <TouchableOpacity
                key={container.id}
                style={[
                  styles.containerOption,
                  {
                    backgroundColor: selectedContainer?.id === container.id 
                      ? container.color + '40' 
                      : theme.background,
                    borderColor: selectedContainer?.id === container.id 
                      ? container.color 
                      : theme.border,
                  }
                ]}
                onPress={() => setSelectedContainer(container)}
              >
                <View style={[styles.containerIcon, { backgroundColor: container.color }]}>
                  <Text style={styles.containerIconText}>{container.icon}</Text>
                </View>
                <Text style={[styles.containerName, { color: theme.text }]} numberOfLines={1}>
                  {container.name}
                </Text>
                <Text style={[styles.containerSize, { color: theme.textSecondary }]}>
                  {container.sizeMl}ml
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Custom Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Or Enter Custom Amount</Text>
          <View style={styles.customAmountContainer}>
            <TextInput
              style={[
                styles.customAmountInput,
                { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                }
              ]}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Enter amount"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              onFocus={() => setSelectedContainer(null)}
            />
            <Text style={[styles.unitLabel, { color: theme.text }]}>ml</Text>
          </View>
          
          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountsContainer}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickAmountButton,
                  { 
                    backgroundColor: customAmount === amount.toString() 
                      ? theme.primary + '40' 
                      : theme.background,
                    borderColor: customAmount === amount.toString() 
                      ? theme.primary 
                      : theme.border,
                  }
                ]}
                onPress={() => {
                  setCustomAmount(amount.toString());
                  setSelectedContainer(null);
                }}
              >
                <Text style={[styles.quickAmountText, { color: theme.text }]}>{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Note (Optional)</Text>
          <TextInput
            style={[
              styles.noteInput,
              { 
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              }
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note about this intake..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Log Button */}
        <TouchableOpacity
          style={[
            styles.logButton,
            { 
              backgroundColor: theme.primary,
              opacity: (selectedContainer || (customAmount && parseInt(customAmount) > 0)) ? 1 : 0.5,
            }
          ]}
          onPress={handleLog}
          disabled={!selectedContainer && (!customAmount || parseInt(customAmount) <= 0)}
        >
          <Text style={styles.logButtonText}>
            Log {selectedContainer ? `${selectedContainer.sizeMl}ml` : customAmount ? `${customAmount}ml` : '0ml'}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  containerScroll: {
    flexGrow: 0,
  },
  containerOption: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginRight: 12,
  },
  containerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  containerIconText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  containerName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  containerSize: {
    fontSize: 10,
    textAlign: 'center',
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customAmountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noteInput: {
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  logButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});