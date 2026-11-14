import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export class RenderBoundary extends Component<{ children: ReactNode; onError?: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    this.props.onError?.('Không thể mở mô hình 3D trên thiết bị này. Hãy đóng và thử lại.');
  }
  render() {
    if (this.state.failed) return <View style={styles.error} accessibilityRole="alert"><Text style={styles.text}>Không thể hiển thị mô hình 3D.{"\n"}Hãy đóng và thử mở lại.</Text></View>;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDD4E5', padding: 32 },
  text: { color: '#302343', textAlign: 'center', lineHeight: 24 },
});
