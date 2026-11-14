import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ProfileScreen from './screens/ProfileScreen';
import RoomScreen from './screens/RoomScreen';
import { checkHealth, designRoom, getApiBaseUrl, scanRoom } from './api';
import { bedroomScene, livingScene } from './fixtures';
import type { Capture, RoomScene } from './types';

type Screen = 'home' | 'scan' | 'processing' | 'room' | 'profile';
type ApiStatus = 'checking' | 'online' | 'offline' | 'unconfigured';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ DMSans_400Regular, SpaceGrotesk_700Bold });
  const [screen, setScreen] = useState<Screen>('home');
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [roomScene, setRoomScene] = useState<RoomScene>(livingScene);
  const [roomName, setRoomName] = useState('Phòng khách của bạn');
  const [isDemo, setIsDemo] = useState(true);
  const [viewMode, setViewMode] = useState<'first' | 'third'>('third');
  const [scanError, setScanError] = useState<string>();
  const [chatError, setChatError] = useState<string>();
  const [chatMessage, setChatMessage] = useState('Hãy hỏi mình về màu sắc hoặc cách sắp xếp nhé.');
  const [chatBusy, setChatBusy] = useState(false);
  const [orientationError, setOrientationError] = useState(false);
  const request = useRef<{ id: number; controller?: AbortController }>({ id: 0 });
  const lastCapture = useRef<Capture | undefined>(undefined);
  const orientationQueue = useRef(Promise.resolve());
  const { width, height } = useWindowDimensions();

  const cancelRequest = useCallback(() => {
    request.current.controller?.abort();
    request.current = { id: request.current.id + 1 };
    setChatBusy(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    try {
      if (!getApiBaseUrl()) setApiStatus('unconfigured');
      else checkHealth(controller.signal).then(() => setApiStatus('online')).catch(() => {
        if (!controller.signal.aborted) setApiStatus('offline');
      });
    } catch { setApiStatus('unconfigured'); }
    return () => { controller.abort(); request.current.controller?.abort(); };
  }, []);

  const landscape = screen === 'room' && viewMode === 'first';
  // iOS resizable windows may ignore a successful orientation lock request.
  const needsLandscapeWindow = Platform.OS !== 'web' && landscape && width <= height;
  useEffect(() => {
    let active = true;
    if (Platform.OS === 'web') return;
    // Serialize orientation calls so rapid switching cannot leave a stale lock.
    orientationQueue.current = orientationQueue.current.catch(() => {}).then(async () => {
      if (!active) return;
      try {
        await ScreenOrientation.lockAsync(landscape ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP);
        if (active) setOrientationError(false);
      } catch { if (active) setOrientationError(true); }
    });
    return () => { active = false; };
  }, [landscape]);

  const goHome = useCallback(() => {
    cancelRequest(); lastCapture.current = undefined; setScreen('home'); setViewMode('third');
  }, [cancelRequest]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      goHome(); return true;
    });
    return () => subscription.remove();
  }, [screen, goHome]);

  function openDemo(kind: 'living' | 'bedroom') {
    cancelRequest();
    setRoomScene(kind === 'living' ? livingScene : bedroomScene);
    setRoomName(kind === 'living' ? 'Phòng khách của bạn' : 'Phòng ngủ của bạn');
    setIsDemo(true); setViewMode('third'); setChatError(undefined);
    setChatMessage('Hãy hỏi mình về màu sắc hoặc cách sắp xếp nhé.'); setScreen('room');
  }

  async function runScan(capture: Capture) {
    cancelRequest();
    const controller = new AbortController();
    const id = request.current.id;
    request.current.controller = controller;
    lastCapture.current = capture;
    setScanError(undefined); setScreen('processing');
    try {
      const result = await scanRoom(capture, controller.signal);
      if (id !== request.current.id || controller.signal.aborted) return;
      setRoomScene(result.scene); setRoomName('Không gian của bạn'); setIsDemo(false);
      setChatMessage(result.message || 'Căn phòng đã sẵn sàng. Bạn muốn thay đổi điều gì?');
      setChatError(undefined); setApiStatus('online'); setViewMode('third'); setScreen('room');
      lastCapture.current = undefined;
    } catch (error) {
      if (id !== request.current.id || controller.signal.aborted) return;
      setScanError(error instanceof Error ? error.message : 'Chưa thể phân tích video. Vui lòng thử lại.');
    }
  }

  async function sendDesign(prompt: string) {
    if (!prompt.trim() || chatBusy) return;
    cancelRequest();
    const controller = new AbortController();
    const id = request.current.id;
    request.current.controller = controller;
    setChatBusy(true); setChatError(undefined);
    try {
      const result = await designRoom(roomScene, prompt.trim(), controller.signal);
      if (id !== request.current.id || controller.signal.aborted) return;
      setRoomScene(result.scene); setChatMessage(result.message || 'Mình đã cập nhật cách bố trí cho bạn.');
      setIsDemo(false); setApiStatus('online');
    } catch (error) {
      if (id === request.current.id && !controller.signal.aborted) setChatError(error instanceof Error ? error.message : 'Chưa gửi được yêu cầu. Hãy thử lại.');
    } finally { if (id === request.current.id) setChatBusy(false); }
  }

  const onScan = () => { cancelRequest(); setScanError(undefined); setScreen('scan'); };
  const desktop = Platform.OS === 'web' && width >= 600;
  const webLandscapeHeight = Math.min(height - 32, 660, (width - 32) * 9 / 16);

  if (!fontsLoaded && !fontError) return <View style={styles.background}><ActivityIndicator size="large" color="#7356e8" /></View>;

  return <SafeAreaProvider>
    <StatusBar style={screen === 'home' || screen === 'profile' ? 'dark' : 'light'} hidden={landscape} />
    <View style={styles.background}>
      <View style={[styles.app, desktop && { width: landscape ? Math.min(width - 32, 1120) : 450, height: landscape ? webLandscapeHeight : Math.min(height - 32, 900), flex: undefined, borderRadius: 34 }, Platform.OS === 'web' && landscape && !desktop && { width: height, height: width, flex: undefined, transform: [{ rotate: '90deg' }] }]}>
        {screen === 'home' && <HomeScreen onScan={onScan} onOpenRoom={openDemo} onProfile={() => setScreen('profile')} apiStatus={apiStatus} />}
        {screen === 'profile' && <ProfileScreen onHome={goHome} onScan={onScan} apiStatus={apiStatus} />}
        {screen === 'scan' && <ScanScreen onClose={goHome} onCapture={runScan} />}
        {screen === 'processing' && <ProcessingScreen onCancel={goHome} error={scanError} onRetry={() => lastCapture.current && runScan(lastCapture.current)} />}
        {screen === 'room' && <RoomScreen sceneData={roomScene} title={roomName} isDemo={isDemo} viewMode={viewMode} onViewMode={setViewMode} onClose={goHome} onSend={sendDesign} chatBusy={chatBusy} chatError={chatError} chatMessage={chatMessage} orientationError={landscape && (orientationError || needsLandscapeWindow)} />}
      </View>
    </View>
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#e8e4f6', justifyContent: 'center', alignItems: 'center' },
  app: { flex: 1, width: '100%', overflow: 'hidden', backgroundColor: '#fbfaff', position: 'relative' }
});
