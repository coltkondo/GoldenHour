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
  { id: '1', name: 'Dupont Circle', visited: true, venues: 12 },
  { id: '2', name: 'Georgetown', visited: true, venues: 15 },
  { id: '3', name: 'Adams Morgan', visited: false, venues: 18 },
  { id: '4', name: 'U Street', visited: true, venues: 14 },
  { id: '5', name: 'Capitol Hill', visited: false, venues: 10 },
  { id: '6', name: 'Navy Yard', visited: false, venues: 8 },
  { id: '7', name: 'Shaw', visited: true, venues: 11 },
  { id: '8', name: 'Penn Quarter', visited: false, venues: 9 },
  { id: '9', name: 'Chinatown', visited: false, venues: 7 },
  { id: '10', name: 'Foggy Bottom', visited: false, venues: 6 },
  { id: '11', name: 'H Street', visited: true, venues: 13 },
  { id: '12', name: '14th Street', visited: false, venues: 16 },
];

const REWARDS = [
  { id: '1', title: 'First Sip', desc: 'Visit your first happy hour', earned: true, requirement: 1 },
  { id: '2', title: 'Regular', desc: 'Visit 5 happy hours', earned: true, requirement: 5 },
  { id: '3', title: 'Explorer', desc: 'Visit 10 different spots', earned: false, requirement: 10 },
  { id: '4', title: 'Neighborhood Pro', desc: 'Hit 5 different neighborhoods', earned: true, requirement: 5 },
  { id: '5', title: 'Golden Legend', desc: 'Visit 25 happy hours', earned: false, requirement: 25 },
  { id: '6', title: 'DC Native', desc: 'Visit all neighborhoods', earned: false, requirement: 12 },
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
        {/* Header - Simplified */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explorer</Text>
          <Text style={styles.headerSub}>Complete your DC map</Text>
        </View>

        {/* RULEBOOK: Progress bars outperform explanations - Visual progress bar instead of ring */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressPercent}>{completionPct}%</Text>
            <Text style={styles.progressLabel}>COMPLETE</Text>
          </View>
          
          {/* Visual progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={[styles.progressBarFill, { width: `${completionPct}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Stats - Condensed */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{visitedCount}</Text>
              <Text style={styles.statLabel}>HOODS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{earnedRewards}</Text>
              <Text style={styles.statLabel}>BADGES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: '#FFD700' }]}>#{3}</Text>
              <Text style={styles.statLabel}>RANK</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector - Gold accent for active */}
        <View style={styles.tabBar}>
          {(['map', 'rewards', 'submit'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab === 'map' ? 'Map' : tab === 'rewards' ? 'Rewards' : 'Submit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map Tab - Simplified cards, no emojis */}
        {selectedTab === 'map' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DC Neighborhoods</Text>
            <View style={styles.neighborhoodGrid}>
              {DC_NEIGHBORHOODS.map((hood) => (
                <TouchableOpacity
                  key={hood.id}
                  style={[
                    styles.neighborhoodCard,
                    hood.visited && styles.neighborhoodCardVisited,
                  ]}
                  activeOpacity={0.8}
                >
                  {/* RULEBOOK: Max 3 elements per card */}
                  {/* 1. Name */}
                  <Text style={[styles.hoodName, hood.visited && styles.hoodNameVisited]} numberOfLines={1}>
                    {hood.name}
                  </Text>
                  {/* 2. Venue count */}
                  <Text style={[styles.hoodVenues, hood.visited && styles.hoodVenuesVisited]}>
                    {hood.venues} spots
                  </Text>
                  {/* 3. Status indicator */}
                  {hood.visited ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#0F0F14" />
                    </View>
                  ) : (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color="#5A5D66" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Rewards Tab - Simplified, no emojis */}
        {selectedTab === 'rewards' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            {REWARDS.map((reward) => (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  !reward.earned && styles.rewardCardLocked,
                ]}
              >
                {/* RULEBOOK: Max 3 elements */}
                {/* 1. Title */}
                <View style={styles.rewardContent}>
                  <Text style={[styles.rewardTitle, !reward.earned && styles.rewardTitleLocked]}>
                    {reward.title}
                  </Text>
                  {/* 2. Description */}
                  <Text style={styles.rewardDesc}>{reward.desc}</Text>
                </View>
                {/* 3. Status icon */}
                {reward.earned ? (
                  <Ionicons name="checkmark-circle" size={28} color="#FFD700" />
                ) : (
                  <Ionicons name="lock-closed" size={20} color="#5A5D66" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Submit Tab - One primary action */}
        {selectedTab === 'submit' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit Happy Hour</Text>
            
            {/* RULEBOOK: One hero CTA */}
            <View style={styles.submitCard}>
              <Text style={styles.submitTitle}>Know a spot we're missing?</Text>
              <Text style={styles.submitDesc}>
                Add a venue and earn points for verified submissions
              </Text>
              
              <TouchableOpacity style={styles.submitButton} activeOpacity={0.9}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="add-circle" size={20} color="#0F0F14" />
                  <Text style={styles.submitButtonText}>Submit Venue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Tips - Simplified */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>What to Include</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tipText}>• Venue name and address</Text>
                <Text style={styles.tipText}>• Happy hour days and times</Text>
                <Text style={styles.tipText}>• Specific deals (e.g. $5 drafts)</Text>
              </View>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: '#F5F7FA',
  },
  headerSub: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    color: '#A0A3AD',
  },

  // Progress Card - Visual bar instead of ring
  progressCard: {
    backgroundColor: '#171A21',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressPercent: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: '#FFD700',
    marginRight: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#A0A3AD',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#F5F7FA',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
    color: '#5A5D66',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Tab Bar - Gold for active
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A5D66',
  },
  tabTextActive: {
    color: '#FFD700',
  },

  // Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
    color: '#F5F7FA',
  },

  // Neighborhood Grid - No emojis, gold for visited
  neighborhoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  neighborhoodCard: {
    width: (width - 50) / 2,
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  neighborhoodCardVisited: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  hoodName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#F5F7FA',
    marginBottom: 6,
  },
  hoodNameVisited: {
    color: '#FFD700',
  },
  hoodVenues: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A3AD',
  },
  hoodVenuesVisited: {
    color: 'rgba(255, 215, 0, 0.8)',
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Rewards - Simplified
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 16,
    marginBottom: 10,
  },
  rewardCardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.5,
  },
  rewardContent: {
    flex: 1,
    marginRight: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5F7FA',
    marginBottom: 4,
  },
  rewardTitleLocked: {
    color: '#A0A3AD',
  },
  rewardDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A3AD',
  },

  // Submit - One hero CTA
  submitCard: {
    backgroundColor: '#171A21',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F5F7FA',
    marginBottom: 8,
    textAlign: 'center',
  },
  submitDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A3AD',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#0F0F14',
    fontSize: 16,
    fontWeight: '900',
  },

  // Tips - Simplified
  tipsCard: {
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5F7FA',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A3AD',
    lineHeight: 18,
  },
});