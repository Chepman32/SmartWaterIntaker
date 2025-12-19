import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors } from '../hooks/useThemeColors';
import DeviceInfo from 'react-native-device-info';

interface Citation {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
}

const AboutScreen: React.FC = () => {
  const theme = useThemeColors();
  const { t } = useTranslation();

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  const citations: Citation[] = [
    {
      id: 'base-intake',
      title: t('about.citations.baseIntake.title'),
      description: t('about.citations.baseIntake.description'),
      source: 'European Food Safety Authority (EFSA)',
      url: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459',
    },
    {
      id: 'activity-adjustment',
      title: t('about.citations.activityAdjustment.title'),
      description: t('about.citations.activityAdjustment.description'),
      source: 'American College of Sports Medicine',
      url: 'https://www.acsm.org/docs/default-source/files-for-resource-library/exercise-and-fluid-replacement.pdf',
    },
    {
      id: 'climate-adjustment',
      title: t('about.citations.climateAdjustment.title'),
      description: t('about.citations.climateAdjustment.description'),
      source: 'National Academies of Sciences',
      url: 'https://nap.nationalacademies.org/catalog/10925/dietary-reference-intakes-for-water-potassium-sodium-chloride-and-sulfate',
    },
    {
      id: 'health-benefits',
      title: t('about.citations.healthBenefits.title'),
      description: t('about.citations.healthBenefits.description'),
      source: 'Mayo Clinic',
      url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256',
    },
  ];

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={[styles.appIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.appIconText}>💧</Text>
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Hydramo</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
            {t('about.version')} {appVersion} ({buildNumber})
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimerCard, { backgroundColor: theme.card }]}>
          <Icon name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            {t('about.disclaimer')}
          </Text>
        </View>

        {/* Medical Citations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('about.medicalCitations')}
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
          >
            {t('about.citationsSubtitle')}
          </Text>

          {citations.map(citation => (
            <TouchableOpacity
              key={citation.id}
              style={[styles.citationCard, { backgroundColor: theme.card }]}
              onPress={() => openLink(citation.url)}
              activeOpacity={0.7}
            >
              <View style={styles.citationContent}>
                <Text style={[styles.citationTitle, { color: theme.text }]}>
                  {citation.title}
                </Text>
                <Text
                  style={[
                    styles.citationDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {citation.description}
                </Text>
                <View style={styles.citationSource}>
                  <Icon name="link" size={14} color={theme.primary} />
                  <Text
                    style={[
                      styles.citationSourceText,
                      { color: theme.primary },
                    ]}
                  >
                    {citation.source}
                  </Text>
                </View>
              </View>
              <Icon name="open-outline" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Calculation Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('about.calculationMethod')}
          </Text>
          <View style={[styles.methodCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.methodText, { color: theme.textSecondary }]}>
              {t('about.calculationExplanation')}
            </Text>
            <View style={styles.formulaContainer}>
              <Text style={[styles.formulaTitle, { color: theme.text }]}>
                {t('about.formula')}
              </Text>
              <Text style={[styles.formula, { color: theme.primary }]}>
                {t('about.formulaText')}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {t('about.footerNote')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    appInfo: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    appIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    appIconText: {
      fontSize: 40,
    },
    appName: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    appVersion: {
      fontSize: 14,
    },
    disclaimerCard: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 12,
    },
    disclaimerText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      marginBottom: 16,
      lineHeight: 20,
    },
    citationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    citationContent: {
      flex: 1,
    },
    citationTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    citationDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    citationSource: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    citationSourceText: {
      fontSize: 13,
      fontWeight: '500',
    },
    methodCard: {
      padding: 16,
      borderRadius: 12,
    },
    methodText: {
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
    },
    formulaContainer: {
      padding: 12,
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 8,
    },
    formulaTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    formula: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'monospace',
    },
    footer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default AboutScreen;
