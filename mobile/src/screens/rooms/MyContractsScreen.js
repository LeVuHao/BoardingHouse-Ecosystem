import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Image, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/config';

const MOCK_CONTRACTS = [
  {
    id: 101,
    roomTitle: 'Phòng 204 - Trọ cao cấp gác lửng ĐH Sư Phạm Kỹ Thuật',
    address: 'Số 1 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức',
    startDate: '01/10/2026',
    endDate: '01/10/2027',
    monthlyRent: 3200000,
    deposit: 3200000,
    status: 'ACTIVE', // ACTIVE, PENDING, EXPIRED
    landlordName: 'Cô Lan',
    landlordPhone: '0909123456',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
    currentBill: {
      id: 5,
      month: '11/2026',
      totalAmount: 3650000,
      status: 'UNPAID', // UNPAID, PAID
    }
  },
  {
    id: 102,
    roomTitle: 'Phòng 102 - Studio full nội thất Bình Thạnh',
    address: 'Đường D2, Phường 25, Quận Bình Thạnh',
    startDate: 'Chờ duyệt',
    endDate: '12 tháng',
    monthlyRent: 4500000,
    deposit: 4500000,
    status: 'PENDING',
    landlordName: 'Anh Tuấn',
    landlordPhone: '0912345678',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    currentBill: null
  }
];

export default function MyContractsScreen({ navigation }) {
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.MY_CONTRACTS, { timeout: 3000 });
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setContracts(data);
      } else {
        setContracts(MOCK_CONTRACTS);
      }
    } catch (e) {
      console.log('[MyContracts] Dùng mock contracts do chưa nối backend:', e.message);
      setContracts(MOCK_CONTRACTS);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const formatPrice = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

  const renderStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <View style={[styles.badge, styles.badgeActive]}>
          <Text style={styles.badgeActiveText}>✓ ĐANG THUÊ</Text>
        </View>
      );
    }
    if (status === 'PENDING') {
      return (
        <View style={[styles.badge, styles.badgePending]}>
          <Text style={styles.badgePendingText}>⏳ ĐANG CHỜ DUYỆT</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeExpired]}>
        <Text style={styles.badgeExpiredText}>ĐÃ KẾT THÚC</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trọ Của Tôi 🏠</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={contracts}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContracts(); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Ảnh & Thông tin chính */}
            <View style={styles.cardHeader}>
              <Image source={{ uri: item.image }} style={styles.roomImage} resizeMode="cover" />
              <View style={styles.headerInfo}>
                {renderStatusBadge(item.status)}
                <Text style={styles.roomTitle} numberOfLines={2}>{item.roomTitle}</Text>
                <Text style={styles.rentText}>{formatPrice(item.monthlyRent)}/tháng</Text>
              </View>
            </View>

            {/* Chi tiết hợp đồng */}
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={15} color="#6366F1" />
                <Text style={styles.infoText} numberOfLines={1}>{item.address}</Text>
              </View>

              <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>Bắt đầu thuê</Text>
                  <Text style={styles.dateVal}>{item.startDate}</Text>
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>Tiền cọc</Text>
                  <Text style={styles.dateVal}>{formatPrice(item.deposit)}</Text>
                </View>
              </View>

              {/* Thông tin chủ trọ */}
              <View style={styles.landlordRow}>
                <View style={styles.landlordMeta}>
                  <Ionicons name="person-circle" size={24} color="#64748B" />
                  <Text style={styles.landlordName}>{item.landlordName} ({item.landlordPhone})</Text>
                </View>
                <TouchableOpacity 
                  style={styles.callIconBtn}
                  onPress={() => Alert.alert('Gọi chủ nhà', `Số điện thoại: ${item.landlordPhone}`)}
                >
                  <Ionicons name="call" size={14} color="#10B981" />
                  <Text style={styles.callBtnText}>Gọi điện</Text>
                </TouchableOpacity>
              </View>

              {/* Khối Hóa đơn tháng nếu đang thuê (Gộp Hóa đơn vào Trọ của tôi) */}
              {item.currentBill && (
                <View style={styles.billBox}>
                  <View style={styles.billHeader}>
                    <Text style={styles.billMonth}>Hóa đơn tháng {item.currentBill.month}</Text>
                    <Text style={item.currentBill.status === 'PAID' ? styles.billPaid : styles.billUnpaid}>
                      {item.currentBill.status === 'PAID' ? '✓ ĐÃ THANH TOÁN' : '⏳ CHƯA THANH TOÁN'}
                    </Text>
                  </View>
                  <View style={styles.billBottomRow}>
                    <Text style={styles.billAmount}>{formatPrice(item.currentBill.totalAmount)}</Text>
                    <TouchableOpacity 
                      style={styles.btnPayQr}
                      onPress={() => navigation?.navigate('MyBills', { billId: item.currentBill.id })}
                    >
                      <Ionicons name="qr-code" size={14} color="#FFFFFF" />
                      <Text style={styles.btnPayQrText}>Thanh toán VietQR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  roomImage: { width: 90, height: 90, borderRadius: 10 },
  headerInfo: { flex: 1, justifyContent: 'center' },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgeActiveText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgePendingText: { color: '#D97706', fontSize: 11, fontWeight: '700' },
  badgeExpired: { backgroundColor: '#F1F5F9' },
  badgeExpiredText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  roomTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 19 },
  rentText: { fontSize: 15, fontWeight: '800', color: '#EF4444', marginTop: 4 },
  cardBody: { padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  infoText: { fontSize: 13, color: '#475569', flex: 1 },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  dateCol: { alignItems: 'flex-start' },
  dateLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  dateVal: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  landlordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  landlordMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  landlordName: { fontSize: 13, fontWeight: '600', color: '#334155' },
  callIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  callBtnText: { fontSize: 12, color: '#059669', fontWeight: '700' },
  billBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  billMonth: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  billPaid: { fontSize: 11, fontWeight: '700', color: '#059669' },
  billUnpaid: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  billBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billAmount: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  btnPayQr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnPayQrText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
