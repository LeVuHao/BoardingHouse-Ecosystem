import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { colors, radius, shadow } from '../../constants/theme';
import { rentalApi, forumApi } from '../../api/forumApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/forum/Avatar';
import Chip from '../../components/forum/Chip';
import { decodeDescription, money, timeAgo } from '../../utils/roommateMeta';
import { MOCK_ROOMMATE_POSTS, MOCK_INBOX } from './mockData';

const TABS = [
  { key: 'roommate', label: 'Ở ghép' },
  { key: 'inbox', label: 'Tin nhắn' },
];
const UNIVERSITIES = ['Tất cả', 'PTIT', 'HUTECH', 'UEH', 'BKHN', 'HUST', 'UIT'];
const GENDERS = ['Tất cả', 'Nam', 'Nữ', 'Không yêu cầu'];

const toList = (res) => {
  const d = res?.data;
  return Array.isArray(d) ? d : d?.content || [];
};

export default function RoommateScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const myId = user?.id;

  const [tab, setTab] = useState('roommate');
  const [roommates, setRoommates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demo, setDemo] = useState(false);
  const [problem, setProblem] = useState('');
  // trạng thái demo theo từng nguồn dữ liệu: nguồn nào lỗi thì chỉ nguồn đó dùng demo
  const [src, setSrc] = useState({ roommate: false, inbox: false });

  const [keyword, setKeyword] = useState('');
  const [uni, setUni] = useState('Tất cả');
  const [gender, setGender] = useState('Tất cả');


  const load = useCallback(async () => {
    // Chưa đăng nhập -> không gọi API (sẽ bị 401), hiển thị dữ liệu demo
    if (!isAuthenticated) {
      setRoommates(MOCK_ROOMMATE_POSTS);
      setMessages(MOCK_INBOX);
      setDemo(true);
      setSrc({ roommate: true, inbox: true });
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const [r, m] = await Promise.allSettled([
      rentalApi.getRoommatePosts(),
      forumApi.getMyAllMessages(),
    ]);
    const problems = [];
    const failed = {};
    const pick = (res, mock, label, setter, key) => {
      if (res.status === 'fulfilled') { setter(toList(res.value)); return; }
      failed[key] = true;
      setter(mock);
      problems.push(`${label}: ${res.reason?.message || 'lỗi không xác định'}${res.reason?.status ? ` (${res.reason.status})` : ''}`);
    };
    pick(r, MOCK_ROOMMATE_POSTS, 'Tin ở ghép', setRoommates, 'roommate');
    pick(m, MOCK_INBOX, 'Tin nhắn', setMessages, 'inbox');
    setSrc({ roommate: !!failed.roommate, inbox: !!failed.inbox });
    setDemo(problems.length > 0);
    setProblem(problems.join(' · '));
    setLoading(false);
    setRefreshing(false);
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredRoommates = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return roommates.filter((p) => {
      const { text, meta } = decodeDescription(p.description);
      if (uni !== 'Tất cả' && (meta.truong || '').toUpperCase() !== uni.toUpperCase()) return false;
      if (gender !== 'Tất cả' && meta.gioitinh !== gender) return false;
      if (kw && !`${p.title} ${text} ${meta.truong || ''}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [roommates, keyword, uni, gender]);

  // Gom tin nhắn theo (bài đăng + người đối thoại)
  const conversations = useMemo(() => {
    const map = {};
    messages.forEach((m) => {
      const mine = m.senderId === myId || (src.inbox && m.senderName === 'Bạn');
      const otherUserId = mine ? m.receiverId : m.senderId;
      const key = `${m.postId}_${otherUserId}`;
      const prev = map[key];
      const unread = !mine && !m.isRead ? 1 : 0;
      if (!prev || new Date(m.createdAt) > new Date(prev.createdAt)) {
        map[key] = { key, postId: m.postId, postTitle: m.postTitle, otherUserId, otherName: mine ? (prev?.otherName || `Người dùng #${otherUserId}`) : (m.senderName || `Người dùng #${otherUserId}`), last: m.content, createdAt: m.createdAt, unread: (prev?.unread || 0) + unread };
      } else {
        prev.unread += unread;
        if (!mine && m.senderName) prev.otherName = m.senderName;
      }
    });
    return Object.values(map).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [messages, myId, src.inbox]);

  const openChat = (params) => navigation.navigate('Chat', params);

  /* ---------- Render items ---------- */
  const renderRoommate = ({ item }) => {
    const { text, meta } = decodeDescription(item.description);
    const name = item.creatorName || `Người dùng #${item.creatorId}`;
    const isMine = item.creatorId === myId;
    const closed = item.status && item.status !== 'OPEN';
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Avatar name={name} seed={item.creatorId} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.sub}>{timeAgo(item.createdAt)}</Text>
          </View>
          {closed && <View style={styles.badgeGray}><Text style={styles.badgeGrayText}>Đã đóng</Text></View>}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        {!!text && <Text style={styles.desc} numberOfLines={3}>{text}</Text>}

        <View style={styles.tags}>
          {!!meta.truong && <Chip icon="school-outline" label={meta.truong} tone="primary" />}
          {!!meta.gioitinh && <Chip icon="people-outline" label={meta.gioitinh} tone="primary" />}
          {!!meta.giogiac && <Chip icon="time-outline" label={meta.giogiac} />}
          {!!meta.thoiquen && <Chip icon="heart-outline" label={meta.thoiquen} />}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.budgetLabel}>Ngân sách chia tiền</Text>
            <Text style={styles.budget}>{money(item.priceShare)}<Text style={styles.sub}> /tháng</Text></Text>
          </View>
          {!isMine && !closed && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => openChat({
                postId: -item.id, // id âm = hội thoại của tin ở ghép (backend tự nhận biết)
                otherUserId: item.creatorId,
                otherName: name,
                postTitle: item.title,
                demo: src.roommate,
              })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Nhắn tin</Text>
            </TouchableOpacity>
          )}
          {isMine && <Text style={styles.sub}>Tin của bạn</Text>}
        </View>
      </View>
    );
  };

  const renderConv = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, styles.row]}
      activeOpacity={0.85}
      onPress={() => openChat({ postId: item.postId, otherUserId: item.otherUserId, otherName: item.otherName, postTitle: item.postTitle, demo: src.inbox })}
    >
      <Avatar name={item.otherName} seed={item.otherUserId} size={48} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.name} numberOfLines={1}>{item.otherName}</Text>
          <Text style={styles.sub}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!!item.postTitle && <Text style={styles.convPost} numberOfLines={1}>{item.postTitle}</Text>}
        <Text style={[styles.desc, item.unread > 0 && { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{item.last}</Text>
      </View>
      {item.unread > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{item.unread}</Text></View>}
    </TouchableOpacity>
  );

  const data = tab === 'roommate' ? filteredRoommates : conversations;
  const renderItem = tab === 'roommate' ? renderRoommate : renderConv;

  const Header = (
    <View>
      {tab !== 'inbox' && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tiêu đề, trường, khu vực…"
            placeholderTextColor={colors.muted}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          {!!keyword && <TouchableOpacity onPress={() => setKeyword('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></TouchableOpacity>}
        </View>
      )}
      {tab === 'roommate' && (
        <>
          <Text style={styles.filterLabel}>Trường đại học gần đó</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {UNIVERSITIES.map((u) => <Chip key={u} label={u} active={uni === u} onPress={() => setUni(u)} />)}
          </ScrollView>
          <Text style={styles.filterLabel}>Giới tính ưu tiên</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {GENDERS.map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} />)}
          </ScrollView>
        </>
      )}
      {demo && (
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#92400E" />
          <Text style={styles.demoText}>
            {isAuthenticated
              ? `Một số dữ liệu chưa tải được nên đang hiện dữ liệu demo.${problem ? `\n${problem}` : ''}`
              : 'Bạn chưa đăng nhập — đang hiển thị dữ liệu demo.'}
          </Text>
          {!isAuthenticated && (
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.demoLink}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Diễn đàn ở ghép</Text>
      </View>

      <View style={styles.segment}>
        {TABS.map((t) => {
          const unread = t.key === 'inbox' ? conversations.reduce((s, c) => s + c.unread, 0) : 0;
          return (
            <TouchableOpacity key={t.key} style={[styles.segBtn, tab === t.key && styles.segBtnActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.segText, tab === t.key && styles.segTextActive]}>{t.label}</Text>
              {unread > 0 && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => String(it.key || it.id)}
          renderItem={renderItem}
          ListHeaderComponent={Header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={tab === 'inbox' ? 'chatbubbles-outline' : 'search-outline'} size={44} color={colors.border} />
              <Text style={styles.emptyText}>{tab === 'inbox' ? 'Chưa có cuộc trò chuyện nào' : 'Không có tin phù hợp'}</Text>
            </View>
          }
        />
      )}

      {tab === 'roommate' && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.9}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: colors.text },

  segment: { flexDirection: 'row', backgroundColor: '#E5E7EB', marginHorizontal: 16, marginVertical: 10, borderRadius: radius.md, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md - 4, flexDirection: 'row', justifyContent: 'center' },
  segBtnActive: { backgroundColor: '#fff', ...shadow },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
  segTextActive: { color: colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginLeft: 6 },

  list: { padding: 16, paddingBottom: 100 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.text },
  filterLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  filterRow: { paddingRight: 8 },
  demoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 10, borderRadius: radius.sm, marginTop: 12 },
  demoText: { color: '#92400E', fontSize: 12, marginLeft: 6, flex: 1 },
  demoLink: { color: '#6366F1', fontSize: 12, fontWeight: '800', marginLeft: 8 },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginTop: 14, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 4 },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  budgetLabel: { fontSize: 11, color: colors.muted },
  budget: { fontSize: 18, fontWeight: '800', color: colors.accent },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  primaryBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },

  badgeGray: { backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeGrayText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  badgeGreen: { backgroundColor: colors.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginLeft: 8 },
  badgeGreenText: { fontSize: 11, color: colors.success, fontWeight: '700' },

  cover: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: '#E5E7EB' },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },

  convPost: { fontSize: 12, color: colors.primary, marginVertical: 2 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8 },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.muted, marginTop: 10 },

  fab: { position: 'absolute', right: 20, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  textarea: { height: 120, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginTop: 14, fontSize: 15, color: colors.text, backgroundColor: colors.bg },
  sheetBtn: { justifyContent: 'center', marginTop: 16, paddingVertical: 14 },
});