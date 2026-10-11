import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, X, Check } from "lucide-react";

/**
 * Component Gợi ý địa chỉ tự động (Address Autocomplete)
 * Sử dụng Nominatim OpenStreetMap (Việt Nam)
 */
const AddressAutocomplete = ({
  value = "",
  onChange,
  onSelectAddress,
  placeholder = "Nhập số nhà, tên đường, khu vực để gợi ý tự động...",
  style = {},
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click ngoài vùng để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tìm kiếm gợi ý địa chỉ qua Nominatim với debounce 400ms
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=vn&limit=5&q=${encodeURIComponent(
          query.trim()
        )}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept-Language": "vi" },
        });

        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Lỗi gợi ý địa chỉ:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (item) => {
    const addr = item.address || {};

    // Chuẩn hóa tên Tỉnh / Thành phố
    let city =
      addr.city ||
      addr.province ||
      addr.state ||
      "";
    if (city.toLowerCase().includes("hồ chí minh") || city.toLowerCase().includes("ho chi minh")) {
      city = "TP. Hồ Chí Minh";
    }

    // Chuẩn hóa Quận / Huyện
    const district =
      addr.city_district ||
      addr.district ||
      addr.county ||
      addr.town ||
      "";

    // Chuẩn hóa Phường / Xã
    const ward =
      addr.quarter ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.village ||
      "";

    // Địa chỉ chi tiết (số nhà + tên đường)
    const streetName = [addr.house_number, addr.road].filter(Boolean).join(" ");
    const detailedAddress = streetName || item.name || query;

    const parsedResult = {
      displayName: item.display_name,
      address: detailedAddress,
      ward: ward,
      district: district,
      city: city,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    };

    setQuery(item.display_name);
    setShowDropdown(false);

    if (onChange) onChange(item.display_name);
    if (onSelectAddress) onSelectAddress(parsedResult);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    if (onChange) onChange("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", ...style }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 38px 10px 36px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "#fff",
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <Search size={16} />
        </div>

        <div style={{ position: "absolute", right: 12, display: "flex", alignItems: "center", gap: 4 }}>
          {loading && <Loader2 size={16} className="room-location-spinner" style={{ color: "var(--primary)" }} />}
          {!loading && query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* DROPDOWN GỢI Ý ĐỊA CHỈ */}
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "1px solid var(--border)",
            zIndex: 9999,
            maxHeight: "280px",
            overflowY: "auto",
            padding: "6px 0",
          }}
        >
          <div style={{ padding: "6px 14px", fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Địa điểm gợi ý tự động (Bấm để chọn & tự điền)
          </div>
          {suggestions.map((item, idx) => (
            <div
              key={item.place_id || idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                borderBottom: idx === suggestions.length - 1 ? "none" : "1px solid #f1f5f9",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <MapPin size={16} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>
                  {item.name || item.display_name.split(",")[0]}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 2,
                  }}
                >
                  {item.display_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
