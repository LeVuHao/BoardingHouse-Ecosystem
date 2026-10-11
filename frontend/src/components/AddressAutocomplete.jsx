import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, X, Sparkles } from "lucide-react";

// Dữ liệu mẫu địa điểm nổi tiếng / trường ĐH / khu vực trọ phổ biến tại VN (Hoạt động offline 100%)
const POPULAR_VN_LOCATIONS = [
  {
    name: "Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
    display_name: "1 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "1 Võ Văn Ngân",
    ward: "Phường Linh Chiểu",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8514,
    lon: 106.7719,
  },
  {
    name: "Làng Đại học Quốc gia TP.HCM (Khu Đô Thị ĐHQG)",
    display_name: "Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "Khu Đô Thị ĐHQG TP.HCM",
    ward: "Phường Linh Trung",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8753,
    lon: 106.8007,
  },
  {
    name: "Ký túc xá Khu A ĐHQG TP.HCM",
    display_name: "Đường Tạ Quang Bửu, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "KTX Khu A ĐHQG",
    ward: "Phường Linh Trung",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8781,
    lon: 106.8062,
  },
  {
    name: "Đại học Bách Khoa TP.HCM (Cơ sở 1)",
    display_name: "268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh",
    address: "268 Lý Thường Kiệt",
    ward: "Phường 14",
    district: "Quận 10",
    city: "TP. Hồ Chí Minh",
    lat: 10.7725,
    lon: 106.6578,
  },
  {
    name: "Đại học Kinh tế TP.HCM (UEH)",
    display_name: "59C Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    address: "59C Nguyễn Đình Chiểu",
    ward: "Phường Võ Thị Sáu",
    district: "Quận 3",
    city: "TP. Hồ Chí Minh",
    lat: 10.7828,
    lon: 106.6958,
  },
  {
    name: "Đại học Công nghiệp TP.HCM (IUH)",
    display_name: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    address: "12 Nguyễn Văn Bảo",
    ward: "Phường 4",
    district: "Quận Gò Vấp",
    city: "TP. Hồ Chí Minh",
    lat: 10.8223,
    lon: 106.6875,
  },
  {
    name: "Đường D2 (Nguyễn Gia Trí) - Khu trọ HUTECH",
    display_name: "Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh",
    address: "Nguyễn Gia Trí",
    ward: "Phường 25",
    district: "Quận Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    lat: 10.8038,
    lon: 106.7161,
  },
  {
    name: "Đại học Văn Lang (Cơ sở 3)",
    display_name: "69/68 Đặng Thùy Trâm, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh",
    address: "69/68 Đặng Thùy Trâm",
    ward: "Phường 13",
    district: "Quận Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    lat: 10.8273,
    lon: 106.7023,
  },
  {
    name: "Khu Công nghệ cao TP.HCM (SHTP)",
    display_name: "Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "Lê Văn Việt",
    ward: "Phường Tăng Nhơn Phú A",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8498,
    lon: 106.7909,
  },
  {
    name: "Đại học Giao thông Vận tải (Phân hiệu TP.HCM)",
    display_name: "450 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "450 Lê Văn Việt",
    ward: "Phường Tăng Nhơn Phú A",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8458,
    lon: 106.7946,
  },
  {
    name: "Đại học Tôn Đức Thắng (Quận 7)",
    display_name: "19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh",
    address: "19 Nguyễn Hữu Thọ",
    ward: "Phường Tân Phong",
    district: "Quận 7",
    city: "TP. Hồ Chí Minh",
    lat: 10.7327,
    lon: 106.6992,
  },
  {
    name: "Đại học Khoa học Tự nhiên TP.HCM (Cơ sở 1)",
    display_name: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
    address: "227 Nguyễn Văn Cừ",
    ward: "Phường 4",
    district: "Quận 5",
    city: "TP. Hồ Chí Minh",
    lat: 10.7628,
    lon: 106.6825,
  },
  {
    name: "Đại học Quốc gia Hà Nội (Cầu Giấy)",
    display_name: "144 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội",
    address: "144 Xuân Thủy",
    ward: "Phường Dịch Vọng Hậu",
    district: "Cầu Giấy",
    city: "Hà Nội",
    lat: 21.0368,
    lon: 105.7826,
  },
  {
    name: "Đại học Bách Khoa Hà Nội",
    display_name: "1 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội",
    address: "1 Đại Cồ Việt",
    ward: "Phường Bách Khoa",
    district: "Hai Bà Trưng",
    city: "Hà Nội",
    lat: 21.0056,
    lon: 105.8433,
  },
  {
    name: "Đại học Bách Khoa - ĐH Đà Nẵng",
    display_name: "54 Nguyễn Lương Bằng, Phường Hòa Khánh Bắc, Quận Liên Chiểu, Đà Nẵng",
    address: "54 Nguyễn Lương Bằng",
    ward: "Phường Hòa Khánh Bắc",
    district: "Liên Chiểu",
    city: "Đà Nẵng",
    lat: 16.0738,
    lon: 108.1498,
  },
  {
    name: "Chợ Thủ Đức (Khu dân cư sầm uất)",
    display_name: "Kha Vạn Cân, Phường Linh Tây, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "Kha Vạn Cân",
    ward: "Phường Linh Tây",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8529,
    lon: 106.7571,
  },
  {
    name: "Ngã Tư Hàng Xanh (Bình Thạnh)",
    display_name: "Điện Biên Phủ, Phường 21, Quận Bình Thạnh, TP. Hồ Chí Minh",
    address: "Điện Biên Phủ",
    ward: "Phường 21",
    district: "Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    lat: 10.8012,
    lon: 106.7118,
  },
  {
    name: "Gigamall Phạm Văn Đồng",
    display_name: "240 Phạm Văn Đồng, Phường Hiệp Bình Chánh, TP. Thủ Đức, TP. Hồ Chí Minh",
    address: "240 Phạm Văn Đồng",
    ward: "Phường Hiệp Bình Chánh",
    district: "Thủ Đức",
    city: "TP. Hồ Chí Minh",
    lat: 10.8286,
    lon: 106.7238,
  },
];

