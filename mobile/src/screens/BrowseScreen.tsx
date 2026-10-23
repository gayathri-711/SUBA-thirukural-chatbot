import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ApiService } from '../services/api';
import { Kural } from '../types';
import { speakText, stopSpeech } from '../utils/speech';

interface BrowseScreenProps {
  initialDivision?: string;
  initialSearch?: string;
  onOpenChat: () => void;
}

export const BrowseScreen: React.FC<BrowseScreenProps> = ({ initialDivision, initialSearch, onOpenChat }) => {
  const [kurals, setKurals] = useState<Kural[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [activeDivision, setActiveDivision] = useState<string>(initialDivision || '');
  const [selectedKural, setSelectedKural] = useState<Kural | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useEffect(() => {
    loadSavedIds();
    loadKurals(1, activeDivision, searchQuery);
  }, [activeDivision]);

  const loadSavedIds = async () => {
    const saved = await ApiService.getSavedKurals();
    setSavedIds(saved.map(s => s.kural_number));
  };

  const loadKurals = async (pageNumber: number, division = activeDivision, search = searchQuery) => {
    setLoading(true);
    try {
      // If user typed a single number (e.g. "42"), fetch by number directly
      const trimmed = search.trim();
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= 1330 && trimmed === num.toString()) {
        const singleKural = await ApiService.getKuralByNumber(num);
        setKurals([singleKural]);
        setTotalPages(1);
        setPage(1);
      } else {
        const res = await ApiService.getKurals({
          page: pageNumber,
          limit: 20,
          division: division || undefined,
          search: trimmed || undefined
        });
        if (pageNumber === 1) {
          setKurals(res.items);
        } else {
          setKurals(prev => [...prev, ...res.items]);
        }
        setTotalPages(res.pages);
        setPage(pageNumber);
      }
    } catch (err) {
      console.warn('Error loading Kurals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    loadKurals(1, activeDivision, searchQuery);
  };

  const handleToggleSave = async (kural: Kural) => {
    const isSaved = await ApiService.toggleSaveKural(kural);
    if (isSaved) {
      setSavedIds(prev => [...prev, kural.kural_number]);
    } else {
      setSavedIds(prev => prev.filter(id => id !== kural.kural_number));
    }
  };

  const divisions = [
    { id: '', label: 'அனைத்தும் (All)' },
    { id: 'அறத்துப்பால்', label: 'அறத்துப்பால்' },
    { id: 'பொருட்பால்', label: 'பொருட்பால்' },
    { id: 'காமத்துப்பால்', label: 'காமத்துப்பால்' },
  ];

  const renderKuralItem = ({ item }: { item: Kural }) => {
    const isSaved = savedIds.includes(item.kural_number);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setSelectedKural(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.kuralNumberBadge}>
            <Text style={styles.kuralNumberText}>குறள் {item.kural_number}</Text>
          </View>
          <Text style={styles.chapterText}>{item.chapter_name_tamil || item.division}</Text>
          <TouchableOpacity onPress={() => handleToggleSave(item)} style={styles.saveBtn}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        <Text style={styles.coupletLine1}>{item.line_1_tamil || item.kural_tamil?.split('\n')[0]}</Text>
        <Text style={styles.coupletLine2}>{item.line_2_tamil || item.kural_tamil?.split('\n')[1]}</Text>

        <Text style={styles.meaningShort} numberOfLines={2}>
          {item.meaning_tamil || item.explanation_tamil_sp}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>திருக்குறள் களஞ்சியம் (1,330)</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="எண் (1-1330) அல்லது சொல் தேடுக..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadKurals(1, activeDivision, ''); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Division Tabs */}
      <View style={styles.tabsRow}>
        {divisions.map(d => (
          <TouchableOpacity
            key={d.id}
            style={[styles.tabChip, activeDivision === d.id && styles.tabChipActive]}
            onPress={() => setActiveDivision(d.id)}
          >
            <Text style={[styles.tabText, activeDivision === d.id && styles.tabTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Kural List */}
      <FlatList
        data={kurals}
        keyExtractor={item => item.kural_number.toString()}
        renderItem={renderKuralItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (!loading && page < totalPages) {
            loadKurals(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 16 }} /> : undefined}
      />

      {/* Detail Modal */}
      {selectedKural && (
        <Modal visible={!!selectedKural} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>குறள் {selectedKural.kural_number}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ marginRight: 12, padding: 4 }}
                    onPress={() => speakText(`${selectedKural.line_1_tamil}. ${selectedKural.line_2_tamil}. பொருள்: ${selectedKural.meaning_tamil || selectedKural.explanation_tamil_sp}`, 'ta')}
                  >
                    <Ionicons name="volume-high" size={22} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setSelectedKural(null)}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.modalChapter}>
                {selectedKural.chapter_name_tamil} • {selectedKural.division}
              </Text>

              <View style={styles.modalCoupletBox}>
                <Text style={styles.modalCouplet1}>{selectedKural.line_1_tamil}</Text>
                <Text style={styles.modalCouplet2}>{selectedKural.line_2_tamil}</Text>
              </View>

              <Text style={styles.modalSectionLabel}>விளக்கம் (சாலமன் பாப்பையா / மு.வ):</Text>
              <Text style={styles.modalMeaningText}>
                {selectedKural.meaning_tamil || selectedKural.explanation_tamil_sp}
              </Text>

              {selectedKural.meaning_english && (
                <>
                  <Text style={[styles.modalSectionLabel, { marginTop: 10 }]}>English Meaning:</Text>
                  <Text style={styles.modalMeaningEn}>{selectedKural.meaning_english}</Text>
                </>
              )}

              <TouchableOpacity
                style={styles.modalChatBtn}
                onPress={() => {
                  setSelectedKural(null);
                  onOpenChat();
                }}
              >
                <MaterialCommunityIcons name="robot" size={18} color="#FFFFFF" />
                <Text style={styles.modalChatBtnText}>இந்தக் குறள் பற்றி சுபாவிடம் விவாதிக்க</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tabChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
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
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
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
  chapterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  saveBtn: {
    padding: 4,
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
  meaningShort: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalBadgeText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  modalChapter: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  modalCoupletBox: {
    backgroundColor: COLORS.goldSubtle,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    marginBottom: 12,
  },
  modalCouplet1: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  modalCouplet2: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGold,
    marginBottom: 4,
  },
  modalMeaningText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  modalMeaningEn: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  modalChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  modalChatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});
