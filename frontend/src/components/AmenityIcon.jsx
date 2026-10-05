import React from "react";
import {
  Wifi, AirVent, WashingMachine, Car, Camera, Layers, Refrigerator, Clock, Tv, Bath, Bed,
  ShieldCheck, Fan, Flame, Utensils, Bike, Lock, Sofa, Droplets, Zap, Home, Star, Trees,
  Dumbbell, Warehouse, Shirt, Lightbulb, Tag,
} from "lucide-react";

// Các icon Admin có thể chọn cho một tiện ích (lưu tên icon trong DB).
export const AMENITY_ICONS = {
  Wifi, AirVent, WashingMachine, Car, Camera, Layers, Refrigerator, Clock, Tv, Bath, Bed,
  ShieldCheck, Fan, Flame, Utensils, Bike, Lock, Sofa, Droplets, Zap, Home, Star, Trees,
  Dumbbell, Warehouse, Shirt, Lightbulb,
};

/**
 * Hiển thị icon của tiện ích. `name` có thể là tên icon lucide (vd "Wifi")
 * hoặc một emoji / ký tự tự nhập; không có thì dùng icon Tag mặc định.
 */
const AmenityIcon = ({ name, size = 16, color }) => {
  const Cmp = name ? AMENITY_ICONS[name] : null;
  if (Cmp) return <Cmp size={size} color={color} />;
  if (name) return <span style={{ fontSize: size, lineHeight: 1 }}>{name}</span>;
  return <Tag size={size} color={color} />;
};

export default AmenityIcon;
