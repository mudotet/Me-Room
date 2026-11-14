import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

type Props = { active: 'home' | 'profile'; onHome: () => void; onScan: () => void; onProfile: () => void };

export default function BottomNav({ active, onHome, onScan, onProfile }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: active === 'home' }} accessibilityLabel="Trang chủ" onPress={onHome} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <Ionicons name="home-outline" size={21} color={active === 'home' ? colors.olive : colors.muted} />
        <Text style={[styles.label, active === 'home' && styles.active]}>Trang chủ</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Bắt đầu quét phòng" onPress={onScan} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <Ionicons name="scan-outline" size={21} color={colors.olive} />
        <Text style={[styles.label, styles.scanLabel]}>Quét phòng</Text>
      </Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: active === 'profile' }} accessibilityLabel="Hồ sơ" onPress={onProfile} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <Ionicons name="person-outline" size={21} color={active === 'profile' ? colors.olive : colors.muted} />
        <Text style={[styles.label, active === 'profile' && styles.active]}>Hồ sơ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.line, paddingTop: 6 },
  item: { flex: 1, minHeight: 52, minWidth: 44, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 11 },
  active: { color: colors.olive, fontWeight: '700' },
  scanLabel: { color: colors.olive, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
