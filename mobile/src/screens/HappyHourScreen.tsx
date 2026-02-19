import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

type HappyHourRouteParams = {
  HappyHour: { venue: Venue };
};

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
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 32 : 14}
              color="#FFD700"
              style={{ marginRight: interactive ? 4 : 2 }}
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
        {/* RULEBOOK: Simplified hero - dark background, gold accents */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#F5F7FA" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            {/* Meta badges */}
            <View style={styles.heroMeta}>
              {venue.venue_type && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{venue.venue_type}</Text>
                </View>
              )}
              {venue.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* Venue name */}
            <Text style={styles.heroName}>{venue.name}</Text>

            {/* Location */}
            {venue.neighborhood && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#A0A3AD" />
                <Text style={styles.heroLocation}>{venue.neighborhood}</Text>
              </View>
            )}

            {/* Live status */}
            {venue.active && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE NOW</Text>
              </View>
            )}
          </View>
        </View>

        {/* RULEBOOK: One primary action - Directions in gold */}
        <TouchableOpacity style={styles.primaryAction} onPress={handleDirections} activeOpacity={0.9}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.primaryActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="navigate" size={20} color="#0F0F14" />
            <Text style={styles.primaryActionText}>Get Directions</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary actions - Lower contrast */}
        <View style={styles.secondaryActions}>
          {venue.phone && (
            <TouchableOpacity style={styles.secondaryAction} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call-outline" size={18} color="#A0A3AD" />
              <Text style={styles.secondaryActionText}>Call</Text>
            </TouchableOpacity>
          )}
          {venue.website && (
            <TouchableOpacity style={styles.secondaryAction} onPress={handleWebsite} activeOpacity={0.8}>
              <Ionicons name="globe-outline" size={18} color="#A0A3AD" />
              <Text style={styles.secondaryActionText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>

        <GradientBackground style={styles.body}>
          {/* Active Deals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Deals</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : deals.length > 0 ? (
              deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} venueName={venue.name} />
              ))
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No active deals right now</Text>
                <Text style={styles.emptySub}>Check back during happy hour</Text>
              </View>
            )}
          </View>

          {/* Venue Info - Max 3 elements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Venue Info</Text>
            <View style={styles.infoCard}>
              {/* 1. Address */}
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#A0A3AD" />
                <Text style={styles.infoText}>{venue.address}</Text>
              </View>
              {/* 2. Phone */}
              {venue.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#A0A3AD" />
                  <Text style={styles.infoText}>{venue.phone}</Text>
                </View>
              )}
              {/* 3. Website */}
              {venue.website && (
                <View style={styles.infoRow}>
                  <Ionicons name="globe-outline" size={20} color="#A0A3AD" />
                  <Text style={styles.infoTextLink} numberOfLines={1}>
                    {venue.website.replace('https://', '').replace('http://', '')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Text style={styles.reviewCount}>{MOCK_REVIEWS.length} reviews</Text>
            </View>

            {/* Write review - Simplified */}
            <View style={styles.writeReview}>
              <Text style={styles.writeReviewTitle}>Rate this spot</Text>
              {renderStars(selectedRating, true)}
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience..."
                placeholderTextColor="#5A5D66"
                multiline
                numberOfLines={3}
                value={newReview}
                onChangeText={setNewReview}
              />
              <TouchableOpacity style={styles.submitButton} activeOpacity={0.9}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Review list */}
            {MOCK_REVIEWS.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {review.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reviewUserName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  {renderStars(review.rating)}
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
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
    backgroundColor: '#0F0F14',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Hero - Dark background, simplified
  hero: {
    backgroundColor: '#171A21',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroContent: {
    gap: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#A0A3AD',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F5F7FA',
    letterSpacing: -1,
    lineHeight: 36,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLocation: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A0A3AD',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  liveText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Primary Action - Gold CTA
  primaryAction: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryActionText: {
    color: '#0F0F14',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // Secondary Actions - Lower contrast
  secondaryActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  secondaryActionText: {
    color: '#A0A3AD',
    fontSize: 14,
    fontWeight: '700',
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 14,
    color: '#F5F7FA',
  },

  // Empty state
  emptySection: {
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F7FA',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A3AD',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F7FA',
    flex: 1,
  },
  infoTextLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    flex: 1,
  },

  // Reviews
  reviewCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A3AD',
  },
  writeReview: {
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 18,
    marginBottom: 14,
  },
  writeReviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5F7FA',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#F5F7FA',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#0F0F14',
    fontSize: 15,
    fontWeight: '900',
  },
  reviewCard: {
    backgroundColor: '#171A21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#0F0F14',
    fontSize: 16,
    fontWeight: '900',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F5F7FA',
  },
  reviewDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A5D66',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#A0A3AD',
  },
});