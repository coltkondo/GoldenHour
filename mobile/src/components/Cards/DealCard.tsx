import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Deal } from '../../types/api';

interface DealCardProps {
  deal: Deal;
  venueName?: string;
  onPress?: (deal: Deal) => void;
  compact?: boolean;
}

const DEAL_ICONS: Record<string, string> = {
  beer: '🍺',
  wine: '🍷',
  cocktail: '🍸',
  food: '🍔',
  wings: '🍗',
  pizza: '🍕',
  tacos: '🌮',
  sushi: '🍣',
  appetizer: '🧆',
  drink: '🥃',
  default: '🎉',
};

function getDealIcon(category: string): string {
  const lower = category.toLowerCase();
  for (const [key, icon] of Object.entries(DEAL_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return DEAL_ICONS.default;
}

function formatPrice(price: number | null): string {
  if (!price) return '';
  return `$${price.toFixed(2)}`;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  venueName,
  onPress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const icon = getDealIcon(deal.category);

  const dynamicStyles = {
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
    },
    title: { color: theme.colors.text },
    description: { color: theme.colors.textSecondary },
    venue: { color: theme.colors.textMuted },
    priceBadge: { backgroundColor: theme.colors.primary },
    categoryBadge: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    categoryText: { color: theme.colors.textSecondary },
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, dynamicStyles.card]}
        activeOpacity={0.8}
        onPress={() => onPress?.(deal)}
      >
        <Text style={styles.compactIcon}>{icon}</Text>
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, dynamicStyles.title]} numberOfLines={1}>
            {deal.title}
          </Text>
          {venueName && (
            <Text style={[styles.compactVenue, dynamicStyles.venue]} numberOfLines={1}>
              {venueName}
            </Text>
          )}
        </View>
        {deal.deal_price != null && (
          <View style={[styles.priceBadge, dynamicStyles.priceBadge]}>
            <Text style={styles.priceText}>{formatPrice(deal.deal_price)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, dynamicStyles.card]}
      activeOpacity={0.85}
      onPress={() => onPress?.(deal)}
    >
      {/* Header with icon and category */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.dealIcon}>{icon}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.dealTitle, dynamicStyles.title]} numberOfLines={2}>
            {deal.title}
          </Text>
          {venueName && (
            <Text style={[styles.venueName, dynamicStyles.venue]} numberOfLines={1}>
              {venueName}
            </Text>
          )}
        </View>
        {deal.deal_price != null && (
          <View style={[styles.priceBadge, dynamicStyles.priceBadge]}>
            <Text style={styles.priceText}>{formatPrice(deal.deal_price)}</Text>
            {deal.original_price != null && (
              <Text style={styles.originalPrice}>{formatPrice(deal.original_price)}</Text>
            )}
          </View>
        )}
      </View>

      {/* Description */}
      {deal.description && (
        <Text style={[styles.description, dynamicStyles.description]} numberOfLines={2}>
          {deal.description}
        </Text>
      )}

      {/* Items tags */}
      {deal.items.length > 0 && (
        <View style={styles.itemsRow}>
          {deal.items.slice(0, 4).map((item, index) => (
            <View key={index} style={[styles.itemTag, dynamicStyles.categoryBadge]}>
              <Text style={[styles.itemText, dynamicStyles.categoryText]}>{item}</Text>
            </View>
          ))}
          {deal.items.length > 4 && (
            <Text style={[styles.moreItems, dynamicStyles.venue]}>
              +{deal.items.length - 4} more
            </Text>
          )}
        </View>
      )}

      {/* Discount badge */}
      {deal.discount_percentage != null && deal.discount_percentage > 0 && (
        <View style={styles.discountStrip}>
          <Text style={styles.discountText}>
            {deal.discount_percentage}% OFF
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dealIcon: {
    fontSize: 22,
  },
  headerContent: {
    flex: 1,
    marginRight: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  venueName: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  itemTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreItems: {
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'center',
    marginLeft: 4,
  },
  discountStrip: {
    position: 'absolute',
    top: 8,
    right: -28,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 28,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Compact variant
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  compactContent: {
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactVenue: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
});
