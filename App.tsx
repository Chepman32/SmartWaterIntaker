import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { store } from './src/state/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useDispatch } from 'react-redux';
import { initIntakeFromStorage } from './src/state/slices/intakeSlice';
import i18n from './src/i18n';

function AppContent() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initIntakeFromStorage());
  }, [dispatch]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
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
