import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ApiService } from '../services/api';
import { Kural } from '../types';
import { FloatingChatWidget } from '../components/FloatingChatWidget';
import { speakText, stopSpeech } from '../utils/speech';

interface HomeScreenProps {
  onOpenChat: () => void;
  onNavigateToBrowse: (division?: string, search?: string) => void;
  onNavigateToSettings: () => void;
  language?: string;
}

const FALLBACK_KURAL: Kural = {
  kural_number: 1,
  chapter_name_tamil: 'கடவுள் வாழ்த்து',
  chapter_name_english: 'Praise of God',
  chapter_number: 1,
  division: 'அறத்துப்பால்',
  line_1_tamil: 'அகர முதல எழுத்தெல்லாம் ஆதி',
  line_2_tamil: 'பகவன் முதற்றே உலகு.',
  meaning_tamil: 'எழுத்துக்களுக்கு அகரம் முதன்மை; அதுபோல உலகிற்கு ஆதிபகவன் முதன்மை.',
  meaning_english: 'As the letter A is the first of all letters, so the eternal God is first in the world.',
  explanation_tamil_sp: 'எழுத்துக்களுக்கு அகரம் தொடக்கம்; அதுபோல உலகுக்கு ஆதிபகவன் தொடக்கம்.',
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenChat,
  onNavigateToBrowse,
  onNavigateToSettings,
  language = 'auto',
}) => {
  const [dailyKural, setDailyKural] = useState<Kural | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ healthy: boolean; message: string }>({ healthy: false, message: 'Checking...' });
  const [saved, setSaved] = useState(false);
  const [isSpeakingDaily, setIsSpeakingDaily] = useState(false);
  const isTamil = language === 'ta';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingDaily(true);
    try {
      const health = await ApiService.checkHealth();
      setServerStatus(health);

      const kural = await ApiService.getDailyKural();
      setDailyKural(kural);
      if (kural) {
        const savedList = await ApiService.getSavedKurals();
        setSaved(savedList.some(s => s.kural_number === kural.kural_number));
      }
    } catch (err: any) {
      console.warn('Error loading home data:', err);
    } finally {
      setLoadingDaily(false);
      setRefreshing(false);
    }
  };

  const handleToggleSave = async () => {
    if (!dailyKural) return;
    const isNowSaved = await ApiService.toggleSaveKural(dailyKural);
    setSaved(isNowSaved);
  };

  const handleSpeakDaily = async () => {
    if (!dailyKural) return;
    if (isSpeakingDaily) {
      await stopSpeech();
      setIsSpeakingDaily(false);
    } else {
      setIsSpeakingDaily(true);
      await speakText(`${dailyKural.line_1_tamil}. ${dailyKural.line_2_tamil}. பொருள்: ${dailyKural.meaning_tamil || dailyKural.explanation_tamil_sp}`, 'ta');
      setIsSpeakingDaily(false);
    }
  };

  const topics = [
    { title: 'நட்பு', titleEn: 'Friendship', icon: 'account-group', query: 'நட்பு' },
    { title: 'கல்வி', titleEn: 'Knowledge', icon: 'school', query: 'கல்வி' },
    { title: 'அன்பு', titleEn: 'Love', icon: 'heart', query: 'அன்பு' },
    { title: 'உழைப்பு', titleEn: 'Effort', icon: 'arm-flex', query: 'முயற்சி' },
    { title: 'வாய்மை', titleEn: 'Truth', icon: 'shield-check', query: 'வாய்மை' },
    { title: 'ஒழுக்கம்', titleEn: 'Virtue', icon: 'star', query: 'ஒழுக்கம்' },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>வணக்கம் • Welcome</Text>
          <Text style={styles.appTitle}>SUBA — திருக்குறள் AI</Text>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={onNavigateToSettings}>
          <Ionicons name="settings-outline" size={20} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {/* Server Connection Banner */}
        <TouchableOpacity
          style={[styles.connectionBanner, serverStatus.healthy ? styles.bannerHealthy : styles.bannerWarning]}
          onPress={onNavigateToSettings}
        >
          <View style={styles.connectionLeft}>
            <View style={[styles.statusDot, { backgroundColor: serverStatus.healthy ? COLORS.success : COLORS.warning }]} />
            <Text style={styles.connectionText}>
              {serverStatus.healthy
                ? (isTamil ? 'சுபா சர்வர் தயாராக உள்ளது (1,330 குறள்கள்)' : 'SUBA Backend Online (1,330 Kurals)')
                : (isTamil ? 'சர்வர் இணைப்பைச் சோதிக்கவும்' : 'Backend offline — Tap to configure IP')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={serverStatus.healthy ? COLORS.success : COLORS.warning} />
        </TouchableOpacity>

        {/* Hero Wisdom Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <MaterialCommunityIcons name="feather" size={20} color={COLORS.gold} />
            <Text style={styles.heroCategory}>தினசரித் திருக்குறள் • KURAL OF THE DAY</Text>
          </View>

          {loadingDaily && !dailyKural ? (
            <ActivityIndicator size="small" color={COLORS.gold} style={{ marginVertical: 20 }} />
          ) : (
            (() => {
              const currentKural = dailyKural || FALLBACK_KURAL;
              return (
                <View>
                  <View style={styles.kuralBadgeRow}>
                    <View style={styles.kuralPill}>
                      <Text style={styles.kuralPillText}>குறள் {currentKural.kural_number}</Text>
                    </View>
                    <Text style={styles.kuralChapter}>{currentKural.chapter_name_tamil || 'அறத்துப்பால்'}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={handleSpeakDaily} style={[styles.bookmarkBtn, { marginRight: 6 }]}>
                        <Ionicons name={isSpeakingDaily ? "volume-high" : "volume-medium-outline"} size={20} color={COLORS.gold} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleToggleSave} style={styles.bookmarkBtn}>
                        <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={18} color={COLORS.gold} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.coupletBox}>
                    <Text style={styles.couplet1}>{currentKural.line_1_tamil}</Text>
                    <Text style={styles.couplet2}>{currentKural.line_2_tamil}</Text>
                  </View>

                  <Text style={styles.heroMeaning}>
                    {currentKural.meaning_tamil || currentKural.explanation_tamil_sp}
                  </Text>

                  {currentKural.meaning_english && (
                    <Text style={styles.heroMeaningEn}>"{currentKural.meaning_english}"</Text>
                  )}
                </View>
              );
            })()
          )}
        </View>

        {/* 3 Main Divisions (முப்பால்) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>முப்பால் பிரிவுகள் (The 3 Books)</Text>
          <TouchableOpacity onPress={() => onNavigateToBrowse()}>
            <Text style={styles.seeAllText}>அனைத்தும் ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divisionsGrid}>
          <TouchableOpacity
            style={[styles.divisionCard, { borderColor: '#E5D6A7' }]}
            onPress={() => onNavigateToBrowse('அறத்துப்பால்')}
          >
            <View style={[styles.divisionIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="scale-balance" size={22} color="#D97706" />
            </View>
            <Text style={styles.divisionTitle}>அறத்துப்பால்</Text>
            <Text style={styles.divisionSub}>Virtue • 380 குறள்கள்</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.divisionCard, { borderColor: '#BFE3D4' }]}
            onPress={() => onNavigateToBrowse('பொருட்பால்')}
          >
            <View style={[styles.divisionIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <MaterialCommunityIcons name="crown" size={22} color="#059669" />
            </View>
            <Text style={styles.divisionTitle}>பொருட்பால்</Text>
            <Text style={styles.divisionSub}>Wealth • 700 குறள்கள்</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.divisionCard, { borderColor: '#FBCFE8' }]}
            onPress={() => onNavigateToBrowse('காமத்துப்பால்')}
          >
            <View style={[styles.divisionIconCircle, { backgroundColor: '#FCE7F3' }]}>
              <MaterialCommunityIcons name="heart-multiple" size={22} color="#DB2777" />
            </View>
            <Text style={styles.divisionTitle}>காமத்துப்பால்</Text>
            <Text style={styles.divisionSub}>Love • 250 குறள்கள்</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Life Topics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>வாழ்க்கைத் தலைப்புகள் (Life Topics)</Text>
        </View>

        <View style={styles.topicsGrid}>
          {topics.map((t, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.topicChip}
              onPress={() => onNavigateToBrowse(undefined, t.query)}
            >
              <MaterialCommunityIcons name={t.icon as any} size={16} color={COLORS.primary} />
              <Text style={styles.topicChipText}>{t.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Space for the floating button */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Chat Widget (The user requested a visible widget on the home screen) */}
      <FloatingChatWidget onPress={onOpenChat} language={language} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryDark,
  },
  greetingText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerHealthy: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroCategory: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6,
  },
  kuralBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kuralPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  kuralPillText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  kuralChapter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookmarkBtn: {
    padding: 4,
  },
  coupletBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    marginBottom: 10,
  },
  couplet1: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  couplet2: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  heroMeaning: {
    color: '#F0EDE6',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  heroMeaningEn: {
    color: COLORS.goldLight,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGold,
  },
  divisionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  divisionCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  divisionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  divisionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  divisionSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
});
