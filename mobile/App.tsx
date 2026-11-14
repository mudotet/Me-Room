import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Room3D from './components/Room3D/Room3D';
import scene from '../shared/example.json';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.heading}>
        <Text style={styles.title}>Me Room</Text>
        <Text style={styles.subtitle}>Kéo d? xoay · Ch?m hai ngón d? phóng to</Text>
      </View>
      <Room3D sceneData={scene} style={styles.scene} />
      <Text style={styles.caption}>Scene: {scene.sceneId} · N?i th?t hi?n th? theo d? li?u JSON</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f2ed' },
  heading: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { color: '#342f29', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#766d62', fontSize: 13, marginTop: 3 },
  scene: { flex: 1, minHeight: 300, borderRadius: 18, marginHorizontal: 10 },
  caption: { color: '#766d62', textAlign: 'center', fontSize: 12, padding: 10 },
});
