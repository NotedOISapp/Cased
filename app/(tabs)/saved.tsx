import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { CaseCard, BlockedCaseCard } from '@/components/case-card';
import { RevealModal } from '@/components/reveal-modal';
import { useApp } from '@/lib/app-context';
import { MOCK_CASES } from '@/lib/mock-data';
import { isCaseBlocked } from '@/lib/filter-utils';
import type { TruecrimeCase } from '@/lib/types';

function triggerHaptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export default function SavedScreen() {
  const { state, toggleSaveCase, isSaved, isRevealed, revealCase } = useApp();
  const [revealTarget, setRevealTarget] = React.useState<TruecrimeCase | null>(null);

  const savedCases = useMemo(
    () => MOCK_CASES.filter((c) => state.savedCaseIds.has(c.id)),
    [state.savedCaseIds]
  );

  const handleRevealRequest = useCallback((c: TruecrimeCase) => {
    setRevealTarget(c);
  }, []);

  const handleConfirmReveal = useCallback(() => {
    if (revealTarget) {
      revealCase(revealTarget.id);
      setRevealTarget(null);
    }
  }, [revealTarget, revealCase]);

  const renderItem = useCallback(
    ({ item }: { item: TruecrimeCase }) => {
      const blocked = isCaseBlocked(item, state.filters) && !isRevealed(item.id);
      if (blocked) {
        return <BlockedCaseCard caseItem={item} onReveal={() => handleRevealRequest(item)} />;
      }
      return (
        <CaseCard
          caseItem={item}
          isSaved={isSaved(item.id)}
          onSave={() => {
            triggerHaptic();
            toggleSaveCase(item.id);
          }}
        />
      );
    },
    [state.filters, isRevealed, isSaved, toggleSaveCase, handleRevealRequest]
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Cases</Text>
        {savedCases.length > 0 && (
          <Text style={styles.headerSub}>{savedCases.length} saved</Text>
        )}
      </View>

      <FlatList
        data={savedCases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No saved cases yet</Text>
            <Text style={styles.emptyBody}>
              Tap the heart icon on any case to save it here for later.
            </Text>
          </View>
        }
      />

      <RevealModal
        visible={revealTarget !== null}
        caseItem={revealTarget}
        onReveal={handleConfirmReveal}
        onCancel={() => setRevealTarget(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F0EB',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#7D7570',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 52,
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
