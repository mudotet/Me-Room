import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../ui/theme';

type Props = { onCancel: () => void; error?: string; onRetry?: () => void };

export default function ProcessingScreen({ onCancel, error, onRetry }: Props) {
  return (
    <LinearGradient colors={['#201734', '#2F215F', '#141023']} locations={[0, 0.4, 1]} style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.outerRing}><View style={styles.middleRing}><View style={styles.innerRing}>{error ? <Ionicons name="cloud-offline-outline" size={34} color="#D9CAFF" /> : <ActivityIndicator accessibilityLabel="Đang phân tích căn phòng" size="large" color={colors.mint} />}</View></View></View>
          <Text accessibilityRole="header" style={styles.title}>{error ? 'Chưa thể dựng không gian' : 'Đang dựng không gian của bạn'}</Text>
          <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={styles.description}>{error ?? 'Roomie đang phân tích ánh sáng, kích thước\nvà bố cục căn phòng.'}</Text>
          {!error && <View style={styles.progressTrack}><View style={styles.progressGlow} /></View>}
          {error && onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}><Ionicons name="refresh-outline" size={18} color="white" /><Text style={styles.retryText}>Thử lại</Text></Pressable>}
        </View>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>{error ? 'Quay lại' : 'Hủy xử lý'}</Text></Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 25 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  outerRing: { width: 156, height: 156, borderRadius: 90, backgroundColor: '#805DE512', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  middleRing: { width: 122, height: 122, borderRadius: 80, backgroundColor: '#17102950', borderWidth: 1, borderColor: '#967ADB50', alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 90, height: 90, borderRadius: 60, backgroundColor: '#8D67E812', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', lineHeight: 31 },
  description: { color: '#BAACD0', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 11, maxWidth: 360 },
  progressTrack: { width: 190, height: 3, borderRadius: 4, backgroundColor: '#AAA0BD38', marginTop: 31, overflow: 'hidden' },
  progressGlow: { width: '100%', height: '100%', backgroundColor: '#B299FF50' },
  retryButton: { backgroundColor: colors.purple, paddingHorizontal: 24, paddingVertical: 15, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 25 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancel: { alignSelf: 'center', minHeight: 48, justifyContent: 'center', paddingHorizontal: 25, marginBottom: 15 },
  cancelText: { color: '#D0C2E5', fontSize: 13 },
});
