import React from 'react';
import { View, Text } from 'react-native';

const PALETTE = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#059669', '#0891B2', '#CA8A04'];

export default function Avatar({ name = '?', seed = 0, size = 44 }) {
  const initials = String(name).trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const bg = PALETTE[Math.abs(Number(seed) || 0) % PALETTE.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}
