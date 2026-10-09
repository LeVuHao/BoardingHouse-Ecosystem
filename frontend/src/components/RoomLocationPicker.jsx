import React, { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LoaderCircle, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "../utils/configureLeafletIcon";

const DEFAULT_CENTER = [10.7769, 106.7009];
const BASEMAP_ATTRIBUTION =
  'Sources: <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, and the GIS User Community';
const BASEMAP_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const GEOCODE_DEBOUNCE_MS = 1000;
const SEARCH_RADIUS_METERS = 2500;

const placeCategoryNames = {
  university: "Trường Đại học",
  college: "Trường Cao đẳng",
  school: "Trường học",
  hospital: "Bệnh viện / Phòng khám",
  marketplace: "Chợ truyền thống",
  supermarket: "Siêu thị / TTTM",
  bus_station: "Bến xe / Trạm trung chuyển",
};

const getDistanceMeters = (from, to) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const [lat1, lng1] = from.map(radians);
  const [lat2, lng2] = to.map(radians);
  const latDelta = lat2 - lat1;
  const lngDelta = lng2 - lng1;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;

  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const MapFocus = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position || DEFAULT_CENTER, position ? 16 : 12);
  }, [map, position]);

  return null;
};

const MapClickHandler = ({ onSelect }) => {
  useMapEvents({
    click: (event) => onSelect([event.latlng.lat, event.latlng.lng]),
  });

  return null;
};

