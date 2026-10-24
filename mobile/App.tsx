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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/theme/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ChatModal } from './src/components/ChatModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'library' | 'profile'>('chat');
  const [browseParams, setBrowseParams] = useState<{ division?: string; search?: string }>({});
  const [language, setLanguage] = useState('auto');

  const handleNavigateToBrowse = (division?: string, search?: string) => {
    setBrowseParams({ division, search });
    setActiveTab('library');
  };

  const handleNavigateToSettings = () => {
    setActiveTab('profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Router */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenChat={() => setActiveTab('chat')}
            onNavigateToBrowse={handleNavigateToBrowse}
            onNavigateToSettings={handleNavigateToSettings}
            language={language}
          />
        )}

        {activeTab === 'chat' && (
          <ChatModal
            visible={true}
            onClose={() => setActiveTab('home')}
            language={language}
            onNavigateToSettings={handleNavigateToSettings}
            onNavigateToLibrary={() => setActiveTab('library')}
          />
        )}

        {activeTab === 'library' && (
          <BrowseScreen
            initialDivision={browseParams.division}
            initialSearch={browseParams.search}
            onOpenChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'profile' && (
          <SettingsScreen
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        )}
      </View>

      {/* Clean Bottom Navigation Bar matching the reference UI */}
      <View style={styles.bottomNav}>
        {/* 1. Home */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? '#6D28D9' : '#64748B'}
          />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Chat */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('chat')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'chat' ? 'chatbubble' : 'chatbubble-outline'}
            size={22}
            color={activeTab === 'chat' ? '#6D28D9' : '#64748B'}
          />
          <Text style={[styles.navText, activeTab === 'chat' && styles.navTextActive]}>
            Chat
          </Text>
        </TouchableOpacity>

        {/* 3. Library */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setBrowseParams({}); setActiveTab('library'); }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'library' ? 'book' : 'book-outline'}
            size={22}
            color={activeTab === 'library' ? '#6D28D9' : '#64748B'}
          />
          <Text style={[styles.navText, activeTab === 'library' && styles.navTextActive]}>
            Library
          </Text>
        </TouchableOpacity>

        {/* 4. Profile */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'profile' ? '#6D28D9' : '#64748B'}
          />
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#6D28D9',
    fontWeight: '700',
  },
});
