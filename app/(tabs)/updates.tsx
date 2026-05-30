import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { BadgePill, caseStatusVariant } from '@/components/badge-pill';
import { MOCK_CASES } from '@/lib/mock-data';
import type { TruecrimeCase } from '@/lib/types';

function triggerHaptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function UpdateCard({ item }: { item: TruecrimeCase }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        triggerHaptic();
        router.push(`/case/${item.id}` as any);
      }}
      activeOpacity={0.85}
    >
      {/* Update badge */}
      <View style={styles.updateBadgeRow}>
        <View style={styles.liveDot} />
        <Text style={styles.updateLabel}>
          Updated {item.lastDevelopmentDate ?? 'Recently'}
        </Text>
      </View>

      {/* Status + title */}
      <View style={styles.statusRow}>
        <BadgePill
          label={
            item.caseStatus === 'WrongfulConviction'
              ? 'Wrongful Conviction'
              : item.caseStatus
          }
          variant={caseStatusVariant(item.caseStatus)}
        />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary} numberOfLines={3}>
        {item.summary}
      </Text>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {item.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Tap prompt */}
      <View style={styles.tapRow}>
        <Text style={styles.tapText}>View case and podcasts</Text>
        <Text style={styles.tapArrow}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function UpdatesScreen() {
  const recentCases = useMemo(
    () =>
      MOCK_CASES.filter((c) => c.recentDevelopments).sort((a, b) => {
        // Sort by lastDevelopmentDate descending (simple string sort works for "Mon YYYY" format)
        const da = a.lastDevelopmentDate ?? '';
        const db = b.lastDevelopmentDate ?? '';
        return db.localeCompare(da);
      }),
    []
  );

  return (
    <ScreenContainer containerClassName="bg-[#1C1917]">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Recent Updates</Text>
          <Text style={styles.headerSub}>
            Cases with new developments, appeals, or verdicts
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{recentCases.length}</Text>
        </View>
      </View>

      {recentCases.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'🔍'}</Text>
          <Text style={styles.emptyTitle}>Nothing new right now</Text>
          <Text style={styles.emptyBody}>
            Check back soon. Cases with new developments, trial updates, or
            appeals will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentCases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UpdateCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2420',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F0EB',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#7D7570',
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: '#3D1520',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#8B1A3A',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4506A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: '#2A2420',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D3530',
    borderLeftWidth: 3,
    borderLeftColor: '#C4A882',
    gap: 10,
  },
  updateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C4A882',
  },
  updateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C4A882',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F0EB',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  summary: {
    fontSize: 14,
    color: '#A89F96',
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#3D3530',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#A89F96',
    fontWeight: '500',
  },
  tapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#3D3530',
  },
  tapText: {
    fontSize: 12,
    color: '#7D7570',
    fontWeight: '500',
  },
  tapArrow: {
    fontSize: 14,
    color: '#C4A882',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F0EB',
  },
  emptyBody: {
    fontSize: 14,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 21,
  },
});
