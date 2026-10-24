import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from './src/theme/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { SavedScreen } from './src/screens/SavedScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ChatModal } from './src/components/ChatModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'browse' | 'saved' | 'settings'>('home');
  const [chatVisible, setChatVisible] = useState(false);
  const [browseParams, setBrowseParams] = useState<{ division?: string; search?: string }>({});
  const [language, setLanguage] = useState('auto');

  const handleNavigateToBrowse = (division?: string, search?: string) => {
    setBrowseParams({ division, search });
    setActiveTab('browse');
  };

  const handleNavigateToSettings = () => {
    setActiveTab('settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Screen Router */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenChat={() => setChatVisible(true)}
            onNavigateToBrowse={handleNavigateToBrowse}
            onNavigateToSettings={handleNavigateToSettings}
            language={language}
          />
        )}

        {activeTab === 'browse' && (
          <BrowseScreen
            initialDivision={browseParams.division}
            initialSearch={browseParams.search}
            onOpenChat={() => setChatVisible(true)}
          />
        )}

        {activeTab === 'saved' && (
          <SavedScreen onOpenChat={() => setChatVisible(true)} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? COLORS.gold : COLORS.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
            முகப்பு
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setBrowseParams({}); setActiveTab('browse'); }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'browse' ? 'book-open-page-variant' : 'book-open-page-variant-outline'}
            size={22}
            color={activeTab === 'browse' ? COLORS.gold : COLORS.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'browse' && styles.navTextActive]}>
            களஞ்சியம்
          </Text>
        </TouchableOpacity>

        {/* Center Chat Trigger */}
        <TouchableOpacity
          style={styles.centerNavBtn}
          onPress={() => setChatVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.centerIconCircle}>
            <MaterialCommunityIcons name="robot" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.centerNavText}>சுபா AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={activeTab === 'saved' ? COLORS.gold : COLORS.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'saved' && styles.navTextActive]}>
            சேமித்தவை
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? COLORS.gold : COLORS.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>
            அமைப்புகள்
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Full-Screen Chat Modal */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        language={language}
        onNavigateToSettings={() => {
          setChatVisible(false);
          setActiveTab('settings');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryDark,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  navTextActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  centerNavBtn: {
    alignItems: 'center',
    marginTop: -16,
    flex: 1,
  },
  centerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  centerNavText: {
    fontSize: 10,
    color: COLORS.goldLight,
    fontWeight: '700',
    marginTop: 2,
  },
});
