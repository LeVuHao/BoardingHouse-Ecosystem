import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { API_ENDPOINTS } from '../../constants/config';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Hợp đồng thuê phòng đã được phê duyệt! 🎉',
    content: 'Chủ nhà Cô Lan đã ký duyệt hợp đồng thuê phòng 204. Vui lòng kiểm tra chi tiết trong mục Trọ của tôi.',
    type: 'RENTAL_APPROVED',
    isRead: false,
    createdAt: '10 phút trước',
  },
  {
    id: 2,
    title: 'Hóa đơn tiền phòng Tháng 11/2026 🧾',
    content: 'Hóa đơn tổng cộng 3.650.000đ (tiền phòng + điện nước) đã được tạo. Hạn thanh toán đến ngày 25/11.',
    type: 'BILL_CREATED',
    isRead: false,
    createdAt: '2 giờ trước',
  },
  {
    id: 3,
    title: 'Xác nhận thanh toán thành công 💳',
    content: 'Giao dịch chuyển khoản VietQR cho hóa đơn Tháng 10/2026 đã được ghi nhận tự động qua ngân hàng.',
    type: 'PAYMENT_SUCCESS',
    isRead: true,
    createdAt: '2 ngày trước',
  },
  {
    id: 4,
    title: 'Chủ trọ đã tiếp nhận báo hỏng điện nước 🔧',
    content: 'Sự cố "Cháy bóng đèn phòng khách" đã được chuyển sang trạng thái: Đang cử thợ đến sửa chữa.',
    type: 'MAINTENANCE_UPDATE',
    isRead: true,
    createdAt: '3 ngày trước',
  },
  {
    id: 5,
    title: 'Yêu cầu ở ghép đã được chấp thuận 🤝',
    content: 'Bạn đã được thêm vào danh sách người ở ghép của phòng 102. Chúc bạn có trải nghiệm tuyệt vời!',
    type: 'JOIN_APPROVED',
    isRead: true,
    createdAt: '5 ngày trước',
  },
];

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, CONTRACT, BILL
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } catch (e) {
      console.log('[Notifications] Dùng Mock Notifications do chưa nối Backend:', e.message);
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Đánh dấu 1 thông báo đã đọc
  const handleMarkAsRead = async (item) => {
    if (item.isRead) return;

    // Cập nhật UI ngay lập tức
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    try {
      await apiClient.put(API_ENDPOINTS.NOTIFICATION_READ(item.id));
    } catch (e) {
      // offline silent
    }
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Lọc thông báo
  const filteredList = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.isRead;
    if (filter === 'CONTRACT') return item.type?.includes('RENTAL') || item.type?.includes('JOIN');
    if (filter === 'BILL') return item.type?.includes('BILL') || item.type?.includes('PAYMENT');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderIcon = (type) => {
    switch (type) {
      case 'RENTAL_APPROVED':
      case 'JOIN_APPROVED':
        return { name: 'document-text', color: '#10B981', bg: '#ECFDF5' };
      case 'BILL_CREATED':
        return { name: 'receipt', color: '#F59E0B', bg: '#FEF3C7' };
      case 'PAYMENT_SUCCESS':
        return { name: 'card', color: '#6366F1', bg: '#EEF2FF' };
      case 'MAINTENANCE_UPDATE':
        return { name: 'construct', color: '#3B82F6', bg: '#EFF6FF' };
      default:
        return { name: 'notifications', color: '#6366F1', bg: '#EEF2FF' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Thông báo hệ thống</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Đã đọc hết</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
          { key: 'CONTRACT', label: 'Hợp đồng' },
          { key: 'BILL', label: 'Hóa đơn' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, filter === tab.key && styles.filterChipActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === tab.key && styles.filterChipTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
            <Text style={styles.emptySub}>
              Các cập nhật mới nhất về phòng trọ và hóa đơn sẽ xuất hiện ở đây.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const icon = renderIcon(item.type);
          return (
            <TouchableOpacity
              style={[styles.notifyCard, !item.isRead && styles.notifyCardUnread]}
              onPress={() => handleMarkAsRead(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name} size={22} color={icon.color} />
              </View>

              <View style={styles.notifyBody}>
                <View style={styles.notifyTopRow}>
                  <Text style={[styles.notifyTitle, !item.isRead && styles.notifyTitleBold]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifyContent} numberOfLines={3}>
                  {item.content}
                </Text>
                <Text style={styles.notifyTime}>
                  {item.createdAt || 'Gần đây'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#EEF2FF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#4F46E5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  notifyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  notifyCardUnread: {
    backgroundColor: '#FBFBFF',
    borderColor: '#E0E7FF',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notifyBody: {
    flex: 1,
  },
  notifyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  notifyTitleBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginLeft: 6,
    marginTop: 4,
  },
  notifyContent: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifyTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});
