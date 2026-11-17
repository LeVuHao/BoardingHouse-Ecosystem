import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, FlatList, 
  TouchableOpacity, SafeAreaView, StatusBar, ScrollView,
  RefreshControl, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import RoomCard from '../../components/RoomCard';
import { API_ENDPOINTS } from '../../constants/config';

// Dữ liệu mẫu phong phú khi test giao diện hoặc khi backend chưa chạy
const MOCK_ROOMS = [
  {
    id: 1,
    title: 'Phòng trọ cao cấp có gác lửng gần ĐH Sư Phạm Kỹ Thuật & PTIT',
    price: 3200000,
    deposit: 3200000,
    area: 28,
    district: 'TP. Thủ Đức',
    address: 'Số 1 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức',
    capacity: 2,
    currentOccupants: 1,
    status: 'AVAILABLE',
    verified: true,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
    amenities: ['Máy lạnh', 'Wifi tốc độ cao', 'Gác lửng', 'Chỗ để xe', 'Camera an ninh'],
  },
  {
    id: 2,
    title: 'Phòng studio full nội thất máy lạnh, ban công thoáng mát gần HUTECH',
    price: 4500000,
    deposit: 4500000,
    area: 32,
    district: 'Bình Thạnh',
    address: 'Đường D2, Phường 25, Quận Bình Thạnh',
    capacity: 2,
    currentOccupants: 1,
    status: 'ROOMMATE_OPEN',
    verified: true,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    amenities: ['Máy lạnh', 'Tủ lạnh', 'Máy giặt chung', 'Ban công', 'Thang máy'],
  },
  {
    id: 3,
    title: 'Ký túc xá sinh viên máy lạnh gần trạm Metro & ĐH Quốc Gia',
    price: 1600000,
    deposit: 1600000,
    area: 20,
    district: 'TP. Thủ Đức',
    address: 'Khu phố 6, Linh Trung, TP. Thủ Đức (Làng Đại Học)',
    capacity: 4,
    currentOccupants: 3,
    status: 'ROOMMATE_OPEN',
    verified: false,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
    amenities: ['Máy lạnh', 'Wifi', 'Giường tầng', 'Bảo vệ 24/7'],
  },
  {
    id: 4,
    title: 'Phòng khép kín sạch đẹp gần trường ĐH Bách Khoa TP.HCM',
    price: 3800000,
    deposit: 3800000,
    area: 25,
    district: 'Quận 10',
    address: '268 Lý Thường Kiệt, Phường 14, Quận 10',
    capacity: 2,
    currentOccupants: 0,
    status: 'AVAILABLE',
    verified: true,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
    amenities: ['Máy lạnh', 'Nóng lạnh', 'Kệ bếp', 'Khóa vân tay'],
  },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'Tất cả giá' },
  { id: 'under2', label: 'Dưới 2 triệu' },
  { id: '2to4', label: '2 - 4 triệu' },
  { id: 'over4', label: 'Trên 4 triệu' },
];

const DISTRICT_FILTERS = ['Tất cả quận', 'TP. Thủ Đức', 'Bình Thạnh', 'Quận 10', 'Quận 9'];

export default function RoomListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả quận');
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Gọi API lấy danh sách phòng từ Backend
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.ROOMS, { timeout: 3500 });
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data);
      } else {
        setRooms(MOCK_ROOMS);
      }
    } catch (err) {
      // Khi backend chưa bật hoặc IP chưa đúng, fallback sang Mock data mượt mà
      console.log('[RoomList] Dùng Mock Rooms do chưa kết nối Backend:', err.message);
      setRooms(MOCK_ROOMS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  // Lọc dữ liệu theo Từ khóa, Giá và Quận/Huyện
  const filteredRooms = rooms.filter(room => {
    const titleMatch = (room.title || room.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const addressMatch = (room.address || room.district || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery && !titleMatch && !addressMatch) return false;

    // Lọc theo quận
    if (selectedDistrict !== 'Tất cả quận') {
      const roomDistrict = room.district || room.address || '';
      if (!roomDistrict.includes(selectedDistrict)) return false;
    }

    // Lọc theo giá
    if (selectedPrice === 'under2') return room.price < 2000000;
    if (selectedPrice === '2to4') return room.price >= 2000000 && room.price <= 4000000;
    if (selectedPrice === 'over4') return room.price > 4000000;

    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header chính */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brandTitle}>Roomily 🏡</Text>
            <Text style={styles.brandSubtitle}>Tìm trọ & bạn ở ghép sinh viên</Text>
          </View>
          <TouchableOpacity 
            style={styles.myContractButton}
            onPress={() => navigation?.navigate('MyContracts')}
          >
            <Ionicons name="home" size={16} color="#6366F1" />
            <Text style={styles.myContractText}>Trọ của tôi</Text>
          </TouchableOpacity>
        </View>

        {/* Thanh tìm kiếm */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748B" />
          <TextInput
            placeholder="Tìm theo khu vực, trường ĐH (PTIT, HUTECH...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Lọc theo mức giá */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {PRICE_FILTERS.map(filter => {
            const isActive = selectedPrice === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedPrice(filter.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lọc theo Quận */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.districtScroll}>
          {DISTRICT_FILTERS.map((dist, idx) => {
            const isActive = selectedDistrict === dist;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedDistrict(dist)}
                style={[styles.districtChip, isActive && styles.districtChipActive]}
              >
                <Text style={[styles.districtText, isActive && styles.districtTextActive]}>
                  {dist}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Danh sách phòng */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải danh sách phòng trọ...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              onPress={() => navigation?.navigate('RoomDetail', { room: item, roomId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
              <Text style={styles.emptyDesc}>Hãy thử thay đổi mức giá hoặc khu vực tìm kiếm</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  myContractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  myContractText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  filterScroll: {
    paddingTop: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  districtScroll: {
    paddingTop: 8,
    gap: 8,
  },
  districtChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  districtChipActive: {
    backgroundColor: '#E0E7FF',
  },
  districtText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  districtTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
