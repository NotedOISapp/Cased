/**
 * Live Podcast Search Screen
 *
 * Allows users to search for podcasts by name using the iTunes Search API.
 * Accessible from Case Detail via "Find More Podcasts" or from any case.
 * Results show real episode counts, artwork, and direct deep links.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { searchPodcastsItunes, type LivePodcast } from '@/lib/podcast-api';

function triggerHaptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ============================================================
// Podcast Result Card
// ============================================================

function PodcastResultCard({ podcast }: { podcast: LivePodcast }) {
  const openUrl = async (url: string) => {
    triggerHaptic();
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot Open', 'Unable to open this link on your device.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {podcast.artworkUrl ? (
          <Image source={{ uri: podcast.artworkUrl }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <IconSymbol name="headphones" size={28} color="#7D7570" />
          </View>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.podcastName} numberOfLines={2}>{podcast.name}</Text>
          {podcast.artistName ? (
            <Text style={styles.artistName} numberOfLines={1}>{podcast.artistName}</Text>
          ) : null}
          <View style={styles.statsRow}>
            {podcast.episodeCount > 0 && (
              <View style={styles.statChip}>
                <Text style={styles.statText}>{podcast.episodeCount} episodes</Text>
              </View>
            )}
            {podcast.genre ? (
              <View style={styles.statChip}>
                <Text style={styles.statText}>{podcast.genre}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.listenBtns}>
        <TouchableOpacity
          style={[styles.listenBtn, styles.appleBtn]}
          onPress={() => openUrl(podcast.applePodcastsUrl)}
          activeOpacity={0.8}
        >
          <IconSymbol name="headphones" size={13} color="#F5F0EB" />
          <Text style={styles.appleBtnText}>Apple Podcasts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listenBtn, styles.spotifyBtn]}
          onPress={() => openUrl(podcast.spotifySearchUrl)}
          activeOpacity={0.8}
        >
          <IconSymbol name="play.fill" size={13} color="#1C1917" />
          <Text style={styles.spotifyBtnText}>Spotify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Main Screen
// ============================================================

export default function PodcastSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string }>();

  const [query, setQuery] = useState(params.prefill ?? '');
  const [results, setResults] = useState<LivePodcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    Keyboard.dismiss();
    triggerHaptic();
    setLoading(true);
    setError(null);
    setSearched(true);

    const result = await searchPodcastsItunes(term, 15);
    setLoading(false);

    if (result.source === 'error') {
      setError(result.error ?? 'Search failed. Please try again.');
      setResults([]);
    } else {
      setResults(result.podcasts);
    }
  }, [query]);

  // Auto-search if prefill provided
  React.useEffect(() => {
    if (params.prefill) {
      handleSearch(params.prefill);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Podcasts</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <IconSymbol name="magnifyingglass" size={16} color="#7D7570" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search by podcast or case name..."
            placeholderTextColor="#5A5450"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <IconSymbol name="xmark.circle.fill" size={16} color="#7D7570" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => handleSearch()}
          activeOpacity={0.8}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Source badge */}
      <View style={styles.sourceBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.sourceText}>Live data from Apple Podcasts directory</Text>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B1A2E" />
          <Text style={styles.loadingText}>Searching podcasts...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Search unavailable</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => handleSearch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No podcasts found</Text>
          <Text style={styles.emptyBody}>Try a different search term or the host name.</Text>
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <Text style={styles.hintIcon}>🎙</Text>
          <Text style={styles.hintTitle}>Search the podcast directory</Text>
          <Text style={styles.hintBody}>
            Search by podcast name, host, or case to find real episodes with direct links to Apple Podcasts and Spotify.
          </Text>
          <View style={styles.suggestionRow}>
            {['Serial', 'Crime Junkie', 'My Favorite Murder', 'Casefile'].map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => { setQuery(s); handleSearch(s); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.collectionId)}
          renderItem={({ item }) => <PodcastResultCard podcast={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{results.length} podcast{results.length !== 1 ? 's' : ''} found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1614',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F0EB',
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 36 },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2420',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#F5F0EB',
  },
  searchBtn: {
    backgroundColor: '#8B1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#F5F0EB',
    fontSize: 14,
    fontWeight: '700',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D7A4F',
  },
  sourceText: {
    fontSize: 11,
    color: '#7D7570',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#7D7570',
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 40,
    color: '#8B1A2E',
    fontWeight: '800',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F0EB',
  },
  errorBody: {
    fontSize: 13,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#8B1A2E',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#F5F0EB',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F0EB',
  },
  emptyBody: {
    fontSize: 13,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 20,
  },
  hintIcon: { fontSize: 44 },
  hintTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F0EB',
    textAlign: 'center',
  },
  hintBody: {
    fontSize: 13,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    backgroundColor: '#2A2420',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  suggestionText: {
    fontSize: 13,
    color: '#C4A882',
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    color: '#7D7570',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#231F1D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2926',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#2A2420',
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    gap: 4,
  },
  podcastName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5F0EB',
    lineHeight: 21,
  },
  artistName: {
    fontSize: 12,
    color: '#8B1A2E',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  statChip: {
    backgroundColor: '#2A2420',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statText: {
    fontSize: 11,
    color: '#A89F96',
  },
  listenBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  listenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  appleBtn: {
    backgroundColor: '#8B1A2E',
  },
  appleBtnText: {
    color: '#F5F0EB',
    fontSize: 13,
    fontWeight: '700',
  },
  spotifyBtn: {
    backgroundColor: '#1DB954',
  },
  spotifyBtnText: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '700',
  },
});