const removeDiacritics = (str = "") => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

const COMMON_VN_WARDS = [
  "Linh Trung", "Linh Chiểu", "Linh Tây", "Linh Xuân", "Hiệp Phú", 
  "Tăng Nhơn Phú A", "Tăng Nhơn Phú B", "Phước Long A", "Phước Long B", 
  "Bình Thọ", "Trường Thọ", "Hiệp Bình Chánh", "Hiệp Bình Phước", "Tam Phú", "Tam Bình",
  "Long Thạnh Mỹ", "Bách Khoa", "Dịch Vọng Hậu", "Dịch Vọng", "Mai Dịch", "Nghĩa Đô", "Nghĩa Tân",
  "Hòa Khánh Bắc", "Hòa Khánh Nam", "Hòa Cường Nam", "Hòa Cường Bắc",
  "Tân Phong", "Tân Phú", "Võ Thị Sáu", "Bến Nghé", "Bến Thành", "Đa Kao",
  "Thảo Điền", "An Phú", "Bình An", "Phú Hữu", "Long Trường",
  "Phường 25", "Phường 26", "Phường 27", "Phường 28", "Phường 21", "Phường 22", 
  "Phường 19", "Phường 17", "Phường 15", "Phường 14", "Phường 13", "Phường 12", 
  "Phường 11", "Phường 10", "Phường 9", "Phường 8", "Phường 7", "Phường 6", 
  "Phường 5", "Phường 4", "Phường 3", "Phường 2", "Phường 1"
];

