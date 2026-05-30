import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'solved' | 'unsolved' | 'ongoing' | 'wrongful' | 'coldcase' | 'default' | 'emerald' | 'sand' | 'wine';

interface BadgePillProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  solved: { bg: '#1D3828', text: '#4ADE80', border: '#1D6B4E' },
  unsolved: { bg: '#3D1520', text: '#F87171', border: '#8B1A3A' },
  ongoing: { bg: '#2A2010', text: '#FBBF24', border: '#A0720A' },
  wrongful: { bg: '#1A2A3D', text: '#60A5FA', border: '#1D4ED8' },
  coldcase: { bg: '#1E1E2A', text: '#A78BFA', border: '#6D28D9' },
  default: { bg: '#2A2420', text: '#A89F96', border: '#3D3530' },
  emerald: { bg: '#1D3828', text: '#4ADE80', border: '#1D6B4E' },
  sand: { bg: '#2A2010', text: '#C4A882', border: '#6B5A3A' },
  wine: { bg: '#3D1520', text: '#C4A882', border: '#8B1A3A' },
};

export function BadgePill({ label, variant = 'default' }: BadgePillProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

export function caseStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'Solved': return 'solved';
    case 'Unsolved': return 'unsolved';
    case 'Ongoing': return 'ongoing';
    case 'WrongfulConviction': return 'wrongful';
    case 'ColdCase': return 'coldcase';
    default: return 'default';
  }
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
