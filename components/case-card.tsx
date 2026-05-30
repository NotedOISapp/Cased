import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { TruecrimeCase } from '@/lib/types';
import { IconSymbol } from './ui/icon-symbol';

// ─── helpers ─────────────────────────────────────────────────────────────────

function primaryCategoryLabel(c: TruecrimeCase): string {
  if (c.caseStatus === 'WrongfulConviction') return 'Wrongful Conviction';
  if (c.caseStatus === 'Unsolved' || c.caseStatus === 'ColdCase') return 'Cold Case';
  if (c.caseStatus === 'Ongoing') return 'Ongoing';
  if (c.crimeTypes.includes('SerialOffender')) return 'Serial';
  if (c.crimeTypes.includes('MissingPerson')) return 'Missing Person';
  if (c.crimeTypes.includes('Cult') || c.crimeTypes.includes('Financial') || c.crimeTypes.includes('Corruption')) return 'Financial / Cult';
  return 'Homicide';
}

// ─── Normal Case Card ─────────────────────────────────────────────────────────

interface CaseCardProps {
  caseItem: TruecrimeCase;
  isSaved: boolean;
  onSave: () => void;
  isVerifiedSafe?: boolean;
}

export function CaseCard({ caseItem, isSaved, onSave, isVerifiedSafe }: CaseCardProps) {
  const router = useRouter();
  const cardScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const prevSaved = useRef(isSaved);

  useEffect(() => {
    if (!prevSaved.current && isSaved) {
      Animated.sequence([
        Animated.timing(bookmarkScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
        Animated.timing(bookmarkScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
        Animated.timing(bookmarkScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
        Animated.timing(bookmarkScale, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    prevSaved.current = isSaved;
  }, [isSaved, bookmarkScale]);

  const handlePressIn = () =>
    Animated.timing(cardScale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.timing(cardScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  const handleSave = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave();
  }, [onSave]);

  const categoryLabel = primaryCategoryLabel(caseItem);
  const shortDesc = caseItem.summary.slice(0, 90);

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/case/${caseItem.id}` as any);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Left: compact thumbnail */}
        <View style={styles.thumbnailWrap}>
          {caseItem.coverImage ? (
            <Image
              source={{ uri: caseItem.coverImage }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <IconSymbol name="magnifyingglass" size={22} color="#5A4F4A" />
            </View>
          )}
          {isVerifiedSafe && (
            <View style={styles.safePin}>
              <IconSymbol name="checkmark.shield.fill" size={10} color="#4ADE80" />
            </View>
          )}
          {caseItem.recentDevelopments && (
            <View style={styles.livePin}>
              <View style={styles.liveDot} />
            </View>
          )}
        </View>

        {/* Right: content */}
        <View style={styles.content}>
          {/* Category pill */}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{categoryLabel}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>{caseItem.title}</Text>

          {/* Short spoiler-free description */}
          <Text style={styles.description} numberOfLines={2}>{shortDesc}</Text>

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            <Text style={styles.podcastCount}>
              {caseItem.podcasts.length} podcast{caseItem.podcasts.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); handleSave(); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <IconSymbol
                  name={isSaved ? 'bookmark.fill' : 'bookmark'}
                  size={17}
                  color={isSaved ? '#8B1A3A' : '#5A4F4A'}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Blocked Case Card ────────────────────────────────────────────────────────

interface BlockedCaseCardProps {
  caseItem: TruecrimeCase;
  onReveal: () => void;
}

export function BlockedCaseCard({ caseItem, onReveal }: BlockedCaseCardProps) {
  const reasons: string[] = [];
  if (caseItem.hasChildVictim) reasons.push('child victim');
  if (caseItem.isFamilicide) reasons.push('familicide');
  if (caseItem.hasSexualAssault) reasons.push('sexual assault');
  if (caseItem.hasSuicide) reasons.push('suicide');
  if (caseItem.hasDomesticViolence) reasons.push('domestic violence');
  if (caseItem.hasPsychManipulation) reasons.push('psychological manipulation');

  return (
    <View style={styles.blockedCard}>
      {/* Blurred thumbnail */}
      <View style={styles.thumbnailWrap}>
        {caseItem.coverImage ? (
          <Image
            source={{ uri: caseItem.coverImage }}
            style={[styles.thumbnail, { opacity: 0.15 }]}
            contentFit="cover"
            blurRadius={6}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
        )}
        <View style={styles.lockPin}>
          <IconSymbol name="lock.fill" size={14} color="#A89F96" />
        </View>
      </View>

      {/* Right: content */}
      <View style={styles.content}>
        <Text style={styles.blockedTitle} numberOfLines={2}>{caseItem.title}</Text>
        <Text style={styles.blockedSub}>
          Contains: {reasons.slice(0, 2).join(' and ')}
        </Text>
        <TouchableOpacity
          style={styles.revealBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReveal();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.revealBtnText}>View anyway</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1A18',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#2A2420',
  },
  // Thumbnail
  thumbnailWrap: {
    width: 88,
    minHeight: 110,
    position: 'relative',
    flexShrink: 0,
  },
  thumbnail: {
    width: 88,
    height: '100%',
    minHeight: 110,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#2A2420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safePin: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(20, 18, 16, 0.85)',
    borderRadius: 8,
    padding: 3,
  },
  livePin: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(20, 18, 16, 0.85)',
    borderRadius: 8,
    padding: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  lockPin: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Content
  content: {
    flex: 1,
    padding: 12,
    gap: 5,
    justifyContent: 'center',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 26, 58, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 26, 58, 0.28)',
  },
  categoryPillText: {
    fontSize: 10,
    color: '#C4A882',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5F0EB',
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: '#A89F96',
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  podcastCount: {
    fontSize: 11,
    color: '#5A4F4A',
    fontWeight: '600',
  },
  // Blocked card
  blockedCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1614',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2420',
    minHeight: 110,
  },
  blockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7D7570',
    lineHeight: 19,
  },
  blockedSub: {
    fontSize: 11,
    color: '#5A4F4A',
    lineHeight: 16,
  },
  revealBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3D3530',
    backgroundColor: '#231F1D',
  },
  revealBtnText: {
    fontSize: 11,
    color: '#A89F96',
    fontWeight: '600',
  },
});
