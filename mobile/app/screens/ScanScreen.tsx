import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type LensInfo } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../ui/theme';
import { selectCaptureFileSize } from '../capture';
import type { Capture } from '../types';

export type { Capture } from '../types';
type Props = { onClose: () => void; onCapture: (capture: Capture) => void };
const MAX_RECORDING_SECONDS = 120;
const isWeb = Platform.OS === 'web';
const WIDE_LENS = 'AVCaptureDeviceTypeBuiltInWideAngleCamera';
const ULTRA_WIDE_LENS = 'AVCaptureDeviceTypeBuiltInUltraWideCamera';

export function getRearLensOptions(lenses: LensInfo[]) {
  const deviceTypes = new Set(lenses.map(({ deviceType }) => deviceType));
  return [
    ...(deviceTypes.has(ULTRA_WIDE_LENS) ? [{ deviceType: ULTRA_WIDE_LENS, label: '0.5×' }] : []),
    ...(deviceTypes.has(WIDE_LENS) ? [{ deviceType: WIDE_LENS, label: '1×' }] : []),
  ];
}

function formatDuration(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

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
  const [availableLenses, setAvailableLenses] = useState<LensInfo[]>([]);
  const [selectedLens, setSelectedLens] = useState<string>();
  const camera = useRef<CameraView>(null);
  const facingRef = useRef<'back' | 'front'>('back');
  const mounted = useRef(true);
  const busyRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const permissionRefresh = useRef(0);
  const recordingRef = useRef(false);
  const recordingSession = useRef(0);
  const startedAt = useRef(0);
  const applyAvailableLenses = (lenses: LensInfo[]) => {
    if (facingRef.current !== 'back') return;
    const rearLenses = lenses.filter(({ deviceType }) => deviceType === WIDE_LENS || deviceType === ULTRA_WIDE_LENS);
    setAvailableLenses(rearLenses);
    setSelectedLens((current) => current && rearLenses.some(({ deviceType }) => deviceType === current)
      ? current
      : rearLenses.find(({ deviceType }) => deviceType === WIDE_LENS)?.deviceType ?? rearLenses[0]?.deviceType);
  };
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
      if (!video?.uri) throw new Error('capture');
      onCapture({ uri: video.uri, mimeType: Platform.OS === 'ios' ? 'video/quicktime' : 'video/mp4', fileName: Platform.OS === 'ios' ? 'room.mov' : 'room.mp4', fileSize: nativeFileSize(video.uri) });
    } catch {
      if (mounted.current && recordingSession.current === session) setError('Chưa quay được video. Hãy thử lại nhé.');
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
        if (asset.duration != null && asset.duration > MAX_RECORDING_SECONDS * 1000) {
          setError('Hãy chọn video tối đa 2 phút để phân tích căn phòng.');
          return;
        }
        const webFile = isWeb ? asset.file ?? await (await fetch(asset.uri)).blob() : undefined;
        const mimeType = asset.mimeType || webFile?.type || (/\.mov(?:$|\?)/i.test(asset.uri) ? 'video/quicktime' : 'video/mp4');
        if (!mimeType.startsWith('video/')) {
          setError('Vui lòng chọn một video căn phòng, không phải ảnh.');
          return;
        }
        if (mounted.current) onCapture({ uri: asset.uri, mimeType, fileName: asset.fileName ?? (mimeType === 'video/quicktime' ? 'room.mov' : 'room.mp4'), webFile, fileSize: selectCaptureFileSize(asset.fileSize, webFile?.size ?? nativeFileSize(asset.uri)) });
      }
    } catch {
      if (mounted.current) setError('Không thể mở video. Hãy kiểm tra quyền truy cập thư viện và thử lại.');
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const switchCamera = () => {
    const nextFacing = facing === 'back' ? 'front' : 'back';
    facingRef.current = nextFacing;
    setAvailableLenses([]);
    setSelectedLens(undefined);
    setReady(false);
    setTorch(false);
    setFacing(nextFacing);
  };
  const close = () => {
    recordingSession.current += 1;
    if (recordingRef.current) safeStopRecording(camera.current);
    recordingRef.current = false;
    onClose();
  };
  const shutterDisabled = !recording && (busy || (!isWeb && !ready));
  const cameraToolsDisabled = isWeb || !permission?.granted || busy;
  const lensOptions = getRearLensOptions(availableLenses);
  const showLensOptions = Platform.OS === 'ios' && cameraActive && facing === 'back' && ready && lensOptions.length > 1;
  const cameraPreview = !isWeb && permission?.granted && cameraActive;

  return (
    <View style={styles.page}>
      {cameraPreview && <CameraView ref={camera} style={StyleSheet.absoluteFill} mode="video" mute videoQuality="720p" facing={facing} selectedLens={Platform.OS === 'ios' && facing === 'back' ? selectedLens : undefined} enableTorch={torch && facing === 'back'} onAvailableLensesChanged={({ lenses }) => applyAvailableLenses(lenses)} onCameraReady={() => {
        if (appState.current === 'active' || appState.current == null) { setReady(true); setError(''); }
        if (Platform.OS === 'ios' && facingRef.current === 'back' && camera.current) {
          const activeCamera = camera.current;
          void activeCamera.getAvailableLensesAsync().then(applyAvailableLenses).catch(() => {});
        }
      }} onMountError={() => { setReady(false); setError('Camera chưa sẵn sàng. Bạn có thể chọn video căn phòng từ thư viện.'); }} />}
      {cameraPreview && <LinearGradient pointerEvents="none" colors={['#151025D9', '#15102500', '#15102500', '#151025F2']} locations={[0, 0.25, 0.65, 1]} style={StyleSheet.absoluteFill} />}
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng camera và hủy video đang quay" onPress={close} style={({ pressed }) => [styles.icon, cameraPreview && styles.previewIcon, pressed && styles.pressed]}><Ionicons name="close" size={24} color={cameraPreview ? colors.surface : colors.ink} /></Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, cameraPreview && styles.previewText]}>Quét căn phòng</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={torch ? 'Tắt đèn flash' : 'Bật đèn flash'} accessibilityState={{ disabled: cameraToolsDisabled || facing === 'front', selected: torch }} disabled={cameraToolsDisabled || facing === 'front'} onPress={() => setTorch(!torch)} style={({ pressed }) => [styles.icon, cameraPreview && styles.previewIcon, torch && styles.iconActive, (cameraToolsDisabled || facing === 'front') && styles.disabled, pressed && styles.pressed]}><Ionicons name={torch ? 'flash' : 'flash-outline'} size={23} color={cameraPreview ? colors.surface : colors.ink} /></Pressable>
        </View>
        {!isWeb && permission?.granted ? (
          <View style={styles.viewfinder}>
            <View style={styles.status}><View style={[styles.dot, recording && styles.recordingDot]} /><Text accessibilityLiveRegion="polite" style={[styles.statusText, styles.previewText]}>{recording ? `Đang quay · ${formatDuration(seconds)} / ${formatDuration(MAX_RECORDING_SECONDS)}` : ready ? 'Sẵn sàng quay căn phòng' : 'Đang mở camera…'}</Text></View>
            <View pointerEvents="none" style={styles.grid}><View style={[styles.gridVertical, { left: '33.33%' }]} /><View style={[styles.gridVertical, { left: '66.66%' }]} /><View style={[styles.gridHorizontal, { top: '33.33%' }]} /><View style={[styles.gridHorizontal, { top: '66.66%' }]} /></View>
            <View pointerEvents="none" style={styles.focus}><View style={styles.cornerTop} /><View style={styles.cornerBottom} /><View style={styles.focusDot} /></View>
          </View>
        ) : (
          <View style={styles.permission}>
            <View style={styles.cameraBadge}><Ionicons name="camera-outline" size={34} color={colors.olive} /></View>
            <Text accessibilityRole="header" style={styles.permissionTitle}>Quét không gian{ '\n' }của bạn</Text>
            <Text style={styles.permissionDescription}>{isWeb ? 'Chọn video MP4 hoặc MOV. Tối đa 2 phút và 250 MiB.' : permission?.canAskAgain === false ? 'Camera chưa được cấp quyền. Bạn có thể bật quyền trong cài đặt hoặc chọn video có sẵn.' : 'Cho phép Me Room dùng camera. Video quay trực tiếp không thu âm; video trong thư viện có thể kèm âm thanh.'}</Text>
            {isWeb ? <Pressable accessibilityRole="button" disabled={busy} onPress={pickVideo} style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>Chọn video căn phòng</Text></Pressable> : permission === null ? <ActivityIndicator color={colors.olive} /> : permission.canAskAgain ? <Pressable accessibilityRole="button" onPress={grant} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Cho phép dùng camera</Text></Pressable> : <Pressable accessibilityRole="button" onPress={() => { void Linking.openSettings().catch(() => setError('Hãy mở Cài đặt của thiết bị và cấp quyền camera cho Me Room.')); }} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Mở cài đặt</Text></Pressable>}
          </View>
        )}
        <View style={styles.controls}>
          {error !== '' && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {showLensOptions && <View style={styles.lensOptions} accessibilityLiveRegion="polite">
            {lensOptions.map((lens) => <Pressable key={lens.deviceType} accessibilityRole="button" accessibilityLabel={lens.label === '0.5×' ? 'Ống kính siêu rộng 0,5 lần' : 'Ống kính chính 1 lần'} accessibilityState={{ selected: selectedLens === lens.deviceType, disabled: recording || busy }} disabled={recording || busy} onPress={() => setSelectedLens(lens.deviceType)} style={({ pressed }) => [styles.lensOption, selectedLens === lens.deviceType && styles.lensOptionSelected, (recording || busy) && styles.disabled, pressed && !recording && !busy && styles.pressed]}><Text style={[styles.lensText, selectedLens === lens.deviceType && styles.lensTextSelected]}>{lens.label}</Text></Pressable>)}
          </View>}
          <Text style={[styles.guide, cameraPreview && styles.previewText]}>{recording ? `Di chuyển chậm · ${formatDuration(seconds)} / ${formatDuration(MAX_RECORDING_SECONDS)} · Chạm để dừng` : isWeb ? 'Chọn video để tiếp tục' : permission?.granted ? 'Tối đa 2 phút · 250 MiB' : 'Bạn cũng có thể chọn video từ thư viện'}</Text>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Chọn video căn phòng từ thư viện" disabled={busy} onPress={pickVideo} style={({ pressed }) => [styles.libraryButton, cameraPreview && styles.previewLibraryButton, busy && styles.disabled, pressed && styles.pressed]}><Ionicons name="film-outline" size={24} color={cameraPreview ? colors.ink : colors.olive} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={isWeb ? 'Chọn video để phân tích căn phòng' : recording ? 'Dừng quay và gửi video để phân tích căn phòng' : 'Bắt đầu quay video căn phòng không thu âm'} accessibilityState={{ disabled: shutterDisabled }} disabled={shutterDisabled} onPress={capture} style={({ pressed }) => [styles.shutterRing, cameraPreview && styles.shutterRingOnCamera, shutterDisabled && !recording && styles.disabled, pressed && !shutterDisabled && styles.pressed]}>{recording ? <View style={styles.stopRecording} /> : busy ? <ActivityIndicator size="large" color={colors.olive} /> : <View style={[styles.shutter, cameraPreview && styles.shutterOnCamera]} />}</Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Đổi camera trước hoặc sau" disabled={cameraToolsDisabled} onPress={switchCamera} style={({ pressed }) => [styles.icon, cameraPreview && styles.previewIcon, cameraToolsDisabled && styles.disabled, pressed && styles.pressed]}><Ionicons name="camera-reverse-outline" size={25} color={cameraPreview ? colors.surface : colors.ink} /></Pressable>
          </View>
          <Text style={[styles.privacy, cameraPreview && styles.privacyOnCamera]}>Video chỉ được gửi sau khi bạn dừng quay hoặc chọn tệp. Quay trong ứng dụng không thu âm; video trong thư viện có thể kèm âm thanh.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  previewIcon: { backgroundColor: '#151025AA', borderColor: '#F0EDFF55' },
  iconActive: { backgroundColor: colors.olive },
  headerTitle: { color: colors.ink, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 17 },
  previewText: { color: colors.surface },
  pressed: { opacity: 0.66 },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', top: 28, alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.olive },
  recordingDot: { backgroundColor: '#A85E48' },
  statusText: { fontFamily: 'DMSans_400Regular', color: colors.ink, fontSize: 12 },
  grid: { position: 'absolute', top: 15, bottom: 0, left: 20, right: 20 },
  gridVertical: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#FFFFFF24' },
  gridHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#FFFFFF24' },
  focus: { width: '57%', aspectRatio: 1, borderColor: '#FFFFFF80', borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  cornerTop: { position: 'absolute', width: 22, height: 22, top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderColor: colors.surface, borderTopLeftRadius: 4 },
  cornerBottom: { position: 'absolute', width: 22, height: 22, bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderColor: colors.surface, borderBottomRightRadius: 4 },
  focusDot: { width: 28, height: 28, borderWidth: 1, borderColor: '#FFFFFF80', borderRadius: 20 },
  permission: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cameraBadge: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender },
  permissionTitle: { color: colors.ink, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 27, lineHeight: 32, textAlign: 'center', letterSpacing: -0.6 },
  permissionDescription: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 350 },
  primaryButton: { minHeight: 48, backgroundColor: colors.olive, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 7, marginTop: 4, justifyContent: 'center', alignItems: 'center' },
  primaryText: { fontFamily: 'DMSans_400Regular', color: colors.surface, fontSize: 14, fontWeight: '700' },
  controls: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18, gap: 12 },
  lensOptions: { flexDirection: 'row', alignSelf: 'center', gap: 3, padding: 3, backgroundColor: '#FBFAFFEE', borderWidth: 1, borderColor: colors.line, borderRadius: 7 },
  lensOption: { minWidth: 62, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  lensOptionSelected: { backgroundColor: colors.olive },
  lensText: { fontFamily: 'DMSans_400Regular', color: colors.ink, fontSize: 14, fontWeight: '700' },
  lensTextSelected: { color: colors.surface },
  guide: { fontFamily: 'DMSans_400Regular', color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 19 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  libraryButton: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  previewLibraryButton: { backgroundColor: colors.surface, borderColor: colors.surface },
  shutterRing: { height: 78, width: 78, borderRadius: 40, borderWidth: 2, borderColor: colors.olive, padding: 5, alignItems: 'center', justifyContent: 'center' },
  shutterRingOnCamera: { borderColor: colors.surface },
  shutter: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: colors.olive },
  shutterOnCamera: { backgroundColor: colors.surface },
  stopRecording: { width: 30, height: 30, borderRadius: 4, backgroundColor: '#A85E48' },
  privacy: { fontFamily: 'DMSans_400Regular', color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  privacyOnCamera: { color: '#EEE8FF' },
  disabled: { opacity: 0.42 },
  error: { backgroundColor: '#F0E2DC', color: '#773F34', borderRadius: 6, padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
