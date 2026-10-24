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
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    const k = dailyKural || FALLBACK_KURAL;
    const isNowSaved = await ApiService.toggleSaveKural(k);
    setSaved(isNowSaved);
  };

  const handleSpeakDaily = async () => {
    const k = dailyKural || FALLBACK_KURAL;
    if (isSpeakingDaily) {
      await stopSpeech();
      setIsSpeakingDaily(false);
    } else {
      setIsSpeakingDaily(true);
      await speakText(
        `${k.line_1_tamil}. ${k.line_2_tamil}. பொருள்: ${k.meaning_tamil || k.explanation_tamil_sp}`,
        'ta'
      );
      setIsSpeakingDaily(false);
    }
  };

  const topics = [
    { title: 'நட்பு', titleEn: 'Friendship', icon: 'account-group', query: 'நட்பு' },
    { title: 'கல்வி', titleEn: 'Knowledge', icon: 'school', query: 'கல்வி' },
    { title: 'அன்பு', titleEn: 'Love', icon: 'heart', query: 'அன்பு' },
    { title: 'உழைப்பு', titleEn: 'Effort', icon: 'arm-flex', query: 'முயற்சி' },
    { title: 'வாய்மை', titleEn: 'Truth', icon: 'shield-check', query: 'வாய்மை' },
    { title: 'ஒழுக்கம்', titleEn: 'Virtue', icon: 'star-outline', query: 'ஒழுக்கம்' },
  ];

  const currentKural = dailyKural || FALLBACK_KURAL;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      {/* Clean Header with Thiruvalluvar Badge & Lotus Brand */}
      <LinearGradient
        colors={['#EDE9FE', '#F5F3FF', '#FAF8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerBrand}>
          <View style={styles.thiruvalluvarBadge}>
            <MaterialCommunityIcons name="feather" size={18} color="#6D28D9" />
          </View>
          <View style={styles.headerCenterText}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="flower-tulip-outline" size={18} color="#6D28D9" />
              <Text style={styles.brandTitle}>SUBA</Text>
            </View>
            <Text style={styles.brandSubtitle}>Your Thirukkural AI Companion</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={onNavigateToSettings}
          accessibilityLabel="Open settings"
        >
          <Ionicons name="settings-outline" size={20} color="#1E1B4B" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor={COLORS.gold}
            colors={[COLORS.primary, COLORS.gold]}
          />
        }
      >
        {/* Discrete Server Connection Status Indicator */}
        <TouchableOpacity
          style={[styles.connectionStatus, serverStatus.healthy ? styles.statusOnline : styles.statusOffline]}
          onPress={onNavigateToSettings}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, { backgroundColor: serverStatus.healthy ? COLORS.success : COLORS.warning }]} />
          <Text style={styles.statusText}>
            {serverStatus.healthy
              ? (isTamil ? 'சுபா சர்வர் ஆன்லைன் (1,330 குறள்கள்)' : 'SUBA Server Online (1,330 Kurals)')
              : (isTamil ? 'ஆஃப்லைன் முறை — குறள் 1 உடன் இயங்குகிறது' : 'Offline Mode — Operating with local wisdom')}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Executive Headline & Welcoming Introduction */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>வணக்கம் • Welcome</Text>
          <Text style={styles.welcomeHeadline}>
            {isTamil
              ? 'வாழ்வியல் கேள்விகளுக்கு திருக்குறள் தரும் வழிகாட்டல்'
              : 'Timeless Thirukkural Guidance for Modern Life Decisions'}
          </Text>
          <Text style={styles.welcomeDescription}>
            {isTamil
              ? 'வேலை, நட்பு, தொழில், மன அமைதி மற்றும் வாழ்வியல் முடிவுகளுக்கு 1,330 குறள்களின் ஆதாரத்துடன் வழிகாட்டும் AI துணைவன்.'
              : 'Grounded intelligence across 1,330 couplets to navigate career, ethics, relationships, and peace of mind.'}
          </Text>
        </View>

        {/* Prominent Primary Action: Ask SUBA Hero Search Bar */}
        <TouchableOpacity
          style={styles.heroAskBar}
          onPress={onOpenChat}
          activeOpacity={0.88}
          accessibilityLabel="Ask SUBA a life question"
        >
          <View style={styles.heroAskLeft}>
            <View style={styles.heroAskIconCircle}>
              <MaterialCommunityIcons name="chat-question-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.heroAskPlaceholder}>
              {isTamil
                ? 'ஒரு சூழல் அல்லது கேள்வி கேட்கவும்... (Ask SUBA)'
                : 'Ask about career, stress, decisions, or peace...'}
            </Text>
          </View>
          <View style={styles.heroAskBtn}>
            <Text style={styles.heroAskBtnText}>{isTamil ? 'கேட்க' : 'Ask'}</Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Elegant Daily Kural Presentation (Hero Wisdom Card) */}
        <View style={styles.wisdomCard}>
          <View style={styles.wisdomHeader}>
            <View style={styles.wisdomTag}>
              <MaterialCommunityIcons name="feather" size={15} color={COLORS.primary} />
              <Text style={styles.wisdomTagText}>தினசரித் திருக்குறள் • KURAL OF THE DAY</Text>
            </View>

            <View style={styles.wisdomActions}>
              <TouchableOpacity
                onPress={handleSpeakDaily}
                style={[styles.wisdomActionBtn, isSpeakingDaily && styles.wisdomActionBtnActive]}
                accessibilityLabel="Listen to Kural recital in Tamil"
              >
                <Ionicons
                  name={isSpeakingDaily ? 'volume-high' : 'volume-medium-outline'}
                  size={18}
                  color={isSpeakingDaily ? '#FFFFFF' : COLORS.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleSave}
                style={[styles.wisdomActionBtn, saved && styles.wisdomActionBtnSaved]}
                accessibilityLabel="Bookmark this Kural"
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={17}
                  color={saved ? COLORS.goldDark : COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {loadingDaily && !dailyKural ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={COLORS.gold} />
            </View>
          ) : (
            <View style={styles.kuralContent}>
              <View style={styles.kuralMetaRow}>
                <View style={styles.kuralPill}>
                  <Text style={styles.kuralPillText}>குறள் {currentKural.kural_number}</Text>
                </View>
                <Text style={styles.kuralChapter}>{currentKural.chapter_name_tamil || 'அறத்துப்பால்'}</Text>
                <Text style={styles.kuralDivision}>{currentKural.division}</Text>
              </View>

              {/* Manuscript Couplet Display */}
              <View style={styles.coupletBox}>
                <Text style={styles.coupletLine1}>{currentKural.line_1_tamil}</Text>
                <Text style={styles.coupletLine2}>{currentKural.line_2_tamil}</Text>
              </View>

              {/* Tamil Meaning */}
              <View style={styles.meaningContainer}>
                <Text style={styles.meaningTitle}>பொருள் விளக்கம்:</Text>
                <Text style={styles.meaningText}>
                  {currentKural.meaning_tamil || currentKural.explanation_tamil_sp}
                </Text>
              </View>

              {/* English Meaning */}
              {currentKural.meaning_english && (
                <View style={styles.meaningEnContainer}>
                  <Text style={styles.meaningEnText}>
                    "{currentKural.meaning_english}"
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* The 3 Main Books (முப்பால் பிரிவுகள்) — Executive Dignified Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>முப்பால் பிரிவுகள் (The 3 Books)</Text>
          <TouchableOpacity onPress={() => onNavigateToBrowse()} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>அனைத்தும் ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divisionsRow}>
          {/* அறத்துப்பால் */}
          <TouchableOpacity
            style={styles.divisionCard}
            onPress={() => onNavigateToBrowse('அறத்துப்பால்')}
            activeOpacity={0.85}
          >
            <View style={styles.divisionIconBox}>
              <MaterialCommunityIcons name="scale-balance" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.divisionTitle}>அறத்துப்பால்</Text>
            <Text style={styles.divisionSub}>Virtue • 380</Text>
          </TouchableOpacity>

          {/* பொருட்பால் */}
          <TouchableOpacity
            style={styles.divisionCard}
            onPress={() => onNavigateToBrowse('பொருட்பால்')}
            activeOpacity={0.85}
          >
            <View style={styles.divisionIconBox}>
              <MaterialCommunityIcons name="crown-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.divisionTitle}>பொருட்பால்</Text>
            <Text style={styles.divisionSub}>Wealth • 700</Text>
          </TouchableOpacity>

          {/* காமத்துப்பால் */}
          <TouchableOpacity
            style={styles.divisionCard}
            onPress={() => onNavigateToBrowse('காமத்துப்பால்')}
            activeOpacity={0.85}
          >
            <View style={styles.divisionIconBox}>
              <MaterialCommunityIcons name="heart-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.divisionTitle}>காமத்துப்பால்</Text>
            <Text style={styles.divisionSub}>Love • 250</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Life Topics (வாழ்க்கைத் தலைப்புகள்) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>வாழ்க்கைத் தலைப்புகள் (Life Topics)</Text>
        </View>

        <View style={styles.topicsGrid}>
          {topics.map((t, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.topicChip}
              onPress={() => onNavigateToBrowse(undefined, t.query)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={t.icon as any} size={15} color={COLORS.primary} />
              <Text style={styles.topicChipText}>{t.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Space for the floating button */}
        <View style={{ height: 95 }} />
      </ScrollView>

      {/* Floating Chat Widget */}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thiruvalluvarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenterText: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: '#3B1E68',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  settingsIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusOffline: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeGreeting: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  welcomeHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 6,
  },
  welcomeDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  heroAskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  heroAskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  heroAskIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAskPlaceholder: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  heroAskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  heroAskBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  wisdomCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  wisdomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  wisdomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wisdomTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  wisdomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wisdomActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wisdomActionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wisdomActionBtnSaved: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  loaderContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  kuralContent: {},
  kuralMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  kuralPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kuralPillText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  kuralChapter: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  kuralDivision: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  coupletBox: {
    backgroundColor: COLORS.goldSubtle,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  coupletLine1: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 22,
    marginBottom: 3,
  },
  coupletLine2: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 22,
  },
  meaningContainer: {
    marginBottom: 8,
  },
  meaningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  meaningText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  meaningEnContainer: {
    backgroundColor: COLORS.ivory,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  meaningEnText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  divisionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  divisionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  divisionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  divisionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  divisionSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
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
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
