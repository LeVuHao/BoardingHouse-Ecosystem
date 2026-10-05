import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DivIcon, latLngBounds } from "leaflet";
import { Link } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  Circle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../utils/configureLeafletIcon";

const DEFAULT_CENTER = [10.7769, 106.7009];
const BASEMAP_ATTRIBUTION =
  'Sources: <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, and the GIS User Community';
const BASEMAP_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const geocodeCache = new Map();
let lastNominatimRequestAt = 0;

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatPriceTag = (value) => {
  const price = Number(value || 0);
  if (price >= 1000000) {
    return `${Number((price / 1000000).toFixed(1))} Tr`;
  }
  return `${Math.round(price / 1000)}k`;
};

const getRoomCoordinates = (room) => {
  if (room.latitude == null || room.longitude == null || room.latitude === "" || room.longitude === "") {
    return null;
  }
  const latitude = Number(room.latitude);
  const longitude = Number(room.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;
};

const getGeocodeQuery = (room) =>
  [room.address, room.ward, room.district, room.city]
    .filter(Boolean)
    .join(", ")
    .trim();

const distanceInMeters = (first, second) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const [lat1, lng1] = first.map(toRadians);
  const [lat2, lng2] = second.map(toRadians);
  const latitudeDelta = lat2 - lat1;
  const longitudeDelta = lng2 - lng1;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const createPriceIcon = (price, active) =>
  new DivIcon({
    className: `room-price-marker${active ? " is-active" : ""}`,
    html: `<span>${formatPriceTag(price)}</span>`,
    iconSize: [72, 34],
    iconAnchor: [36, 17],
  });

const MapViewportListener = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => onBoundsChange?.(map.getBounds()),
    zoomend: () => onBoundsChange?.(map.getBounds()),
  });

  return null;
};

