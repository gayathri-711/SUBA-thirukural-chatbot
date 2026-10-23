import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ApiService } from '../services/api';
import { Kural } from '../types';

interface SavedScreenProps {
  onOpenChat: () => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onOpenChat }) => {
  const [savedKurals, setSavedKurals] = useState<Kural[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'saved') {
      const kurals = await ApiService.getSavedKurals();
      setSavedKurals(kurals);
    } else {
      const hist = await ApiService.getChatHistory();
      setHistory(hist.filter(m => m.sender === 'user'));
    }
  };

  const handleRemove = async (kural: Kural) => {
    await ApiService.toggleSaveKural(kural);
    setSavedKurals(prev => prev.filter(k => k.kural_number !== kural.kural_number));
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>சேமித்தவை & வரலாறு (Saved & History)</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            சேமித்த குறள்கள் ({savedKurals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            கேள்வி வரலாறு ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'saved' ? (
        <FlatList
          data={savedKurals}
          keyExtractor={item => item.kural_number.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bookmark-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>சேமித்த குறள்கள் எதுவும் இல்லை</Text>
              <Text style={styles.emptySub}>முகப்பு அல்லது களஞ்சியத்தில் உள்ள புக்மார்க் பட்டனை அழுத்தி குறள்களைச் சேமிக்கவும்.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.kuralBadge}>
                  <Text style={styles.kuralBadgeText}>குறள் {item.kural_number}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemove(item)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              <Text style={styles.couplet1}>{item.line_1_tamil}</Text>
              <Text style={styles.couplet2}>{item.line_2_tamil}</Text>
              <Text style={styles.meaningText} numberOfLines={2}>
                {item.meaning_tamil || item.explanation_tamil_sp}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>உரையாடல் வரலாறு இல்லை</Text>
              <Text style={styles.emptySub}>சுபாவிடம் கேள்விகள் கேட்டதும் உங்கள் வரலாறு இங்கே தோன்றும்.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.historyCard} onPress={onOpenChat}>
              <View style={styles.historyHeader}>
                <MaterialCommunityIcons name="help-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.historyTime}>{item.timestamp}</Text>
              </View>
              <Text style={styles.historyQuery}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kuralBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kuralBadgeText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  couplet1: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  couplet2: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  meaningText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  historyQuery: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
