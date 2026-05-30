'use client';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FEATURED_CASES } from '@/lib/featured-cases-data';
import { dbCaseToAppCase } from '@/lib/case-transformer';
import { useApp } from '@/lib/app-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { trpc } from '@/lib/trpc';
import type {
  PodcastEntry,
  PodcastEpisodeCard,
  ListenerFit,
  SourceTag,
  WarningTag,
} from '@/lib/types';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#111110',
  surface: '#1C1B19',
  surfaceHigh: '#252320',
  border: '#2E2B27',
  borderLight: '#3A3630',
  gold: '#C4A882',
  goldDim: 'rgba(196,168,130,0.18)',
  goldBorder: 'rgba(196,168,130,0.28)',
  text: '#F0EBE4',
  textSub: '#A89F96',
  textMuted: '#6E6660',
  spoiler: '#D97B5A',
  spoilerBg: 'rgba(217,123,90,0.12)',
  spoilerBorder: 'rgba(217,123,90,0.3)',
  warning: '#C49A2A',
  warningBg: 'rgba(196,154,42,0.1)',
  warningBorder: 'rgba(196,154,42,0.25)',
  apple: '#1C1917',
  appleBg: '#F0EBE4',
  spotifyBg: '#1DB954',
  groupHeader: '#2A2724',
  muted: '#6E6660',
} as const;

// ─── Label helpers ────────────────────────────────────────────────────────────

function statusLabel(s: string): string {
  switch (s) {
    case 'WrongfulConviction': return 'Wrongful Conviction';
    case 'ColdCase': return 'Cold Case';
    case 'TrialPending': return 'Trial Pending';
    case 'RecentUpdate': return 'Recent Update';
    case 'BodyNotRecovered': return 'Body Not Recovered';
    case 'PresumedMurder': return 'Presumed Murder';
    case 'Ongoing': return 'Ongoing';
    default: return s;
  }
}

function listenerFitLabel(f: ListenerFit): string {
  const map: Record<ListenerFit, string> = {
    BestFirstListen: 'Best First Listen',
    BestDeepDive: 'Deep Dive',
    BestShortOverview: 'Short Overview',
    BestUpdate: 'Latest Update',
    BestTimeline: 'Best Timeline',
    BestVictimBackground: 'Victim Background',
    BestEvidenceBreakdown: 'Evidence Breakdown',
    BestLegalBreakdown: 'Legal Breakdown',
    BestLocalContext: 'Local Context',
    BestFamilyPerspective: 'Family Perspective',
    BetterAsFollowUp: 'Better as Follow-Up',
    ForExperiencedListeners: 'For Experienced Listeners',
  };
  return map[f] ?? f;
}

function sourceTagLabel(s: SourceTag): string {
  const map: Record<SourceTag, string> = {
    FamilyInterview: 'Family interview',
    SurvivorInterview: 'Survivor interview',
    DetectiveInterview: 'Detective interview',
    ProsecutorInterview: 'Prosecutor interview',
    DefenseInterview: 'Defense interview',
    '911Audio': '911 audio',
    CourtAudio: 'Court audio',
    TrialTestimony: 'Trial testimony',
    PoliceRecords: 'Police records',
    InterrogationAudio: 'Interrogation audio',
    NewsClips: 'News clips',
    LocalReporting: 'Local reporting',
    PrimarySources: 'Primary sources',
    BodycamAudio: 'Bodycam audio',
    DispatchAudio: 'Dispatch audio',
  };
  return map[s] ?? s;
}

function warningTagLabel(w: WarningTag): string {
  const map: Record<WarningTag, string> = {
    DescriptionContainsSpoilers: 'Description has spoilers',
    TitleContainsSpoilers: 'Title has spoilers',
    RevealsOutcomeEarly: 'Reveals outcome early',
    GraphicDetail: 'Graphic detail',
    DisturbingAudio: 'Disturbing audio',
    DramaticSoundEffects: 'Dramatic sound effects',
    ReenactmentAudio: 'Reenactment audio',
    HeavyEmotionalContent: 'Heavy emotional content',
    ChildVictim: 'Child victim',
    DomesticViolence: 'Domestic violence',
    SexualViolence: 'Sexual violence',
    Dismemberment: 'Dismemberment',
    Stalking: 'Stalking',
    TortureCaptivity: 'Torture / captivity',
    IntimatePartnerViolence: 'Intimate partner violence',
    NotForCasualListening: 'Not for casual listening',
    HeadphonesCaution: 'Headphones caution',
    MayBeDisturbing: 'May be disturbing',
    ImmersiveStyle: 'Immersive production style',
    IntenseProduction: 'Intense production',
  };
  return map[w] ?? w;
}

