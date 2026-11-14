import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Robot({ size = 112 }: { size?: number }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size, height: size * 1.23 }}>
      <View style={[styles.antenna, { left: size * 0.48, top: 0, height: size * 0.19 }]} />
      <View style={[styles.light, { left: size * 0.445, width: size * 0.10, height: size * 0.10 }]} />
      <LinearGradient colors={['#FFFFFF', '#DAD2FF']} style={[styles.head, { top: size * 0.18, height: size * 0.7, borderRadius: size * 0.27 }]}>
        <View style={[styles.ear, { left: -6, top: size * 0.24, height: size * 0.26 }]} />
        <View style={[styles.ear, { right: -6, top: size * 0.24, height: size * 0.26 }]} />
        <View style={[styles.face, { borderRadius: size * 0.17, gap: size * 0.14 }]}>
          <View style={[styles.eye, { width: size * 0.09, height: size * 0.15 }]} />
          <View style={[styles.eye, { width: size * 0.09, height: size * 0.15 }]} />
          <View style={styles.smile} />
        </View>
      </LinearGradient>
      <LinearGradient colors={['#F8F5FF', '#C6BAEF']} style={[styles.body, { top: size * 0.94, height: size * 0.42, borderRadius: size * 0.16 }]}>
        <View style={styles.dot} /><View style={[styles.dot, { opacity: 0.7 }]} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  antenna: { position: 'absolute', width: 3, backgroundColor: '#D5CBFF', borderRadius: 3 },
  light: { position: 'absolute', borderRadius: 20, backgroundColor: '#A8F2D0' },
  head: { position: 'absolute', width: '100%', borderWidth: 2, borderColor: '#F7F4FF', padding: '12%' },
  ear: { position: 'absolute', width: 8, borderRadius: 8, backgroundColor: '#B9AEFF' },
  face: { flex: 1, backgroundColor: '#34256C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  eye: { backgroundColor: '#AEF4D4', borderRadius: 6 },
  smile: { position: 'absolute', width: 13, height: 6, bottom: '18%', borderBottomWidth: 1.5, borderBottomColor: '#AEF4D4', borderRadius: 8 },
  body: { position: 'absolute', left: '17%', width: '66%', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, width: 8, borderRadius: 5, backgroundColor: '#7659E4' },
});
