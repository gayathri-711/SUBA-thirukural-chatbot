import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface FloatingChatWidgetProps {
  onPress: () => void;
  language?: string;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ onPress, language = 'auto' }) => {
  const isTamil = language === 'ta';

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityLabel="Ask SUBA Thirukkural Chatbot"
        accessibilityRole="button"
      >
        {/* Glow / Border Ring */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="robot-happy" size={24} color={COLORS.gold} />
          {/* Active online pulse dot */}
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.labelTitle}>
            {isTamil ? 'சுபாவிடம் கேட்க' : 'Ask SUBA'}
          </Text>
          <Text style={styles.labelSubtitle}>
            {isTamil ? 'AI திருக்குறள் வழிகாட்டி' : 'Kural AI Wisdom'}
          </Text>
        </View>

        <View style={styles.arrowCircle}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
    alignItems: 'flex-end',
    zIndex: 9999,
    elevation: 12,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  textContainer: {
    marginLeft: 10,
    marginRight: 10,
  },
  labelTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labelSubtitle: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '500',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
