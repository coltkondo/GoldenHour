import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Deal } from '../../types/api';
import { AppIcon, IconName } from '../icons';

interface DealCardProps {
  deal: Deal;
  venueName?: string;
  onPress?: (deal: Deal) => void;
  compact?: boolean;
}

const CATEGORY_ICON_MAP: Record<string, IconName> = {
  beer: 'deals',
  wine: 'wine',
  cocktail: 'martini',
  food: 'food',
  wings: 'food',
  pizza: 'food',
  tacos: 'food',
  sushi: 'food',
  appetizer: 'food',
  drink: 'martini',
};

function getDealIconName(category: string): IconName {
  const lower = category.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'martini';
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
  const d = theme.derived;
  const iconName = getDealIconName(deal.category);

  const dynamicStyles = {
    card: {
      backgroundColor: d.cardBackground,
      borderColor: d.cardBorder,
    },
    title: { color: d.text },
    description: { color: d.textSecondary },
    venue: { color: d.textMuted },
    priceBadge: { backgroundColor: d.primary },
    categoryBadge: {
      backgroundColor: d.surface,
      borderColor: d.border,
    },
    categoryText: { color: d.textSecondary },
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, dynamicStyles.card]}
        activeOpacity={0.8}
        onPress={() => onPress?.(deal)}
      >
        <View style={[styles.compactIconContainer, { backgroundColor: d.filterInactive }]}>
          <AppIcon name={iconName} size={20} role="brand" />
        </View>
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
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: d.filterInactive }]}>
          <AppIcon name={iconName} size={22} role="brand" />
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

      {deal.description && (
        <Text style={[styles.description, dynamicStyles.description]} numberOfLines={2}>
          {deal.description}
        </Text>
      )}

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

      {deal.discount_percentage != null && deal.discount_percentage > 0 && (
        <View style={styles.discountStrip}>
          <Text style={styles.discountText}>{deal.discount_percentage}% OFF</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '800',
  },
  originalPrice: {
    color: 'rgba(13,13,13,0.5)',
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
    backgroundColor: '#2DD4A0',
    paddingHorizontal: 28,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  discountText: {
    color: '#0D0D0D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
