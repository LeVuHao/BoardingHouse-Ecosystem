import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../../constants/theme';
import { forumApi } from '../../api/forumApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/forum/Avatar';
import { hhmm } from '../../utils/roommateMeta';
import { MOCK_CHAT } from './mockData';

const POLL_MS = 5000;

const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  return d.toLocaleDateString('vi-VN');
};

/**
 * route.params: { postId, otherUserId, otherName?, postTitle?, demo? }
 * - postId < 0: hội thoại của TIN Ở GHÉP (id = -roommatePostId), luôn dùng reply
 * - Lần đầu liên hệ chủ bài đăng diễn đàn: POST /rental/forum/{postId}/messages
 * - Các tin tiếp theo / chủ bài trả lời: POST /rental/forum/{postId}/reply?receiverId=
 */
export default function ChatScreen({ route, navigation }) {
  const { postId, otherUserId, otherName, postTitle, demo } = route.params || {};
  const { user } = useAuth();
  const myId = user?.id ?? 1;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const name = otherName || `Người dùng #${otherUserId}`;

  const load = useCallback(async (silent) => {
    if (demo) {
      setMessages((prev) => (prev.length ? prev : MOCK_CHAT(otherUserId, myId)));
      setLoading(false);
      return;
    }
    try {
      const res = await forumApi.getConversation(postId, otherUserId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setMessages((prev) => {
        // giữ lại tin đang gửi (id tạm) nếu server chưa trả về
        const pending = prev.filter((m) => m.pending);
        return [...list, ...pending];
      });
      list.filter((m) => !m.isRead && m.senderId !== myId).forEach((m) => forumApi.markMessageRead(m.id).catch(() => {}));
    } catch (e) {
      if (!silent) setMessages([]);
    } finally { setLoading(false); }
  }, [demo, postId, otherUserId, myId]);

  useEffect(() => {
    load(false);
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { id: tempId, pending: true, senderId: myId, receiverId: otherUserId, content, createdAt: new Date().toISOString() };
    setMessages((p) => [...p, optimistic]);
    setText('');
    setSending(true);

    if (demo) {
      setMessages((p) => p.map((m) => (m.id === tempId ? { ...m, pending: false } : m)));
      setSending(false);
      return;
    }
    try {
      const payload = { content, senderName: user?.fullName || user?.name || user?.username, senderPhone: user?.phoneNumber };
      const sent = messages.filter((m) => !m.pending);
      const firstContact = postId > 0 && (sent.length === 0 || sent[0].senderId === myId);
      const res = firstContact
        ? await forumApi.sendMessage(postId, payload)
        : await forumApi.replyMessage(postId, otherUserId, payload);
      setMessages((p) => p.map((m) => (m.id === tempId ? { ...(res?.data || m), pending: false } : m)));
    } catch (e) {
      setMessages((p) => p.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
    } finally { setSending(false); }
  };

  const renderItem = ({ item, index }) => {
    const mine = item.senderId === myId;
    const prev = messages[index - 1];
    const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(item.createdAt);
    return (
      <View>
        {showDay && <Text style={styles.day}>{dayLabel(item.createdAt)}</Text>}
        <View style={[styles.msgRow, mine ? styles.mineRow : styles.otherRow]}>
          {!mine && <Avatar name={name} seed={otherUserId} size={28} />}
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther, !mine && { marginLeft: 8 }]}>
            <Text style={[styles.msgText, mine && { color: '#fff' }]}>{item.content}</Text>
            <View style={styles.meta}>
              <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.75)' }]}>{hhmm(item.createdAt)}</Text>
              {mine && item.pending && <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.75)" style={{ marginLeft: 4 }} />}
              {mine && item.failed && <Ionicons name="alert-circle" size={12} color="#FCA5A5" style={{ marginLeft: 4 }} />}
            </View>
          </View>
        </View>
        {item.failed && <Text style={styles.failed}>Gửi thất bại</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Avatar name={name} seed={otherUserId} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
          {!!postTitle && <Text style={styles.headerSub} numberOfLines={1}>{postTitle}</Text>}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={44} color={colors.border} />
                <Text style={styles.emptyText}>Hãy nhắn tin chào {name} nhé!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]} onPress={send} disabled={!text.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2F7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 12, color: colors.primary },

  list: { padding: 12, flexGrow: 1 },
  day: { alignSelf: 'center', fontSize: 11, color: colors.muted, backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, marginVertical: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3 },
  mineRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.bubbleMine, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.bubbleOther, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  time: { fontSize: 10, color: colors.muted },
  failed: { alignSelf: 'flex-end', fontSize: 11, color: colors.danger, marginRight: 4 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.muted, marginTop: 10 },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  input: { flex: 1, maxHeight: 110, backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: colors.text },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});