function banterLabel(b: string): string {
  switch (b) {
    case 'Low': case 'low': case 'none': return 'Low banter';
    case 'Medium': case 'medium': return 'Some banter';
    case 'High': case 'high': return 'High banter';
    default: return '';
  }
}

function hostTypeLabel(h: string): string {
  switch (h) {
    case 'SoloFemale': case 'solo_female': return 'Female host';
    case 'SoloMale': case 'solo_male': return 'Male host';
    case 'FemaleDuo': case 'two_female': return 'Female duo';
    case 'MixedDuo': case 'mixed': return 'Mixed hosts';
    case 'HusbandWife': case 'husband_wife': return 'Husband & wife';
    case 'Network': return 'Network';
    case 'GuestHost': case 'rotating': return 'Rotating hosts';
    default: return '';
  }
}

function coverageStyleLabel(s: string): string {
  const map: Record<string, string> = {
    Narrative: 'Narrative', Conversational: 'Conversational', Documentary: 'Documentary',
    Investigative: 'Investigative', InterviewBased: 'Interview-based', HostCommentary: 'Host commentary',
    TimelineFocused: 'Timeline-focused', CasefileStyle: 'Casefile style', MultiPart: 'Multi-part',
    SingleEpisode: 'Single episode', MiniSeries: 'Mini-series', CourtFocused: 'Court-focused',
    EvidenceFocused: 'Evidence-focused', LocalReporting: 'Local reporting',
  };
  return map[s] ?? s;
}