// Hàm bóc tách phường/xã từ thông tin trả về (Hỗ trợ cả có dấu, không dấu, phường số, xã/thị trấn bất kỳ trên toàn quốc)
const extractWardFromProperties = (p = {}, displayName = "", query = "") => {
  const candidates = [displayName, p.name, query, p.street].filter(Boolean);

  for (const str of candidates) {
    // 1. Khớp phường số (VD: Phường 4, Phường 10, Phường 25, P. 14, Phuong 12)
    const numberMatch = str.match(/(?:Phường|Phuong|Xã|Xa|P\.)\s*(\d+[A-Za-z]?)/i);
    if (numberMatch) {
      return `Phường ${numberMatch[1]}`;
    }

    // 2. Khớp phường/xã chữ (VD: Phường Bến Nghé, Phường Dịch Vọng Hậu, Xã Tân Triều)
    const nameMatch = str.match(
      /(?:Phường|Phuong|Xã|Xa|Thị trấn|Thi tran|P\.)\s+([A-Za-z0-9\u00C0-\u1EF9]+(?:\s+[A-Za-z0-9\u00C0-\u1EF9]+){0,3}?)(?=[,\.]|$|\s+(?:Quận|Quan|Huyện|Huyen|Thị xã|Thi xa|Thành phố|Thanh pho|TP|TP\.|Q\.|H\.))/i
    );
    if (nameMatch) {
      let w = nameMatch[0].trim();
      if (w.toLowerCase().startsWith("p.")) w = "Phường " + w.slice(2).trim();
      if (w.toLowerCase().startsWith("phuong ")) w = "Phường " + w.slice(7).trim();
      if (w.toLowerCase().startsWith("xa ")) w = "Xã " + w.slice(3).trim();
      if (w.endsWith(",")) w = w.slice(0, -1).trim();
      return w;
    }
  }

  if (p.suburb) {
    return p.suburb.startsWith("Phường") || p.suburb.startsWith("Xã") ? p.suburb : "Phường " + p.suburb;
  }
  if (p.quarter) {
    return p.quarter.startsWith("Phường") || p.quarter.startsWith("Xã") ? p.quarter : "Phường " + p.quarter;
  }
  if (p.locality && !p.locality.toLowerCase().startsWith("khu phố") && !p.locality.toLowerCase().startsWith("kp") && !p.locality.toLowerCase().startsWith("tổ")) {
    return p.locality.startsWith("Phường") || p.locality.startsWith("Xã") ? p.locality : "Phường " + p.locality;
  }

  // Tra cứu qua danh sách phường phổ biến
  const allText = `${displayName} ${p.name || ""} ${query} ${p.street || ""}`;
  for (const cw of COMMON_VN_WARDS) {
    if (allText.toLowerCase().includes(cw.toLowerCase())) {
      return cw.startsWith("Phường") ? cw : "Phường " + cw;
    }
  }

  return "";
};

/**
 * Component Gợi ý địa chỉ tự động (Address Autocomplete)
 * Hỗ trợ Photon Komoot API + Fallback Dữ liệu phổ biến offline
 */