const RoomLocationPicker = ({ addressQuery, initialLocation, onChange }) => {
  const onChangeRef = useRef(onChange);
  const geocodeControllerRef = useRef(null);
  const manualSelectionQueryRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const latitude = Number(initialLocation?.latitude);
    const longitude = Number(initialLocation?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
      query: addressQuery.trim(),
      position: [latitude, longitude],
    };
  });
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [nearbyResult, setNearbyResult] = useState(null);
  const query = addressQuery.trim();
  const position = selectedLocation?.query === query ? selectedLocation.position : null;
  const locationKey = position ? `${query}:${position[0]}:${position[1]}` : null;
  const nearbyPlaces = nearbyResult?.key === locationKey ? nearbyResult.places : [];
  const geocodeStatus = !query
    ? "idle"
    : geocodeResult?.query === query
      ? geocodeResult.status
      : "waiting";
  const placesStatus = !position
    ? "idle"
    : nearbyResult?.key !== locationKey
      ? "loading"
      : nearbyResult.error
        ? "error"
        : "loaded";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let controller;

    if (!query) {
      return undefined;
    }

    if (manualSelectionQueryRef.current !== query) {
      manualSelectionQueryRef.current = null;
    }

    const timer = window.setTimeout(async () => {
      if (manualSelectionQueryRef.current === query) return;
      controller = new AbortController();
      geocodeControllerRef.current = controller;
      setGeocodeResult({ query, status: "loading" });

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          limit: "1",
          countrycodes: "vn",
          q: query,
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { signal: controller.signal, headers: { "Accept-Language": "vi" } },
        );

        if (!response.ok) {
          throw new Error(`Nominatim trả về lỗi ${response.status}`);
        }

        const results = await response.json();
        if (results.length === 0) {
          setGeocodeResult({ query, status: "not-found" });
          return;
        }

        const nextPosition = [Number(results[0].lat), Number(results[0].lon)];
        if (controller.signal.aborted) return;
        setSelectedLocation({ query, position: nextPosition });
        setGeocodeResult({ query, status: "found" });
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Không thể tìm tọa độ địa chỉ:", error);
        setGeocodeResult({ query, status: "error" });
      }
    }, GEOCODE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller?.abort();
      if (geocodeControllerRef.current === controller) {
        geocodeControllerRef.current = null;
      }
    };
  }, [query]);

  useEffect(() => {
    if (!position) return undefined;

    const controller = new AbortController();
    const [latitude, longitude] = position;
    const query = `
      [out:json][timeout:20];
      (
        nwr["amenity"~"^(university|college|school|hospital|marketplace|bus_station)$"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
        nwr["shop"="supermarket"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      );
      out center tags;
    `;

    onChangeRef.current({
      latitude,
      longitude,
      nearbyPlaces: [],
    });

    const loadNearbyPlaces = async () => {
      try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: query,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Overpass trả về lỗi ${response.status}`);
        }

        const result = await response.json();
        const places = result.elements
          .map((element) => {
            const placeLatitude = element.lat ?? element.center?.lat;
            const placeLongitude = element.lon ?? element.center?.lon;
            const name = element.tags?.name;
            const category =
              placeCategoryNames[element.tags?.amenity] ||
              placeCategoryNames[element.tags?.shop];

            if (!name || !category || placeLatitude == null || placeLongitude == null) {
              return null;
            }

            return {
              id: `${element.type}-${element.id}`,
              name,
              category,
              distanceMeters: getDistanceMeters(position, [
                placeLatitude,
                placeLongitude,
              ]),
              latitude: placeLatitude,
              longitude: placeLongitude,
            };
          })
          .filter(Boolean)
          .sort((first, second) => first.distanceMeters - second.distanceMeters)
          .slice(0, 5);

        if (controller.signal.aborted) return;
        setNearbyResult({ key: locationKey, places, error: false });
        onChangeRef.current({
          latitude,
          longitude,
          nearbyPlaces: places,
        });
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        console.error("Không thể tìm địa điểm lân cận:", error);
        setNearbyResult({ key: locationKey, places: [], error: true });
      }
    };

    loadNearbyPlaces();
    return () => controller.abort();
  }, [position, locationKey]);

  const updatePosition = (nextPosition, isManual = true) => {
    if (isManual) {
      geocodeControllerRef.current?.abort();
      manualSelectionQueryRef.current = query;
      setGeocodeResult({ query, status: "found" });
    }
    setSelectedLocation({ query, position: nextPosition });
  };

  return (
    <section style={{ marginTop: 8 }}>
      <div style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={position ? 16 : 12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution={BASEMAP_ATTRIBUTION}
            url={BASEMAP_URL}
            maxNativeZoom={19}
          />
          <MapFocus position={position} />
          <MapClickHandler onSelect={(nextPosition) => updatePosition(nextPosition)} />
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const markerPosition = event.target.getLatLng();
                  updatePosition([markerPosition.lat, markerPosition.lng]);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div style={{ minHeight: 36, paddingTop: 8, color: "var(--text-muted)", fontSize: 13 }}>
        {geocodeStatus === "waiting" && "Đang chờ nhập địa chỉ..."}
        {geocodeStatus === "loading" && (
          <span><LoaderCircle size={14} className="room-location-spinner" /> Đang tìm tọa độ địa chỉ...</span>
        )}
        {geocodeStatus === "found" && (
          <span>Đã tìm thấy vị trí. Kéo ghim hoặc bấm lên bản đồ để chỉnh lại.</span>
        )}
        {geocodeStatus === "not-found" && "Không tìm thấy địa chỉ; hãy thử thêm phường, quận và thành phố."}
        {geocodeStatus === "error" && "Không thể tra cứu địa chỉ lúc này. Bạn vẫn có thể chọn vị trí trực tiếp trên bản đồ."}
        {geocodeStatus === "idle" && "Nhập địa chỉ để tìm vị trí, hoặc bấm lên bản đồ để chọn thủ công."}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 8 }}>
          <MapPin size={15} />
          Địa điểm nổi bật gần đây
        </div>
        {placesStatus === "loading" && <div className="muted">Đang tìm trường học, chợ và bệnh viện gần vị trí...</div>}
        {placesStatus === "error" && <div className="muted">Không thể tải địa điểm lân cận. Vị trí phòng vẫn được lưu.</div>}
        {placesStatus === "loaded" && nearbyPlaces.length === 0 && (
          <div className="muted">Chưa tìm thấy địa điểm phù hợp trong bán kính 2,5 km.</div>
        )}
        {nearbyPlaces.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 5 }}>
            {nearbyPlaces.map((place) => (
              <li key={place.id}>
                {place.name} <span className="muted">· {place.category} · {place.distanceMeters >= 1000
                  ? `${(place.distanceMeters / 1000).toFixed(1)} km`
                  : `${place.distanceMeters} m`}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`.room-location-spinner { vertical-align: -2px; animation: room-location-spin 1s linear infinite; } @keyframes room-location-spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
};

export default RoomLocationPicker;
