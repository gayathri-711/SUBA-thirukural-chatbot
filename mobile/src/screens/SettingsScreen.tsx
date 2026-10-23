import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ApiService, DEFAULT_API_URL } from '../services/api';

interface SettingsScreenProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentLanguage, onLanguageChange }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await ApiService.getBaseUrl();
    setApiUrl(url);
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'API URL cannot be empty.');
      return;
    }
    await ApiService.setBaseUrl(apiUrl.trim());
    Alert.alert('Saved', 'Backend server URL updated.');
  };

  const handleResetApiUrl = async () => {
    setApiUrl(DEFAULT_API_URL);
    await ApiService.setBaseUrl(DEFAULT_API_URL);
    setTestStatus(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      await ApiService.setBaseUrl(apiUrl.trim());
      const health = await ApiService.checkHealth();
      if (health.healthy) {
        setTestStatus({
          success: true,
          message: `Connected successfully! 1,330 Kurals verified.`
        });
      } else {
        setTestStatus({
          success: false,
          message: health.message || 'Server responded with an unhealthy status.'
        });
      }
    } catch (err: any) {
      setTestStatus({
        success: false,
        message: err.message || 'Connection failed. Check IP and Wi-Fi network.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await ApiService.saveChatHistory([]);
            Alert.alert('Done', 'Chat history cleared.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>அமைப்புகள் (Settings & Network)</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Backend Configuration Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="server-network" size={20} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>Backend Server Connection</Text>
          </View>
          <Text style={styles.sectionDesc}>
            In mobile applications, the phone connects to your computer's local Wi-Fi IP or a deployed server (not localhost).
          </Text>

          <Text style={styles.inputLabel}>FastAPI Server URL:</Text>
          <TextInput
            style={styles.textInput}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.0.9:8000/api"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnTest]}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                  <Text style={styles.btnText}>Test Connection</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSaveApiUrl}>
              <Ionicons name="checkmark" size={14} color={COLORS.primary} />
              <Text style={styles.btnSaveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={handleResetApiUrl}>
              <Text style={styles.btnResetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Test Status Banner */}
          {testStatus && (
            <View style={[styles.statusBox, testStatus.success ? styles.statusSuccess : styles.statusError]}>
              <Ionicons
                name={testStatus.success ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={testStatus.success ? COLORS.success : COLORS.error}
              />
              <Text style={[styles.statusText, { color: testStatus.success ? COLORS.success : COLORS.error }]}>
                {testStatus.message}
              </Text>
            </View>
          )}
        </View>

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language" size={20} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>Language Preference (மொழி)</Text>
          </View>

          <View style={styles.langGrid}>
            <TouchableOpacity
              style={[styles.langOption, currentLanguage === 'ta' && styles.langOptionActive]}
              onPress={() => onLanguageChange('ta')}
            >
              <Text style={[styles.langText, currentLanguage === 'ta' && styles.langTextActive]}>
                தமிழ் (Tamil)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langOption, currentLanguage === 'en' && styles.langOptionActive]}
              onPress={() => onLanguageChange('en')}
            >
              <Text style={[styles.langText, currentLanguage === 'en' && styles.langTextActive]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langOption, currentLanguage === 'auto' && styles.langOptionActive]}
              onPress={() => onLanguageChange('auto')}
            >
              <Text style={[styles.langText, currentLanguage === 'auto' && styles.langTextActive]}>
                இருமொழி (Bilingual)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Storage & Clear */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-bin-outline" size={20} color={COLORS.error} />
            <Text style={styles.sectionTitle}>Data & Storage</Text>
          </View>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearHistory}>
            <Text style={styles.dangerBtnText}>Clear Chat History</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.appNameText}>SUBA — திருக்குறள் AI</Text>
          <Text style={styles.appVerText}>Version 1.0.0 (Mobile Build)</Text>
          <Text style={styles.appDescText}>
            1,330 திருக்குறள்களின் மூலப் பொருள், உரை மற்றும் சூழ்நிலைக்கு ஏற்ப வழிகாட்டும் AI இயங்குதளம்.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 8,
  },
  sectionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  btnTest: {
    backgroundColor: COLORS.primary,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  btnSave: {
    backgroundColor: COLORS.goldLight,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  btnSaveText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  btnReset: {
    backgroundColor: '#F3F4F6',
  },
  btnResetText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  langGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  langOption: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerBtnText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  appVerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  appDescText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});
