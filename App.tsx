import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { store } from './src/state/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useDispatch } from 'react-redux';
import { initIntakeFromStorage } from './src/state/slices/intakeSlice';
import { selectOnboardingCompleted } from './src/state/slices/settingsSlice';
import i18n from './src/i18n';
import AnimatedSplashScreen from './src/screens/AnimatedSplashScreen';

function AppContent() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useDispatch();
  const [showSplash, setShowSplash] = useState(true);
  const onboardingCompleted = useSelector(selectOnboardingCompleted);

  useEffect(() => {
    dispatch(initIntakeFromStorage());
  }, [dispatch]);

  if (showSplash) {
    return (
      <AnimatedSplashScreen onAnimationComplete={() => setShowSplash(false)} />
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator
        initialRoute={onboardingCompleted ? 'MainTabs' : 'UnitsScreen'}
      />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </I18nextProvider>
    </Provider>
  );
}

export default App;
