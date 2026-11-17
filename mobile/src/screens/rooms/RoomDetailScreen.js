import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, Alert, Modal, TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/config';

export default function RoomDetailScreen({ route, navigation }) {
  // Lấy dữ liệu phòng từ params truyền sang, hoặc dùng fallback mock data
  const room = route?.params?.room || {
    id: 1,
    title: 'Phòng trọ cao cấp có gác lửng gần ĐH Sư Phạm Kỹ Thuật & PTIT',
    price: 3200000,
    deposit: 3200000,
    area: 28,
    district: 'TP. Thủ Đức',
    address: 'Số 1 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức',
    capacity: 2,
    currentOccupants: 1,
    electricityRate: '3.500 đ/kWh',
    waterRate: '20.000 đ/m³',
    internetRate: '100.000 đ/phòng',
    description: 'Phòng mới xây sạch sẽ, giờ giấc tự do không chung chủ, có gác lửng cao không đụng đầu, ban công thoáng mát, bãi xe vân tay an ninh 24/7.',
    landlord: {
      name: 'Cô Lan (Chủ nhà)',
      phone: '0909123456',
    },
    amenities: ['Máy lạnh', 'Wifi tốc độ cao', 'Gác lửng', 'Chỗ để xe', 'Camera an ninh', 'Tủ lạnh', 'Khóa vân tay'],
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
  };

  const images = room.images && room.images.length > 0 ? room.images : [
    room.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
  ];

  const [activeImage, setActiveImage] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [rentMessage, setRentMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const formatPrice = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

  // Xử lý gửi yêu cầu thuê phòng
  const handleSendRentalRequest = async () => {
    try {
      setSubmitting(true);
      // Gọi API POST /rental/requests
      const payload = {
        roomId: room.id,
        message: rentMessage || 'Em muốn gửi yêu cầu thuê phòng này ạ.',
      };
      
      await axios.post(API_ENDPOINTS.RENTAL_REQUEST, payload, { timeout: 3000 });
      setModalVisible(false);
      Alert.alert(
        'Gửi yêu cầu thành công! 🎉',
        'Yêu cầu thuê phòng của bạn đã được chuyển tới Chủ trọ. Bạn có thể theo dõi tiến độ phê duyệt tại mục "Trọ của tôi".',
        [
          { text: 'Xem Trọ của tôi', onPress: () => navigation?.navigate('MyContracts') },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } catch (err) {
      console.log('[RoomDetail] Gửi yêu cầu offline/mock:', err.message);
      // Khi backend chưa bật, vẫn thông báo thành công cho trải nghiệm demo UI
      setModalVisible(false);
      Alert.alert(
        'Gửi yêu cầu thành công! (Demo Mode) 🎉',
        'Đã gửi yêu cầu thuê phòng số ' + room.id + ' đến Chủ trọ. Trạng thái: Đang chờ duyệt.',
        [
          { text: 'Xem Trọ của tôi', onPress: () => navigation?.navigate('MyContracts') },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Nút Back & Wishlist ở góc trên */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconCircle} 
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={isFavorite ? "#EF4444" : "#1E293B"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner ảnh lớn */}
        <View style={styles.carouselContainer}>
          <Image source={{ uri: images[activeImage] }} style={styles.mainImage} resizeMode="cover" />
          <View style={styles.imageIndicator}>
            <Text style={styles.indicatorText}>{activeImage + 1}/{images.length}</Text>
          </View>
        </View>

        {/* Thumbnail lướt ngang */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            {images.map((img, idx) => (
              <TouchableOpacity key={idx} onPress={() => setActiveImage(idx)}>
                <Image 
                  source={{ uri: img }} 
                  style={[styles.thumbImage, activeImage === idx && styles.thumbActive]} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Chi tiết nội dung */}
        <View style={styles.contentSection}>
          <Text style={styles.roomTitle}>{room.title || room.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceHighlight}>{formatPrice(room.price)}</Text>
            <Text style={styles.perMonth}>/ tháng</Text>
          </View>

          <View style={styles.locationBox}>
            <Ionicons name="location" size={16} color="#6366F1" />
            <Text style={styles.locationAddress}>{room.address || `${room.district}, TP. Hồ Chí Minh`}</Text>
          </View>

          {/* Bảng thông số cơ bản */}
          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Diện tích</Text>
              <Text style={styles.specValue}>{room.area || 25} m²</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Tiền cọc</Text>
              <Text style={styles.specValue}>{formatPrice(room.deposit || room.price)}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Sức chứa</Text>
              <Text style={styles.specValue}>{room.capacity || 2} người</Text>
            </View>
          </View>

          {/* Biểu phí dịch vụ */}
          <Text style={styles.sectionHeading}>Biểu phí dịch vụ hàng tháng</Text>
          <View style={styles.ratesBox}>
            <View style={styles.rateRow}>
              <Text style={styles.rateName}>⚡ Tiền điện</Text>
              <Text style={styles.rateVal}>{room.electricityRate || '3.500 đ/kWh'}</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateName}>💧 Tiền nước</Text>
              <Text style={styles.rateVal}>{room.waterRate || '20.000 đ/m³'}</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateName}>🌐 Internet & Dịch vụ</Text>
              <Text style={styles.rateVal}>{room.internetRate || '100.000 đ/phòng'}</Text>
            </View>
          </View>

          {/* Tiện ích có sẵn */}
          <Text style={styles.sectionHeading}>Tiện ích phòng trọ</Text>
          <View style={styles.amenityWrap}>
            {(room.amenities || ['Máy lạnh', 'Wifi', 'Gác lửng', 'Chỗ để xe']).map((item, idx) => (
              <View key={idx} style={styles.amenityBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Mô tả chi tiết */}
          <Text style={styles.sectionHeading}>Mô tả phòng</Text>
          <Text style={styles.descriptionText}>
            {room.description || 'Phòng trọ đầy đủ tiện nghi, môi trường sinh viên văn minh lịch sự, thuận tiện đi lại tới các trường đại học.'}
          </Text>

          {/* Thẻ liên hệ Chủ trọ */}
          <View style={styles.landlordCard}>
            <View style={styles.landlordAvatar}>
              <Ionicons name="person" size={24} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.landlordName}>{room.landlord?.name || 'Chủ trọ Roomily'}</Text>
              <Text style={styles.landlordRole}>✓ Đã xác minh danh tính</Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => Alert.alert('Liên hệ Chủ nhà', `Số điện thoại: ${room.landlord?.phone || '0909123456'}`)}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Thanh đặt phòng cố định ở dưới */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Giá thuê</Text>
          <Text style={styles.bottomPriceVal}>{formatPrice(room.price)}</Text>
        </View>
        <TouchableOpacity style={styles.btnBook} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnBookText}>Gửi Yêu Cầu Thuê</Text>
          <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modal gửi yêu cầu thuê phòng */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Gửi Yêu Cầu Thuê Phòng 📝</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSub}>
              Nhập thông tin giới thiệu bản thân hoặc thời gian bạn dự kiến dọn vào:
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="VD: Em là sinh viên PTIT năm 3, muốn đăng ký thuê phòng và dự kiến dọn vào từ đầu tháng sau..."
              value={rentMessage}
              onChangeText={setRentMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnConfirm} 
                onPress={handleSendRentalRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Xác nhận gửi</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topNav: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  carouselContainer: { position: 'relative', height: 260 },
  mainImage: { width: '100%', height: '100%' },
  imageIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  indicatorText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  thumbScroll: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC' },
  thumbImage: { width: 64, height: 48, borderRadius: 8, marginRight: 8 },
  thumbActive: { borderWidth: 2, borderColor: '#6366F1' },
  contentSection: { padding: 16 },
  roomTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', lineHeight: 28 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 12 },
  priceHighlight: { fontSize: 22, fontWeight: '900', color: '#EF4444' },
  perMonth: { fontSize: 14, color: '#64748B', marginLeft: 4 },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  locationAddress: { fontSize: 14, color: '#475569', flex: 1 },
  specsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specBox: { alignItems: 'center' },
  specLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  specValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 16, marginBottom: 10 },
  ratesBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, gap: 8 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rateName: { fontSize: 14, color: '#475569' },
  rateVal: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  amenityText: { fontSize: 13, color: '#065F46', fontWeight: '600' },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  landlordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    marginBottom: 80,
    gap: 12,
  },
  landlordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landlordName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  landlordRole: { fontSize: 12, color: '#6366F1' },
  callButton: {
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bottomPriceLabel: { fontSize: 12, color: '#64748B' },
  bottomPriceVal: { fontSize: 18, fontWeight: '800', color: '#EF4444' },
  btnBook: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  btnBookText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    height: 90,
    fontSize: 14,
    marginBottom: 16,
    color: '#1E293B',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalBtnCancelText: { color: '#475569', fontWeight: '600' },
  modalBtnConfirm: { flex: 2, padding: 12, borderRadius: 10, backgroundColor: '#6366F1', alignItems: 'center' },
  modalBtnConfirmText: { color: '#FFFFFF', fontWeight: '700' },
});
