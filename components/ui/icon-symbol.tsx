import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "list.bullet": "format-list-bulleted",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "gearshape.fill": "settings",
  // Actions
  "magnifyingglass": "search",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  // Content
  "heart": "favorite-border",
  "heart.fill": "favorite",
  "lock.fill": "lock",
  "eye": "visibility",
  "eye.slash": "visibility-off",
  "arrow.up.right.square": "open-in-new",
  "star.fill": "star",
  "info.circle": "info",
  "exclamationmark.triangle": "warning",
  "checkmark.circle.fill": "check-circle",
  "checkmark.shield.fill": "verified-user",
  "plus": "add",
  "minus": "remove",
  "slider.horizontal.3": "tune",
  "arrow.clockwise": "refresh",
  "waveform": "graphic-eq",
  "mic.fill": "mic",
  "headphones": "headphones",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "square.and.arrow.up": "share",
  "bell.fill": "notifications",
  "clock.fill": "access-time",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
