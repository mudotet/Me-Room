import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../ui/BottomNav';
import Robot from '../ui/Robot';
import { ApiStatus, colors, statusLabel } from '../ui/theme';

type Props = { onScan: () => void; onOpenRoom: (kind: 'living' | 'bedroom') => void; onProfile: () => void; apiStatus: ApiStatus };

export default function HomeScreen({ onScan, onOpenRoom, onProfile, apiStatus }: Props) {
  const [toast, setToast] = useState('');
  const [showAll, setShowAll] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const notify = () => {
    setToast('Bạn chưa có thông báo mới.');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3000);
  };
  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <LinearGradient colors={['#987CFF', '#664BDB']} style={styles.brandMark}><Ionicons name="home-outline" size={20} color="white" /></LinearGradient>
            <Text accessibilityRole="header" style={styles.brandName}>Me <Text style={styles.brandPurple}>Room</Text></Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Mở thông báo" onPress={notify} style={styles.iconButton}><Ionicons name="notifications-outline" size={23} color={colors.ink} /></Pressable>
        </View>
        <View style={styles.intro}>
          <View style={styles.eyebrow}><View style={[styles.statusDot, apiStatus !== 'online' && { backgroundColor: apiStatus === 'offline' ? '#C79350' : colors.purple }]} /><Text style={styles.eyebrowText}>{statusLabel[apiStatus].toLocaleUpperCase('vi-VN')}</Text></View>
          <Text accessibilityRole="header" style={styles.title}>Biến căn phòng{ '\n' }<Text style={styles.purple}>thành cảm hứng.</Text></Text>
          <Text style={styles.description}>Quét không gian của bạn, để Roomie gợi ý phong cách và cách sắp xếp phù hợp.</Text>
        </View>
        <LinearGradient colors={['#7458E4', '#5E45CA', '#4936B1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.assistantCard}>
          <View style={styles.orbitOne} /><View style={styles.orbitTwo} />
          <Text style={styles.cardLabel}>ROOMIE AI · ROOM SCANNER</Text>
          <View style={styles.robotOrb}><View style={styles.orbGlow} /><Robot size={85} /></View>
          <View style={styles.bubble}><Text style={styles.greeting}>Xin chào, bạn!</Text><Text style={styles.bubbleText}>Mình có thể giúp bạn khám phá căn phòng mới hôm nay.</Text></View>
          <Pressable accessibilityRole="button" onPress={onScan} style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.85 }]}><Ionicons name="scan-outline" size={20} color={colors.purpleDeep} /><Text style={styles.scanText}>Bắt đầu quét phòng</Text></Pressable>
        </LinearGradient>
        <View style={styles.sectionHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>{showAll ? 'Khám phá không gian' : 'Không gian gần đây'}</Text><Pressable accessibilityRole="button" onPress={() => setShowAll(!showAll)} style={styles.seeAll}><Text style={styles.link}>{showAll ? 'Thu gọn' : 'Xem tất cả'}</Text></Pressable></View>
        {showAll && <Text style={styles.demoExplanation}>Hai không gian mẫu để bạn trải nghiệm góc nhìn 3D trước khi quét phòng của mình.</Text>}
        <View style={styles.rooms}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mở phòng khách mẫu trong 3D" onPress={() => onOpenRoom('living')} style={({ pressed }) => [styles.roomCard, pressed && { opacity: 0.8 }]}>
            <View style={[styles.roomArt, { backgroundColor: '#D5CEFF' }]}><View style={styles.loungeDiagonal} /><View style={styles.loungeSofa} /><View style={styles.loungeLamp} /><View style={styles.loungeChair} /></View>
            <View style={styles.roomCopy}><Text style={styles.roomName}>Phòng khách</Text><Text style={styles.roomMeta}>Không gian mẫu · 3D</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mở phòng ngủ mẫu trong 3D" onPress={() => onOpenRoom('bedroom')} style={({ pressed }) => [styles.roomCard, pressed && { opacity: 0.8 }]}>
            <LinearGradient colors={['#F8E4DE', '#B392B8']} style={styles.roomArt}><View style={styles.bedHead} /><View style={styles.bed} /><View style={styles.wardrobe} /></LinearGradient>
            <View style={styles.roomCopy}><Text style={styles.roomName}>Phòng ngủ</Text><Text style={styles.roomMeta}>Không gian mẫu · 3D</Text></View>
          </Pressable>
        </View>
      </ScrollView>
      {toast !== '' && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
      <BottomNav active="home" onHome={() => setShowAll(false)} onScan={onScan} onProfile={onProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 22, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 22, paddingBottom: 27 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: colors.purple, shadowRadius: 12, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  brandName: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: colors.ink, letterSpacing: -0.7 },
  brandPurple: { color: colors.purple },
  iconButton: { width: 44, height: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  intro: { gap: 12 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 30, backgroundColor: colors.lavender },
  statusDot: { width: 6, height: 6, borderRadius: 5, backgroundColor: '#55D49D' },
  eyebrowText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.45, color: colors.purpleDeep },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 32, lineHeight: 36, letterSpacing: -1.15, color: colors.ink, marginTop: 4 },
  purple: { color: colors.purple },
  description: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 14, lineHeight: 22, maxWidth: 350 },
  assistantCard: { marginTop: 26, borderRadius: 27, padding: 20, minHeight: 288, overflow: 'hidden' },
  orbitOne: { position: 'absolute', width: 265, height: 265, borderRadius: 150, borderWidth: 1, borderColor: '#FFFFFF20', right: -85, top: -80 },
  orbitTwo: { position: 'absolute', width: 350, height: 350, borderRadius: 180, borderWidth: 1, borderColor: '#FFFFFF20', right: -128, top: -120 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#E0D7FF' },
  robotOrb: { position: 'absolute', right: 20, top: 52, width: 145, height: 145, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 },
  orbGlow: { position: 'absolute', width: 145, height: 145, borderRadius: 80, backgroundColor: '#D7C7FF35', borderTopWidth: 1, borderColor: '#FFFFFF20' },
  bubble: { marginTop: 78, width: 184, backgroundColor: '#FAF8FF', borderRadius: 17, borderBottomLeftRadius: 5, padding: 14 },
  greeting: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 13, marginBottom: 5 },
  bubbleText: { fontFamily: 'DMSans_400Regular', color: colors.ink, fontSize: 12, lineHeight: 18 },
  scanButton: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, marginTop: 15, minHeight: 46 },
  scanText: { fontSize: 13, color: colors.purpleDeep, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 7 },
  sectionTitle: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 17, letterSpacing: -0.4 },
  seeAll: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingLeft: 10 },
  link: { fontSize: 12, fontWeight: '700', color: colors.purpleDeep },
  demoExplanation: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  rooms: { flexDirection: 'row', gap: 12 },
  roomCard: { flex: 1, maxWidth: 190, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  roomArt: { height: 99, position: 'relative', overflow: 'hidden' },
  loungeDiagonal: { position: 'absolute', height: 200, width: 200, backgroundColor: '#8B78D9', transform: [{ rotate: '48deg' }], left: 103, top: 6 },
  loungeSofa: { position: 'absolute', width: 90, height: 40, backgroundColor: '#8D6A53', borderTopLeftRadius: 12, borderTopRightRadius: 12, bottom: 0, left: 43 },
  loungeLamp: { position: 'absolute', width: 36, height: 57, backgroundColor: '#FFD889', borderTopLeftRadius: 8, borderTopRightRadius: 8, bottom: 0, left: 13 },
  loungeChair: { position: 'absolute', width: 35, height: 38, backgroundColor: '#5B498F', borderTopLeftRadius: 8, borderTopRightRadius: 8, bottom: 0, right: 7 },
  bedHead: { position: 'absolute', left: 22, right: 14, height: 40, bottom: 0, backgroundColor: '#D9C0CA', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  bed: { position: 'absolute', left: 22, width: 103, height: 32, bottom: 0, backgroundColor: '#EEE5DF', borderTopLeftRadius: 11, borderTopRightRadius: 11 },
  wardrobe: { position: 'absolute', right: 9, bottom: 0, height: 56, width: 40, backgroundColor: '#8F6B7D', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  roomCopy: { paddingHorizontal: 11, paddingVertical: 11, gap: 5 },
  roomName: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  roomMeta: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 10 },
  toast: { position: 'absolute', bottom: 103, alignSelf: 'center', backgroundColor: '#261A4A', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  toastText: { color: '#FFFFFF', fontSize: 13 },
});
