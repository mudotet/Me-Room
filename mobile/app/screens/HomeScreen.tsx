import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../ui/BottomNav';
import Robot from '../ui/Robot';
import { ApiStatus, colors, statusLabel } from '../ui/theme';

type Props = { onScan: () => void; onOpenRoom: (kind: 'living' | 'bedroom') => void; onProfile: () => void; apiStatus: ApiStatus };

export default function HomeScreen({ onScan, onOpenRoom, onProfile, apiStatus }: Props) {
  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.studio}>STUDIO THIẾT KẾ KHÔNG GIAN</Text>
            <Text accessibilityRole="header" style={styles.brand}>Me Room</Text>
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.status}>{statusLabel[apiStatus]}</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.kicker}>Không gian sống, theo cách của bạn</Text>
          <Text accessibilityRole="header" style={styles.title}>Một căn phòng.{ '\n' }Nhiều cách sống.</Text>
          <Text style={styles.description}>Quét video căn phòng để tạo bản dựng 3D và thử những cách sắp xếp khác nhau.</Text>
        </View>

        <View style={styles.roomieRow}>
          <Robot size={36} />
          <View style={styles.roomieCopy}>
            <Text style={styles.roomieName}>Roomie</Text>
            <Text style={styles.roomieHint}>Mở phòng 3D để trao đổi về cách sắp xếp.</Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.planHeading}>
            <Text style={styles.planLabel}>Mặt bằng minh họa</Text>
            <Text style={styles.planNumber}>01</Text>
          </View>
          <View style={styles.planStage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={styles.planRoom}>
              <View style={styles.planRug} />
              <View style={styles.planSofa}><View style={styles.planSofaSeat} /></View>
              <View style={styles.planTable} />
              <View style={styles.planCabinet} />
              <View style={styles.planBed}><View style={styles.planPillow} /></View>
              <View style={styles.planWall} />
              <View style={styles.planDoor} />
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={onScan} style={({ pressed }) => [styles.scanButton, pressed && styles.pressedButton]}>
            <Text style={styles.scanText}>Quét căn phòng của tôi</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.surface} />
          </Pressable>
          <Text style={styles.featureNote}>Quay hoặc chọn video · tối đa 2 phút</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Bản dựng 3D</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Phòng mẫu</Text>
          </View>
          <Text style={styles.sampleNote}>Dữ liệu minh họa</Text>
        </View>
        <View style={styles.samples}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mở phòng khách mẫu 3D, kích thước 5,2 nhân 5,8 mét" accessibilityHint="Mở bản dựng phòng khách minh họa" onPress={() => onOpenRoom('living')} style={({ pressed }) => [styles.sample, styles.livingSample, pressed && styles.pressedCard]}>
            <View style={styles.livingArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.livingWindow} /><View style={styles.livingRug} /><View style={styles.livingSofa}><View style={styles.sofaSeam} /></View><View style={styles.livingTable} /><View style={styles.livingPlant}><View style={styles.plantStem} /></View>
            </View>
            <Text style={styles.sampleType}>Phòng khách · Mẫu</Text>
            <Text style={styles.sampleSize}>5,2 × 5,8 m</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mở phòng ngủ mẫu 3D, kích thước 4 nhân 5 mét" accessibilityHint="Mở bản dựng phòng ngủ minh họa" onPress={() => onOpenRoom('bedroom')} style={({ pressed }) => [styles.sample, styles.bedroomSample, pressed && styles.pressedCard]}>
            <View style={styles.bedroomArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.bedroomBed}><View style={styles.bedroomPillow} /></View><View style={styles.bedroomTable} /><View style={styles.bedroomWindow} />
            </View>
            <Text style={styles.sampleType}>Phòng ngủ · Mẫu</Text>
            <Text style={styles.sampleSize}>4 × 5 m</Text>
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav active="home" onHome={() => undefined} onScan={onScan} onProfile={onProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  studio: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 9, letterSpacing: 1.1 },
  brand: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 25, letterSpacing: -0.7, marginTop: 2 },
  status: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 10, textAlign: 'right', maxWidth: 132, paddingBottom: 5 },
  intro: { marginTop: 30, gap: 10 },
  kicker: { fontFamily: 'DMSans_400Regular', color: colors.olive, fontSize: 10, letterSpacing: 1 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 32, lineHeight: 37, letterSpacing: -1.05 },
  description: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 330 },
  roomieRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, paddingHorizontal: 6 },
  roomieCopy: { flex: 1, gap: 3 },
  roomieName: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.purpleDeep, fontSize: 14 },
  roomieHint: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 12, lineHeight: 18 },
  feature: { backgroundColor: '#F0EDFF', marginTop: 16, padding: 16, borderRadius: 8 },
  planHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { fontFamily: 'DMSans_400Regular', color: colors.olive, fontSize: 9, letterSpacing: 1 },
  planNumber: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.muted, fontSize: 12 },
  planStage: { height: 150, justifyContent: 'center', alignItems: 'center' },
  planRoom: { width: '78%', height: 126, borderWidth: 1.5, borderColor: '#A99BD2', backgroundColor: colors.surface },
  planRug: { position: 'absolute', left: '9%', top: '19%', width: '44%', height: '62%', backgroundColor: '#EEEAF8', borderWidth: 1, borderColor: '#D4CAEF' },
  planSofa: { position: 'absolute', left: '13%', top: '26%', width: '36%', height: '21%', borderWidth: 1.5, borderColor: colors.purpleDeep, backgroundColor: '#DDD7F4', justifyContent: 'center', padding: 4 },
  planSofaSeat: { flex: 1, borderWidth: 1, borderColor: '#C8BDE8' },
  planTable: { position: 'absolute', left: '24%', top: '54%', width: 31, height: 31, borderRadius: 16, borderWidth: 1.5, borderColor: '#A99BD2', backgroundColor: '#E8DDF4' },
  planCabinet: { position: 'absolute', right: '9%', top: '14%', width: 27, height: 38, borderWidth: 1, borderColor: '#A99BD2', backgroundColor: '#F1EDFA' },
  planBed: { position: 'absolute', right: '8%', bottom: '11%', width: 56, height: 43, borderWidth: 1.5, borderColor: colors.purpleDeep, backgroundColor: '#E2DCF1', justifyContent: 'flex-start', padding: 4 },
  planPillow: { width: 17, height: 8, borderWidth: 1, borderColor: '#C8BDE8', backgroundColor: colors.surface },
  planWall: { position: 'absolute', right: '38%', top: 0, height: '42%', width: 3, backgroundColor: '#A99BD2' },
  planDoor: { position: 'absolute', right: 0, bottom: '20%', width: 17, height: 1, backgroundColor: '#A99BD2' },
  scanButton: { minHeight: 50, backgroundColor: colors.olive, borderRadius: 7, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scanText: { fontFamily: 'DMSans_400Regular', color: colors.surface, fontSize: 14, fontWeight: '700' },
  pressedButton: { opacity: 0.76 },
  featureNote: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 10, marginTop: 9 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25, marginBottom: 8 },
  sectionKicker: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 9, letterSpacing: 1 },
  sectionTitle: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 20, letterSpacing: -0.5, marginTop: 2 },
  sampleNote: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 10, paddingBottom: 3 },
  samples: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  sample: { minHeight: 156 },
  livingSample: { flex: 1.12 },
  bedroomSample: { flex: 0.88, marginTop: 22 },
  livingArt: { height: 116, backgroundColor: '#EEEAF8', overflow: 'hidden', position: 'relative' },
  livingWindow: { position: 'absolute', left: '11%', top: 14, width: '44%', height: 4, backgroundColor: colors.surface },
  livingRug: { position: 'absolute', left: '16%', right: '9%', bottom: 11, height: 42, backgroundColor: '#DDD7F1' },
  livingSofa: { position: 'absolute', left: '12%', bottom: 21, width: '55%', height: 32, borderRadius: 5, backgroundColor: '#9887D8', borderBottomWidth: 4, borderColor: '#7866C3' },
  sofaSeam: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: '#ECE8FA' },
  livingTable: { position: 'absolute', width: 31, height: 31, borderRadius: 16, right: '11%', bottom: 17, backgroundColor: '#C7B5D7', borderWidth: 2, borderColor: '#EEEAF8' },
  livingPlant: { position: 'absolute', right: 9, top: 22, width: 16, height: 17, borderRadius: 10, backgroundColor: colors.purple },
  plantStem: { position: 'absolute', height: 16, width: 2, backgroundColor: '#7B69C0', left: 7, top: 13 },
  bedroomArt: { height: 96, marginTop: 20, backgroundColor: '#F0EDFF', overflow: 'hidden', position: 'relative' },
  bedroomBed: { position: 'absolute', left: '12%', right: '12%', bottom: 13, height: 47, backgroundColor: '#DDD7ED', borderWidth: 1, borderColor: '#AA9BCE' },
  bedroomPillow: { position: 'absolute', top: 6, left: 7, width: '35%', height: 13, backgroundColor: colors.surface },
  bedroomTable: { position: 'absolute', right: '5%', top: 19, width: 20, height: 23, backgroundColor: '#C7B5D7' },
  bedroomWindow: { position: 'absolute', left: '12%', top: 12, width: '42%', height: 3, backgroundColor: colors.surface },
  sampleType: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 9, letterSpacing: 0.35, marginTop: 8 },
  sampleSize: { fontFamily: 'DMSans_400Regular', color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 2 },
  pressedCard: { opacity: 0.68 },
});
