import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
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
  { id: '1', label: '💼 வேலை & படிப்பு அழுத்தம்', labelEn: 'Stress', query: 'வேலை அல்லது படிப்பில் ஏற்படும் மன அழுத்தம், கவலையை நீக்க வள்ளுவர் கூறும் தீர்வு என்ன?' },
  { id: '2', label: '💔 நட்பு & ஏமாற்றம்', labelEn: 'Friendship', query: 'நண்பனால் ஏமாற்றப்பட்டால் அல்லது பிரிந்தால் மனதை எப்படித் தேற்றிக் கொள்வது?' },
  { id: '3', label: '🎯 சோம்பல் & முயற்சி', labelEn: 'Effort', query: 'இலக்கை அடைய சோம்பலை விரட்டி விடாமுயற்சியுடன் உழைப்பது எப்படி?' },
  { id: '4', label: '💰 பொருளாதார சிக்கல்', labelEn: 'Finance', query: 'பொருளாதார நெருக்கடி மற்றும் பணச் சிக்கலைச் சமாளிக்க திருக்குறள் என்ன வழிகாட்டுகிறது?' },
  { id: '5', label: '🧘 கோபம் & மன அமைதி', labelEn: 'Peace', query: 'தேவையற்ற கோபத்தை அடக்கி மன அமைதி பெற என்ன வழி?' },
  { id: '6', label: '❤️ உண்மையான அன்பு', labelEn: 'Love', query: 'குடும்பத்திலும் மனிதர்களிடமும் உண்மையான அன்புடன் வாழ்வது எப்படி?' },
];