const MapController = ({
  searchTarget,
  searchRadiusMeters,
  rooms,
  isVisible,
  geocodingCount,
}) => {
  const map = useMap();
  const fittedInitialRooms = useRef(false);

  useEffect(() => {
    if (!searchTarget) return;
    const zoom = searchRadiusMeters >= 5000 ? 12 : searchRadiusMeters >= 3000 ? 13 : 14;
    map.flyTo(searchTarget, zoom, { duration: 0.8 });
  }, [map, searchTarget, searchRadiusMeters]);

  useEffect(() => {
    if (fittedInitialRooms.current || searchTarget || geocodingCount > 0) return;
    const positions = rooms.map(getRoomCoordinates).filter(Boolean);
    if (positions.length === 0) return;

    fittedInitialRooms.current = true;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else {
      map.fitBounds(latLngBounds(positions), { padding: [36, 36], maxZoom: 14 });
    }
  }, [map, rooms, searchTarget, geocodingCount]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [isVisible, map]);

  useEffect(() => {
    const handleResize = () => map.invalidateSize({ pan: false });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
};

const MapView = ({
  rooms = [],
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = 13,
  height = "600px",
  onMarkerClick,
  onMarkerHover,
  activeRoomId,
  onBoundsChange,
  searchTarget,
  searchRadiusMeters,
  isVisible = true,
  onRoomGeocoded,
}) => {
  const [geocodeResults, setGeocodeResults] = useState({});
  const reportGeocoded = useCallback(
    (roomId, coordinates) => onRoomGeocoded?.(roomId, coordinates),
    [onRoomGeocoded],
  );
  const roomsToGeocode = useMemo(
    () =>
      rooms.filter((room) => {
        if (getRoomCoordinates(room) || !room.address) return false;
        const query = getGeocodeQuery(room).toLowerCase();
        return query && !geocodeCache.has(query) && !(query in geocodeResults);
      }),
    [rooms, geocodeResults],
  );
  const geocodeRequestKey = roomsToGeocode
    .map((room) => `${room.id}:${getGeocodeQuery(room)}`)
    .join("|");
  const geocodingCount = roomsToGeocode.length;
  const resolvedRooms = useMemo(
    () =>
      rooms.map((room) => {
        if (getRoomCoordinates(room)) return room;
        const query = getGeocodeQuery(room).toLowerCase();
        const cachedCoordinates = query in geocodeResults
          ? geocodeResults[query]
          : geocodeCache.get(query);
        return Array.isArray(cachedCoordinates)
          ? { ...room, latitude: cachedCoordinates[0], longitude: cachedCoordinates[1] }
          : room;
      }),
    [rooms, geocodeResults],
  );

  useEffect(() => {
    const unresolvedIds = new Set(
      rooms.filter((room) => !getRoomCoordinates(room)).map((room) => room.id),
    );
    resolvedRooms.forEach((room) => {
      const coordinates = getRoomCoordinates(room);
      if (coordinates && unresolvedIds.has(room.id)) {
        reportGeocoded(room.id, coordinates);
      }
    });
  }, [reportGeocoded, rooms, resolvedRooms]);

  useEffect(() => {
    let cancelled = false;
    const unlocatedRooms = roomsToGeocode;

    if (unlocatedRooms.length === 0) return undefined;
    const geocodeMissingRooms = async () => {
      for (const room of unlocatedRooms) {
        if (cancelled) return;
        const query = getGeocodeQuery(room).toLowerCase();
        if (!query) continue;

        let coordinates;
        if (!geocodeCache.has(query)) {
          const wait = Math.max(0, 1100 - (Date.now() - lastNominatimRequestAt));
          if (wait > 0) {
            await new Promise((resolve) => window.setTimeout(resolve, wait));
            if (cancelled) return;
          }

          try {
            const params = new URLSearchParams({
              format: "jsonv2",
              limit: "1",
              countrycodes: "vn",
              q: getGeocodeQuery(room),
            });
            lastNominatimRequestAt = Date.now();
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?${params}`,
              { headers: { "Accept-Language": "vi" } },
            );
            if (!response.ok) {
              throw new Error(`Nominatim trả về lỗi ${response.status}`);
            }
            const results = await response.json();
            coordinates = results.length
              ? [Number(results[0].lat), Number(results[0].lon)]
              : null;
            geocodeCache.set(query, coordinates);
            setGeocodeResults((previous) => ({ ...previous, [query]: coordinates }));
          } catch (error) {
            if (cancelled) return;
            console.error(`Không thể tìm tọa độ phòng ${room.id}:`, error);
            geocodeCache.set(query, null);
            setGeocodeResults((previous) => ({ ...previous, [query]: null }));
            coordinates = null;
          }
        } else {
          coordinates = geocodeCache.get(query);
        }

        if (!cancelled && coordinates) {
          reportGeocoded(room.id, coordinates);
        }
      }
    };

    geocodeMissingRooms();
    return () => {
      cancelled = true;
    };
  }, [geocodeRequestKey, roomsToGeocode, reportGeocoded]);

  const locatedRooms = resolvedRooms.filter((room) => getRoomCoordinates(room));
  const markerRooms = locatedRooms.filter((room) => {
    if (!searchTarget || !searchRadiusMeters) return true;
    return distanceInMeters(searchTarget, getRoomCoordinates(room)) <= searchRadiusMeters;
  });

  return (
    <div
      style={{
        height,
        width: "100%",
        minHeight: 320,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution={BASEMAP_ATTRIBUTION}
          url={BASEMAP_URL}
          maxNativeZoom={19}
        />
        <MapController
          searchTarget={searchTarget}
          searchRadiusMeters={searchRadiusMeters}
          rooms={locatedRooms}
          isVisible={isVisible}
          geocodingCount={geocodingCount}
        />
        <MapViewportListener onBoundsChange={onBoundsChange} />

        {searchTarget && searchRadiusMeters && (
          <Circle
            center={searchTarget}
            radius={searchRadiusMeters}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.08 }}
          />
        )}

        {markerRooms.map((room) => {
          const position = getRoomCoordinates(room);
          const active = String(room.id) === String(activeRoomId);

          return (
            <Marker
              key={room.id}
              position={position}
              icon={createPriceIcon(room.price, active)}
              eventHandlers={{
                click: () => onMarkerClick?.(room),
                mouseover: () => onMarkerHover?.(room.id),
                mouseout: () => onMarkerHover?.(null),
              }}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: 200, padding: 0 }}>
                  {room.images?.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: 120, background: "#eee", borderRadius: "8px 8px 0 0" }} />
                  )}
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
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
                        display: "block",
                        textAlign: "center",
                        background: "var(--ink)",
                        color: "#fff",
                        padding: "6px 0",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {geocodingCount > 0 && (
        <div className="map-geocoding-status">
          Đang tìm vị trí cho {geocodingCount} phòng chưa có tọa độ...
        </div>
      )}
      {rooms.length > 0 && markerRooms.length === 0 && geocodingCount === 0 && (
        <div className="map-geocoding-status">
          Chưa có tọa độ để hiển thị ghim trên bản đồ.
        </div>
      )}
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 8px; }
        .leaflet-popup-content { margin: 0; width: 100% !important; }
        .room-price-marker { background: transparent; border: 0; }
        .room-price-marker span {
          display: inline-flex; justify-content: center; align-items: center;
          min-width: 58px; height: 32px; padding: 0 8px; border: 2px solid #fff;
          border-radius: 18px; background: #1f2937; color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.3); font-size: 12px; font-weight: 800;
          white-space: nowrap; transition: transform .15s, background .15s;
        }
        .room-price-marker.is-active span { background: #2563eb; transform: scale(1.16); z-index: 1000; }
        .map-geocoding-status {
          position: absolute; z-index: 500; top: 12px; left: 50%; transform: translateX(-50%);
          padding: 7px 12px; border-radius: 8px; background: rgba(255,255,255,.95);
          color: #475569; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }
      `}</style>
    </div>
  );
};

export default MapView;
