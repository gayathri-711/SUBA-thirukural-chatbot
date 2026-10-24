import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ChatMessage, Kural } from '../types';
import { ApiService } from '../services/api';
import { speakText, stopSpeech } from '../utils/speech';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  language?: string;
  onNavigateToSettings?: () => void;
}

const SUGGESTIONS = [
  { id: '1', label: '💼 வேலை & மன அழுத்தம்', labelEn: 'Career', query: 'வேலை அல்லது படிப்பில் ஏற்படும் மன அழுத்தம், கவலையை நீக்க வள்ளுவர் கூறும் தீர்வு என்ன?' },
  { id: '2', label: '🤝 நட்பு & நம்பிக்கை', labelEn: 'Friendship', query: 'நல்ல நண்பனை எப்படி அடையாளம் காண்பது? நட்பின் இலக்கணம் என்ன?' },
  { id: '3', label: '🎯 சோம்பல் & விடாமுயற்சி', labelEn: 'Effort', query: 'இலக்கை அடைய சோம்பலை விரட்டி விடாமுயற்சியுடன் உழைப்பது எப்படி?' },
  { id: '4', label: '💰 செல்வம் & நிதி நெறி', labelEn: 'Finance', query: 'பொருளாதார நெருக்கடி மற்றும் பணச் சிக்கலைச் சமாளிக்க திருக்குறள் என்ன வழிகாட்டுகிறது?' },
  { id: '5', label: '🧘 மன அமைதி & கோபம்', labelEn: 'Peace', query: 'தேவையற்ற கோபத்தை அடக்கி மன அமைதி பெற திருக்குறள் தரும் நெறி என்ன?' },
];

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  language = 'auto',
  onNavigateToSettings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [langPreference, setLangPreference] = useState(language);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Hardware back button on Android
  useEffect(() => {
    if (!visible) return;
    const backAction = () => {
      onClose();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible]);

  // Keep latest message visible when keyboard opens
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    );
    return () => showSub.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      loadChatHistory();
    }
  }, [visible]);

  const loadChatHistory = async () => {
    const history = await ApiService.getChatHistory();
    if (history && history.length > 0) {
      setMessages(history);
    } else {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'வணக்கம்! நான் சுபா (SUBA). உங்கள் வாழ்க்கைச் சூழல், கேள்விகள் அல்லது குழப்பங்களைக் கூறுங்கள் — 1,330 திருக்குறள்களின் காலத்தால் அழியாத ஞானத்துடன் வழிகாட்டுகிறேன்.\n\nAsk me about career, friendship, duty, leadership, mental peace, or life decisions.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          grounded: true,
        },
      ]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const response = await ApiService.sendChatMessage(query, langPreference);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.answer || (langPreference === 'ta' ? response.answer_tamil : response.answer_english) || '',
        answer_tamil: response.answer_tamil,
        answer_english: response.answer_english,
        practical_takeaway: response.practical_takeaway || response.practical_takeaway_tamil,
        practical_takeaway_tamil: response.practical_takeaway_tamil,
        practical_takeaway_english: response.practical_takeaway_english,
        kurals: response.kurals || [],
        grounded: response.grounded,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      await ApiService.saveChatHistory(finalMessages);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚠️ ${err.message || 'சுபாவிடம் இருந்து பதில் பெற முடியவில்லை. சர்வர் இணைப்பைச் சோதிக்கவும்.'}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSpeak = async (msgId: string, text: string, lang = 'ta') => {
    if (speakingId === msgId) {
      await stopSpeech();
      setSpeakingId(null);
    } else {
      setSpeakingId(msgId);
      await speakText(text, lang);
      setSpeakingId(null);
    }
  };

  const handleTranslateMessage = async (msg: ChatMessage) => {
    if (translatingId) return;
    setTranslatingId(msg.id);

    try {
      const isCurrentlyTamil = !msg.answer_english && (!msg.language || msg.language === 'ta');
      const targetLang = isCurrentlyTamil ? 'en' : 'ta';

      let translated = '';
      if (targetLang === 'en' && msg.answer_english) {
        translated = msg.answer_english;
      } else if (targetLang === 'ta' && msg.answer_tamil) {
        translated = msg.answer_tamil;
      } else {
        translated = await ApiService.translateText(msg.text, targetLang);
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msg.id) {
            return {
              ...m,
              text: translated,
              language: targetLang,
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.warn('Translation error:', err);
    } finally {
      setTranslatingId(null);
    }
  };

  const renderKuralCard = (kural: Kural, idx: number) => {
    return (
      <View key={`kural-${kural.kural_number || idx}`} style={styles.kuralCard}>
        <View style={styles.kuralHeader}>
          <View style={styles.kuralNumberBadge}>
            <Text style={styles.kuralNumberText}>குறள் {kural.kural_number}</Text>
          </View>
          <Text style={styles.chapterName}>
            {kural.chapter_name_tamil || kural.chapter_name_english || 'அறத்துப்பால்'}
          </Text>

          <TouchableOpacity
            style={styles.voiceSmallBtn}
            onPress={() =>
              handleSpeak(
                `kural-${kural.kural_number}`,
                `${kural.line_1_tamil}. ${kural.line_2_tamil}. பொருள்: ${kural.meaning_tamil || kural.explanation_tamil_sp}`,
                'ta'
              )
            }
          >
            <Ionicons
              name={speakingId === `kural-${kural.kural_number}` ? 'volume-high' : 'volume-medium-outline'}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.coupletContainer}>
          <Text style={styles.coupletLine1}>{kural.line_1_tamil || kural.kural_tamil?.split('\n')[0]}</Text>
          <Text style={styles.coupletLine2}>{kural.line_2_tamil || kural.kural_tamil?.split('\n')[1]}</Text>
        </View>

        {(kural.meaning_tamil || kural.explanation_tamil_sp) && (
          <View style={styles.meaningRow}>
            <Text style={styles.meaningLabel}>பொருள்:</Text>
            <Text style={styles.meaningText}>
              {kural.meaning_tamil || kural.explanation_tamil_sp}
            </Text>
          </View>
        )}

        {kural.meaning_english && (
          <View style={styles.meaningRowEn}>
            <Text style={styles.meaningLabelEn}>English:</Text>
            <Text style={styles.meaningTextEn}>{kural.meaning_english}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="feather" size={15} color={COLORS.gold} />
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble, item.isError && styles.errorBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
            {item.text}
          </Text>

          {/* Practical Takeaway box */}
          {(item.practical_takeaway || item.practical_takeaway_tamil) && (
            <View style={styles.takeawayBox}>
              <View style={styles.takeawayHeader}>
                <MaterialCommunityIcons name="compass-outline" size={15} color={COLORS.goldDark} />
                <Text style={styles.takeawayTitle}>வாழ்வியல் பாடம் • Action Takeaway</Text>
              </View>
              <Text style={styles.takeawayText}>
                {item.practical_takeaway_tamil || item.practical_takeaway}
              </Text>
              {item.practical_takeaway_english && (
                <Text style={styles.takeawayTextEn}>
                  {item.practical_takeaway_english}
                </Text>
              )}
            </View>
          )}

          {/* Referenced Kurals */}
          {item.kurals && item.kurals.length > 0 && (
            <View style={styles.kuralsSection}>
              <Text style={styles.kuralsSectionTitle}>
                ஆதாரத் திருக்குறள் ({item.kurals.length})
              </Text>
              {item.kurals.map((k, idx) => renderKuralCard(k, idx))}
            </View>
          )}

          {item.isError && onNavigateToSettings && (
            <TouchableOpacity style={styles.settingsRedirectBtn} onPress={onNavigateToSettings}>
              <Ionicons name="settings-outline" size={14} color={COLORS.error} />
              <Text style={styles.settingsRedirectText}>Configure Backend Server IP in Settings</Text>
            </TouchableOpacity>
          )}

          {/* Audio & Translate Controls */}
          {!isUser && !item.isError && (
            <View style={styles.botActionRow}>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => handleSpeak(item.id, item.text, 'ta')}
              >
                <Ionicons
                  name={speakingId === item.id ? 'volume-high' : 'volume-medium-outline'}
                  size={13}
                  color={COLORS.primary}
                />
                <Text style={styles.actionPillText}>
                  {speakingId === item.id ? 'நிறுத்து' : 'ஒலிவடிவம்'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => handleTranslateMessage(item)}
                disabled={translatingId === item.id}
              >
                <MaterialCommunityIcons name="translate" size={13} color={COLORS.primary} />
                <Text style={styles.actionPillText}>
                  {translatingId === item.id ? 'மொழிபெயர்க்கிறது...' : 'மொழிபெயர்'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.timestampText, isUser ? styles.userTimestamp : styles.botTimestamp]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      {/* Executive Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons name="book-open-page-variant" size={20} color={COLORS.gold} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>SUBA • சுபா</Text>
              <View style={styles.badgeGrounded}>
                <Text style={styles.badgeGroundedText}>1,330 Kurals</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>AI Thirukkural Life Guide</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLangPreference((prev) => (prev === 'ta' ? 'en' : prev === 'en' ? 'auto' : 'ta'))}
          >
            <Text style={styles.langPillText}>
              {langPreference === 'ta' ? 'தமிழ்' : langPreference === 'en' ? 'ENG' : 'இருமொழி'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close chat">
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestion Chips */}
      <View style={styles.suggestionsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.suggestionChip}
              onPress={() => handleSend(s.query)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.suggestionText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Chat Flow with Resilient Keyboard Handling */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={COLORS.goldDark} />
            <Text style={styles.typingText}>சுபா குறள்களைத் தேடி ஆராய்கிறது...</Text>
          </View>
        )}

        {/* Input Bar — Pinned right above keyboard */}
        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="கேள்வி அல்லது சூழலைக் கேட்கவும்... (Ask SUBA)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={600}
              returnKeyType="default"
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.85}
              accessibilityLabel="Send Question"
            >
              <Ionicons
                name="send"
                size={17}
                color={inputText.trim() && !loading ? '#FFFFFF' : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryDark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeGrounded: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  badgeGroundedText: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  langPillText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsBar: {
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingVertical: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 14,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 18,
    padding: 13,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  errorBubble: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  botMessageText: {
    color: COLORS.textPrimary,
  },
  takeawayBox: {
    marginTop: 10,
    backgroundColor: COLORS.accentSage,
    padding: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  takeawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  takeawayTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  takeawayText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  takeawayTextEn: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  kuralsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 10,
  },
  kuralsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  kuralCard: {
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  kuralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kuralNumberBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kuralNumberText: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  chapterName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  voiceSmallBtn: {
    padding: 4,
  },
  coupletContainer: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    paddingLeft: 8,
    marginVertical: 4,
  },
  coupletLine1: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 18,
  },
  coupletLine2: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 18,
  },
  meaningRow: {
    marginTop: 5,
  },
  meaningLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  meaningText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  meaningRowEn: {
    marginTop: 4,
  },
  meaningLabelEn: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  meaningTextEn: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  botActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: COLORS.goldLight,
  },
  botTimestamp: {
    color: COLORS.textMuted,
  },
  settingsRedirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  settingsRedirectText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputBar: {
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.ivory,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingRight: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1DBD5',
    elevation: 0,
  },
});
