import { useEffect, useState } from "react";
import { catalogApi } from "../api/apiClient";

// Chỉ dùng khi không gọi được API (backend chưa chạy) để giao diện không trống.
const FALLBACK = ["Wifi", "Máy lạnh", "Máy giặt", "Chỗ để xe", "Camera an ninh", "Gác lửng"].map(
  (name, i) => ({ id: `fb-${i}`, name, icon: null }),
);

/** Lấy danh sách tiện ích đang bật từ Admin (Master Data). */
export default function useAmenities() {
  const [amenities, setAmenities] = useState(FALLBACK);

  useEffect(() => {
    let alive = true;
    catalogApi
      .getAmenities()
      .then((res) => {
        if (alive) setAmenities(res.data || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return amenities;
}
