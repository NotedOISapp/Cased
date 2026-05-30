import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './ui/icon-symbol';
import type { TruecrimeCase } from '@/lib/types';

interface RevealModalProps {
  visible: boolean;
  caseItem: TruecrimeCase | null;
  onReveal: () => void;
  onCancel: () => void;
}

export function RevealModal({ visible, caseItem, onReveal, onCancel }: RevealModalProps) {
  if (!caseItem) return null;

  const reasons: string[] = [];
  if (caseItem.hasChildVictim) reasons.push('child victim');
  if (caseItem.isFamilicide) reasons.push('familicide');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Icon */}
              <View style={styles.iconWrap}>
                <IconSymbol name="exclamationmark.triangle" size={28} color="#C4A882" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Content Notice</Text>

              {/* Case name */}
              <Text style={styles.caseName}>{caseItem.title}</Text>

              {/* Warning */}
              <Text style={styles.body}>
                This case contains content you've chosen to filter:{' '}
                <Text style={styles.highlight}>{reasons.join(' and ')}</Text>.
              </Text>
              <Text style={styles.body}>
                You can reveal this case now without changing your global settings. Your boundaries
                remain in place for all other cases.
              </Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                  <Text style={styles.cancelText}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.revealBtn}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    onReveal();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.revealText}>Reveal This Case</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,13,12,0.88)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sheet: {
    backgroundColor: '#2A2420',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2010',
    borderWidth: 1,
    borderColor: '#A0720A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F0EB',
    textAlign: 'center',
    marginBottom: 6,
  },
  caseName: {
    fontSize: 14,
    color: '#C4A882',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  body: {
    fontSize: 14,
    color: '#A89F96',
    lineHeight: 21,
    marginBottom: 10,
    textAlign: 'center',
  },
  highlight: {
    color: '#F5F0EB',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#3D3530',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5A4F48',
  },
  cancelText: {
    color: '#A89F96',
    fontSize: 15,
    fontWeight: '600',
  },
  revealBtn: {
    flex: 1,
    backgroundColor: '#8B1A3A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  revealText: {
    color: '#F5F0EB',
    fontSize: 15,
    fontWeight: '700',
  },
});
