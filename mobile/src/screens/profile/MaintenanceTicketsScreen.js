import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { API_ENDPOINTS } from '../../constants/config';

const CATEGORIES = [
  { key: 'ELECTRICAL', label: 'Điện', icon: 'flash', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'PLUMBING', label: 'Cấp thoát nước', icon: 'water', color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'APPLIANCE', label: 'Máy lạnh/Gia dụng', icon: 'snow', color: '#6366F1', bg: '#EEF2FF' },
  { key: 'STRUCTURAL', label: 'Cửa/Tường/Trần', icon: 'business', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'OTHER', label: 'Sự cố khác', icon: 'help-circle', color: '#64748B', bg: '#F1F5F9' },
];

const URGENCIES = [
  { key: 'LOW', label: 'Thấp', color: '#64748B' },
  { key: 'NORMAL', label: 'Bình thường', color: '#10B981' },
  { key: 'HIGH', label: 'Ưu tiên cao', color: '#F59E0B' },
  { key: 'URGENT', label: 'Khẩn cấp', color: '#EF4444' },
];

const MOCK_TICKETS = [
  {
    id: 1,
    roomId: 1,
    roomNumber: 'Phòng 204',
    propertyTitle: 'Trọ cao cấp gác lửng SPKT',
    category: 'ELECTRICAL',
    categoryLabel: 'Điện',
    title: 'Cháy bóng đèn tuýp led phòng khách',
    description: 'Bóng đèn tuýp bị chập chờn 2 hôm nay và tối qua tắt hẳn, cần thay bóng mới.',
    urgency: 'NORMAL',
    urgencyLabel: 'Bình thường',
    status: 'IN_PROGRESS',
    statusLabel: 'Đang sửa chữa',
    landlordNote: 'Đã hẹn thợ điện ghé lúc 17h30 chiều nay kiểm tra cho em nhé.',
    createdAt: 'Hôm nay, 09:15',
  },
  {
    id: 2,
    roomId: 1,
    roomNumber: 'Phòng 204',
    propertyTitle: 'Trọ cao cấp gác lửng SPKT',
    category: 'PLUMBING',
    categoryLabel: 'Cấp thoát nước',
    title: 'Vòi sen nhà tắm bị rò rỉ nước',
    description: 'Khớp nối vòi sen bị nhỏ giọt liên tục gây lãng phí nước sạch.',
    urgency: 'LOW',
    urgencyLabel: 'Thấp',
    status: 'RESOLVED',
    statusLabel: 'Chủ trọ đã khắc phục',
    landlordNote: 'Đã thay ron cao su mới vào trưa nay.',
    createdAt: '3 ngày trước',
  },
  {
    id: 3,
    roomId: 2,
    roomNumber: 'Phòng 102',
    propertyTitle: 'Studio D2 Bình Thạnh',
    category: 'APPLIANCE',
    categoryLabel: 'Máy lạnh',
    title: 'Máy lạnh Panasonic chảy nước',
    description: 'Bật máy lạnh được 30 phút thì có nước rỉ nhỏ xuống sàn gỗ.',
    urgency: 'HIGH',
    urgencyLabel: 'Ưu tiên cao',
    status: 'OPEN',
    statusLabel: 'Chờ chủ trọ tiếp nhận',
    landlordNote: null,
    createdAt: '5 ngày trước',
  },
];

