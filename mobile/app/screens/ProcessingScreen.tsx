import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../ui/theme';

type Props = { onCancel: () => void; error?: string; onRetry?: () => void };

export default function ProcessingScreen({ onCancel, error, onRetry }: Props) {
  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.indicator}>{error ? <Ionicons name="cloud-offline-outline" size={28} color={colors.muted} /> : <ActivityIndicator accessibilityLabel="Đang phân tích video" size="large" color={colors.olive} />}</View>
          <Text accessibilityRole="header" style={styles.title}>{error ? 'Chưa thể phân tích video' : 'Đang phân tích video'}</Text>
          <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={styles.description}>{error ?? 'Video đang được gửi và phân tích. Thời gian có thể thay đổi theo độ dài video và kết nối.'}</Text>
          {error && onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Thử lại</Text><Ionicons name="arrow-forward" size={18} color={colors.surface} /></Pressable>}
        </View>
        <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>{error ? 'Quay lại' : 'Hủy xử lý'}</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  indicator: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.ink, fontSize: 23, letterSpacing: -0.5, textAlign: 'center', lineHeight: 30 },
  description: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 340 },
  retryButton: { minHeight: 48, backgroundColor: colors.olive, paddingHorizontal: 17, borderRadius: 7, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  retryText: { fontFamily: 'DMSans_400Regular', color: colors.surface, fontSize: 14, fontWeight: '700' },
  cancel: { alignSelf: 'center', minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, marginBottom: 12 },
  cancelText: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.65 },
});
