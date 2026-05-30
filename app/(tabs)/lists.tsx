import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { BadgePill } from '@/components/badge-pill';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MOCK_CASES } from '@/lib/mock-data';

// ============================================================
// Curated Lists Data
// ============================================================
interface CuratedList {
  id: string;
  title: string;
  description: string;
  emoji: string;
  caseIds: string[];
  accentColor: string;
}

const CURATED_LISTS: CuratedList[] = [
  {
    id: 'editors_picks',
    title: "Editor's Picks",
    description: 'The best-covered cases with the most compelling podcast coverage.',
    emoji: '✨',
    caseIds: ['case_001', 'case_017', 'case_012', 'case_022'],
    accentColor: '#8B1A3A',
  },
  {
    id: 'cold_cases',
    title: 'Cold Cases & Unsolved',
    description: 'Mysteries that have haunted investigators for decades.',
    emoji: '🔍',
    caseIds: ['case_002', 'case_004', 'case_005', 'case_020'],
    accentColor: '#1D6B4E',
  },
  {
    id: 'wrongful',
    title: 'Wrongful Convictions',
    description: 'When the justice system fails and advocates fight back.',
    emoji: '⚖️',
    caseIds: ['case_006', 'case_022'],
    accentColor: '#1D4ED8',
  },
  {
    id: 'recent',
    title: 'Recent & Ongoing',
    description: 'Cases still unfolding, with the most up-to-date podcast coverage.',
    emoji: '📡',
    caseIds: ['case_008', 'case_011', 'case_017', 'case_026'],
    accentColor: '#A0720A',
  },
  {
    id: 'fraud_power',
    title: 'Fraud & Power',
    description: 'Corporate crime, cults, and the abuse of influence.',
    emoji: '💼',
    caseIds: ['case_012', 'case_019', 'case_014'],
    accentColor: '#6D28D9',
  },
  {
    id: 'media_circus',
    title: 'The Media Circus',
    description: 'Cases that defined a generation of true crime coverage.',
    emoji: '📺',
    caseIds: ['case_010', 'case_009', 'case_003', 'case_008'],
    accentColor: '#C4A882',
  },
];

// ============================================================
// List Card
// ============================================================
function ListCard({ list }: { list: CuratedList }) {
  const router = useRouter();
  const cases = list.caseIds
    .map((id) => MOCK_CASES.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => {}}
      activeOpacity={0.85}
    >
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: list.accentColor }]} />

      <View style={styles.listCardContent}>
        <View style={styles.listCardHeader}>
          <Text style={styles.listEmoji}>{list.emoji}</Text>
          <View style={styles.listCardMeta}>
            <Text style={styles.listTitle}>{list.title}</Text>
            <Text style={styles.listDesc}>{list.description}</Text>
          </View>
        </View>

        {/* Case previews */}
        <View style={styles.casePreviewList}>
          {cases.slice(0, 3).map((c) => c && (
            <TouchableOpacity
              key={c.id}
              style={styles.casePreviewRow}
              onPress={() => router.push(`/case/${c.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.casePreviewDot} />
              <Text style={styles.casePreviewTitle} numberOfLines={1}>{c.title}</Text>
              <BadgePill
                label={c.caseStatus === 'WrongfulConviction' ? 'Wrongful' : c.caseStatus}
                variant={c.caseStatus === 'Solved' ? 'solved' : c.caseStatus === 'Unsolved' ? 'unsolved' : c.caseStatus === 'Ongoing' ? 'ongoing' : 'wrongful'}
              />
            </TouchableOpacity>
          ))}
          {cases.length > 3 && (
            <Text style={styles.moreText}>+{cases.length - 3} more cases</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// Lists Screen
// ============================================================
export default function ListsScreen() {
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Curated Lists</Text>
        <Text style={styles.headerSub}>Handpicked by our editors</Text>
      </View>

      <FlatList
        data={CURATED_LISTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListCard list={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F0EB',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: '#7D7570',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14,
  },
  listCard: {
    backgroundColor: '#2A2420',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3D3530',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  listCardContent: {
    flex: 1,
    padding: 18,
    gap: 14,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  listCardMeta: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F0EB',
    lineHeight: 22,
  },
  listDesc: {
    fontSize: 13,
    color: '#A89F96',
    lineHeight: 18,
  },
  casePreviewList: {
    gap: 8,
  },
  casePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  casePreviewDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3D3530',
  },
  casePreviewTitle: {
    flex: 1,
    fontSize: 13,
    color: '#A89F96',
    lineHeight: 18,
  },
  moreText: {
    fontSize: 12,
    color: '#7D7570',
    marginLeft: 13,
    fontStyle: 'italic',
  },
});
