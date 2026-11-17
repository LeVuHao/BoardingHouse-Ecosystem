import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RoomCard({ room, onPress }) {
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN') + ' đ/tháng';
  };

  const imageUrl = room.image || room.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600';
  const isRoommate = room.status === 'ROOMMATE_OPEN';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {/* Container ảnh phòng */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <View style={[styles.badge, isRoommate ? styles.badgeRoommate : styles.badgeAvailable]}>
          <Text style={styles.badgeText}>
            {isRoommate ? '👥 Tìm ở ghép' : '✓ Còn phòng'}
          </Text>
        </View>
        
        {room.verified && (
          <View style={styles.badgeVerified}>
            <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
            <Text style={styles.badgeVerifiedText}>Đã xác minh</Text>
          </View>
        )}
      </View>

      {/* Thông tin phòng */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {room.title || room.name}
        </Text>
        
        <Text style={styles.price}>{formatPrice(room.price)}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="expand-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>{room.area || 25} m²</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>{room.currentOccupants || 1}/{room.capacity || 2} người</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color="#6366F1" />
          <Text style={styles.locationText} numberOfLines={1}>
            {room.address || `${room.district || 'Thủ Đức'}, TP. Hồ Chí Minh`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    position: 'relative',
    height: 165,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
  },
  badgeRoommate: {
    backgroundColor: 'rgba(99, 102, 241, 0.95)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeVerified: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeVerifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 22,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
});
