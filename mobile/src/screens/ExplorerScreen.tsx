import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { GradientBackground } from '../components/common/GradientBackground';

const { width } = Dimensions.get('window');

// DC Neighborhoods for the "map" to fill out
const DC_NEIGHBORHOODS = [
  { id: '1', name: 'Dupont Circle', emoji: '🔵', visited: true, venues: 12 },
  { id: '2', name: 'Georgetown', emoji: '🏛️', visited: true, venues: 15 },
  { id: '3', name: 'Adams Morgan', emoji: '🎭', visited: false, venues: 18 },
  { id: '4', name: 'U Street', emoji: '🎵', visited: true, venues: 14 },
  { id: '5', name: 'Capitol Hill', emoji: '🏛️', visited: false, venues: 10 },
  { id: '6', name: 'Navy Yard', emoji: '⚓', visited: false, venues: 8 },
  { id: '7', name: 'Shaw', emoji: '🎨', visited: true, venues: 11 },
  { id: '8', name: 'Penn Quarter', emoji: '🏀', visited: false, venues: 9 },
  { id: '9', name: 'Chinatown', emoji: '🏮', visited: false, venues: 7 },
  { id: '10', name: 'Foggy Bottom', emoji: '🌫️', visited: false, venues: 6 },
  { id: '11', name: 'H Street', emoji: '🚃', visited: true, venues: 13 },
  { id: '12', name: '14th Street', emoji: '🍽️', visited: false, venues: 16 },
];

const REWARDS = [
  { id: '1', title: 'First Sip', desc: 'Visit your first happy hour', icon: '🍺', earned: true, requirement: 1 },
  { id: '2', title: 'Regular', desc: 'Visit 5 happy hours', icon: '⭐', earned: true, requirement: 5 },
  { id: '3', title: 'Explorer', desc: 'Visit 10 different spots', icon: '🧭', earned: false, requirement: 10 },
  { id: '4', title: 'Neighborhood Pro', desc: 'Hit 5 different neighborhoods', icon: '🗺️', earned: true, requirement: 5 },
  { id: '5', title: 'Golden Legend', desc: 'Visit 25 happy hours', icon: '👑', earned: false, requirement: 25 },
  { id: '6', title: 'DC Native', desc: 'Visit all neighborhoods', icon: '🏆', earned: false, requirement: 12 },
  { id: '7', title: 'Social Butterfly', desc: 'Leave 10 reviews', icon: '🦋', earned: false, requirement: 10 },
  { id: '8', title: 'Photographer', desc: 'Upload 5 photos', icon: '📸', earned: false, requirement: 5 },
];

export const ExplorerScreen = () => {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'map' | 'rewards' | 'submit'>('map');

  const visitedCount = DC_NEIGHBORHOODS.filter(n => n.visited).length;
  const totalCount = DC_NEIGHBORHOODS.length;
  const completionPct = Math.round((visitedCount / totalCount) * 100);
  const earnedRewards = REWARDS.filter(r => r.earned).length;

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Explorer
          </Text>
          <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>
            Fill out your DC happy hour map
          </Text>
        </View>

        {/* Progress Ring */}
        <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.progressRing}>
            <LinearGradient
              colors={['#FF6B35', '#FFD700']}
              style={styles.ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.ringInner, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.ringPercent, { color: theme.colors.text }]}>
                  {completionPct}%
                </Text>
                <Text style={[styles.ringLabel, { color: theme.colors.textMuted }]}>
                  COMPLETE
                </Text>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatNum, { color: theme.colors.text }]}>{visitedCount}</Text>
              <Text style={[styles.progressStatLabel, { color: theme.colors.textMuted }]}>HOODS HIT</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatNum, { color: theme.colors.text }]}>{earnedRewards}</Text>
              <Text style={[styles.progressStatLabel, { color: theme.colors.textMuted }]}>BADGES</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatNum, { color: theme.colors.secondary }]}>#{3}</Text>
              <Text style={[styles.progressStatLabel, { color: theme.colors.textMuted }]}>RANK</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {(['map', 'rewards', 'submit'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && { backgroundColor: theme.colors.primary }]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? '#FFF' : theme.colors.textMuted },
                ]}
              >
                {tab === 'map' ? '🗺️ Map' : tab === 'rewards' ? '🏆 Rewards' : '➕ Submit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map Tab */}
        {selectedTab === 'map' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              DC Neighborhoods
            </Text>
            <View style={styles.neighborhoodGrid}>
              {DC_NEIGHBORHOODS.map((hood) => (
                <TouchableOpacity
                  key={hood.id}
                  style={[
                    styles.neighborhoodCard,
                    {
                      backgroundColor: hood.visited ? theme.colors.primary : theme.colors.surface,
                      borderColor: hood.visited ? theme.colors.secondary : theme.colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.hoodEmoji}>{hood.emoji}</Text>
                  <Text
                    style={[
                      styles.hoodName,
                      { color: hood.visited ? '#FFF' : theme.colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {hood.name}
                  </Text>
                  <Text
                    style={[
                      styles.hoodVenues,
                      { color: hood.visited ? 'rgba(255,255,255,0.8)' : theme.colors.textMuted },
                    ]}
                  >
                    {hood.venues} spots
                  </Text>
                  {hood.visited && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                  {!hood.visited && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={10} color={theme.colors.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Rewards Tab */}
        {selectedTab === 'rewards' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Badges & Rewards
            </Text>
            {REWARDS.map((reward) => (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: reward.earned ? theme.colors.secondary : theme.colors.border,
                    opacity: reward.earned ? 1 : 0.6,
                  },
                ]}
              >
                <Text style={styles.rewardIcon}>{reward.icon}</Text>
                <View style={styles.rewardContent}>
                  <Text style={[styles.rewardTitle, { color: theme.colors.text }]}>
                    {reward.title}
                  </Text>
                  <Text style={[styles.rewardDesc, { color: theme.colors.textMuted }]}>
                    {reward.desc}
                  </Text>
                </View>
                {reward.earned ? (
                  <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  </View>
                ) : (
                  <View style={[styles.lockedBadge, { borderColor: theme.colors.border }]}>
                    <Ionicons name="lock-closed" size={16} color={theme.colors.textMuted} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Submit Tab */}
        {selectedTab === 'submit' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Submit a Happy Hour
            </Text>
            <View style={[styles.submitCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={styles.submitEmoji}>🍻</Text>
              <Text style={[styles.submitTitle, { color: theme.colors.text }]}>
                Know a spot we're missing?
              </Text>
              <Text style={[styles.submitDesc, { color: theme.colors.textMuted }]}>
                Help the community by adding a new happy hour venue. Earn badges for verified submissions!
              </Text>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Submit New Venue</Text>
              </TouchableOpacity>
            </View>

            {/* Submission tips */}
            <View style={[styles.tipsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                💡 Submission Tips
              </Text>
              {[
                'Include the venue name and address',
                'Add happy hour days and times',
                'List specific deals (e.g. $5 drafts)',
                'Mention any food specials',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.secondary} />
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },

  // Progress Card
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  progressRing: {
    marginRight: 20,
  },
  ringGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressStats: {
    flex: 1,
    gap: 8,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  progressStatNum: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    minWidth: 35,
  },
  progressStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Neighborhood Grid
  neighborhoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  neighborhoodCard: {
    width: (width - 50) / 2,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    position: 'relative',
  },
  hoodEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  hoodName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  hoodVenues: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Rewards
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  rewardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rewardDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  earnedBadge: {},
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Submit
  submitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  submitTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  submitDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Tips
  tipsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
