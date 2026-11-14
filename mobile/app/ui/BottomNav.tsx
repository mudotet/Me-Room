import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

type Props = { active: 'home' | 'profile'; onHome: () => void; onScan: () => void; onProfile: () => void };

export default function BottomNav({ active, onHome, onScan, onProfile }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 15) }]}>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: active === 'home' }} accessibilityLabel="Trang chủ" onPress={onHome} style={styles.item}>
        {active === 'home' && <View style={styles.activeLine} />}
        <Ionicons name="home-outline" size={22} color={active === 'home' ? colors.purpleDeep : colors.muted} />
        <Text style={[styles.label, active === 'home' && styles.active]}>Trang chủ</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Bắt đầu quét phòng" onPress={onScan} style={styles.item}>
        <LinearGradient colors={['#866DF1', '#5D43CA']} style={styles.scan}><Ionicons name="scan-outline" color="white" size={26} /></LinearGradient>
        <Text style={styles.label}>Quét phòng</Text>
      </Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: active === 'profile' }} accessibilityLabel="Hồ sơ" onPress={onProfile} style={styles.item}>
        {active === 'profile' && <View style={styles.activeLine} />}
        <Ionicons name="person-outline" size={22} color={active === 'profile' ? colors.purpleDeep : colors.muted} />
        <Text style={[styles.label, active === 'profile' && styles.active]}>Hồ sơ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: colors.line, paddingTop: 15 },
  item: { minHeight: 48, minWidth: 80, alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  active: { color: colors.purpleDeep },
  activeLine: { position: 'absolute', top: -15, height: 3, width: 28, borderRadius: 4, backgroundColor: colors.purple },
  scan: { height: 55, width: 55, borderRadius: 15, borderWidth: 5, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: -35, shadowColor: colors.purpleDeep, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
});
