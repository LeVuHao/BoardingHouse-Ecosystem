import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../../constants/theme';
import { rentalApi, contractApi } from '../../api/forumApi';
import { useAuth } from '../../context/AuthContext';
import Chip from '../../components/forum/Chip';
import { encodeDescription, money } from '../../utils/roommateMeta';
import { MOCK_CONTRACTS } from './mockData';

const UNIVERSITIES = ['PTIT', 'HUTECH', 'UEH', 'BKHN', 'HUST', 'UIT', 'Khác'];
const GENDERS = ['Nam', 'Nữ', 'Không yêu cầu'];
const SLEEP = ['Ngủ sớm (22h)', 'Bình thường (23h)', 'Cú đêm (sau 0h)'];
const WAKE = ['Dậy 5-6h', 'Dậy 7-8h', 'Dậy muộn'];
const HABITS = ['Không hút thuốc', 'Sạch sẽ', 'Yên tĩnh', 'Nấu ăn', 'Có nuôi thú cưng', 'Hay về quê', 'Đi làm part-time'];

const Section = ({ icon, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

export default function CreatePostScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [demo, setDemo] = useState(false);

  const [roomId, setRoomId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceShare, setPriceShare] = useState('');
  const [uni, setUni] = useState('');
  const [gender, setGender] = useState('');
  const [sleep, setSleep] = useState('');
  const [wake, setWake] = useState('');
  const [habits, setHabits] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isAuthenticated) { setContracts(MOCK_CONTRACTS); setDemo(true); setLoadingContracts(false); return; }
      try {
        const res = await contractApi.getMyContracts();
        const list = (Array.isArray(res?.data) ? res.data : res?.data?.content || []).filter((c) => !c.status || c.status === 'ACTIVE');
        setContracts(list);
        if (list.length === 1) setRoomId(list[0].roomId);
      } catch {
        setContracts(MOCK_CONTRACTS);
        setDemo(true);
      } finally { setLoadingContracts(false); }
    })();
  }, []);

  const toggleHabit = (h) => setHabits((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  const priceNumber = Number(String(priceShare).replace(/\D/g, ''));

  const submit = async () => {
    if (!roomId) return Alert.alert('Thiếu thông tin', 'Hãy chọn phòng bạn đang thuê.');
    if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Hãy nhập tiêu đề tin đăng.');
    if (!priceNumber) return Alert.alert('Thiếu thông tin', 'Hãy nhập mức giá mong muốn (lớn hơn 0).');

    const giogiac = [sleep, wake].filter(Boolean).join(', ');
    setSubmitting(true);
    try {
      if (!demo) {
        await rentalApi.createRoommatePost({
          roomId,
          title: title.trim(),
          priceShare: priceNumber,
          description: encodeDescription(description, { truong: uni, gioitinh: gender, giogiac, thoiquen: habits.join(', ') }),
        });
      }
      Alert.alert('Thành công', 'Đã đăng tin tìm bạn ở ghép!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Không đăng được', e?.message || 'Vui lòng thử lại.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng tin tìm bạn ở ghép</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {demo && (
            <View style={styles.demoBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#92400E" />
              <Text style={styles.demoText}>Chế độ demo (chưa đăng nhập hoặc chưa kết nối backend) — tin sẽ không được lưu.</Text>
            </View>
          )}

          <Section icon="home-outline" title="Phòng của bạn">
            {loadingContracts ? <ActivityIndicator color={colors.primary} /> : contracts.length === 0 ? (
              <Text style={styles.hint}>Bạn cần có hợp đồng thuê đang hiệu lực để đăng tin tìm bạn ở ghép.</Text>
            ) : contracts.map((c) => {
              const active = roomId === c.roomId;
              return (
                <TouchableOpacity key={c.id} style={[styles.roomOption, active && styles.roomOptionActive]} onPress={() => setRoomId(c.roomId)} activeOpacity={0.85}>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.primary : colors.muted} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.roomName}>{c.propertyTitle || 'Khu trọ'} · {c.roomNumber || `Phòng ${c.roomId}`}</Text>
                    {c.rentalPrice != null && <Text style={styles.hint}>Giá thuê: {money(c.rentalPrice)}/tháng</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Section>

          <Section icon="create-outline" title="Nội dung tin">
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput style={styles.input} placeholder="VD: Tìm nữ ở ghép gần PTIT Hà Đông" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} maxLength={120} />
            <Text style={styles.label}>Mô tả thêm</Text>
            <TextInput style={[styles.input, styles.textarea]} placeholder="Giới thiệu phòng, tiện nghi, bản thân…" placeholderTextColor={colors.muted} multiline textAlignVertical="top" value={description} onChangeText={setDescription} />
          </Section>

          <Section icon="cash-outline" title="Mức giá mong muốn">
            <Text style={styles.label}>Số tiền bạn ở ghép chia/tháng (đ) *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 1500000"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={priceShare}
              onChangeText={(t) => setPriceShare(t.replace(/\D/g, ''))}
            />
            {!!priceNumber && <Text style={styles.preview}>{money(priceNumber)} / tháng</Text>}
          </Section>

          <Section icon="school-outline" title="Trường đại học gần đó">
            <View style={styles.wrap}>{UNIVERSITIES.map((u) => <Chip key={u} label={u} active={uni === u} onPress={() => setUni(uni === u ? '' : u)} />)}</View>
          </Section>

          <Section icon="people-outline" title="Giới tính ưu tiên">
            <View style={styles.wrap}>{GENDERS.map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => setGender(gender === g ? '' : g)} />)}</View>
          </Section>

          <Section icon="time-outline" title="Giờ giấc sinh hoạt">
            <View style={styles.wrap}>{SLEEP.map((s) => <Chip key={s} label={s} active={sleep === s} onPress={() => setSleep(sleep === s ? '' : s)} />)}</View>
            <View style={styles.wrap}>{WAKE.map((s) => <Chip key={s} label={s} active={wake === s} onPress={() => setWake(wake === s ? '' : s)} />)}</View>
          </Section>

          <Section icon="heart-outline" title="Thói quen">
            <View style={styles.wrap}>{HABITS.map((h) => <Chip key={h} label={h} active={habits.includes(h)} onPress={() => toggleHabit(h)} />)}</View>
          </Section>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.submit, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting} activeOpacity={0.9}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>Đăng tin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  body: { padding: 16, paddingBottom: 24 },
  section: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginLeft: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  textarea: { height: 100 },
  preview: { color: colors.accent, fontWeight: '800', fontSize: 16, marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { fontSize: 12, color: colors.muted },
  roomOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  roomOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roomName: { fontSize: 14, fontWeight: '700', color: colors.text },
  demoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 10, borderRadius: radius.sm, marginBottom: 14 },
  demoText: { color: '#92400E', fontSize: 12, marginLeft: 6, flex: 1 },
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.pill },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 8 },
});