function formatDuration(secs?: number | null): string | null {
  if (!secs || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(d?: Date | string | null): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function Dot() {
  return <Text style={{ color: C.textMuted, marginHorizontal: 4, fontSize: 11 }}>·</Text>;
}

// ─── Nav Bar (always visible, not floating) ───────────────────────────────────

function NavBar({ onBack, onShare, onSave, saved }: {
  onBack: () => void;
  onShare: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <View style={st.navBar}>
      {/* Back button with label */}
      <TouchableOpacity
        style={st.navBackBtn}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
        activeOpacity={0.7}
      >
        <IconSymbol name="chevron.left" size={20} color={C.gold} />
        <Text style={st.navBackLabel}>Cases</Text>
      </TouchableOpacity>

      {/* Right actions */}
      <View style={st.navRight}>
        <TouchableOpacity
          style={st.navBtn}
          onPress={onShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <IconSymbol name="square.and.arrow.up" size={17} color={C.muted} />
        </TouchableOpacity>
        {/* Bookmark — prominent, gold when saved */}
        <TouchableOpacity
          style={[st.navBookmarkBtn, saved && st.navBookmarkBtnSaved]}
          onPress={onSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.75}
        >
          <IconSymbol
            name={saved ? 'bookmark.fill' : 'bookmark'}
            size={18}
            color={saved ? C.bg : C.gold}
          />
          <Text style={[st.navBookmarkLabel, saved && { color: C.bg }]}>
            {saved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Before You Listen ───────────────────────────────────────────────────────

function BeforeYouListen({ notes, flags }: {
  notes?: string[];
  flags: { hasChildVictim: boolean; isFamilicide: boolean; hasSexualAssault: boolean; hasSuicide: boolean; hasDomesticViolence: boolean; hasPsychManipulation: boolean };
}) {
  const items: string[] = [...(notes ?? [])];
  if (flags.hasChildVictim) items.push('Child victim');
  if (flags.isFamilicide) items.push('Familicide');
  if (flags.hasSexualAssault) items.push('Sexual assault');
  if (flags.hasSuicide) items.push('Suicide');
  if (flags.hasDomesticViolence) items.push('Domestic violence');
  if (flags.hasPsychManipulation) items.push('Psychological manipulation');
  if (items.length === 0) return null;

  return (
    <View style={st.beforeListen}>
      <View style={st.beforeListenHeader}>
        <IconSymbol name="exclamationmark.triangle" size={12} color={C.gold} />
        <Text style={st.beforeListenTitle}>Before you listen</Text>
      </View>
      <View style={st.tagChips}>
        {items.map((item, i) => (
          <View key={i} style={st.tagChip}>
            <Text style={st.tagChipText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Spoiler warning block (exact wording per protocol) ───────────────────────

function SpoilerWarnings({ ep }: { ep: PodcastEpisodeCard }) {
  const warnings: string[] = [];
  if (ep.spoilerInTitle) warnings.push('Caution: title contains spoilers.');
  if (ep.spoilerInDescription) warnings.push("Caution: this podcast's case description contains spoilers.");
  if (ep.revealsOutcomeEarly) warnings.push('Caution: episode reveals major outcome early.');
  if (warnings.length === 0) return null;

  return (
    <View style={st.spoilerBlock}>
      {warnings.map((w, i) => (
        <Text key={i} style={st.spoilerText}>{w}</Text>
      ))}
    </View>
  );
}

// ─── Curated Episode Card ─────────────────────────────────────────────────────

function CuratedEpisodeCard({ ep, rank }: { ep: PodcastEpisodeCard; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  const openUrl = async (url?: string) => {
    if (!url) return;
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('Cannot Open', 'Unable to open this link on your device.');
  };

  const primaryFit = ep.listenerFit?.[0];
  const secondaryFit = ep.listenerFit?.[1];
  const contentStyle = ep.coverageStyle?.[0];
  const banter = ep.banterLevel ? banterLabel(ep.banterLevel) : null;
  const host = ep.hostType ? hostTypeLabel(ep.hostType) : null;

  // Max 3-5 visible badges: fit + style + banter
  const visibleBadges: string[] = [];
  if (primaryFit) visibleBadges.push(listenerFitLabel(primaryFit));
  if (secondaryFit) visibleBadges.push(listenerFitLabel(secondaryFit));
  if (contentStyle) visibleBadges.push(coverageStyleLabel(contentStyle));

  return (
    <View style={st.card}>
      {/* Card header */}
      <TouchableOpacity
        style={st.cardTop}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(!expanded);
        }}
        activeOpacity={0.85}
      >
        {ep.podcastImage ? (
          <Image source={{ uri: ep.podcastImage }} style={st.artwork} contentFit="cover" />
        ) : (
          <View style={[st.artwork, st.artworkPlaceholder]}>
            <Text style={st.artworkRank}>{rank}</Text>
          </View>
        )}

        <View style={st.cardIdentity}>
          <Text style={st.podcastName} numberOfLines={1}>{ep.podcastName}</Text>
          <Text style={st.episodeTitle} numberOfLines={2}>{ep.episodeTitle}</Text>
          <View style={st.metaRow}>
            {ep.durationFormatted && <Text style={st.metaText}>{ep.durationFormatted}</Text>}
            {ep.durationFormatted && ep.releaseDate && <Dot />}
            {ep.releaseDate && <Text style={st.metaText}>{ep.releaseDate}</Text>}
            {(ep.durationFormatted || ep.releaseDate) && banter && <Dot />}
            {banter && <Text style={st.metaText}>{banter}</Text>}
            {(ep.durationFormatted || ep.releaseDate || banter) && host && <Dot />}
            {host && <Text style={st.metaText}>{host}</Text>}
          </View>
        </View>

        <IconSymbol
          name={expanded ? 'chevron.down' : 'chevron.right'}
          size={15}
          color={C.textMuted}
        />
      </TouchableOpacity>

      {/* Visible badges (max 3-5) */}
      {visibleBadges.length > 0 && (
        <View style={st.badgeRow}>
          {visibleBadges.map((b, i) => (
            <View key={i} style={st.fitBadge}>
              <Text style={st.fitBadgeText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Spoiler warnings — always visible, exact wording */}
      <SpoilerWarnings ep={ep} />

      {/* Expanded detail */}
      {expanded && (
        <View style={st.cardDetail}>
          {ep.whyListen && (
            <View style={st.detailBlock}>
              <Text style={st.detailLabel}>Why listen to this one</Text>
              <Text style={st.detailText}>{ep.whyListen}</Text>
            </View>
          )}

          {ep.strength && (
            <View style={st.detailBlock}>
              <Text style={st.detailLabel}>What it does best</Text>
              <Text style={st.detailText}>{ep.strength}</Text>
            </View>
          )}

          {ep.watchOut && (
            <View style={[st.detailBlock, st.watchOutBlock]}>
              <Text style={[st.detailLabel, { color: C.warning }]}>Watch out for</Text>
              <Text style={[st.detailText, { color: '#D4A820' }]}>{ep.watchOut}</Text>
            </View>
          )}

          {/* Sources */}
          {ep.sources && ep.sources.length > 0 && (
            <View style={st.tagSection}>
              <Text style={st.tagSectionLabel}>Sources</Text>
              <View style={st.tagChips}>
                {ep.sources.slice(0, 5).map((s) => (
                  <View key={s} style={st.tagChip}>
                    <Text style={st.tagChipText}>{sourceTagLabel(s)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Warnings */}
          {ep.warnings && ep.warnings.length > 0 && (
            <View style={st.tagSection}>
              <Text style={[st.tagSectionLabel, { color: C.warning }]}>Warnings</Text>
              <View style={st.tagChips}>
                {ep.warnings.map((w) => (
                  <View key={w} style={[st.tagChip, st.tagChipWarning]}>
                    <Text style={[st.tagChipText, { color: C.warning }]}>{warningTagLabel(w)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Listen buttons */}
          <View style={st.listenBtns}>
            {ep.applePodcastsUrl && (
              <TouchableOpacity
                style={[st.listenBtn, st.appleBtn]}
                onPress={() => openUrl(ep.applePodcastsUrl)}
                activeOpacity={0.8}
              >
                <IconSymbol name="headphones" size={13} color={C.apple} />
                <Text style={[st.listenBtnText, { color: C.apple }]}>Apple Podcasts</Text>
              </TouchableOpacity>
            )}
            {ep.spotifyUrl && (
              <TouchableOpacity
                style={[st.listenBtn, st.spotifyBtn]}
                onPress={() => openUrl(ep.spotifyUrl)}
                activeOpacity={0.8}
              >
                <IconSymbol name="play.fill" size={13} color="#fff" />
                <Text style={[st.listenBtnText, { color: '#fff' }]}>Spotify</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Live Episode Card (DB-backed) ────────────────────────────────────────────

type LiveEpisode = {
  id: number;
  showId: number;
  titleOriginal: string;
  titleClean?: string | null;
  descriptionOriginal?: string | null;
  publishDate?: Date | string | null;
  durationSeconds?: number | null;
  audioUrl?: string | null;
  episodeUrl?: string | null;
  storyPosition?: string | null;
  banterScore?: number | null;
  showName: string;
  showArtwork: string;
  showHostType: string;
  showBanterLevel: string;
  showTone: string;
  showApplePodcastsUrl: string;
  showSpotifyUrl: string;
};

function LiveEpisodeCard({ ep, rank }: { ep: LiveEpisode; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  const openUrl = async (url?: string | null) => {
    if (!url) return;
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('Cannot Open', 'Unable to open this link on your device.');
  };

  const duration = formatDuration(ep.durationSeconds);
  const date = formatDate(ep.publishDate);
  const banter = ep.showBanterLevel !== 'unknown' ? banterLabel(ep.showBanterLevel) : null;
  const host = ep.showHostType !== 'unknown' ? hostTypeLabel(ep.showHostType) : null;
  const title = ep.titleClean ?? ep.titleOriginal;

  return (
    <View style={st.card}>
      <TouchableOpacity
        style={st.cardTop}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(!expanded);
        }}
        activeOpacity={0.85}
      >
        {ep.showArtwork ? (
          <Image source={{ uri: ep.showArtwork }} style={st.artwork} contentFit="cover" />
        ) : (
          <View style={[st.artwork, st.artworkPlaceholder]}>
            <Text style={st.artworkRank}>{rank}</Text>
          </View>
        )}

        <View style={st.cardIdentity}>
          <Text style={st.podcastName} numberOfLines={1}>{ep.showName}</Text>
          <Text style={st.episodeTitle} numberOfLines={2}>{title}</Text>
          <View style={st.metaRow}>
            {duration && <Text style={st.metaText}>{duration}</Text>}
            {duration && date && <Dot />}
            {date && <Text style={st.metaText}>{date}</Text>}
            {(duration || date) && banter && <Dot />}
            {banter && <Text style={st.metaText}>{banter}</Text>}
            {(duration || date || banter) && host && <Dot />}
            {host && <Text style={st.metaText}>{host}</Text>}
          </View>
        </View>

        <IconSymbol
          name={expanded ? 'chevron.down' : 'chevron.right'}
          size={15}
          color={C.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={st.cardDetail}>
          {ep.descriptionOriginal && (
            <View style={st.detailBlock}>
              <Text style={st.detailLabel}>Episode description</Text>
              <Text style={st.detailText} numberOfLines={5}>
                {ep.descriptionOriginal.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
              </Text>
            </View>
          )}
          <View style={st.listenBtns}>
            {ep.showApplePodcastsUrl && (
              <TouchableOpacity
                style={[st.listenBtn, st.appleBtn]}
                onPress={() => openUrl(ep.episodeUrl ?? ep.showApplePodcastsUrl)}
                activeOpacity={0.8}
              >
                <IconSymbol name="headphones" size={13} color={C.apple} />
                <Text style={[st.listenBtnText, { color: C.apple }]}>Apple Podcasts</Text>
              </TouchableOpacity>
            )}
            {ep.showSpotifyUrl && (
              <TouchableOpacity
                style={[st.listenBtn, st.spotifyBtn]}
                onPress={() => openUrl(ep.showSpotifyUrl)}
                activeOpacity={0.8}
              >
                <IconSymbol name="play.fill" size={13} color="#fff" />
                <Text style={[st.listenBtnText, { color: '#fff' }]}>Spotify</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Legacy Podcast Card ──────────────────────────────────────────────────────

function LegacyPodcastCard({ podcast, rank }: { podcast: PodcastEntry; rank: number }) {
  const openUrl = async (url: string) => {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('Cannot Open', 'Unable to open this link on your device.');
  };
  const banter = podcast.banterLevel ? banterLabel(podcast.banterLevel) : null;

  return (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={[st.artwork, st.artworkPlaceholder]}>
          <Text style={st.artworkRank}>{rank}</Text>
        </View>
        <View style={st.cardIdentity}>
          <Text style={st.podcastName}>{podcast.podcastName}</Text>
          {podcast.startHereNote && (
            <Text style={st.detailText} numberOfLines={2}>{podcast.startHereNote}</Text>
          )}
          <View style={st.metaRow}>
            {podcast.timeCommitment && (
              <Text style={st.metaText}>
                {podcast.timeCommitment.replace('Under1Hr', 'Under 1 hr').replace('1to3Hrs', '1–3 hrs').replace('3PlusHrs', '3+ hrs')}
              </Text>
            )}
            {podcast.timeCommitment && banter && <Dot />}
            {banter && <Text style={st.metaText}>{banter}</Text>}
          </View>
        </View>
      </View>
      <View style={[st.cardDetail, { paddingTop: 0 }]}>
        <View style={st.listenBtns}>
          <TouchableOpacity style={[st.listenBtn, st.appleBtn]} onPress={() => openUrl(podcast.applePodcastsUrl)} activeOpacity={0.8}>
            <IconSymbol name="headphones" size={13} color={C.apple} />
            <Text style={[st.listenBtnText, { color: C.apple }]}>Apple Podcasts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.listenBtn, st.spotifyBtn]} onPress={() => openUrl(podcast.spotifyUrl)} activeOpacity={0.8}>
            <IconSymbol name="play.fill" size={13} color="#fff" />
            <Text style={[st.listenBtnText, { color: '#fff' }]}>Spotify</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Episode Group Header ─────────────────────────────────────────────────────

function GroupHeader({ title, subtitle, count }: { title: string; subtitle?: string; count?: number }) {
  return (
    <View style={st.groupHeader}>
      <View style={st.groupHeaderLeft}>
        <Text style={st.groupTitle}>{title}</Text>
        {subtitle && <Text style={st.groupSubtitle}>{subtitle}</Text>}
      </View>
      {count !== undefined && (
        <View style={st.groupCount}>
          <Text style={st.groupCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Case Detail Screen ───────────────────────────────────────────────────────

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isSaved, toggleSaveCase } = useApp();

  const { data: liveEpisodes, isLoading: episodesLoading } = trpc.cases.episodesWithShow.useQuery(
    { caseId: id ?? '' },
    { enabled: !!id, staleTime: 5 * 60 * 1000 }
  );

  const { data: dbCase, isLoading: caseLoading } = trpc.cases.byId.useQuery(
    { id: id ?? '' },
    { enabled: !!id, staleTime: 5 * 60 * 1000 }
  );

  const featuredOverride = FEATURED_CASES.find((c) => c.id === id);
  const baseCase = dbCase ? dbCaseToAppCase(dbCase) : undefined;
  const caseItem = baseCase
    ? (featuredOverride ? { ...baseCase, ...featuredOverride } : baseCase)
    : undefined;

  // Show loading skeleton while case data is being fetched
  const isLoading = caseLoading && !caseItem;

  const handleBack = () => router.back();
  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: caseItem?.title ?? 'True Crime Case',
        message: `${caseItem?.title ?? ''}\n\n${caseItem?.summary ?? ''}\n\nFound on TrueCrimePodList`,
      });
    } catch {}
  };
  const handleSave = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (caseItem) toggleSaveCase(caseItem.id);
  };

  const saved = caseItem ? isSaved(caseItem.id) : false;

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={st.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <NavBar onBack={handleBack} onShare={handleShare} onSave={handleSave} saved={false} />
        <View style={st.notFound}>
          <Text style={[st.notFoundSub, { color: C.gold }]}>Loading case…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ──
  if (!caseItem) {
    return (
      <SafeAreaView style={st.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <NavBar onBack={handleBack} onShare={handleShare} onSave={handleSave} saved={false} />
        <View style={st.notFound}>
          <Text style={st.notFoundTitle}>Case not found</Text>
          <Text style={st.notFoundSub}>This case may have been removed or the link is incorrect.</Text>
          <TouchableOpacity style={st.notFoundBtn} onPress={handleBack} activeOpacity={0.8}>
            <IconSymbol name="chevron.left" size={14} color={C.gold} />
            <Text style={st.notFoundBtnText}>Back to cases</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const episodeCards = (caseItem as any).episodeCards as PodcastEpisodeCard[] | undefined;
  const hasEpisodeCards = episodeCards && episodeCards.length > 0;
  const hasLiveEpisodes = liveEpisodes && liveEpisodes.length > 0;

  // ── Episode grouping for live episodes ──
  const startHereEps = (liveEpisodes ?? []).filter(ep =>
    (ep.durationSeconds ?? 0) > 0 && (ep.durationSeconds ?? 0) <= 2700
  );
  const deepDiveEps = (liveEpisodes ?? []).filter(ep =>
    (ep.durationSeconds ?? 0) > 5400
  );
  const latestUpdateEps = (liveEpisodes ?? []).filter(ep => {
    if (!ep.publishDate) return false;
    const d = new Date(ep.publishDate);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    return d >= cutoff;
  });
  const primarySourceEps = (liveEpisodes ?? []).filter(ep =>
    ep.storyPosition === 'trial' || ep.storyPosition === 'verdict' || ep.showTone === 'court'
  );
  const sensitiveEps = (liveEpisodes ?? []).filter(ep =>
    ep.showBanterLevel === 'none' && (ep.durationSeconds ?? 0) > 3600
  );

  // Remaining episodes not in any group
  const groupedIds = new Set([
    ...startHereEps.map(e => e.id),
    ...deepDiveEps.map(e => e.id),
  ]);
  const remainingEps = (liveEpisodes ?? []).filter(ep => !groupedIds.has(ep.id));

  // Build metadata row
  const metaParts: string[] = [];
  if ((caseItem as any).year) metaParts.push(String((caseItem as any).year));
  if ((caseItem as any).location) metaParts.push((caseItem as any).location);
  if (caseItem.crimeTypes.length > 0) {
    const ct = caseItem.crimeTypes[0];
    metaParts.push(ct === 'SerialOffender' ? 'Serial Offender' : ct === 'MissingPerson' ? 'Missing Person' : ct);
  }
  metaParts.push(statusLabel(caseItem.caseStatus));

  return (
    <SafeAreaView style={st.safeArea} edges={['top', 'left', 'right']}>
      {/* Nav bar — always in document flow, never floating */}
      <NavBar onBack={handleBack} onShare={handleShare} onSave={handleSave} saved={saved} />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Case Header ── */}
        <View style={st.header}>
          {caseItem.coverImage ? (
            <View style={st.headerImageStrip}>
              <Image source={{ uri: caseItem.coverImage }} style={st.headerImage} contentFit="cover" />
              <View style={st.headerImageFade} />
            </View>
          ) : null}

          <View style={st.headerContent}>
            <Text style={st.caseTitle}>{caseItem.title}</Text>

            {/* Compact metadata fact row */}
            {metaParts.length > 0 && (
              <View style={st.metaFactRow}>
                {metaParts.map((part, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {i > 0 && <Text style={st.metaFactDot}>·</Text>}
                    <Text style={st.metaFact}>{part}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Episode count */}
            {hasLiveEpisodes && (
              <Text style={st.episodeCountLine}>
                {liveEpisodes!.length} podcast episodes covering this case
              </Text>
            )}
          </View>
        </View>

        <View style={st.divider} />

        {/* ── Case Summary ── */}
        <View style={st.section}>
          <Text style={st.summary}>{caseItem.summary}</Text>
        </View>

        {/* ── Before You Listen ── */}
        <BeforeYouListen
          notes={caseItem.contentNotes}
          flags={{
            hasChildVictim: caseItem.hasChildVictim,
            isFamilicide: caseItem.isFamilicide,
            hasSexualAssault: caseItem.hasSexualAssault,
            hasSuicide: caseItem.hasSuicide,
            hasDomesticViolence: caseItem.hasDomesticViolence,
            hasPsychManipulation: caseItem.hasPsychManipulation,
          }}
        />

        <View style={st.divider} />

        {/* ── Section heading ── */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Compare episodes</Text>
          <Text style={st.sectionSubtitle}>
            Chosen for clarity, pacing, spoiler safety, and how well they explain the case.
          </Text>
        </View>

        {/* ── Loading ── */}
        {episodesLoading && (
          <View style={[st.emptyState, { marginHorizontal: 16 }]}>
            <Text style={st.emptyStateText}>Loading episodes…</Text>
          </View>
        )}

        {/* ── Live episodes — grouped ── */}
        {!episodesLoading && hasLiveEpisodes && (
          <View style={st.episodeSection}>

            {/* Start Here */}
            {startHereEps.length > 0 && (
              <>
                <GroupHeader
                  title="Start Here"
                  subtitle="Best first-listen episodes — under 45 minutes."
                  count={startHereEps.length}
                />
                {startHereEps.slice(0, 5).map((ep, i) => (
                  <LiveEpisodeCard key={ep.id} ep={ep as any} rank={i + 1} />
                ))}
              </>
            )}

            {/* Deep Dives */}
            {deepDiveEps.length > 0 && (
              <>
                <GroupHeader
                  title="Deep Dives"
                  subtitle="Longer, more detailed coverage."
                  count={deepDiveEps.length}
                />
                {deepDiveEps.slice(0, 5).map((ep, i) => (
                  <LiveEpisodeCard key={ep.id} ep={ep as any} rank={i + 1} />
                ))}
              </>
            )}

            {/* Latest Updates */}
            {latestUpdateEps.length > 0 && (
              <>
                <GroupHeader
                  title="Latest Updates"
                  subtitle="Episodes from the past year."
                  count={latestUpdateEps.length}
                />
                {latestUpdateEps.slice(0, 3).map((ep, i) => (
                  <LiveEpisodeCard key={ep.id} ep={ep as any} rank={i + 1} />
                ))}
              </>
            )}

            {/* Primary Sources */}
            {primarySourceEps.length > 0 && (
              <>
                <GroupHeader
                  title="Primary Sources"
                  subtitle="Episodes with court coverage, trial testimony, or primary audio."
                  count={primarySourceEps.length}
                />
                {primarySourceEps.slice(0, 3).map((ep, i) => (
                  <LiveEpisodeCard key={ep.id} ep={ep as any} rank={i + 1} />
                ))}
              </>
            )}

            {/* All episodes if no groups formed, or remaining */}
            {startHereEps.length === 0 && deepDiveEps.length === 0 && (
              <>
                <GroupHeader
                  title="All Episodes"
                  subtitle="Browse all podcast coverage of this case."
                  count={liveEpisodes!.length}
                />
                {liveEpisodes!.slice(0, 20).map((ep, i) => (
                  <LiveEpisodeCard key={ep.id} ep={ep as any} rank={i + 1} />
                ))}
              </>
            )}

            {/* Remaining (not in start here or deep dive) */}
            {(startHereEps.length > 0 || deepDiveEps.length > 0) && remainingEps.length > 0 && (
              <>
                <GroupHeader
                  title="More Episodes"
                  subtitle="Additional coverage of this case."
                  count={remainingEps.length}
                />
                {remainingEps.slice(0, 10).map((ep, i) => (
                  <LiveEpisodeCard key={ep.id} ep={ep as any} rank={i + 1} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Curated Episode Cards ── */}
        {!hasLiveEpisodes && !episodesLoading && hasEpisodeCards && (
          <View style={st.episodeSection}>
            <GroupHeader
              title="Curated Episodes"
              subtitle="Chosen for clarity, pacing, and spoiler safety."
              count={episodeCards!.length}
            />
            {episodeCards!.map((ep, i) => (
              <CuratedEpisodeCard key={ep.episodeId ?? i} ep={ep} rank={i + 1} />
            ))}
          </View>
        )}

        {/* ── Legacy podcast cards ── */}
        {!hasLiveEpisodes && !episodesLoading && !hasEpisodeCards && caseItem.podcasts.length > 0 && (
          <View style={st.episodeSection}>
            <GroupHeader
              title="Podcast Coverage"
              subtitle="Shows covering this case."
              count={caseItem.podcasts.length}
            />
            {caseItem.podcasts.map((p, i) => (
              <LegacyPodcastCard key={i} podcast={p} rank={i + 1} />
            ))}
          </View>
        )}

        {/* ── No episodes ── */}
        {!episodesLoading && !hasLiveEpisodes && !hasEpisodeCards && caseItem.podcasts.length === 0 && (
          <View style={[st.emptyState, { marginHorizontal: 16 }]}>
            <Text style={st.emptyStateText}>No podcast episodes found for this case yet.</Text>
          </View>
        )}

        {/* ── Bottom CTA ── */}
        <TouchableOpacity
          style={st.bottomCta}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/podcast-search', params: { prefill: caseItem?.title ?? '' } });
          }}
          activeOpacity={0.8}
        >
          <IconSymbol name="magnifyingglass" size={13} color={C.gold} />
          <Text style={st.bottomCtaText}>Compare all episodes for this case</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  notFoundSub: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  notFoundBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, padding: 10 },
  notFoundBtnText: { fontSize: 15, color: C.gold, fontWeight: '600' },

  // Nav bar — in document flow
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  navBackBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
  },
  navBackLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: C.gold,
    letterSpacing: 0.1,
  },
  navBookmarkBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.goldBorder,
    backgroundColor: 'transparent',
    marginLeft: 4,
  },
  navBookmarkBtnSaved: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  navBookmarkLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: C.gold,
    letterSpacing: 0.2,
  },

  // Header
  header: {},
  headerImageStrip: { width: '100%', height: 110, position: 'relative' },
  headerImage: { width: '100%', height: 110 },
  headerImageFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,16,0.55)',
  },
  headerContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  caseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
    lineHeight: 30,
    marginBottom: 8,
  },
  metaFactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  metaFact: { fontSize: 13, color: C.textSub },
  metaFactDot: { fontSize: 11, color: C.textMuted, marginHorizontal: 5 },
  episodeCountLine: { fontSize: 12, color: C.textMuted, marginTop: 6 },

  // Divider
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginVertical: 2 },

  // Section
  section: { paddingHorizontal: 20, paddingVertical: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: C.textSub, lineHeight: 18 },
  summary: { fontSize: 15, color: C.textSub, lineHeight: 22 },

  // Before you listen
  beforeListen: {
    marginHorizontal: 20, marginBottom: 10,
    padding: 12,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  beforeListenHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  beforeListenTitle: { fontSize: 11, fontWeight: '600', color: C.gold, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Episode section
  episodeSection: { paddingHorizontal: 16, paddingBottom: 8 },

  // Group header
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 10,
  },
  groupHeaderLeft: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.1 },
  groupSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  groupCount: {
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    marginLeft: 8,
    marginTop: 2,
  },
  groupCountText: { fontSize: 11, color: C.textMuted, fontWeight: '600' },

  // Empty state
  emptyState: {
    paddingVertical: 24, alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 8,
  },
  emptyStateText: { fontSize: 13, color: C.textMuted, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  artwork: { width: 50, height: 50, borderRadius: 8, flexShrink: 0 },
  artworkPlaceholder: { backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  artworkRank: { fontSize: 15, fontWeight: '700', color: C.gold },
  cardIdentity: { flex: 1, gap: 2 },
  podcastName: { fontSize: 10, fontWeight: '700', color: C.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
  episodeTitle: { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  metaText: { fontSize: 11, color: C.textMuted },

  // Badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 12, paddingBottom: 10 },
  fitBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: C.goldDim, borderRadius: 6,
    borderWidth: 0.5, borderColor: C.goldBorder,
  },
  fitBadgeText: { fontSize: 11, color: C.gold, fontWeight: '600' },

  // Spoiler block
  spoilerBlock: {
    marginHorizontal: 12, marginBottom: 10,
    padding: 10,
    backgroundColor: C.spoilerBg,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.spoilerBorder,
    gap: 4,
  },
  spoilerText: { fontSize: 12, color: C.spoiler, fontWeight: '500', lineHeight: 17 },

  // Card detail
  cardDetail: {
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 10,
    borderTopWidth: 0.5, borderTopColor: C.border,
    gap: 10,
  },
  detailBlock: { gap: 3 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText: { fontSize: 13, color: C.textSub, lineHeight: 19 },
  watchOutBlock: {
    padding: 10, backgroundColor: C.warningBg,
    borderRadius: 8, borderWidth: 0.5, borderColor: C.warningBorder,
  },

  // Tag chips
  tagSection: { gap: 5 },
  tagSectionLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: C.surfaceHigh, borderRadius: 6,
    borderWidth: 0.5, borderColor: C.borderLight,
  },
  tagChipText: { fontSize: 11, color: C.textSub },
  tagChipWarning: { backgroundColor: C.warningBg, borderColor: C.warningBorder },

  // Listen buttons
  listenBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  listenBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8,
  },
  appleBtn: { backgroundColor: C.appleBg },
  spotifyBtn: { backgroundColor: C.spotifyBg },
  listenBtnText: { fontSize: 13, fontWeight: '600' },

  // Bottom CTA
  bottomCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
  },
  bottomCtaText: { fontSize: 14, color: C.gold, fontWeight: '500' },
});
