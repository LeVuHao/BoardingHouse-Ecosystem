import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Sửa lỗi icon default của Leaflet trong React (Vite/ESM)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

// Component để auto focus map vào marker mới nhất
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

const MapView = ({ rooms, defaultCenter = [10.7769, 106.7009], defaultZoom = 13, height = "600px", onMarkerClick }) => {
  const validRooms = rooms.filter(r => r.latitude && r.longitude);

  if (validRooms.length === 0) {
    return (
      <div style={{
        height, width: "100%", borderRadius: "var(--radius-lg)",
        background: "var(--surface)", border: "1px solid var(--border)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)"
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
        <p>Không có phòng nào có tọa độ vị trí để hiển thị bản đồ.</p>
      </div>
    );
  }

  const center = validRooms.length > 0
    ? [validRooms[0].latitude, validRooms[0].longitude]
    : defaultCenter;

  return (
    <div style={{ height, width: "100%", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", zIndex: 0, position: "relative" }}>
      <MapContainer center={center} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={defaultZoom} />

        {validRooms.map((room) => (
          <Marker
            key={room.id}
            position={[room.latitude, room.longitude]}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(room);
              }
            }}
          >
            <Popup className="custom-popup">
              <div style={{ minWidth: 200, padding: 0 }}>
                {room.images && room.images.length > 0 ? (
                   <img src={room.images[0]} alt={room.title} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "8px 8px 0 0" }} />
                ) : (
                   <div style={{ width: "100%", height: 120, background: "#eee", borderRadius: "8px 8px 0 0" }} />
                )}
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {room.title}
                  </div>
                  <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                    {formatVnd(room.price)}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                    <span>{room.roomArea}m²</span>
                    <span>•</span>
                    <span>{room.city}</span>
                  </div>
                  <Link
                    to={`/rooms/${room.id}`}
                    style={{
                      display: "block", textAlign: "center", background: "var(--ink)", color: "#fff",
                      padding: "6px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none"
                    }}
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 8px; }
        .leaflet-popup-content { margin: 0; width: 100% !important; }
      `}</style>
    </div>
  );
};

export default MapView;
