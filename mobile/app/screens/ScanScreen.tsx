import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../ui/theme';
import type { Capture } from '../types';

export type { Capture } from '../types';
type Props = { onClose: () => void; onCapture: (capture: Capture) => void };
const MIN_RECORDING_SECONDS = 5;
const MAX_RECORDING_SECONDS = 15;
const isWeb = Platform.OS === 'web';

function nativeFileSize(uri: string): number | undefined {
  if (isWeb) return undefined;
  try {
    const size = new ExpoFile(uri).size;
    // Expo reports zero for unreadable files; leave unavailable metadata absent.
    return Number.isFinite(size) && size > 0 ? size : undefined;
  } catch {
    return undefined;
  }
}

function safeStopRecording(camera: CameraView | null): boolean {
  try {
    if (!camera) return false;
    camera.stopRecording();
    return true;
  } catch {
    return false;
  }
}

export default function ScanScreen({ onClose, onCapture }: Props) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const camera = useRef<CameraView>(null);
  const mounted = useRef(true);
  const busyRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const permissionRefresh = useRef(0);
  const recordingRef = useRef(false);
  const recordingSession = useRef(0);
  const startedAt = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      recordingSession.current += 1;
      if (recordingRef.current) safeStopRecording(camera.current);
    };
  }, []);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds(Math.min(MAX_RECORDING_SECONDS, Math.floor((Date.now() - startedAt.current) / 1000))), 250);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appState.current;
      appState.current = nextState;
      if (nextState === 'active' && previousState === 'active') return;
      const refreshId = ++permissionRefresh.current;
      if (nextState !== 'active') {
        if (recordingRef.current) {
          recordingSession.current += 1;
          safeStopRecording(camera.current);
          recordingRef.current = false;
          setRecording(false);
          setError('Video đã được hủy khi rời ứng dụng. Hãy quay lại khi bạn sẵn sàng.');
        }
        setCameraActive(false);
        setReady(false);
        setTorch(false);
        return;
      }
      // Settings may have granted or revoked permission while the camera was unmounted.
      setReady(false);
      void getPermission().then(() => {
        if (mounted.current && permissionRefresh.current === refreshId && appState.current === 'active') {
          setCameraActive(true);
        }
      }).catch(() => {
        if (mounted.current && permissionRefresh.current === refreshId) {
          setError('Không thể kiểm tra quyền camera. Hãy đóng màn hình quét rồi mở lại.');
        }
      });
    });
    return () => {
      subscription.remove();
      permissionRefresh.current += 1;
    };
  }, [getPermission]);

  const grant = async () => {
    setError('');
    try { await requestPermission(); }
    catch { if (mounted.current) setError('Không thể mở camera. Hãy kiểm tra quyền truy cập trong cài đặt.'); }
  };
  const capture = async () => {
    if (isWeb) { void pickVideo(); return; }
    if (recordingRef.current) {
      if (Date.now() - startedAt.current < MIN_RECORDING_SECONDS * 1000) return;
      if (!safeStopRecording(camera.current)) {
        setError('Chưa dừng được video. Hãy thử chạm dừng lần nữa hoặc đóng camera để hủy.');
        return;
      }
      setRecording(false);
      return;
    }
    if (!camera.current || !cameraActive || !ready || busyRef.current) return;
    const session = ++recordingSession.current;
    busyRef.current = true;
    recordingRef.current = true;
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(true);
    setBusy(true);
    setError('');
    try {
      const video = await camera.current.recordAsync({ maxDuration: MAX_RECORDING_SECONDS, ...(Platform.OS === 'ios' ? { codec: 'avc1' as const } : {}) });
      if (!mounted.current || recordingSession.current !== session) return;
      if (!video?.uri || Date.now() - startedAt.current < MIN_RECORDING_SECONDS * 1000) throw new Error('capture');
      onCapture({ uri: video.uri, mimeType: Platform.OS === 'ios' ? 'video/quicktime' : 'video/mp4', fileName: Platform.OS === 'ios' ? 'room.mov' : 'room.mp4', fileSize: nativeFileSize(video.uri) });
    } catch {
      if (mounted.current && recordingSession.current === session) setError('Chưa quay được video. Hãy quay tối thiểu 5 giây và thử lại nhé.');
    } finally {
      recordingRef.current = false;
      busyRef.current = false;
      if (mounted.current) { setBusy(false); setRecording(false); }
    }
  };
  const pickVideo = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsMultipleSelection: false });
      const asset = !result.canceled ? result.assets[0] : undefined;
      if (asset && mounted.current) {
        if (asset.duration != null && (asset.duration < MIN_RECORDING_SECONDS * 1000 || asset.duration > MAX_RECORDING_SECONDS * 1000 + 100)) {
          setError('Hãy chọn video ngắn từ 5 đến 15 giây để phân tích căn phòng.');
          return;
        }
        const webFile = isWeb ? asset.file ?? await (await fetch(asset.uri)).blob() : undefined;
        const mimeType = asset.mimeType || webFile?.type || (/\.mov(?:$|\?)/i.test(asset.uri) ? 'video/quicktime' : 'video/mp4');
        if (!mimeType.startsWith('video/')) {
          setError('Vui lòng chọn một video căn phòng, không phải ảnh.');
          return;
        }
        if (mounted.current) onCapture({ uri: asset.uri, mimeType, fileName: asset.fileName ?? (mimeType === 'video/quicktime' ? 'room.mov' : 'room.mp4'), webFile, fileSize: asset.fileSize ?? webFile?.size ?? nativeFileSize(asset.uri) });
      }
    } catch {
      if (mounted.current) setError('Không thể mở video. Hãy kiểm tra quyền truy cập thư viện và thử lại.');
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const switchCamera = () => { setReady(false); setTorch(false); setFacing(facing === 'back' ? 'front' : 'back'); };
  const close = () => {
    recordingSession.current += 1;
    if (recordingRef.current) safeStopRecording(camera.current);
    recordingRef.current = false;
    onClose();
  };
  const shutterDisabled = recording ? seconds < MIN_RECORDING_SECONDS : busy || (!isWeb && !ready);
  const cameraToolsDisabled = isWeb || !permission?.granted || busy;

  return (
    <View style={styles.page}>
      {!isWeb && permission?.granted && cameraActive && <CameraView ref={camera} style={StyleSheet.absoluteFill} mode="video" mute videoQuality="720p" facing={facing} enableTorch={torch && facing === 'back'} onCameraReady={() => { if (appState.current === 'active' || appState.current == null) { setReady(true); setError(''); } }} onMountError={() => { setReady(false); setError('Camera chưa sẵn sàng. Bạn có thể chọn video căn phòng từ thư viện.'); }} />}
      <LinearGradient pointerEvents="none" colors={['#151025D9', '#15102500', '#15102500', '#151025']} locations={[0, 0.25, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng camera và hủy video đang quay" onPress={close} style={styles.icon}><Ionicons name="close" size={24} color="white" /></Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>Quét căn phòng</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={torch ? 'Tắt đèn flash' : 'Bật đèn flash'} accessibilityState={{ disabled: cameraToolsDisabled || facing === 'front', selected: torch }} disabled={cameraToolsDisabled || facing === 'front'} onPress={() => setTorch(!torch)} style={[styles.icon, torch && { backgroundColor: colors.purple }, (cameraToolsDisabled || facing === 'front') && styles.disabled]}><Ionicons name={torch ? 'flash' : 'flash-outline'} size={23} color="white" /></Pressable>
        </View>
        {!isWeb && permission?.granted ? (
          <View style={styles.viewfinder}>
            <View style={styles.pill}><View style={[styles.dot, recording && { backgroundColor: '#FF657D' }]} /><Text accessibilityLiveRegion="polite" style={styles.pillText}>{recording ? `Đang quay · 00:${String(seconds).padStart(2, '0')} / 00:15` : ready ? 'Sẵn sàng quay căn phòng' : 'Đang mở camera…'}</Text></View>
            <View pointerEvents="none" style={styles.grid}><View style={[styles.gridVertical, { left: '33.33%' }]} /><View style={[styles.gridVertical, { left: '66.66%' }]} /><View style={[styles.gridHorizontal, { top: '33.33%' }]} /><View style={[styles.gridHorizontal, { top: '66.66%' }]} /></View>
            <View pointerEvents="none" style={styles.focus}><View style={styles.cornerTop} /><View style={styles.cornerBottom} /><View style={styles.focusDot} /></View>
          </View>
        ) : (
          <View style={styles.permission}>
            <View style={styles.cameraBadge}><Ionicons name="camera-outline" size={38} color="#C9B9FF" /></View>
            <Text accessibilityRole="header" style={styles.permissionTitle}>Một góc nhìn mới{ '\n' }cho căn phòng của bạn</Text>
            <Text style={styles.permissionDescription}>{isWeb ? 'Trên trình duyệt, hãy chọn video căn phòng dài 5–15 giây. Mở ứng dụng trên điện thoại để quay trực tiếp.' : permission?.canAskAgain === false ? 'Camera chưa được cấp quyền. Hãy bật quyền trong cài đặt hoặc chọn một video có sẵn.' : 'Cho phép Me Room dùng camera để quay không gian bạn muốn thiết kế. Video quay trực tiếp không thu âm.'}</Text>
            {isWeb ? <Pressable accessibilityRole="button" disabled={busy} onPress={pickVideo} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryText}>Chọn video căn phòng</Text></Pressable> : permission === null ? <ActivityIndicator color={colors.mint} /> : permission.canAskAgain ? <Pressable accessibilityRole="button" onPress={grant} style={styles.primaryButton}><Text style={styles.primaryText}>Cho phép dùng camera</Text></Pressable> : <Pressable accessibilityRole="button" onPress={() => { void Linking.openSettings().catch(() => setError('Hãy mở Cài đặt của thiết bị và cấp quyền camera cho Me Room.')); }} style={styles.primaryButton}><Text style={styles.primaryText}>Mở cài đặt</Text></Pressable>}
          </View>
        )}
        <View style={styles.controls}>
          {error !== '' && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Text style={styles.guide}>{recording ? seconds < MIN_RECORDING_SECONDS ? 'Di chuyển chậm, quay tối thiểu 5 giây' : 'Chạm để dừng và phân tích · Tự dừng sau 15 giây' : isWeb ? 'Chọn video để phân tích không gian' : permission?.granted ? 'Quay để phân tích không gian · 5–15 giây' : 'Bạn cũng có thể chọn một video từ thư viện'}</Text>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Chọn video căn phòng từ thư viện" disabled={busy} onPress={pickVideo} style={[styles.libraryButton, busy && styles.disabled]}><Ionicons name="film-outline" size={25} color="white" /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={isWeb ? 'Chọn video để phân tích căn phòng' : recording ? 'Dừng quay và gửi video để phân tích căn phòng' : 'Bắt đầu quay video căn phòng không thu âm'} accessibilityState={{ disabled: shutterDisabled }} disabled={shutterDisabled} onPress={capture} style={[styles.shutterRing, shutterDisabled && !recording && styles.disabled]}>{recording ? <View style={styles.stopRecording} /> : busy ? <ActivityIndicator size="large" color="white" /> : <View style={styles.shutter} />}</Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Đổi camera trước hoặc sau" disabled={cameraToolsDisabled} onPress={switchCamera} style={[styles.icon, cameraToolsDisabled && styles.disabled]}><Ionicons name="camera-reverse-outline" size={26} color="white" /></Pressable>
          </View>
          <Text style={styles.privacy}>Video bạn quay hoặc chọn sẽ được gửi để AI phân tích. Quay trực tiếp không thu âm; video chọn có thể kèm âm thanh.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#201833' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 24, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 28, alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 28, backgroundColor: '#30234EAA' },
  dot: { width: 6, height: 6, borderRadius: 5, backgroundColor: colors.mint },
  pillText: { color: '#EEE8FF', fontSize: 12, fontWeight: '600' },
  grid: { position: 'absolute', top: 15, bottom: 0, left: 20, right: 20 },
  gridVertical: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#FFFFFF24' },
  gridHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#FFFFFF24' },
  focus: { width: '57%', aspectRatio: 1, borderColor: '#FFFFFF80', borderWidth: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  cornerTop: { position: 'absolute', width: 22, height: 22, top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#FFFFFF', borderTopLeftRadius: 4 },
  cornerBottom: { position: 'absolute', width: 22, height: 22, bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#FFFFFF', borderBottomRightRadius: 4 },
  focusDot: { width: 28, height: 28, borderWidth: 1, borderColor: '#FFFFFF80', borderRadius: 20 },
  permission: { flex: 1, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center', gap: 18 },
  cameraBadge: { width: 82, height: 82, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7356E82C', borderWidth: 1, borderColor: '#A28AEC30' },
  permissionTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', lineHeight: 32, textAlign: 'center', letterSpacing: -0.6 },
  permissionDescription: { color: '#C4B9D5', fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 350 },
  primaryButton: { backgroundColor: colors.purple, paddingHorizontal: 22, paddingVertical: 16, borderRadius: 15, marginTop: 6 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  webHint: { color: colors.mint, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  controls: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22, gap: 16 },
  guide: { color: '#EEE8FF', textAlign: 'center', fontSize: 12, lineHeight: 19 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  libraryButton: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#8B74A680', borderWidth: 1.5, borderColor: '#F5ECFF', alignItems: 'center', justifyContent: 'center' },
  shutterRing: { height: 78, width: 78, borderRadius: 42, borderWidth: 2, borderColor: '#FFFFFFCC', padding: 5, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#FFFFFF' },
  stopRecording: { width: 30, height: 30, borderRadius: 7, backgroundColor: '#FF657D' },
  privacy: { color: '#C1B6CF', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  disabled: { opacity: 0.35 },
  error: { backgroundColor: '#481F3BE6', color: '#FFE4F2', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
