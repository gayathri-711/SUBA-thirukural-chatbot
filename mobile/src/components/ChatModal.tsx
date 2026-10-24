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
  Share,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../theme/colors';
import { ChatMessage, Kural } from '../types';
import { ApiService } from '../services/api';
import { speakText, stopSpeech } from '../utils/speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  language?: string;
  onNavigateToSettings?: () => void;
  onNavigateToLibrary?: () => void;
}

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  sender: 'assistant',
  text: 'This Thirukkural emphasizes the importance of learning thoroughly and without flaws. It also highlights that true education is not just about gaining knowledge, but also about living a life that reflects what we have learned.',
  timestamp: '12:30 PM',
  practical_takeaway: 'Learn with clarity and apply the knowledge in daily life.',
  kurals: [
    {
      kural_number: 391,
      chapter_number: 40,
      chapter_name_tamil: 'கல்வி',
      chapter_name_english: 'Education',
      division: 'பொருட்பால்',
      line_1_tamil: 'கற்க கசடறக் கற்பவை கற்றபின்',
      line_2_tamil: 'நிற்க அதற்குத் தக.',
      meaning_tamil: 'கற்க வேண்டியவற்றை குற்றமில்லாமல் கற்றபின், அதற்கேற்ப நெறிப்படி வாழ வேண்டும்.',
      meaning_english: 'Learn what needs to be learned without any defects and after learning, live your life according to that knowledge.',
      explanation_tamil_sp: 'கற்க வேண்டிய நூல்களைக் குற்றமறக் கற்க வேண்டும்; கற்ற பிறகு, கற்ற கல்விக்கு ஏற்றபடி நல்ல வழியில் நடக்க வேண்டும்.',
      explanation_english: 'Let a man learn thoroughly whatever he learns, and let his conduct be worthy of his learning.',
    },
  ],
};

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  language = 'auto',
  onNavigateToSettings,
  onNavigateToLibrary,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [savedKuralNumbers, setSavedKuralNumbers] = useState<number[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Hook into native speech recognition to listen to voice and convert into question sentence
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setVoiceNotice(
      language === 'ta'
        ? '🎙️ குரல் கேட்கிறது... பேசுங்கள்'
        : '🎙️ Listening... Speak your question'
    );
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setVoiceNotice(null);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';
    if (transcript && transcript.trim()) {
      // Live update question input field with transcribed sentence
      setInputText(transcript.trim());
      setVoiceNotice(null);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    setVoiceNotice(null);
    if (event.error === 'not-allowed') {
      Alert.alert(
        'Microphone Permission',
        'Microphone permission is required to listen to your voice. Please allow microphone access in device settings.'
      );
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      console.warn('Speech recognition notice:', event.error, event.message);
    }
  });

  const handleVoicePress = async () => {
    if (isListening) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
      setIsListening(false);
      setVoiceNotice(null);
      return;
    }

    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission to allow SUBA to listen to your voice and change it into a sentence for your question.'
        );
        return;
      }

      setVoiceNotice(
        language === 'ta'
          ? '🎙️ குரல் கேட்கிறது... பேசுங்கள்'
          : '🎙️ Listening... Speak your question'
      );

      await ExpoSpeechRecognitionModule.start({
        lang: language === 'en' ? 'en-IN' : 'ta-IN',
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
      setIsListening(true);
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      setVoiceNotice(null);
      Alert.alert(
        'Voice Input',
        'Unable to start voice listening. Please ensure speech recognition is supported on your device.'
      );
    }
  };

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
      loadSavedIds();
    }
  }, [visible]);

  const loadSavedIds = async () => {
    try {
      const saved = await ApiService.getSavedKurals();
      setSavedKuralNumbers(saved.map((k) => k.kural_number));
    } catch (e) {
      console.warn('Error loading saved IDs:', e);
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await ApiService.getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Initial sample query and answer from the requested interface
        const initialUserMsg: ChatMessage = {
          id: 'initial_user',
          sender: 'user',
          text: 'What is the meaning of the Thirukkural about education?',
          timestamp: '12:30 PM',
        };
        setMessages([initialUserMsg, DEFAULT_WELCOME_MSG]);
      }
    } catch {
      setMessages([DEFAULT_WELCOME_MSG]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: currentTime,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const response = await ApiService.sendChatMessage(query, language);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.answer || (response.answer_english || response.answer_tamil) || '',
        answer_tamil: response.answer_tamil,
        answer_english: response.answer_english,
        practical_takeaway: response.practical_takeaway || response.practical_takeaway_english || response.practical_takeaway_tamil,
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
        text: `⚠️ ${err.message || 'Unable to connect to SUBA backend. Please check server settings.'}`,
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

  const handleSpeakText = async (id: string, text: string, lang = 'ta') => {
    if (speakingId === id) {
      await stopSpeech();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      await speakText(text, lang);
      setSpeakingId(null);
    }
  };

  const handleCopyText = async (text: string, label = 'Copied') => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${label} copied to clipboard!`);
    } catch {
      // Fallback
    }
  };

  const handleShareMessage = async (msg: ChatMessage) => {
    try {
      const kural = msg.kurals && msg.kurals.length > 0 ? msg.kurals[0] : null;
      let shareContent = `SUBA — Thirukkural AI Wisdom\n\n`;
      if (kural) {
        shareContent += `📜 குறள் ${kural.kural_number} (${kural.chapter_name_tamil || kural.chapter_name_english}):\n${kural.line_1_tamil}\n${kural.line_2_tamil}\n\n`;
        shareContent += `பொருள்: ${kural.meaning_tamil}\n\nEnglish: ${kural.meaning_english}\n\n`;
      }
      shareContent += `விளக்கம் (Explanation):\n${msg.text}\n\n`;
      if (msg.practical_takeaway) {
        shareContent += `வாழ்வியல் பாடம் (Key Takeaway): ${msg.practical_takeaway}\n`;
      }
      await Share.share({ message: shareContent });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleToggleSave = async (kural: Kural) => {
    const isNowSaved = await ApiService.toggleSaveKural(kural);
    if (isNowSaved) {
      setSavedKuralNumbers((prev) => [...prev, kural.kural_number]);
      Alert.alert('Saved', `குறள் ${kural.kural_number} saved to your Library!`);
    } else {
      setSavedKuralNumbers((prev) => prev.filter((id) => id !== kural.kural_number));
      Alert.alert('Removed', `குறள் ${kural.kural_number} removed from Library.`);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    if (isUser) {
      return (
        <View style={styles.userMessageRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
            <View style={styles.userTimeRow}>
              <Text style={styles.userTimeText}>{item.timestamp}</Text>
              <Ionicons name="checkmark-done" size={14} color="#6D28D9" style={{ marginLeft: 3 }} />
            </View>
          </View>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
        </View>
      );
    }

    // Assistant Multi-tier Wisdom Card (Exact layout as screenshot)
    const primaryKural = item.kurals && item.kurals.length > 0 ? item.kurals[0] : null;
    const isSaved = primaryKural ? savedKuralNumbers.includes(primaryKural.kural_number) : false;

    return (
      <View style={styles.botContainer}>
        {/* SUBA Header */}
        <View style={styles.botHeader}>
          <View style={styles.botHeaderLeft}>
            <View style={styles.botAvatar}>
              <MaterialCommunityIcons name="robot" size={18} color="#4338CA" />
            </View>
            <Text style={styles.botName}>SUBA</Text>
          </View>
          <Text style={styles.botTime}>{item.timestamp}</Text>
        </View>

        {/* 1. Thirukkural Verse Card (Warm Cream Tint) */}
        {primaryKural && (
          <View style={styles.verseCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="book-outline" size={18} color={COLORS.verseTitle} />
                <Text style={styles.verseTitle}>Thirukkural Verse</Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <TouchableOpacity
                  style={styles.miniRoundBtn}
                  onPress={() =>
                    handleSpeakText(
                      `verse-${primaryKural.kural_number}`,
                      `${primaryKural.line_1_tamil}. ${primaryKural.line_2_tamil}.`,
                      'ta'
                    )
                  }
                  accessibilityLabel="Listen to verse"
                >
                  <Ionicons
                    name={speakingId === `verse-${primaryKural.kural_number}` ? 'volume-high' : 'volume-medium-outline'}
                    size={16}
                    color={COLORS.verseTitle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.miniRoundBtn}
                  onPress={() =>
                    handleCopyText(
                      `${primaryKural.line_1_tamil}\n${primaryKural.line_2_tamil}\nKural ${primaryKural.kural_number} | ${primaryKural.chapter_name_tamil}`,
                      'Verse'
                    )
                  }
                  accessibilityLabel="Copy verse"
                >
                  <Ionicons name="copy-outline" size={15} color={COLORS.verseTitle} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.verseLine}>{primaryKural.line_1_tamil}</Text>
            <Text style={styles.verseLine}>{primaryKural.line_2_tamil}</Text>

            <Text style={styles.verseMeta}>
              Kural {primaryKural.kural_number} | {primaryKural.chapter_name_tamil || 'கல்வி'} ({primaryKural.chapter_name_english || 'Education'})
            </Text>
          </View>
        )}

        {/* 2. Meaning (Tamil) Card (Pastel Mint Green Tint) */}
        {primaryKural && (primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp) && (
          <View style={styles.meaningTaCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <MaterialCommunityIcons name="leaf" size={17} color={COLORS.meaningTaTitle} />
                <Text style={styles.meaningTaTitle}>Meaning (Tamil)</Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <TouchableOpacity
                  style={styles.miniRoundBtn}
                  onPress={() =>
                    handleSpeakText(
                      `meaning-ta-${primaryKural.kural_number}`,
                      (primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp) || '',
                      'ta'
                    )
                  }
                >
                  <Ionicons
                    name={speakingId === `meaning-ta-${primaryKural.kural_number}` ? 'volume-high' : 'volume-medium-outline'}
                    size={16}
                    color={COLORS.meaningTaTitle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.miniRoundBtn}
                  onPress={() =>
                    handleCopyText((primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp) || '', 'Tamil Meaning')
                  }
                >
                  <Ionicons name="copy-outline" size={15} color={COLORS.meaningTaTitle} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.meaningTaText}>
              {primaryKural.meaning_tamil || primaryKural.explanation_tamil_sp}
            </Text>
          </View>
        )}

        {/* 3. Meaning (English) Card (Pastel Sky Blue Tint) */}
        {primaryKural && primaryKural.meaning_english && (
          <View style={styles.meaningEnCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <MaterialCommunityIcons name="translate" size={17} color={COLORS.meaningEnTitle} />
                <Text style={styles.meaningEnTitle}>Meaning (English)</Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <TouchableOpacity
                  style={styles.miniRoundBtn}
                  onPress={() =>
                    handleSpeakText(
                      `meaning-en-${primaryKural.kural_number}`,
                      primaryKural.meaning_english || '',
                      'en'
                    )
                  }
                >
                  <Ionicons
                    name={speakingId === `meaning-en-${primaryKural.kural_number}` ? 'volume-high' : 'volume-medium-outline'}
                    size={16}
                    color={COLORS.meaningEnTitle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.miniRoundBtn}
                  onPress={() => handleCopyText(primaryKural.meaning_english || '', 'English Meaning')}
                >
                  <Ionicons name="copy-outline" size={15} color={COLORS.meaningEnTitle} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.meaningEnText}>{primaryKural.meaning_english}</Text>
          </View>
        )}

        {/* 4. Explanation Card (Pastel Lavender Tint) */}
        <View style={styles.explanationCard}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={COLORS.explanationTitle} />
            <Text style={styles.explanationTitle}>Explanation</Text>
          </View>
          <Text style={styles.explanationText}>{item.text}</Text>
        </View>

        {/* 5. Key Takeaway Card (Pastel Rose / Coral Tint) */}
        {(item.practical_takeaway || item.practical_takeaway_english || item.practical_takeaway_tamil) && (
          <View style={styles.takeawayCard}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons name="target" size={18} color={COLORS.takeawayTitle} />
              <Text style={styles.takeawayTitle}>Key Takeaway</Text>
            </View>
            <Text style={styles.takeawayText}>
              {item.practical_takeaway || item.practical_takeaway_english || item.practical_takeaway_tamil}
            </Text>
          </View>
        )}

        {/* 6. Bottom Action Pills Row (Listen All, Copy, Share, Save) */}
        <View style={styles.actionPillsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => {
              const fullSpeech = `${primaryKural ? primaryKural.line_1_tamil + '. ' + primaryKural.line_2_tamil + '. ' : ''}${item.text}`;
              handleSpeakText(`all-${item.id}`, fullSpeech, 'ta');
            }}
          >
            <Ionicons
              name={speakingId === `all-${item.id}` ? 'volume-high' : 'volume-medium-outline'}
              size={15}
              color={COLORS.actionPillText}
            />
            <Text style={styles.actionPillText}>
              {speakingId === `all-${item.id}` ? 'Stop' : 'Listen All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => {
              const allContent = `${primaryKural ? primaryKural.line_1_tamil + '\n' + primaryKural.line_2_tamil + '\n\n' + primaryKural.meaning_tamil + '\n\n' : ''}${item.text}`;
              handleCopyText(allContent, 'Full explanation');
            }}
          >
            <Ionicons name="copy-outline" size={15} color={COLORS.actionPillText} />
            <Text style={styles.actionPillText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => handleShareMessage(item)}
          >
            <Ionicons name="share-social-outline" size={15} color={COLORS.actionPillText} />
            <Text style={styles.actionPillText}>Share</Text>
          </TouchableOpacity>

          {primaryKural && (
            <TouchableOpacity
              style={[styles.actionPill, isSaved && styles.actionPillSaved]}
              onPress={() => handleToggleSave(primaryKural)}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={15}
                color={isSaved ? COLORS.primary : COLORS.actionPillText}
              />
              <Text style={[styles.actionPillText, isSaved && styles.actionPillSavedText]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Thiruvalluvar Portrait & Lotus Emblem */}
      <LinearGradient
        colors={['#EDE9FE', '#F5F3FF', '#FAF8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        {/* Left: Thiruvalluvar Avatar */}
        <View style={styles.thiruvalluvarBadge}>
          <MaterialCommunityIcons name="feather" size={18} color="#6D28D9" />
        </View>

        {/* Center: Lotus & SUBA Branding */}
        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="flower-tulip-outline" size={20} color="#6D28D9" />
          <Text style={styles.brandTitle}>SUBA</Text>
          <Text style={styles.brandSubtitle}>Your Thirukkural AI Companion</Text>
        </View>

        {/* Right: Search & Settings Icons */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={onNavigateToLibrary}
            accessibilityLabel="Search Kurals"
          >
            <Ionicons name="search-outline" size={20} color="#1E1B4B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={onNavigateToSettings}
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={20} color="#1E1B4B" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Conversation Flow */}
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

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#6D28D9" />
            <Text style={styles.typingText}>SUBA is retrieving timeless wisdom...</Text>
          </View>
        )}

        {/* Bottom Input Area matching screenshot */}
        {/* Active Speech-to-Text Listening Banner */}
        {isListening && (
          <View style={styles.listeningBanner}>
            <View style={styles.listeningBadge}>
              <View style={styles.listeningDot} />
              <Ionicons name="mic" size={16} color="#DC2626" />
              <Text style={styles.listeningTitle}>
                {language === 'ta'
                  ? 'குரல் கேட்கிறது... பேசுங்கள் (தமிழ் / English)'
                  : 'Listening to your voice... Speak your question now'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleVoicePress}
              style={styles.listeningDoneBtn}
              accessibilityLabel="Finish speaking"
            >
              <Ionicons name="checkmark-circle" size={14} color="#166534" style={{ marginRight: 3 }} />
              <Text style={styles.listeningDoneText}>
                {language === 'ta' ? 'முடிந்தது (Done)' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          {/* Plus icon circle button */}
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={onNavigateToLibrary}
            accessibilityLabel="Explore Kural library"
          >
            <Ionicons name="add" size={22} color="#6D28D9" />
          </TouchableOpacity>

          {/* Pill Input with Mic button inside */}
          <View style={[styles.pillInputContainer, isListening && styles.pillInputListening]}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isListening ? (language === 'ta' ? 'பேசுங்கள், எழுத்துக்கள் இங்கே தோன்றும்...' : 'Listening... your words will appear here') : 'Ask me about Thirukkural...'}
              placeholderTextColor={isListening ? '#DC2626' : '#94A3B8'}
              multiline
              maxLength={600}
              returnKeyType="default"
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[styles.micBtn, isListening && styles.micBtnActive]}
              onPress={handleVoicePress}
              accessibilityLabel={isListening ? 'Stop listening' : 'Voice input'}
            >
              <Ionicons
                name={isListening ? 'radio-button-on' : 'mic-outline'}
                size={20}
                color={isListening ? '#DC2626' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          {/* Circular Vibrant Indigo Send Button with Paper Airplane */}
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            accessibilityLabel="Send question"
          >
            <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8F6FC',
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
  thiruvalluvarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3B1E68',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 20,
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1E1B4B',
    fontWeight: '500',
  },
  userTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  userTimeText: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '500',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  botTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // 1. Verse Card
  verseCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniRoundBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  verseLine: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
    lineHeight: 22,
  },
  verseMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
    marginTop: 6,
  },
  // 2. Meaning (Tamil)
  meaningTaCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  meaningTaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  meaningTaText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#064E3B',
    fontWeight: '500',
  },
  // 3. Meaning (English)
  meaningEnCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  meaningEnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  meaningEnText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  // 4. Explanation
  explanationCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B21A8',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4C1D95',
  },
  // 5. Takeaway
  takeawayCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  takeawayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
    marginBottom: 4,
  },
  takeawayText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#881337',
    fontWeight: '600',
  },
  // 6. Action Pills
  actionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  actionPillSaved: {
    backgroundColor: '#EDE9FE',
    borderColor: '#6D28D9',
  },
  actionPillSavedText: {
    color: '#4338CA',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // Input Bar Area
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    gap: 8,
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    fontSize: 14,
    color: '#1E1B4B',
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
  },
  micBtn: {
    padding: 6,
  },
  micBtnActive: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
  },
  pillInputListening: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  listeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  listeningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  listeningDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  listeningDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
});
