import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../ui/BottomNav';
import { ApiStatus, colors, statusLabel } from '../ui/theme';

type Props = { onHome: () => void; onScan: () => void; apiStatus: ApiStatus };

export default function ProfileScreen({ onHome, onScan, apiStatus }: Props) {
  const statusDescription = apiStatus === 'unconfigured'
    ? 'Dịch vụ chưa được cấu hình. Hai phòng mẫu vẫn mở được từ Trang chủ.'
    : apiStatus === 'offline'
      ? 'Hiện chưa kết nối được. Kiểm tra mạng rồi thử quét lại.'
      : apiStatus === 'checking'
        ? 'Ứng dụng đang kiểm tra kết nối tới dịch vụ.'
        : 'Dịch vụ đã phản hồi kiểm tra kết nối.';

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Me Room · Thông tin</Text>
        <Text accessibilityRole="header" style={styles.title}>Hướng dẫn</Text>
        <Text style={styles.intro}>Cách quét phòng và những điều cần biết về video của bạn.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái dịch vụ</Text>
          <Text style={styles.status}>{statusLabel[apiStatus]}</Text>
          <Text style={styles.body}>{statusDescription}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bắt đầu với một video</Text>
          <View style={styles.step}>
            <Text style={styles.number}>01</Text>
            <View style={styles.stepCopy}><Text style={styles.stepTitle}>Quay hoặc chọn video</Text><Text style={styles.body}>Video dài tối đa 2 phút và 250 MiB.</Text></View>
          </View>
          <View style={styles.step}>
            <Text style={styles.number}>02</Text>
            <View style={styles.stepCopy}><Text style={styles.stepTitle}>Gửi để phân tích</Text><Text style={styles.body}>Video chỉ được gửi sau khi bạn dừng quay hoặc chọn tệp.</Text></View>
          </View>
          <View style={styles.step}>
            <Text style={styles.number}>03</Text>
            <View style={styles.stepCopy}><Text style={styles.stepTitle}>Xem bản dựng 3D</Text><Text style={styles.body}>Phòng mẫu trên Trang chủ dùng dữ liệu minh họa.</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video & quyền riêng tư</Text>
          <Text style={styles.body}>Camera chỉ mở khi bạn chọn quét phòng. Video quay trong ứng dụng không thu âm; video chọn từ thư viện có thể kèm âm thanh. Me Room không gửi video cho đến khi bạn dừng quay hoặc chọn tệp.</Text>
        </View>
      </ScrollView>
      <BottomNav active="profile" onHome={onHome} onScan={onScan} onProfile={() => undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 },
  kicker: { fontFamily: 'DMSans_400Regular', color: colors.olive, fontSize: 12 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 29, letterSpacing: -0.8, marginTop: 8 },
  intro: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 14 },
  section: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 17, paddingBottom: 17 },
  sectionTitle: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 17, letterSpacing: -0.3, marginBottom: 9 },
  status: { fontFamily: 'DMSans_400Regular', color: colors.olive, fontSize: 14, fontWeight: '700' },
  body: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
  step: { flexDirection: 'row', gap: 13, paddingVertical: 9 },
  number: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.olive, fontSize: 13, paddingTop: 2 },
  stepCopy: { flex: 1 },
  stepTitle: { fontFamily: 'DMSans_400Regular', color: colors.ink, fontSize: 14, fontWeight: '700' },
});