export default function MaintenanceTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal tạo ticket
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ELECTRICAL');
  const [selectedUrgency, setSelectedUrgency] = useState('NORMAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.MY_MAINTENANCE_TICKETS);
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setTickets(data);
      } else {
        setTickets(MOCK_TICKETS);
      }
    } catch (e) {
      console.log('[Maintenance] Dùng Mock Tickets do chưa nối Backend:', e.message);
      setTickets(MOCK_TICKETS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  // Gửi tạo ticket mới
  const handleCreateTicket = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập tiêu đề sự cố ngắn gọn');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng mô tả chi tiết sự cố hỏng hóc');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roomId: 1, // Mặc định phòng đang thuê của người dùng
        category: selectedCategory,
        urgency: selectedUrgency,
        title: title.trim(),
        description: description.trim(),
      };

      const res = await apiClient.post(API_ENDPOINTS.MAINTENANCE_TICKETS, payload);
      const newTicket = res.data?.data || {
        id: Date.now(),
        ...payload,
        roomNumber: 'Phòng 204',
        status: 'OPEN',
        statusLabel: 'Chờ chủ trọ tiếp nhận',
        createdAt: 'Vừa xong',
      };

      setTickets([newTicket, ...tickets]);
      Alert.alert('Thành công 🎉', 'Đã gửi báo hỏng đến chủ trọ! Chủ trọ sẽ nhận được thông báo để xử lý.');
      setModalVisible(false);
      setTitle('');
      setDescription('');
    } catch (e) {
      // Fallback khi offline
      const mockNew = {
        id: Date.now(),
        roomId: 1,
        roomNumber: 'Phòng 204',
        category: selectedCategory,
        categoryLabel: CATEGORIES.find((c) => c.key === selectedCategory)?.label || selectedCategory,
        urgency: selectedUrgency,
        urgencyLabel: URGENCIES.find((u) => u.key === selectedUrgency)?.label || selectedUrgency,
        title: title.trim(),
        description: description.trim(),
        status: 'OPEN',
        statusLabel: 'Chờ chủ trọ tiếp nhận',
        landlordNote: null,
        createdAt: 'Vừa xong',
      };
      setTickets([mockNew, ...tickets]);
      Alert.alert('Thành công 🎉', 'Đã lưu yêu cầu báo hỏng (Mô phỏng offline)!');
      setModalVisible(false);
      setTitle('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  // Người thuê xác nhận sự cố đã xong
  const handleConfirmResolved = async (ticketId) => {
    Alert.alert(
      'Xác nhận hoàn thành',
      'Bạn xác nhận chủ trọ đã khắc phục sự cố này hoàn toàn ổn định?',
      [
        { text: 'Chưa xong', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticketId
                  ? { ...t, status: 'CLOSED', statusLabel: 'Đã đóng hoàn tất' }
                  : t
              )
            );
            try {
              await apiClient.put(API_ENDPOINTS.MAINTENANCE_CONFIRM(ticketId));
            } catch (e) {
              // offline silent
            }
          },
        },
      ]
    );
  };

  // Lọc theo trạng thái
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'OPEN') return t.status === 'OPEN';
    if (filterStatus === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filterStatus === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
    return true;
  });

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { text: 'Chờ tiếp nhận', color: '#D97706', bg: '#FEF3C7' };
      case 'IN_PROGRESS':
        return { text: 'Đang sửa chữa', color: '#2563EB', bg: '#DBEAFE' };
      case 'RESOLVED':
        return { text: 'Chủ trọ đã xong', color: '#059669', bg: '#D1FAE5' };
      case 'CLOSED':
        return { text: 'Đã hoàn tất', color: '#4B5563', bg: '#F3F4F6' };
      default:
        return { text: status, color: '#64748B', bg: '#F1F5F9' };
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
        <Text style={styles.headerTitle}>Báo hỏng & Sự cố điện nước</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Báo mới</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'OPEN', label: 'Chờ xử lý' },
          { key: 'IN_PROGRESS', label: 'Đang sửa' },
          { key: 'RESOLVED', label: 'Đã xong' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, filterStatus === tab.key && styles.filterChipActive]}
            onPress={() => setFilterStatus(tab.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === tab.key && styles.filterChipTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List Tickets */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={56} color="#10B981" />
            <Text style={styles.emptyTitle}>Phòng trọ đang hoạt động tốt!</Text>
            <Text style={styles.emptySub}>
              Không có sự cố hỏng hóc nào được ghi nhận. Nhấn "+ Báo mới" khi cần hỗ trợ sửa chữa.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = renderStatusBadge(item.status);
          const catInfo = CATEGORIES.find((c) => c.key === item.category) || CATEGORIES[4];

          return (
            <View style={styles.ticketCard}>
              {/* Header card */}
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: catInfo.bg }]}>
                  <Ionicons name={catInfo.icon} size={14} color={catInfo.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.categoryText, { color: catInfo.color }]}>
                    {catInfo.label}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {statusStyle.text}
                  </Text>
                </View>
              </View>

              {/* Title & Desc */}
              <Text style={styles.ticketTitle}>{item.title}</Text>
              <Text style={styles.ticketDesc}>{item.description}</Text>

              {/* Landlord Note (nếu có phản hồi) */}
              {item.landlordNote ? (
                <View style={styles.noteBox}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#6366F1" style={{ marginRight: 6 }} />
                  <Text style={styles.noteText}>
                    <Text style={{ fontWeight: '700' }}>Chủ trọ: </Text>
                    {item.landlordNote}
                  </Text>
                </View>
              ) : null}

              {/* Bottom Row */}
              <View style={styles.cardFooter}>
                <View style={styles.roomTag}>
                  <Ionicons name="home-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.roomTagText}>{item.roomNumber || 'Phòng 204'}</Text>
                </View>
                <Text style={styles.timeText}>{item.createdAt || 'Gần đây'}</Text>
              </View>

              {/* Nút xác nhận khi chủ trọ báo đã sửa xong */}
              {item.status === 'RESOLVED' && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirmResolved(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Xác nhận sự cố đã khắc phục tốt</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* MODAL: TẠO BÁO HỎNG */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Gửi yêu cầu báo hỏng</Text>
                <Text style={styles.modalSubtitle}>Chủ trọ sẽ nhận được thông báo để bố trí sửa chữa</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Chọn loại sự cố */}
              <Text style={styles.modalLabel}>Loại sự cố *</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((c) => {
                  const isSelected = selectedCategory === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.catCard, isSelected && styles.catCardSelected]}
                      onPress={() => setSelectedCategory(c.key)}
                    >
                      <Ionicons
                        name={c.icon}
                        size={20}
                        color={isSelected ? '#6366F1' : '#64748B'}
                      />
                      <Text
                        style={[styles.catCardText, isSelected && styles.catCardTextSelected]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Mức độ khẩn cấp */}
              <Text style={styles.modalLabel}>Mức độ ưu tiên</Text>
              <View style={styles.urgencyRow}>
                {URGENCIES.map((u) => {
                  const isSelected = selectedUrgency === u.key;
                  return (
                    <TouchableOpacity
                      key={u.key}
                      style={[
                        styles.urgencyChip,
                        isSelected && { borderColor: u.color, backgroundColor: `${u.color}15` },
                      ]}
                      onPress={() => setSelectedUrgency(u.key)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          isSelected && { color: u.color, fontWeight: '700' },
                        ]}
                      >
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tiêu đề ngắn gọn */}
              <Text style={styles.modalLabel}>Tiêu đề ngắn gọn *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ví dụ: Cháy bóng đèn phòng khách, hỏng vòi sen"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              {/* Gợi ý tiêu đề nhanh */}
              <View style={styles.quickSuggestRow}>
                {['Cháy bóng đèn', 'Hỏng vòi nước', 'Máy lạnh chảy nước', 'Nghẹt lavabo'].map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    style={styles.sugChip}
                    onPress={() => setTitle(sug)}
                  >
                    <Text style={styles.sugText}>+ {sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mô tả chi tiết */}
              <Text style={styles.modalLabel}>Mô tả chi tiết sự cố *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Mô tả cụ thể biểu hiện hư hỏng, vị trí và thời gian bạn có mặt ở phòng để thợ vào sửa..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />

              {/* Nút gửi */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateTicket}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Gửi báo hỏng đến chủ trọ</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    paddingBottom: 36,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  ticketDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#3730A3',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 28,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 10,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  catCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  catCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  catCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catCardTextSelected: {
    color: '#4338CA',
    fontWeight: '700',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  urgencyChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  urgencyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1E293B',
  },
  quickSuggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  sugChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sugText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '600',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
