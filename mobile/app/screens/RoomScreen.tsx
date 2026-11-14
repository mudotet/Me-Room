import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Room3D from '../../components/Room3D';
import Robot from '../ui/Robot';
import type { RoomScene } from '../types';

type Props = {
  sceneData: RoomScene; title: string; isDemo: boolean;
  viewMode: 'first' | 'third'; onViewMode: (mode: 'first' | 'third') => void;
  onClose: () => void; onSend: (prompt: string) => Promise<void>;
  chatBusy: boolean; chatError?: string; chatMessage: string; orientationError: boolean;
};

export default function RoomScreen({ sceneData, title, isDemo, viewMode, onViewMode, onClose, onSend, chatBusy, chatError, chatMessage, orientationError }: Props) {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [renderError, setRenderError] = useState<string>();
  const [rendererKey, setRendererKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [movement, setMovement] = useState({ forward: 0, turn: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const first = viewMode === 'first';
  useEffect(() => { setMovement({ forward: 0, turn: 0 }); setZoom(1); }, [viewMode]);

  const moveButton = (name: 'arrow-up' | 'arrow-down' | 'arrow-back' | 'arrow-forward', label: string, forward: number, turn: number) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPressIn={() => setMovement({ forward, turn })} onPressOut={() => setMovement({ forward: 0, turn: 0 })} style={({ pressed }) => [s.moveButton, pressed && s.pressed]}>
      <Ionicons name={name} size={22} color="white" />
    </Pressable>
  );

  return <View style={s.root}>
    <View style={[s.header, { paddingTop: Math.max(insets.top, 16), paddingLeft: Math.max(insets.left, 18), paddingRight: Math.max(insets.right, 18) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Về trang chủ" onPress={onClose} style={s.back}><Ionicons name="arrow-back" size={21} color="white" /></Pressable>
      <View style={s.heading}><Text style={s.title} numberOfLines={1}>{title}</Text><Text style={s.subtitle}>{first ? 'Góc nhìn ngang · khám phá không gian' : 'Góc nhìn dọc · từ trên xuống'}</Text></View>
      <View style={s.switch}>
        {(['third', 'first'] as const).map(mode => <Pressable key={mode} accessibilityRole="button" accessibilityLabel={mode === 'first' ? 'Góc nhìn thứ nhất, màn hình ngang' : 'Góc nhìn thứ ba, màn hình dọc'} accessibilityState={{ selected: viewMode === mode }} onPress={() => onViewMode(mode)} style={[s.tab, viewMode === mode && s.activeTab]}><Text style={[s.tabText, viewMode === mode && s.activeText]}>{mode === 'first' ? 'Góc 1' : 'Góc 3'}</Text></Pressable>)}
      </View>
    </View>

    <View style={s.viewport}>
      <Room3D key={rendererKey} sceneData={sceneData} viewMode={viewMode} zoom={zoom} movement={movement} onReady={() => { setReady(true); setRenderError(undefined); }} onError={setRenderError} />
      <View pointerEvents="none" style={s.status}><View style={[s.dot, renderError && { backgroundColor: '#ffc2b8' }]} /><Text style={s.statusText}>{renderError ? 'Chưa tải được mô hình' : ready ? (isDemo ? 'Không gian mẫu · mô hình 3D' : 'Mô hình 3D đã sẵn sàng') : 'Đang tải mô hình 3D…'}</Text></View>
      {(!ready && !renderError) && <View pointerEvents="none" style={s.center}><ActivityIndicator color="#7356e8" size="large" /></View>}
      {renderError && <View style={s.center}><View style={s.renderError}><Ionicons name="cube-outline" size={32} color="#7356e8" /><Text style={s.errorTitle}>Chưa thể mở mô hình 3D</Text><Text style={s.errorDescription}>{renderError}</Text><Pressable accessibilityRole="button" onPress={() => { setRenderError(undefined); setReady(false); setRendererKey(k => k + 1); }} style={s.retry}><Text style={s.sendText}>Tải lại mô hình</Text></Pressable></View></View>}
      {first && <View pointerEvents="none" style={s.crosshair}><View style={s.crossH} /><View style={s.crossV} /></View>}
      {(orientationError) && <View style={s.orientationNotice}><Text style={s.statusText}>Xoay thiết bị hoặc mở rộng cửa sổ sang ngang để khám phá.</Text></View>}

      {!chatOpen && <Pressable accessibilityRole="button" accessibilityLabel="Trò chuyện với Roomie" onPress={() => setChatOpen(true)} style={[s.assistant, first && s.assistantLandscape]}>
        <View style={s.robotMini}><Robot size={first ? 55 : 62} /><View style={s.chatBadge}><Ionicons name="chatbubble-ellipses" size={14} color="white" /></View></View>
        <View style={[s.bubble, first && { maxWidth: 190 }]}><Text style={s.bubbleTitle}>Roomie</Text><Text numberOfLines={3} style={s.bubbleText}>{chatMessage}</Text></View>
      </Pressable>}

      {!chatOpen && (first ? <View style={[s.dpad, { right: Math.max(insets.right, 18) }]}>
        {moveButton('arrow-up', 'Tiến về phía trước', 1, 0)}
        <View style={s.dpadMiddle}>{moveButton('arrow-back', 'Quay trái', 0, -1)}<View style={s.dpadCenter} />{moveButton('arrow-forward', 'Quay phải', 0, 1)}</View>
        {moveButton('arrow-down', 'Lùi về phía sau', -1, 0)}
      </View> : <View style={s.zoomControls}>
        <Text style={s.zoomLabel}>ZOOM</Text>
        <View style={s.zoomTrack}>
          <Pressable accessibilityRole="button" accessibilityLabel="Phóng to" accessibilityState={{ disabled: zoom >= 1.8 }} disabled={zoom >= 1.8} onPress={() => setZoom(z => Math.min(1.8, z + .15))} style={s.zoomButton}><Ionicons name="add" size={24} color="white" /></Pressable>
          <View style={s.zoomIndicator}><View style={[s.zoomFill, { height: `${25 + (zoom - .7) / 1.1 * 75}%` }]} /></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Thu nhỏ" accessibilityState={{ disabled: zoom <= .7 }} disabled={zoom <= .7} onPress={() => setZoom(z => Math.max(.7, z - .15))} style={s.zoomButton}><Ionicons name="remove" size={24} color="white" /></Pressable>
        </View>
      </View>)}

      {chatOpen && <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.chatPanel, first && s.chatPanelLandscape]}>
        <View style={s.chatHeader}><View><Text style={s.chatTitle}>Cùng Roomie thiết kế</Text><Text style={s.chatSub}>Một ý tưởng mới cho căn phòng của bạn</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Đóng trò chuyện" onPress={() => setChatOpen(false)} style={s.closeChat}><Ionicons name="close" size={21} color="#211936" /></Pressable></View>
        <ScrollView style={s.chatHistory} keyboardShouldPersistTaps="handled"><Text style={s.chatResponse}>{chatMessage}</Text>{chatError && <Text accessibilityRole="alert" style={s.chatError}>{chatError}</Text>}</ScrollView>
        <View style={s.suggestions}>{['Tông màu ấm hơn', 'Sắp xếp thoáng hơn'].map(text => <Pressable key={text} accessibilityRole="button" onPress={() => setPrompt(text)} style={s.suggestion}><Text style={s.suggestionText}>{text}</Text></Pressable>)}</View>
        <View style={s.inputRow}><TextInput accessibilityLabel="Yêu cầu thiết kế phòng" value={prompt} onChangeText={setPrompt} maxLength={1000} placeholder="Bạn muốn thay đổi điều gì?" placeholderTextColor="#8c83a0" style={s.input} onSubmitEditing={() => prompt.trim() && onSend(prompt)} returnKeyType="send" editable={!chatBusy} /><Pressable accessibilityRole="button" accessibilityLabel="Gửi yêu cầu thiết kế" accessibilityState={{ disabled: chatBusy || !prompt.trim() }} disabled={chatBusy || !prompt.trim()} onPress={() => onSend(prompt)} style={[s.send, (chatBusy || !prompt.trim()) && { opacity: .45 }]}>{chatBusy ? <ActivityIndicator color="white" /> : <Ionicons name="arrow-up" color="white" size={22} />}</Pressable></View>
      </KeyboardAvoidingView>}
    </View>
    <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12), paddingLeft: Math.max(insets.left, 18), paddingRight: Math.max(insets.right, 18) }]}>
      <Text style={s.footerText}>{first ? 'Kéo để nhìn · giữ mũi tên để di chuyển' : 'Kéo để xoay · dùng + / − để zoom'}</Text>
      <Pressable accessibilityRole="button" onPress={onClose} style={s.closeButton}><Ionicons name="close-circle-outline" size={16} color="white" /><Text style={s.closeText}>Đóng mô hình</Text></Pressable>
    </View>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#161126' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 }, title: { color: 'white', fontSize: 15, fontWeight: '700' }, subtitle: { color: '#bcb4cc', fontSize: 10, marginTop: 4 },
  switch: { flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: '#ffffff18', borderColor: '#ffffff22', borderWidth: 1 },
  tab: { minHeight: 44, minWidth: 44, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, activeTab: { backgroundColor: 'white' }, tabText: { color: '#bcb4cc', fontWeight: '600', fontSize: 11 }, activeText: { color: '#312653' },
  viewport: { flex: 1, position: 'relative', backgroundColor: '#c9bed0', overflow: 'hidden' },
  status: { position: 'absolute', top: 18, left: 18, borderRadius: 10, backgroundColor: '#35284cbb', paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', gap: 7, alignItems: 'center' }, dot: { width: 6, height: 6, borderRadius: 5, backgroundColor: '#a8f2d0' }, statusText: { color: '#eee8ff', fontSize: 10, fontWeight: '600' },
  center: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  renderError: { backgroundColor: '#fbfaff', padding: 24, borderRadius: 20, width: '82%', maxWidth: 330, alignItems: 'center', gap: 12 }, errorTitle: { fontWeight: '700', color: '#211936', fontSize: 17 }, errorDescription: { color: '#786c8c', fontSize: 13, textAlign: 'center', lineHeight: 20 }, retry: { backgroundColor: '#7356e8', padding: 14, borderRadius: 12 }, sendText: { color: '#fff', fontWeight: '700' },
  crosshair: { position: 'absolute', left: '50%', top: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12 }, crossH: { position: 'absolute', top: 12, width: 24, height: 1, backgroundColor: '#ffffffaa' }, crossV: { position: 'absolute', left: 12, width: 1, height: 24, backgroundColor: '#ffffffaa' },
  orientationNotice: { position: 'absolute', top: 56, left: 18, borderRadius: 9, padding: 10, backgroundColor: '#35284cdd' },
  assistant: { position: 'absolute', left: 16, bottom: 18, flexDirection: 'row', gap: 8, alignItems: 'flex-end', maxWidth: '72%' }, assistantLandscape: { left: 20, bottom: 16, maxWidth: '64%' },
  robotMini: { backgroundColor: '#eee7ff', width: 56, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }, chatBadge: { position: 'absolute', bottom: -4, right: -4, borderRadius: 20, backgroundColor: '#7356e8', width: 26, height: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#39276a' },
  bubble: { backgroundColor: 'white', borderRadius: 14, padding: 12, flexShrink: 1, maxWidth: 175 }, bubbleTitle: { color: '#211936', fontWeight: '700', fontSize: 12, marginBottom: 4 }, bubbleText: { color: '#413750', fontSize: 11, lineHeight: 16 },
  dpad: { position: 'absolute', bottom: 16, width: 134, height: 134, borderRadius: 70, backgroundColor: '#43334e88', justifyContent: 'center', alignItems: 'center' }, dpadMiddle: { flexDirection: 'row', alignItems: 'center', marginVertical: -3 }, dpadCenter: { width: 23 }, moveButton: { minWidth: 44, minHeight: 44, borderRadius: 11, backgroundColor: '#ffffff22', justifyContent: 'center', alignItems: 'center' }, pressed: { backgroundColor: '#7356e8' },
  zoomControls: { position: 'absolute', right: 16, bottom: 24, alignItems: 'center', gap: 2 }, zoomLabel: { backgroundColor: '#514057aa', color: '#eee8fa', borderRadius: 9, padding: 8, fontSize: 9 }, zoomTrack: { backgroundColor: '#514057aa', borderRadius: 16, padding: 7, alignItems: 'center', gap: 7 }, zoomButton: { minWidth: 44, minHeight: 44, borderRadius: 10, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' }, zoomIndicator: { width: 4, height: 26, borderRadius: 2, backgroundColor: '#bfa9ee77', justifyContent: 'flex-end', overflow: 'hidden' }, zoomFill: { width: 4, backgroundColor: '#a8f2d0', borderRadius: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, gap: 10 }, footerText: { color: '#b0a7c7', fontSize: 10, flex: 1, lineHeight: 15 }, closeButton: { minHeight: 44, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', gap: 7, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff22', backgroundColor: '#ffffff10' }, closeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  chatPanel: { position: 'absolute', bottom: 12, left: 12, right: 12, borderRadius: 22, backgroundColor: '#fbfaff', padding: 16, maxHeight: '84%', elevation: 10, boxShadow: '0 8px 24px #21193622' }, chatPanelLandscape: { left: undefined, width: '50%', maxWidth: 440, bottom: 10, padding: 12, maxHeight: '96%' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }, chatTitle: { color: '#211936', fontSize: 15, fontWeight: '700' }, chatSub: { color: '#8c83a0', fontSize: 10, marginTop: 3 }, closeChat: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, chatHistory: { flexShrink: 1, maxHeight: 140 }, chatResponse: { fontSize: 13, color: '#413750', lineHeight: 20 }, chatError: { fontSize: 12, lineHeight: 18, color: '#a83b52', marginTop: 10 }, suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 12 }, suggestion: { backgroundColor: '#eee8ff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16 }, suggestionText: { color: '#5d43ca', fontSize: 10, fontWeight: '600' }, inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, input: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#e7e0f5', borderRadius: 12, padding: 12, color: '#211936', fontSize: 12, minHeight: 44 }, send: { minWidth: 44, minHeight: 44, backgroundColor: '#7356e8', borderRadius: 13, justifyContent: 'center', alignItems: 'center' }
});
