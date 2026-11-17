import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { API_ENDPOINTS } from '../../constants/config';

export default function ProfileScreen({ navigation }) {
  const { user, isAuthenticated, logout, updateProfile, changePassword, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [activeTicketsCount, setActiveTicketsCount] = useState(1);

  // Modal Sửa hồ sơ
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIdCard, setEditIdCard] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Modal Đổi mật khẩu
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Lấy số lượng thông báo chưa đọc & ticket mở
  const fetchCounts = async () => {
    if (!isAuthenticated) return;
    try {
      // Đếm thông báo chưa đọc
      const resNotify = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD);
      if (resNotify.data?.data?.count !== undefined) {
        setUnreadNotifications(resNotify.data.data.count);
      }
    } catch (e) {
      // Giữ mock count mặc định
    }

    try {
      // Đếm ticket sự cố
      const resTickets = await apiClient.get(API_ENDPOINTS.MY_MAINTENANCE_TICKETS);
      const tickets = resTickets.data?.data || resTickets.data;
      if (Array.isArray(tickets)) {
        const active = tickets.filter(
          (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
        ).length;
        setActiveTicketsCount(active);
      }
    } catch (e) {
      // Giữ mock count mặc định
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchCounts();
    setRefreshing(false);
  };

  // Mở modal sửa thông tin
  const openEditModal = () => {
    setEditFullName(user?.fullName || '');
    setEditPhone(user?.phoneNumber || '');
    setEditIdCard(user?.idCardNumber || '');
    setEditModalVisible(true);
  };

  // Lưu sửa thông tin
  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống');
      return;
    }
    setEditLoading(true);
    try {
      const res = await updateProfile({
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim(),
        idCardNumber: editIdCard.trim(),
      });
      if (res.success) {
        Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân!');
        setEditModalVisible(false);
      } else {
        Alert.alert('Thất bại', res.message || 'Không thể cập nhật');
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    if (!currentPwd) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPwd !== confirmNewPwd) {
      Alert.alert('Lỗi', 'Mật khẩu mới và mật khẩu xác nhận không trùng khớp');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await changePassword(currentPwd, newPwd);
      if (res.success) {
        Alert.alert('Thành công 🎉', 'Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực.');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmNewPwd('');
        setPwdModalVisible(false);
      } else {
        Alert.alert('Thất bại', res.message || 'Đổi mật khẩu không thành công');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  // Đăng xuất an toàn
  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Roomily không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Giao diện Khách (chưa đăng nhập)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconBox}>
            <Ionicons name="person-circle-outline" size={76} color="#6366F1" />
          </View>
          <Text style={styles.guestTitle}>Chào mừng bạn đến với Roomily</Text>
          <Text style={styles.guestSubtitle}>
            Đăng nhập tài khoản để quản lý hợp đồng thuê phòng, thanh toán hóa đơn, xem thông báo và gửi báo hỏng điện nước tức thì.
          </Text>

          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.guestLoginText}>Đăng nhập ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestRegisterBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestRegisterText}>Chưa có tài khoản? Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Vai trò hiển thị
  const roleName =
    user?.role === 'LANDLORD'
      ? 'Chủ nhà trọ'
      : user?.role === 'ADMIN'
      ? 'Quản trị viên'
      : 'Sinh viên thuê trọ';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.profileMeta}>
              <Text style={styles.userName}>{user?.fullName || 'Người dùng Roomily'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons
                  name={user?.role === 'LANDLORD' ? 'business' : 'school'}
                  size={12}
                  color="#4F46E5"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.roleText}>{roleName}</Text>
              </View>
            </View>
          </View>

          {/* Dòng tóm tắt thông tin */}
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Điện thoại</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CCCD / CMND</Text>
              <Text style={styles.infoValue}>{user?.idCardNumber || 'Chưa định danh'}</Text>
            </View>
          </View>
        </View>

        {/* Khối Truy cập nhanh Phân hệ Hùng phụ trách */}
        <Text style={styles.sectionHeading}>Dịch vụ & Tiện ích sinh viên</Text>

        <View style={styles.menuContainer}>
          {/* Trung tâm thông báo */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="notifications" size={22} color="#6366F1" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Trung tâm thông báo</Text>
              <Text style={styles.menuSub}>Hợp đồng duyệt, hóa đơn mới, cập nhật trọ</Text>
            </View>
            {unreadNotifications > 0 ? (
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{unreadNotifications} mới</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Báo hỏng điện nước & thiết bị */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MaintenanceTickets')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="construct" size={22} color="#D97706" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Báo hỏng điện nước & Thiết bị</Text>
              <Text style={styles.menuSub}>Yêu cầu sửa bóng đèn, vòi nước, máy lạnh</Text>
            </View>
            {activeTicketsCount > 0 ? (
              <View style={[styles.badgePill, { backgroundColor: '#FDE68A' }]}>
                <Text style={[styles.badgePillText, { color: '#92400E' }]}>
                  {activeTicketsCount} đang xử lý
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Khối Cài đặt tài khoản */}
        <Text style={styles.sectionHeading}>Cài đặt tài khoản</Text>

        <View style={styles.menuContainer}>
          {/* Chỉnh sửa thông tin cá nhân */}
          <TouchableOpacity style={styles.menuItem} onPress={openEditModal} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="create-outline" size={22} color="#334155" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Chỉnh sửa thông tin cá nhân</Text>
              <Text style={styles.menuSub}>Họ tên, số điện thoại, số CCCD</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Đổi mật khẩu */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setPwdModalVisible(true)} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="key-outline" size={22} color="#334155" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Đổi mật khẩu đăng nhập</Text>
              <Text style={styles.menuSub}>Bảo mật tài khoản của bạn</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất an toàn */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Roomily Mobile v1.0.0 • Phân hệ Quản trị & Cá nhân</Text>
      </ScrollView>

      {/* MODAL: SỬA HỒ SƠ */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalInputLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.modalInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ và tên"
              />

              <Text style={styles.modalInputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />

              <Text style={styles.modalInputLabel}>Số CCCD / CMND</Text>
              <TextInput
                style={styles.modalInput}
                value={editIdCard}
                onChangeText={setEditIdCard}
                placeholder="12 chữ số căn cước"
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, editLoading && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ĐỔI MẬT KHẨU */}
      <Modal visible={pwdModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setPwdModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalInputLabel}>Mật khẩu hiện tại *</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="Mật khẩu đang sử dụng"
                secureTextEntry
              />

              <Text style={styles.modalInputLabel}>Mật khẩu mới (tối thiểu 6 ký tự) *</Text>
              <TextInput
                style={styles.modalInput}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
              />

              <Text style={styles.modalInputLabel}>Xác nhận mật khẩu mới *</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmNewPwd}
                onChangeText={setConfirmNewPwd}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, pwdLoading && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Xác nhận đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // Guest state
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  guestIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  guestLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guestRegisterBtn: {
    paddingVertical: 10,
  },
  guestRegisterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  // Profile card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  // Menu
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 6,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
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
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    gap: 12,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1E293B',
  },
  modalSubmitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
