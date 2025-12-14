import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../state/slices/settingsSlice';
import { RootState } from '../state/store';
import { LANGUAGES } from '../constants/languages';
import { useThemeColors } from '../hooks/useThemeColors';
import { StorageService } from '../services/storage';

interface LanguageSelectorProps {
  onLanguageChange?: (languageCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const dispatch = useDispatch();
  const theme = useThemeColors();
  const { i18n } = useTranslation();
  const currentLanguage = useSelector((state: RootState) => state.settings.settings.language || 'en');
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    // Update i18n
    await i18n.changeLanguage(languageCode);

    // Update Redux
    dispatch(setLanguage(languageCode));

    // Persist to storage
    try {
      const settings = StorageService.getSettings();
      StorageService.setSettings({ ...settings, language: languageCode });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }

    // Callback
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }

    // Close accordion
    toggleExpanded();
  };

  const getFlagImage = (code: string) => {
    const flagMap: { [key: string]: any } = {
      'en': require('../assets/icons/flags/en.png'),
      'zh': require('../assets/icons/flags/zh.png'),
      'ja': require('../assets/icons/flags/ja.png'),
      'ko': require('../assets/icons/flags/ko.png'),
      'de': require('../assets/icons/flags/de.png'),
      'fr': require('../assets/icons/flags/fr.png'),
      'es': require('../assets/icons/flags/es.png'),
      'pt-BR': require('../assets/icons/flags/pt-BR.png'),
      'ar': require('../assets/icons/flags/ar.png'),
      'ru': require('../assets/icons/flags/ru.png'),
      'it': require('../assets/icons/flags/it.png'),
      'nl': require('../assets/icons/flags/nl.png'),
      'tr': require('../assets/icons/flags/tr.png'),
      'th': require('../assets/icons/flags/th.png'),
      'vi': require('../assets/icons/flags/vi.png'),
      'id': require('../assets/icons/flags/id.png'),
      'pl': require('../assets/icons/flags/pl.png'),
      'uk': require('../assets/icons/flags/uk.png'),
      'hi': require('../assets/icons/flags/hi.png'),
      'he': require('../assets/icons/flags/he.png'),
      'sv': require('../assets/icons/flags/sv.png'),
      'no': require('../assets/icons/flags/no.png'),
      'da': require('../assets/icons/flags/da.png'),
      'fi': require('../assets/icons/flags/fi.png'),
      'cs': require('../assets/icons/flags/cs.png'),
      'hu': require('../assets/icons/flags/hu.png'),
      'ro': require('../assets/icons/flags/ro.png'),
      'el': require('../assets/icons/flags/el.png'),
      'ms': require('../assets/icons/flags/ms.png'),
      'fil': require('../assets/icons/flags/fil.png'),
    };
    return flagMap[code];
  };

  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage);
  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 600],
  });

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Selected Language Display */}
      <TouchableOpacity
        style={styles.selectedLanguageContainer}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.selectedLanguageContent}>
          <Image
            source={getFlagImage(currentLanguage)}
            style={styles.flagIcon}
          />
          <Text style={styles.selectedLanguageName}>
            {currentLang?.nativeName}
          </Text>
        </View>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Accordion List */}
      <Animated.View style={[styles.accordionContainer, { maxHeight }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {LANGUAGES.map((language) => {
            const isSelected = language.code === currentLanguage;
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  isSelected && styles.languageItemSelected,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
              >
                <Image
                  source={getFlagImage(language.code)}
                  style={styles.flagIcon}
                />
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                    {language.nativeName}
                  </Text>
                  <Text style={styles.languageEnglishName}>
                    {language.name}
                  </Text>
                </View>
                {isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectedLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedLanguageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagIcon: {
    width: 32,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  selectedLanguageName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  chevron: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 12,
  },
  accordionContainer: {
    overflow: 'hidden',
  },
  scrollView: {
    marginTop: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  languageItemSelected: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}10`,
  },
  languageInfo: {
    flex: 1,
    marginLeft: 0,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  languageEnglishName: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  checkmark: {
    fontSize: 20,
    color: theme.primary,
    fontWeight: '700',
    marginLeft: 12,
  },
});

export default LanguageSelector;
