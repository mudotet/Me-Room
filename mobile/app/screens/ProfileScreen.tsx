import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../ui/BottomNav';
import Robot from '../ui/Robot';
import { ApiStatus, colors, statusLabel } from '../ui/theme';

type Props = { onHome: () => void; onScan: () => void; apiStatus: ApiStatus };

export default function ProfileScreen({ onHome, onScan, apiStatus }: Props) {
  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text accessibilityRole="header" style={styles.title}>Không gian của bạn</Text>
        <View style={styles.avatar}><Robot size={68} /></View>
        <Text style={styles.name}>Chào bạn, mình là Roomie.</Text>
        <Text style={styles.description}>Cùng khám phá những ý tưởng mới cho một căn phòng mang dấu ấn của bạn.</Text>
        <View style={styles.card}>
          <View style={styles.row}><Ionicons name="sparkles-outline" size={22} color={colors.purple} /><Text style={styles.cardTitle}>Trợ lý thiết kế</Text></View>
          <Text style={styles.cardText}>{statusLabel[apiStatus]}{apiStatus === 'unconfigured' ? '. Bạn vẫn có thể khám phá hai căn phòng mẫu trên trang chủ.' : apiStatus === 'offline' ? '. Hãy kiểm tra kết nối và thử lại sau.' : '.'}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.row}><Ionicons name="shield-checkmark-outline" size={22} color={colors.purple} /><Text style={styles.cardTitle}>Bạn kiểm soát video của mình</Text></View>
          <Text style={styles.cardText}>Camera chỉ mở khi bạn chọn quét phòng. Video quay trực tiếp không thu âm; video chọn từ thư viện có thể kèm âm thanh. Video chỉ được gửi khi bạn hoàn tất quay hoặc chọn video.</Text>
        </View>
      </ScrollView>
      <BottomNav active="profile" onHome={onHome} onScan={onScan} onProfile={() => undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 24, paddingTop: 29, paddingBottom: 45 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.7 },
  avatar: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#E8DFFF', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 36, paddingBottom: 13 },
  name: { color: colors.ink, textAlign: 'center', fontSize: 20, fontWeight: '700', marginTop: 22 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 25 },
  card: { padding: 20, marginTop: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '700' },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 12 },
});