const AddressAutocomplete = ({
  value = "",
  onChange,
  onSelectAddress,
  placeholder = "Nhập số nhà, tên đường, khu vực, trường ĐH để tự động điền...",
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

  // Tìm kiếm gợi ý địa chỉ
  useEffect(() => {
    const trimmed = (query || "").trim();
    if (!trimmed || trimmed.length < 2) {
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
      const qNormalized = removeDiacritics(trimmed);

      // 1. Tìm trong danh sách offline trước (tức thì 0ms)
      const offlineMatches = POPULAR_VN_LOCATIONS.filter((loc) => {
        const fullText = removeDiacritics(
          `${loc.name} ${loc.display_name} ${loc.address} ${loc.ward} ${loc.district} ${loc.city}`
        );
        return fullText.includes(qNormalized);
      });

      try {
        // 2. Tìm kiếm trực tuyến qua Photon Komoot API (Nhanh, không chặn CORS, hỗ trợ tọa độ)
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed
        )}&limit=6&lang=en`;

        const res = await fetch(photonUrl, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const features = data.features || [];

          const onlineMatches = features.map((f, idx) => {
            const p = f.properties || {};
            const coords = f.geometry?.coordinates || [106.7, 10.8]; // [lon, lat]

            let city = p.city || p.state || "";
            if (
              city.toLowerCase().includes("hồ chí minh") ||
              city.toLowerCase().includes("ho chi minh")
            ) {
              city = "TP. Hồ Chí Minh";
            } else if (
              city.toLowerCase().includes("hà nội") ||
              city.toLowerCase().includes("ha noi")
            ) {
              city = "Hà Nội";
            } else if (
              city.toLowerCase().includes("đà nẵng") ||
              city.toLowerCase().includes("da nang")
            ) {
              city = "Đà Nẵng";
            }

            let district = p.district || "";
            if (!district && p.county) district = p.county;
            if (!district && p.locality && (p.locality.toLowerCase().includes("quận") || p.locality.toLowerCase().includes("huyện") || p.locality.toLowerCase().includes("thị xã"))) {
              district = p.locality;
            }

            const street = [p.housenumber, p.street].filter(Boolean).join(" ");
            const address = street || p.name || trimmed;

            const displayName = [
              p.name,
              p.housenumber,
              p.street,
              district,
              city,
              p.country,
            ]
              .filter(Boolean)
              .join(", ");

            const extractedWard = extractWardFromProperties(p, displayName, trimmed);

            return {
              id: `online-${p.osm_id || idx}`,
              name: p.name || street || district,
              display_name: displayName,
              address: address,
              ward: extractedWard,
              district: district,
              city: city || "TP. Hồ Chí Minh",
              lat: Number(coords[1]),
              lon: Number(coords[0]),
            };
          });

          // Ghép kết quả: Ưu tiên local matches nếu khớp, sau đó tới online
          const merged = [...offlineMatches, ...onlineMatches];
          // Lọc trùng theo display_name
          const unique = merged.filter(
            (v, i, a) => a.findIndex((t) => t.display_name === v.display_name) === i
          );

          setSuggestions(unique.slice(0, 8));
          setShowDropdown(unique.length > 0);
        } else {
          // Nếu API online lỗi, dùng kết quả offline
          setSuggestions(offlineMatches);
          setShowDropdown(offlineMatches.length > 0);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // Fallback sang offline
          setSuggestions(offlineMatches);
          setShowDropdown(offlineMatches.length > 0);
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setShowDropdown(false);

    if (onChange) onChange(item.display_name);
    if (onSelectAddress) {
      onSelectAddress({
        displayName: item.display_name,
        address: item.address || item.name || query,
        ward: item.ward || "",
        district: item.district || "",
        city: item.city || "",
        latitude: item.lat ? Number(item.lat) : undefined,
        longitude: item.lon ? Number(item.lon) : undefined,
      });
    }
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
            if (suggestions.length > 0) {
              setShowDropdown(true);
            } else if (!query) {
              // Khi mới bấm vào ô chưa gõ gì, hiện sẵn các gợi ý phổ biến!
              setSuggestions(POPULAR_VN_LOCATIONS.slice(0, 6));
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 38px 10px 36px",
            fontSize: "13.5px",
            borderRadius: "8px",
            border: "1.5px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 11,
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <Search size={16} />
        </div>

        <div style={{ position: "absolute", right: 11, display: "flex", alignItems: "center", gap: 4 }}>
          {loading && <Loader2 size={16} className="animate-spin" style={{ color: "#16a34a" }} />}
          {!loading && query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
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
            background: "var(--bg-card)",
            borderRadius: "12px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
            border: "1.5px solid var(--border-color)",
            zIndex: 99999,
            maxHeight: "280px",
            overflowY: "auto",
            padding: "6px 0",
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#16a34a",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <Sparkles size={12} /> Bấm chọn để tự động điền địa chỉ & tọa độ bản đồ:
          </div>
          {suggestions.map((item, idx) => (
            <div
              key={item.id || item.display_name || idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: "9px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                borderBottom: idx === suggestions.length - 1 ? "none" : "1px solid var(--border-color)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <MapPin size={15} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  {item.name || item.address}
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "var(--text-secondary)",
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