export const ChatModal: React.FC<ChatModalProps> = ({ visible, onClose, language = 'auto', onNavigateToSettings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [langPreference, setLangPreference] = useState(language);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    const history = await ApiService.getChatHistory();
    if (history && history.length > 0) {
      setMessages(history);
    } else {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'வணக்கம்! நான் சுபா (SUBA). உங்கள் வாழ்க்கைச் சூழல், கேள்விகள் அல்லது குழப்பங்களைக் கூறுங்கள் — 1,330 திருக்குறள்களின் காலத்தால் அழியாத ஞானத்துடன் பதிலளிக்கிறேன்.\n\nAsk me about friendship, career, duty, love, mental peace, or life decisions in Tamil, English, or Tanglish!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          grounded: true,
        }
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updated = [...newMessages, botMsg];
      setMessages(updated);
      await ApiService.saveChatHistory(updated);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚠️ ${err.message || 'Server connection failed.'}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleSpeak = async (id: string, text: string, lang = 'ta') => {
    if (speakingId === id) {
      await stopSpeech();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      await speakText(text, lang);
    }
  };

  const handleTranslateMessage = async (msg: ChatMessage) => {
    setTranslatingId(msg.id);
    try {
      // Toggle target language
      const isCurrentlyTamil = /[\u0B80-\u0BFF]/.test(msg.text);
      const targetLang = isCurrentlyTamil ? 'en' : 'ta';
      const translated = await ApiService.translateText(msg.text, targetLang);
      
      setMessages(prev => prev.map(m => {
        if (m.id === msg.id) {
          return { ...m, text: translated };
        }
        return m;
      }));
    } catch (e) {
      console.warn('Translate error:', e);
    } finally {
      setTranslatingId(null);
    }
  };

  const renderKuralCard = (kural: Kural, index: number) => {
    return (
      <View key={kural.kural_number || index} style={styles.kuralBox}>
        <View style={styles.kuralHeader}>
          <View style={styles.kuralHeaderLeft}>
            <View style={styles.kuralNumberBadge}>
              <Text style={styles.kuralNumberText}>குறள் {kural.kural_number}</Text>
            </View>
            {kural.chapter_name_tamil && (
              <Text style={styles.kuralChapterText}>
                {kural.chapter_name_tamil} {kural.division ? `(${kural.division})` : ''}
              </Text>
            )}
          </View>

          {/* Voice Recital Button for Kural */}
          <TouchableOpacity
            style={styles.voiceSmallBtn}
            onPress={() => handleSpeak(`kural-${kural.kural_number}`, `${kural.line_1_tamil}. ${kural.line_2_tamil}. பொருள்: ${kural.meaning_tamil}`, 'ta')}
          >
            <Ionicons
              name={speakingId === `kural-${kural.kural_number}` ? "volume-high" : "volume-medium-outline"}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Couplet */}
        <View style={styles.coupletContainer}>
          <Text style={styles.coupletLine1}>{kural.line_1_tamil || (kural.kural_tamil?.split('\n')[0])}</Text>
          <Text style={styles.coupletLine2}>{kural.line_2_tamil || (kural.kural_tamil?.split('\n')[1])}</Text>
        </View>

        {/* Tamil Meaning */}
        {(kural.meaning_tamil || kural.explanation_tamil_sp) && (
          <View style={styles.meaningRow}>
            <Text style={styles.meaningLabel}>பொருள்:</Text>
            <Text style={styles.meaningText}>
              {kural.meaning_tamil || kural.explanation_tamil_sp}
            </Text>
          </View>
        )}

        {/* English Meaning */}
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
            <MaterialCommunityIcons name="robot" size={16} color={COLORS.gold} />
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble, item.isError && styles.errorBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
            {item.text}
          </Text>

          {/* Practical Takeaway box if available */}
          {(item.practical_takeaway || item.practical_takeaway_tamil) && (
            <View style={styles.takeawayBox}>
              <View style={styles.takeawayHeader}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={COLORS.goldDark} />
                <Text style={styles.takeawayTitle}>வாழ்வியல் பாடம் (Action Takeaway)</Text>
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
                📜 ஆதாரக் குறள்கள் ({item.kurals.length})
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

          {/* Action Row for Assistant Messages: Voice & Translate */}
          {!isUser && !item.isError && (
            <View style={styles.botActionRow}>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => handleSpeak(item.id, item.text, 'ta')}
              >
                <Ionicons
                  name={speakingId === item.id ? "volume-high" : "volume-medium-outline"}
                  size={13}
                  color={COLORS.primary}
                />
                <Text style={styles.actionPillText}>
                  {speakingId === item.id ? 'நிறுத்து (Stop)' : 'ஒலிவடிவம் (Listen)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => handleTranslateMessage(item)}
                disabled={translatingId === item.id}
              >
                <MaterialCommunityIcons name="translate" size={13} color={COLORS.primary} />
                <Text style={styles.actionPillText}>
                  {translatingId === item.id ? 'மொழிபெயர்க்கிறது...' : 'மொழிபெயர் (Translate)'}
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
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
            {/* Language toggle */}
            <TouchableOpacity
              style={styles.langPill}
              onPress={() => setLangPreference(prev => prev === 'ta' ? 'en' : prev === 'en' ? 'auto' : 'ta')}
            >
              <Text style={styles.langPillText}>
                {langPreference === 'ta' ? 'தமிழ்' : langPreference === 'en' ? 'ENG' : 'இருமொழி'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Suggestion Chips */}
        <View style={styles.suggestionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.suggestionChip}
                onPress={() => handleSend(s.query)}
                disabled={loading}
              >
                <Text style={styles.suggestionText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={COLORS.goldDark} />
            <Text style={styles.typingText}>சுபா குறள்களைத் தேடி ஆராய்கிறது (Analyzing wisdom)...</Text>
          </View>
        )}

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="கேள்வி அல்லது சூழலைக் கேட்கவும்... (Ask SUBA)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={600}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? '#FFFFFF' : COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
  },
  avatarLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  badgeGrounded: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: COLORS.gold,
  },
  badgeGroundedText: {
    color: COLORS.goldLight,
    fontSize: 9,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.goldLight,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  suggestionsBar: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
  },
  suggestionChip: {
    backgroundColor: COLORS.goldSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
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
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '86%',
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.botBubble,
    borderWidth: 1,
    borderColor: COLORS.botBubbleBorder,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  errorBubble: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.userText,
  },
  botMessageText: {
    color: COLORS.textPrimary,
  },
  takeawayBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
  },
  takeawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  takeawayTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.goldDark,
    marginLeft: 4,
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
    marginTop: 4,
    fontStyle: 'italic',
  },
  kuralsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 10,
  },
  kuralsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
    marginBottom: 8,
  },
  kuralBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  kuralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kuralNumberBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kuralNumberText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  kuralChapterText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  kuralHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceSmallBtn: {
    padding: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 8,
    marginLeft: 6,
  },
  botActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#E8DEC8',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2D5BA',
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 4,
  },
  coupletContainer: {
    marginBottom: 6,
    paddingLeft: 4,
  },
  coupletLine1: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  coupletLine2: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  meaningRow: {
    marginTop: 4,
  },
  meaningLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textGold,
  },
  meaningText: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textPrimary,
  },
  meaningRowEn: {
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#E8DEC8',
    paddingTop: 3,
  },
  meaningLabelEn: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  meaningTextEn: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textSecondary,
  },
  settingsRedirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  settingsRedirectText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 6,
  },
  timestampText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimestamp: {
    color: COLORS.textMuted,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
