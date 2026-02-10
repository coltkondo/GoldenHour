import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme';
import { dealsAPI } from '../api/endpoints';
import { Venue, Deal } from '../types/api';
import { DealCard } from '../components/Cards/DealCard';
import { GradientBackground } from '../components/common/GradientBackground';

const { width } = Dimensions.get('window');

type HappyHourRouteParams = {
  HappyHour: { venue: Venue };
};

// Mock reviews for UI (to be replaced with real API)
interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', userName: 'HappyHourHero', rating: 5, text: 'Best wings deal in DC. Absolute steal during happy hour!', date: '2 days ago' },
  { id: '2', userName: 'DCFoodie', rating: 4, text: 'Great vibes, solid drink specials. Gets busy around 6pm.', date: '1 week ago' },
  { id: '3', userName: 'BarCrawlKing', rating: 5, text: 'My go-to spot. Never disappoints.', date: '2 weeks ago' },
];

export const HappyHourScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HappyHourRouteParams, 'HappyHour'>>();
  const { venue } = route.params;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const allDeals = await dealsAPI.getActive();
      const venueDeals = allDeals.filter((d: Deal) => d.venue_id === venue.id);
      setDeals(venueDeals);
    } catch {
      // Deals may not be available
    } finally {
      setLoading(false);
    }
  };

  const handleDirections = () => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`
    );
  };

  const handleCall = () => {
    if (venue.phone) Linking.openURL(`tel:${venue.phone}`);
  };

  const handleWebsite = () => {
    if (venue.website) Linking.openURL(venue.website);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setSelectedRating(star)}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 28 : 14}
              color="#FFD700"
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#BF360C', '#E65100', '#FF6B35', '#FF8A50']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.heroMeta}>
              {venue.venue_type && (
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{venue.venue_type}</Text>
                </View>
              )}
              {venue.verified && (
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroName}>{venue.name}</Text>

            {venue.neighborhood && (
              <Text style={styles.heroNeighborhood}>
                📍 {venue.neighborhood}
              </Text>
            )}

            {/* Live status */}
            {venue.active && (
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>HAPPY HOUR ACTIVE</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Quick Actions Bar */}
        <View style={[styles.actionsBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDirections}>
            <Ionicons name="navigate" size={20} color="#FF6B35" />
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Directions</Text>
          </TouchableOpacity>

          {venue.phone && (
            <>
              <View style={[styles.actionDivider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#FF6B35" />
                <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Call</Text>
              </TouchableOpacity>
            </>
          )}

          {venue.website && (
            <>
              <View style={[styles.actionDivider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleWebsite}>
                <Ionicons name="globe" size={20} color="#FF6B35" />
                <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Website</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <GradientBackground style={styles.bodyGradient}>
          {/* Active Deals */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔥 Active Deals
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : deals.length > 0 ? (
              deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} venueName={venue.name} />
              ))
            ) : (
              <View style={[styles.emptySection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.emptyEmoji}>🕐</Text>
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  No active deals right now
                </Text>
                <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                  Check back during happy hour times
                </Text>
              </View>
            )}
          </View>

          {/* Venue Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📋 Info
            </Text>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={theme.colors.textMuted} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{venue.address}</Text>
              </View>
              {venue.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={18} color={theme.colors.textMuted} />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{venue.phone}</Text>
                </View>
              )}
              {venue.website && (
                <View style={styles.infoRow}>
                  <Ionicons name="globe" size={18} color={theme.colors.textMuted} />
                  <Text style={[styles.infoText, { color: theme.colors.secondary }]} numberOfLines={1}>
                    {venue.website}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* User Photos (placeholder for social media feel) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                📸 Photos
              </Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="camera" size={16} color="#FFF" />
                <Text style={styles.addButtonText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.photoGrid}>
              {/* Placeholder photo slots */}
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Ionicons name="image-outline" size={28} color={theme.colors.textMuted} />
                  <Text style={[styles.photoPlaceholderText, { color: theme.colors.textMuted }]}>
                    {i === 1 ? 'Be first!' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                ⭐ Reviews
              </Text>
              <Text style={[styles.reviewCount, { color: theme.colors.textMuted }]}>
                {MOCK_REVIEWS.length} reviews
              </Text>
            </View>

            {/* Write a review */}
            <View style={[styles.writeReview, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.writeReviewTitle, { color: theme.colors.text }]}>
                Rate this spot
              </Text>
              {renderStars(selectedRating, true)}
              <TextInput
                style={[styles.reviewInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Share your experience..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={newReview}
                onChangeText={setNewReview}
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>

            {/* Review list */}
            {MOCK_REVIEWS.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.avatarText}>
                        {review.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.reviewUserName, { color: theme.colors.text }]}>
                        {review.userName}
                      </Text>
                      <Text style={[styles.reviewDate, { color: theme.colors.textMuted }]}>
                        {review.date}
                      </Text>
                    </View>
                  </View>
                  {renderStars(review.rating)}
                </View>
                <Text style={[styles.reviewText, { color: theme.colors.textSecondary }]}>
                  {review.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </GradientBackground>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Hero
  hero: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroContent: {
    gap: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 36,
  },
  heroNeighborhood: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Actions Bar
  actionsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionDivider: {
    width: 1,
  },

  // Body
  bodyGradient: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Empty state
  emptySection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },

  // Info Card
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Photos
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoPlaceholder: {
    width: (width - 56) / 2,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  // Reviews
  reviewCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  writeReview: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  writeReviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
