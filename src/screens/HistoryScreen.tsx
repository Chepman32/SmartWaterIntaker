import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { RootState } from '../state/store';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  deleteIntakeEventAndPersist,
  logIntakeEvent,
} from '../state/slices/intakeSlice';
import DrinkTypeCarousel from '../components/DrinkTypeCarousel';
import { DrinkType } from '../types/models';
import { DRINK_TYPES } from '../constants/drinkTypes';

const MODAL_CAROUSEL_HEIGHT = 260;

const DRINK_TYPE_MAP = DRINK_TYPES.reduce<Record<string, DrinkType>>(
  (acc, type) => {
    acc[type.id] = type;
    return acc;
  },
  {},
);

interface AnimatedEventCardProps {
  event: any;
  theme: any;
  unit: string;
  convertAmount: (amount: number) => number;
  formatTime: (timestamp: number) => string;
  onDelete: (eventId: string) => void;
}

const AnimatedEventCard: React.FC<AnimatedEventCardProps> = ({
  event,
  theme,
  unit,
  convertAmount,
  formatTime,
  onDelete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleDelete = () => {
    setIsRemoving(true);
    // Animate out before deleting
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete(event.id);
    });
  };

  const styles = getStyles(theme, 0, 0);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View style={styles.eventCard}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventAmount}>
            {convertAmount(event.amountMl)} {unit}
          </Text>
          <Text style={styles.eventTime}>{formatTime(event.timestamp)}</Text>
          {event.drinkTypeId && (
            <Text style={styles.eventDrinkType}>
              Drink:{' '}
              {DRINK_TYPE_MAP[event.drinkTypeId]?.name ?? event.drinkTypeId}
            </Text>
          )}
          {event.containerId && (
            <Text style={styles.eventContainer}>
              Container: {event.containerId}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isRemoving}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const HistoryScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Container images
  const cupImage = require('../../assets/images/cup.png');
  const glassImage = require('../../assets/images/Glass.png');
  const bottleImage = require('../../assets/images/bottle.png');
  const tumblerImage = require('../../assets/images/tumbler.png');
  const pitcherImage = require('../../assets/images/pitcher.png');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const { width: screenWidth } = useWindowDimensions();
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType | null>(
    null,
  );
  const carouselAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const previousEventCount = useRef(0);
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  const isFirstProgressAnimation = useRef(true);

  const { events, dailyGoalMl } = useSelector(
    (state: RootState) => state.intake,
  );
  const { profile } = useSelector((state: RootState) => state.settings);
  const unit = profile.unit;

  // Filter events for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
    return eventDate === selectedDateStr;
  });

  // Calculate total intake for the day
  const totalIntake = dayEvents.reduce((sum, event) => sum + event.amountMl, 0);
  const progressPercent =
    dailyGoalMl > 0 ? Math.round((totalIntake / dailyGoalMl) * 100) : 0;

  // Convert ml to display unit
  const convertAmount = (amountMl: number) => {
    if (unit === 'oz') {
      return Math.round(amountMl * 0.033814 * 10) / 10; // Convert to oz with 1 decimal
    }
    return amountMl;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const containers = useSelector((state: RootState) => state.containers.items);
  const favoriteContainers = containers.filter(c => c.favorite);

  const handleDeleteEvent = (eventId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dispatch(deleteIntakeEventAndPersist(eventId, selectedDateStr));
  };

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (isFirstProgressAnimation.current) {
      const timer = setTimeout(() => {
        Animated.timing(progressBarWidth, {
          toValue: Math.min(progressPercent, 100),
          duration: 1200,
          useNativeDriver: false,
        }).start();
        isFirstProgressAnimation.current = false;
      }, 300);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(progressBarWidth, {
        toValue: Math.min(progressPercent, 100),
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [progressPercent, progressBarWidth]);

  const handleAddWater = () => {
    openAddModal();
  };

  const openAddModal = () => {
    carouselAnim.setValue(0);
    setSelectedDrinkType(null);
    setIsAddModalVisible(true);
    overlayAnim.setValue(0);
    slideAnim.setValue(600);
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
    ]).start();
  };

  const closeAddModal = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAddModalVisible(false);
      carouselAnim.setValue(0);
      setSelectedDrinkType(null);
    });
  };

  const handleContainerSelect = (container: any) => {
    // Create a timestamp for the selected date at current time
    const timestamp = new Date(selectedDate);
    timestamp.setHours(new Date().getHours());
    timestamp.setMinutes(new Date().getMinutes());
    timestamp.setSeconds(new Date().getSeconds());

    const notePrefix = selectedDrinkType ? `${selectedDrinkType.name} - ` : '';

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dispatch(
      logIntakeEvent({
        amountMl: container.sizeMl,
        source: 'container',
        containerId: container.id,
        timestamp: timestamp.getTime(),
        drinkTypeId: selectedDrinkType?.id,
        note: `${notePrefix}${container.name} (${container.sizeMl}ml)`,
      }),
    );

    closeAddModal();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    // Don't navigate or trigger haptic if trying to go to future
    if (direction === 'next' && isToday) {
      return;
    }

    // Trigger light haptic feedback
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    progressBarWidth.setValue(0);
    isFirstProgressAnimation.current = true;
    setSelectedDate(newDate);
  };

  const handleDrinkTypeSelect = (type: DrinkType) => {
    setSelectedDrinkType(type);
    Animated.timing(carouselAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleChangeDrinkType = () => {
    Animated.timing(carouselAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedDrinkType(null));
  };

  const translateDrinkCarousel = carouselAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -MODAL_CAROUSEL_HEIGHT],
  });

  const translateContainerCarousel = carouselAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MODAL_CAROUSEL_HEIGHT, 0],
  });

  const isToday = selectedDateStr === new Date().toISOString().split('T')[0];

  // Helper function to check if date is recent (within last week)
  const isRecentDate = () => {
    if (isToday) return true;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (selectedDateStr === yesterdayStr) return true;

    // Check if date is within last week (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return selectedDate > weekAgo && selectedDate < today;
  };

  // Helper function to format date display
  const getDateDisplayText = () => {
    if (isToday) return 'Today';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (selectedDateStr === yesterdayStr) return 'Yesterday';

    // Check if date is within last week (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (selectedDate > weekAgo && selectedDate < today) {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    }

    // For older dates, show the formatted date
    return selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const styles = getStyles(theme, insets.bottom, tabBarHeight);

  useLayoutEffect(() => {
    if (dayEvents.length !== previousEventCount.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      previousEventCount.current = dayEvents.length;
    }
  }, [dayEvents.length, selectedDateStr]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => navigateDate('prev')}
        >
          <Text style={styles.dateButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          {isRecentDate() ? (
            <>
              <Text style={styles.dateText}>{getDateDisplayText()}</Text>
              <Text style={styles.dateSubtext}>
                {selectedDate.toLocaleDateString('en-GB').split('/').join('.')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-GB').split('/').join('.')}
              </Text>
              <Text style={styles.dateSubtext}>{getDateDisplayText()}</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.dateButton, isToday && styles.dateButtonDisabled]}
          onPress={() => navigateDate('next')}
          disabled={isToday}
        >
          <Text
            style={[
              styles.dateButtonText,
              isToday && styles.dateButtonTextDisabled,
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Intake</Text>
          <Text style={styles.summaryValue}>
            {convertAmount(totalIntake)} {unit}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Daily Goal</Text>
          <Text style={styles.summaryValue}>
            {convertAmount(dailyGoalMl)} {unit}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressBarWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}% of goal</Text>
      </View>

      <View style={styles.listHeader}>
        <TouchableOpacity
          style={styles.inlineAddButton}
          onPress={handleAddWater}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
      >
        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No water logged for this day
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {isToday
                ? 'Start logging your water intake!'
                : 'No data available'}
            </Text>
          </View>
        ) : (
          dayEvents
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .map(event => (
              <AnimatedEventCard
                key={event.id}
                event={event}
                theme={theme}
                unit={unit}
                convertAmount={convertAmount}
                formatTime={formatTime}
                onDelete={handleDeleteEvent}
              />
            ))
        )}
      </ScrollView>

      {/* Add Water Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeAddModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}
            activeOpacity={1}
            onPress={closeAddModal}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalContentInner}
                activeOpacity={1}
                onPress={e => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Water Intake</Text>
                  <TouchableOpacity
                    onPress={closeAddModal}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalCarouselSwitcher}>
                  <Animated.View
                    style={[
                      styles.modalCarouselInner,
                      { transform: [{ translateY: translateDrinkCarousel }] },
                    ]}
                    pointerEvents={selectedDrinkType ? 'none' : 'auto'}
                  >
                    <DrinkTypeCarousel
                      textColor={theme.text}
                      subtitleColor={theme.textSecondary}
                      onSelect={handleDrinkTypeSelect}
                      selectedDrinkTypeId={selectedDrinkType?.id}
                    />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.modalCarouselInner,
                      {
                        transform: [{ translateY: translateContainerCarousel }],
                      },
                    ]}
                    pointerEvents={selectedDrinkType ? 'auto' : 'none'}
                  >
                    {selectedDrinkType && (
                      <View style={styles.selectedDrinkHeader}>
                        <View>
                          <Text style={styles.selectedDrinkLabel}>
                            Selected drink
                          </Text>
                          <Text
                            style={[
                              styles.selectedDrinkName,
                              { color: selectedDrinkType.color },
                            ]}
                          >
                            {selectedDrinkType.name}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={handleChangeDrinkType}>
                          <Text
                            style={[
                              styles.changeTypeText,
                              { color: selectedDrinkType.color },
                            ]}
                          >
                            Change
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.modalScrollContent}
                    >
                      {favoriteContainers.map(container => (
                        <TouchableOpacity
                          key={container.id}
                          style={[
                            styles.modalContainerItem,
                            {
                              backgroundColor: container.color + '20',
                              borderColor: container.color,
                            },
                          ]}
                          onPress={() => handleContainerSelect(container)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.modalIconContainer,
                              { backgroundColor: container.color },
                            ]}
                          >
                            {container.id?.startsWith('cup') ||
                            container.name === 'Cup' ? (
                              <Image
                                source={cupImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('glass') ||
                              container.name === 'Glass' ? (
                              <Image
                                source={glassImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('bottle') ||
                              container.name === 'Bottle' ||
                              container.name === 'Water Bottle' ? (
                              <Image
                                source={bottleImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('tumbler') ||
                              container.name === 'Tumbler' ? (
                              <Image
                                source={tumblerImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('pitcher') ||
                              container.name === 'Pitcher' ? (
                              <Image
                                source={pitcherImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Text style={styles.modalIconText}>
                                {container.icon}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.modalContainerName,
                              { color: theme.text },
                            ]}
                            numberOfLines={1}
                          >
                            {container.name}
                          </Text>
                          <Text
                            style={[
                              styles.modalContainerSize,
                              { color: theme.text },
                            ]}
                          >
                            {container.sizeMl}ml
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (
  theme: any,
  bottomInset: number = 0,
  tabBarHeight: number = 0,
) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
    },
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.card,
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 12,
    },
    dateButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateButtonDisabled: {
      backgroundColor: theme.border,
    },
    dateButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
    },
    dateButtonTextDisabled: {
      color: theme.textSecondary,
    },
    dateContainer: {
      alignItems: 'center',
    },
    dateText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    dateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    summaryCard: {
      backgroundColor: theme.card,
      marginHorizontal: 20,
      marginTop: 16,
      padding: 20,
      borderRadius: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      marginVertical: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    eventsList: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    eventsContent: {
      paddingBottom: Math.max(bottomInset + tabBarHeight + 20, 60),
    },
    eventCard: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventInfo: {
      flex: 1,
    },
    eventAmount: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    eventTime: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    eventContainer: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.error || '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textSecondary,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    addButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    addButtonText: {
      fontSize: 28,
      fontWeight: '400',
      color: '#FFFFFF',
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 12,
    },
    inlineAddButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Math.max(bottomInset, 20),
      marginBottom: tabBarHeight,
      minHeight: 300,
    },
    modalContentInner: {},
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 24,
      fontWeight: '300',
      color: theme.text,
    },
    modalCarouselSwitcher: {
      height: MODAL_CAROUSEL_HEIGHT,
      position: 'relative',
      overflow: 'hidden',
    },
    modalCarouselInner: {
      position: 'absolute',
      width: '100%',
      top: 0,
    },
    modalScrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      gap: 12,
    },
    selectedDrinkHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    selectedDrinkLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    selectedDrinkName: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 4,
    },
    changeTypeText: {
      fontSize: 14,
      fontWeight: '500',
    },
    modalContainerItem: {
      width: 160,
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    modalIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    modalIconText: {
      fontSize: 36,
    },
    modalIconImage: {
      width: 48,
      height: 48,
    },
    modalContainerName: {
      fontSize: 18,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 4,
    },
    modalContainerSize: {
      fontSize: 16,
      opacity: 0.7,
      textAlign: 'center',
    },
    eventDrinkType: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
  });
};

export default HistoryScreen;
