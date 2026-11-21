import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';

// Chip chọn được (bộ lọc / form) — nếu không truyền onPress thì chỉ hiển thị (tag).
export default function Chip({ label, icon, active, onPress, tone = 'default' }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const tagStyle = tone === 'primary' ? styles.tagPrimary : null;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.8} style={[styles.chip, active && styles.active, !onPress && tagStyle]}>
      {icon ? <Ionicons name={icon} size={13} color={active ? '#fff' : colors.muted} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.text, active && styles.textActive, !onPress && tone === 'primary' && { color: colors.primaryDark }]}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 6,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagPrimary: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  text: { fontSize: 13, color: colors.text, fontWeight: '500' },
  textActive: { color: '#fff' },
});
