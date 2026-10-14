import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Clock, Plus, ChevronLeft, ChevronRight,
  MessageCircle, Eye, Users, Zap, X, Search, Filter, RotateCcw,
  Phone, Maximize2, Sparkles, ShieldCheck, SlidersHorizontal, LayoutGrid, List
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { forumApi, rentalApi, unwrapApiData } from "../api/apiClient";
import useAmenities from "../hooks/useAmenities";
import MapView from "../components/MapView";
import WishlistButton from "../components/WishlistButton";

const PAGE_SIZE = 6;
const API_PAGE_SIZE = 100;
const AMENITY_GROUPS = [
  { label: "Nội thất cơ bản", icon: "❄️", keywords: ["máy lạnh", "điều hòa", "tủ lạnh", "máy giặt", "giường", "nệm", "tủ quần áo"] },
  { label: "Kết cấu phòng", icon: "🏠", keywords: ["gác", "ban công", "cửa sổ", "bếp"] },
  { label: "An ninh & tiện ích chung", icon: "🛡️", keywords: ["khóa", "thẻ từ", "camera", "chủ", "24/24", "giờ giấc"] },
  { label: "Quy định & tiện ích", icon: "🐶", keywords: ["thú cưng", "pet", "ở ghép", "thang máy", "bãi xe", "ô tô"] },
];

// Các địa điểm sinh viên & người đi làm quan tâm nhất
const POPULAR_LANDMARKS = [
  { id: "dh-qg", name: "ĐHQG / Làng Đại học", query: "Làng Đại Học Quốc Gia TP.HCM", icon: "🎓", coords: [10.8753, 106.8007], city: "Thủ Đức, TP.HCM" },
  { id: "bach-khoa", name: "ĐH Bách Khoa TP.HCM", query: "Đại học Bách Khoa TP.HCM 268 Lý Thường Kiệt", icon: "🏛️", coords: [10.7725, 106.6578], city: "Quận 10, TP.HCM" },
  { id: "su-pham-kt", name: "ĐH Sư Phạm Kỹ Thuật", query: "Đại học Sư phạm Kỹ thuật TP.HCM", icon: "⚙️", coords: [10.8506, 106.7719], city: "Thủ Đức, TP.HCM" },
  { id: "kinh-te", name: "ĐH Kinh Tế (UEH)", query: "Đại học Kinh tế TP.HCM 59C Nguyễn Đình Chiểu", icon: "📈", coords: [10.7828, 106.6959], city: "Quận 3, TP.HCM" },
  { id: "fpt-q9", name: "ĐH FPT / Khu CNC", query: "Đại học FPT TP.HCM Khu Công Nghệ Cao", icon: "💻", coords: [10.8411, 106.8099], city: "Quận 9, TP.HCM" },
  { id: "pho-di-bo", name: "Phố đi bộ Nguyễn Huệ", query: "Phố đi bộ Nguyễn Huệ Quận 1", icon: "🏙️", coords: [10.7735, 106.7037], city: "Quận 1, TP.HCM" },
  { id: "hang-xanh", name: "Ngã 4 Hàng Xanh", query: "Ngã tư Hàng Xanh Bình Thạnh", icon: "🚦", coords: [10.8016, 106.7114], city: "Bình Thạnh, TP.HCM" },
  { id: "san-bay", name: "Sân bay Tân Sơn Nhất", query: "Sân bay Tân Sơn Nhất", icon: "✈️", coords: [10.8185, 106.6588], city: "Tân Bình, TP.HCM" },
];

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDistance = (meters) => {
  if (meters == null || isNaN(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const isUserPost = (post, user) => {
  if (!post || !user) return false;
  const uid = String(user.id || user.userId || "");
  const postLandlordId = String(post.landlordId || "");
  const postUserId = String(post.userId || "");
  if (uid && (postLandlordId === uid || postUserId === uid)) return true;
  
  const uEmail = (user.email || "").toLowerCase().trim();
  const postEmail = (post.contactEmail || post.landlordEmail || "").toLowerCase().trim();
  if (uEmail && postEmail && uEmail === postEmail) return true;

  const uName = (user.fullName || "").toLowerCase().trim();
  const postName = (post.landlordName || "").toLowerCase().trim();
  if (uName && postName && uName === postName) return true;

  return false;
};

const getCoordinates = (room) => {
  if (room.latitude == null || room.longitude == null || room.latitude === "" || room.longitude === "") {
    return null;
  }
  const latitude = Number(room.latitude);
  const longitude = Number(room.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;
};

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

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

// Chuẩn hóa và làm sạch địa chỉ hiển thị (tránh lặp quận huyện, thành phố)
const formatFullAddress = (post) => {
  if (!post) return "Chưa cập nhật địa chỉ";
  const rawParts = [post.address, post.ward, post.district, post.city]
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);

  const result = [];
  for (const part of rawParts) {
    const isDup = result.some((existing) => {
      const e = existing.toLowerCase();
      const p = part.toLowerCase();
      return e === p || (e.includes(p) && p.length > 5) || (p.includes(e) && e.length > 5);
    });
    if (!isDup) {
      result.push(part);
    }
  }
  return result.length > 0 ? result.join(", ") : "Chưa cập nhật địa chỉ";
};

// Carousel ảnh bài đăng
const PostImageCarousel = ({ images, post }) => {
  const [idx, setIdx] = useState(0);
  const imgList = (images && Array.isArray(images) && images.length > 0) ? images : [];

  if (imgList.length === 0) {
    return (
      <div className="forum-card-photo forum-card-photo-empty" style={{ position: "relative", overflow: "hidden" }}>
        <img 
          src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600" 
          alt="Ảnh phòng trọ mặc định" 
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.92)" }}
        />
        <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.65)", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
          Ảnh phòng mẫu
        </span>
        <div className="room-photo-actions">
          <span className="room-photo-status">{post?.isRented ? "Đã cho thuê" : "Còn phòng"}</span>
          {post && <WishlistButton post={post} showText={false} />}
        </div>
      </div>
    );
  }
  return (
    <div className="forum-card-photo">
      <img src={imgList[idx]} alt="Ảnh phòng trọ" />
      <div className="room-photo-actions">
        <span className="room-photo-status">{post?.isRented ? "Đã cho thuê" : "Đang nhận khách"}</span>
        {post && <WishlistButton post={post} showText={false} />}
      </div>
      {imgList.length > 1 && (
        <>
          <button
            className="forum-carousel-btn forum-carousel-prev"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIdx((i) => (i === 0 ? imgList.length - 1 : i - 1));
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="forum-carousel-btn forum-carousel-next"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIdx((i) => (i === imgList.length - 1 ? 0 : i + 1));
            }}
          >
            <ChevronRight size={18} />
          </button>
          <div className="forum-carousel-dots">
            {imgList.map((_, i) => (
              <span key={i} className={`forum-dot ${i === idx ? "active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Rooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentRentedPost, setRecentRentedPost] = useState(null);
  const [showFlashBanner, setShowFlashBanner] = useState(false);
  const [landlordMyPosts, setLandlordMyPosts] = useState([]);

  // Bộ lọc
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") || "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") || "");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AVAILABLE | ROOMMATE | RENTED
  const [postTab, setPostTab] = useState("ALL"); // ALL | MY_POSTS | OTHERS
  const [showFullMap, setShowFullMap] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const amenityOptions = useAmenities(); // danh mục tiện ích do Admin quản lý
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("LIST"); // LIST | GRID | MAP
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([
    Math.min(15000000, Math.max(1000000, Number(searchParams.get("minPrice")) || 1000000)),
    Math.min(15000000, Math.max(1000000, Number(searchParams.get("maxPrice")) || 15000000)),
  ]);
  const [roomCoordinates, setRoomCoordinates] = useState({});
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [proximityQuery, setProximityQuery] = useState("");
  const [proximityRadius, setProximityRadius] = useState(3);
  const [proximityLocation, setProximityLocation] = useState(null);
  const [proximityLoading, setProximityLoading] = useState(false);
  const [proximityError, setProximityError] = useState("");
  const [proximitySuggestions, setProximitySuggestions] = useState([]);
  const [proximitySuggestionsLoading, setProximitySuggestionsLoading] = useState(false);
  const [proximitySuggestionsOpen, setProximitySuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const proximitySearchControllerRef = useRef(null);
  const suggestionsControllerRef = useRef(null);

  // Modal Gửi Yêu Cầu Thuê
  const [rentalModalPost, setRentalModalPost] = useState(null);
  const [rentalForm, setRentalForm] = useState({ occupants: 1, moveInDate: "", note: "" });
  const [submittingRental, setSubmittingRental] = useState(false);

  // Modal Tìm Người Ở Ghép
  const [roommateModalPost, setRoommateModalPost] = useState(null);
  const [roommateForm, setRoommateForm] = useState({
    roommateNeeded: true,
    roommateCount: 1,
    gender: "ALL",
    expectedCost: "",
    roommateNote: "",
  });
  const [savingRoommate, setSavingRoommate] = useState(false);

  // Tải danh sách phòng từ diễn đàn trọ
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const firstResponse = await forumApi.getAllPosts({
        page: 0,
        size: API_PAGE_SIZE,
        sort: "createdAt,desc",
      });
      const firstPayload = unwrapApiData(firstResponse);

      if (Array.isArray(firstPayload)) {
        setPosts(firstPayload);
        setRecentRentedPost(firstPayload.find((post) => post.isRented) || null);
        return;
      }

      const data = [...(firstPayload?.content || [])];
      const totalPages = Number(firstPayload?.totalPages) || 1;
      for (let currentPage = 1; currentPage < totalPages; currentPage += 1) {
        const response = await forumApi.getAllPosts({
          page: currentPage,
          size: API_PAGE_SIZE,
          sort: "createdAt,desc",
        });
        const payload = unwrapApiData(response);
        data.push(...(Array.isArray(payload) ? payload : payload?.content || []));
      }

      setPosts(data);
      setRecentRentedPost(data.find((post) => post.isRented) || null);

      if (user && user.role === "LANDLORD") {
        try {
          const myRes = await forumApi.getMyPosts();
          const myData = unwrapApiData(myRes);
          setLandlordMyPosts(Array.isArray(myData) ? myData : []);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải bài đăng phòng trọ:", err);
      toast.error("Không thể tải danh sách bài đăng phòng trọ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Quản lý hiển thị Flash banner thông báo phòng vừa duyệt (chỉ hiện tối đa 2 lần trong phiên, tự đóng sau 7s)
  useEffect(() => {
    if (!recentRentedPost) {
      setShowFlashBanner(false);
      return;
    }

    const isClosed = sessionStorage.getItem("roomily_flash_banner_closed");
    if (isClosed === "true") {
      setShowFlashBanner(false);
      return;
    }

    const views = Number(sessionStorage.getItem("roomily_flash_banner_views") || 0);
    const MAX_FLASH_VIEWS = 2; // Giới hạn số lần thông báo theo yêu cầu thay vì để hoài

    if (views < MAX_FLASH_VIEWS) {
      setShowFlashBanner(true);
      sessionStorage.setItem("roomily_flash_banner_views", String(views + 1));

      // Tự động đóng sau 7 giây
      const timer = setTimeout(() => {
        setShowFlashBanner(false);
      }, 7000);

      return () => clearTimeout(timer);
    } else {
      setShowFlashBanner(false);
    }
  }, [recentRentedPost]);

  const handleDismissFlashBanner = () => {
    setShowFlashBanner(false);
    sessionStorage.setItem("roomily_flash_banner_closed", "true");
  };

  useEffect(() => {
    const query = proximityQuery.trim();
    if (query.length < 2 || selectedSuggestion?.query === query) {
      setProximitySuggestions([]);
      setProximitySuggestionsLoading(false);
      setProximitySuggestionsOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    suggestionsControllerRef.current?.abort();
    suggestionsControllerRef.current = controller;
    const timer = window.setTimeout(async () => {
      setProximitySuggestionsLoading(true);
      setProximitySuggestionsOpen(true);
      try {
        const params = new URLSearchParams({ limit: "10", q: query });
        const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
          headers: { "Accept-Language": "vi" },
        });
        if (!response.ok) {
          throw new Error(`Photon trả về lỗi ${response.status}`);
        }

        const result = await response.json();
        const suggestions = (result.features || [])
          .filter((feature) => feature.properties?.countrycode === "VN")
          .map((feature) => {
            const properties = feature.properties || {};
            const [longitude, latitude] = feature.geometry?.coordinates || [];
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

            const street = [properties.housenumber, properties.street]
              .filter(Boolean)
              .join(" ");
            const address = [
              street,
              properties.district,
              properties.city,
              properties.state !== properties.city ? properties.state : null,
              properties.country,
            ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(", ");

            return {
              query,
              label: properties.name || street || properties.city || query,
              address,
              location: [Number(latitude), Number(longitude)],
            };
          })
          .filter(Boolean)
          .slice(0, 6);

        if (controller.signal.aborted) return;
        setProximitySuggestions(suggestions);
        setActiveSuggestionIndex(-1);
        setProximitySuggestionsOpen(suggestions.length > 0);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Không thể tải gợi ý địa điểm:", error);
        setProximitySuggestions([]);
        setProximitySuggestionsOpen(false);
      } finally {
        if (!controller.signal.aborted) setProximitySuggestionsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [proximityQuery, selectedSuggestion]);

  const handleRoomGeocoded = useCallback((roomId, coordinates) => {
    setRoomCoordinates((previous) => {
      if (previous[roomId]) return previous;
      return { ...previous, [roomId]: coordinates };
    });
  }, []);

  const handleMapBoundsChange = useCallback((bounds) => {
    const nextBounds = {
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    };
    setViewportBounds(nextBounds);
    setPage(0);
  }, []);

  const handleProximitySearch = async (event) => {
    event.preventDefault();
    const query = proximityQuery.trim();
    if (!query) {
      proximitySearchControllerRef.current?.abort();
      setProximityLoading(false);
      setProximityLocation(null);
      setProximityError("");
      setViewportBounds(null);
      setPage(0);
      return;
    }

    if (selectedSuggestion?.query === query) {
      setProximityLocation(selectedSuggestion.location);
      setProximitySuggestionsOpen(false);
      setViewportBounds(null);
      setPage(0);
      return;
    }

    proximitySearchControllerRef.current?.abort();
    const controller = new AbortController();
    proximitySearchControllerRef.current = controller;
    setProximityLoading(true);
    setProximityError("");
    setProximityLocation(null);
    setViewportBounds(null);
    setPage(0);

    try {
      const params = new URLSearchParams({
        limit: "10",
        q: query,
      });
      const response = await fetch(
        `https://photon.komoot.io/api/?${params}`,
        { signal: controller.signal, headers: { "Accept-Language": "vi" } },
      );
      if (!response.ok) {
        throw new Error(`Photon trả về lỗi ${response.status}`);
      }

      const result = await response.json();
      const features = result.features || [];
      const match = features.find((feature) => feature.properties?.countrycode === "VN")
        || features[0];
      const coordinates = match?.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) {
        setProximityLocation(null);
        setProximityError("Không tìm thấy địa điểm. Hãy thử thêm quận/huyện hoặc thành phố.");
        return;
      }

      const location = [Number(coordinates[1]), Number(coordinates[0])];
      const properties = match.properties || {};
      const street = [properties.housenumber, properties.street].filter(Boolean).join(" ");
      setSelectedSuggestion({
        query,
        label: properties.name || street || properties.city || query,
        address: [
          street,
          properties.district,
          properties.city,
          properties.state !== properties.city ? properties.state : null,
          properties.country,
        ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(", "),
        location,
      });
      setProximitySuggestions([]);
      setProximitySuggestionsOpen(false);
      setProximityLocation(location);
      setViewportBounds(null);
      setPage(0);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Không thể tìm địa điểm gần phòng:", error);
      setProximityError("Không thể tìm địa điểm lúc này. Vui lòng thử lại.");
    } finally {
      if (!controller.signal.aborted) setProximityLoading(false);
    }
  };

  const clearProximitySearch = () => {
    proximitySearchControllerRef.current?.abort();
    suggestionsControllerRef.current?.abort();
    setProximityQuery("");
    setProximityLocation(null);
    setProximityError("");
    setProximitySuggestions([]);
    setProximitySuggestionsOpen(false);
    setSelectedSuggestion(null);
    setViewportBounds(null);
    setPage(0);
  };

  const chooseProximitySuggestion = (suggestion) => {
    proximitySearchControllerRef.current?.abort();
    suggestionsControllerRef.current?.abort();
    setSelectedSuggestion({ ...suggestion, query: suggestion.label });
    setProximityQuery(suggestion.label);
    setProximitySuggestions([]);
    setProximitySuggestionsOpen(false);
    setProximitySuggestionsLoading(false);
    setProximityError("");
    setProximityLocation(suggestion.location);
    setViewportBounds(null);
    setPage(0);
  };

  // Xử lý gửi yêu cầu thuê
  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê phòng");
      navigate("/login");
      return;
    }

    setSubmittingRental(true);
    try {
      const formattedNote = `[YÊU CẦU THUÊ TRỌ #${rentalModalPost.id} - ${rentalModalPost.title}] | Số người: ${rentalForm.occupants} | Ngày dọn vào: ${rentalForm.moveInDate || "Sớm nhất"} | Lời nhắn: ${rentalForm.note || "Khách sẵn sàng ký hợp đồng"}`;

      await rentalApi.createRentalRequest({
        postId: rentalModalPost.id,
        roomId: rentalModalPost.roomId || null,
        senderName: user.fullName || "Khách thuê",
        senderPhone: user.phoneNumber || "",
        note: formattedNote,
      });

      try {
        await forumApi.sendMessage(rentalModalPost.id, {
          senderName: user.fullName || "Khách thuê",
          senderPhone: user.phoneNumber || "",
          content: `⚡ ${formattedNote}`,
        });
      } catch (msgErr) {
        console.warn("Message sending fallback:", msgErr);
      }

      toast.success("Đã gửi yêu cầu thuê phòng tới chủ trọ thành công! 🎉");
      setRentalModalPost(null);
      setRentalForm({ occupants: 1, moveInDate: "", note: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi yêu cầu thuê");
    } finally {
      setSubmittingRental(false);
    }
  };

  // Xử lý lưu nhu cầu ở ghép
  const handleRoommateSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }

    setSavingRoommate(true);
    try {
      const fullCriteria = `[Giới tính: ${roommateForm.gender === "MALE" ? "Nam" : roommateForm.gender === "FEMALE" ? "Nữ" : "Tất cả"}] ${roommateForm.expectedCost ? `• Chia: ${formatVnd(roommateForm.expectedCost)}/người` : ""} • ${roommateForm.roommateNote || "Tìm bạn cùng chia sẻ chi phí phòng"}`;

      await forumApi.updateRoommateStatus(roommateModalPost.id, {
        roommateNeeded: true,
        roommateCount: Number(roommateForm.roommateCount) || 1,
        roommateNote: fullCriteria,
      });

      toast.success("Đã đăng nhu cầu tìm người ở ghép thành công! 🔥");
      setRoommateModalPost(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật nhu cầu ở ghép");
    } finally {
      setSavingRoommate(false);
    }
  };

  // Lọc và sắp xếp phòng
  const filteredPosts = useMemo(() => {
    // Quy tắc: Những phòng đã có người thuê mà không tìm ở ghép thì không hiển thị ngoài diễn đàn
    let result = posts.filter((p) => !p.isRented || Boolean(p.roommateNeeded));

    // Lọc theo từ khóa / khu vực
    if (city.trim()) {
      const kw = city.trim().toLowerCase();
      result = result.filter((p) => {
        const fullAddr = `${p.title || ""} ${p.address || ""} ${p.ward || ""} ${p.district || ""} ${p.city || ""}`.toLowerCase();
        return fullAddr.includes(kw);
      });
    }

    // Lọc theo giá tối thiểu
    if (minPrice) {
      const minP = Number(minPrice);
      result = result.filter((p) => Number(p.price) >= minP);
    }

    // Lọc theo giá tối đa
    if (maxPrice) {
      const maxP = Number(maxPrice);
      result = result.filter((p) => Number(p.price) <= maxP);
    }

    // Lọc theo diện tích tối thiểu
    if (minArea) {
      const minA = Number(minArea);
      result = result.filter((p) => Number(p.roomArea || 0) >= minA);
    }

    // Lọc theo diện tích tối đa
    if (maxArea) {
      const maxA = Number(maxArea);
      result = result.filter((p) => Number(p.roomArea || 0) <= maxA);
    }

    // Lọc theo trạng thái
    if (statusFilter === "AVAILABLE") {
      result = result.filter((p) => !p.isRented);
    } else if (statusFilter === "ROOMMATE") {
      result = result.filter((p) => Boolean(p.roommateNeeded));
    }

    // Lọc theo tiện ích
    if (selectedAmenities.length > 0) {
      result = result.filter((p) => {
        const utilStr = (p.utilities || "").toLowerCase();
        return selectedAmenities.every((a) => utilStr.includes(a.toLowerCase()));
      });
    }

    if (roomTypeFilter) {
      result = result.filter((p) => p.roomType === roomTypeFilter);
    }

    if (sort === "today") {
      const today = new Date().toDateString();
      result = result.filter((post) => post.createdAt && new Date(post.createdAt).toDateString() === today);
    }

    // Lọc theo Tab Người đăng (Của tôi / Người khác)
    if (postTab === "MY_POSTS" && user) {
      result = result.filter((p) => isUserPost(p, user));
    } else if (postTab === "OTHERS" && user) {
      result = result.filter((p) => !isUserPost(p, user));
    }

    // Sắp xếp
    if (sort === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "area-desc") {
      result.sort((a, b) => Number(b.roomArea || 0) - Number(a.roomArea || 0));
    } else if (sort === "rating") {
      result.sort((a, b) => Number(b.averageRating || b.rating || 0) - Number(a.averageRating || a.rating || 0));
    } else if (sort === "recommended") {
      result.sort((a, b) =>
        (Number(b.viewCount || 0) + Number(b.commentCount || 0) * 2)
        - (Number(a.viewCount || 0) + Number(a.commentCount || 0) * 2)
      );
    } else {
      result.sort((a, b) => {
        const dateDifference = new Date(b.createdAt) - new Date(a.createdAt);
        if (sort !== "today") return dateDifference;
        return dateDifference;
      });
    }

    return result;
  }, [posts, city, minPrice, maxPrice, minArea, maxArea, statusFilter, postTab, selectedAmenities, sort, user, roomTypeFilter]);

  const roomTypes = useMemo(
    () => [...new Set(posts.map((post) => post.roomType).filter(Boolean))],
    [posts],
  );
  const priceDistribution = useMemo(() => {
    const buckets = Array(7).fill(0);
    posts.forEach((post) => {
      const bucket = Math.min(6, Math.floor(Number(post.price || 0) / 2000000));
      buckets[bucket] += 1;
    });
    const maxBucket = Math.max(1, ...buckets);
    return buckets.map((count) => Math.max(8, (count / maxBucket) * 100));
  }, [posts]);

  const mapPosts = useMemo(
    () =>
      filteredPosts.map((post) => {
        const coordinates = roomCoordinates[post.id];
        return coordinates
          ? { ...post, latitude: coordinates[0], longitude: coordinates[1] }
          : post;
      }),
    [filteredPosts, roomCoordinates],
  );
  const proximityPosts = useMemo(() => {
    if (!proximityLocation) return mapPosts;
    const radiusMeters = proximityRadius * 1000;
    const withDistances = mapPosts
      .map((post) => {
        const coordinates = getCoordinates(post);
        const dist = coordinates ? distanceInMeters(proximityLocation, coordinates) : null;
        return { ...post, distanceToTarget: dist };
      })
      .filter((post) => post.distanceToTarget != null && post.distanceToTarget <= radiusMeters);

    // Khi tìm kiếm quanh địa điểm, ưu tiên sắp xếp theo khoảng cách gần nhất
    return withDistances.sort((a, b) => (a.distanceToTarget || 0) - (b.distanceToTarget || 0));
  }, [mapPosts, proximityLocation, proximityRadius]);
  const visiblePosts = useMemo(() => {
    if (!viewportBounds) return proximityPosts;
    return proximityPosts.filter((post) => {
      const coordinates = getCoordinates(post);
      if (!coordinates) return false;
      const [latitude, longitude] = coordinates;
      const insideLatitude = latitude >= viewportBounds.south && latitude <= viewportBounds.north;
      const insideLongitude = viewportBounds.west <= viewportBounds.east
        ? longitude >= viewportBounds.west && longitude <= viewportBounds.east
        : longitude >= viewportBounds.west || longitude <= viewportBounds.east;
      return insideLatitude && insideLongitude;
    });
  }, [proximityPosts, viewportBounds]);

  const myPostsCount = useMemo(() => {
    if (!user || !posts.length) return 0;
    return posts.filter((p) => isUserPost(p, user)).length;
  }, [posts, user]);

  const otherPostsCount = useMemo(() => {
    if (!user || !posts.length) return posts.length;
    return posts.filter((p) => !isUserPost(p, user)).length;
  }, [posts, user]);

  // Phân trang
  const totalPages = Math.ceil(visiblePosts.length / PAGE_SIZE) || 1;
  const currentItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return visiblePosts.slice(start, start + PAGE_SIZE);
  }, [visiblePosts, page]);

  const handleMarkerClick = useCallback((room) => {
    setActiveRoomId(room.id);
    const index = visiblePosts.findIndex((post) => String(post.id) === String(room.id));
    if (index >= 0) {
      setPage(Math.floor(index / PAGE_SIZE));
    }
  }, [visiblePosts]);

  useEffect(() => {
    if (!activeRoomId) return;
    const card = document.getElementById(`room-card-${activeRoomId}`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeRoomId, currentItems]);

  // Reset trang khi đổi filter
  useEffect(() => {
    setPage(0);
  }, [city, minPrice, maxPrice, minArea, maxArea, statusFilter, postTab, selectedAmenities, sort, roomTypeFilter]);

  useEffect(() => {
    if (!showAdvancedFilters) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") setShowAdvancedFilters(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showAdvancedFilters]);

  const clearAllFilters = () => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setStatusFilter("ALL");
    setPostTab("ALL");
    setSelectedAmenities([]);
    setRoomTypeFilter("");
    setSort("newest");
    setPriceRange([1000000, 15000000]);
    clearProximitySearch();
    setPage(0);
  };

  const updatePriceRange = (index, value) => {
    const nextRange = [...priceRange];
    nextRange[index] = Number(value);
    if (index === 0 && nextRange[0] >= nextRange[1]) nextRange[0] = nextRange[1] - 500000;
    if (index === 1 && nextRange[1] <= nextRange[0]) nextRange[1] = nextRange[0] + 500000;
    setPriceRange(nextRange);
    setMinPrice(nextRange[0] <= 1000000 ? "" : String(nextRange[0]));
    setMaxPrice(nextRange[1] >= 15000000 ? "" : String(nextRange[1]));
  };

  const setQuickPrice = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
    setPriceRange([Number(min) || 1000000, Number(max) || 15000000]);
  };

  const activeFilters = [
    city && { label: city, clear: () => setCity("") },
    minPrice && { label: `Từ ${formatVnd(minPrice)}`, clear: () => { setMinPrice(""); setPriceRange((range) => [1000000, range[1]]); } },
    maxPrice && { label: `Đến ${formatVnd(maxPrice)}`, clear: () => { setMaxPrice(""); setPriceRange((range) => [range[0], 15000000]); } },
    roomTypeFilter && { label: roomTypeFilter, clear: () => setRoomTypeFilter("") },
    ...selectedAmenities.map((amenity) => ({ label: amenity, clear: () => toggleAmenity(amenity) })),
    proximityLocation && { label: `Gần ${selectedSuggestion?.label || proximityQuery || "địa điểm đã chọn"}`, kind: "proximity" },
  ].filter(Boolean);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="page-shell">
      {/* 1. TOP SEARCH BAR (Dải tìm kiếm nhanh trên cùng) */}
      <section className="search-strip" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", padding: "18px 0" }}>
        <div className="wrap">
          <form
            className="search-box rooms-search-box"
            style={{ margin: 0, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
            }}
          >
            <div className="search-field" style={{ flex: 1.5 }}>
              <label>Khu vực, địa chỉ, quận huyện</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Thử Bình Thạnh, Quận 10, ĐH Bách Khoa..."
                  list="room-location-suggestions"
                />
                <datalist id="room-location-suggestions">
                  {[
                    "Quận 1", "Quận 3", "Quận 10", "Bình Thạnh", "Thủ Đức",
                    "ĐHQG / Làng Đại học", "ĐH Bách Khoa TP.HCM", "ĐH Kinh Tế (UEH)",
                    "ĐH FPT / Khu CNC", "ĐH Sư Phạm Kỹ Thuật",
                  ].map((location) => <option key={location} value={location} />)}
                </datalist>
              </div>
            </div>

            <div className="search-field" style={{ flex: 1 }}>
              <label>Loại hình phòng</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                style={{ color: "var(--text-primary)", background: "transparent" }}
              >
                <option value="">Tất cả loại phòng</option>
                {roomTypes.map((roomType) => <option key={roomType} value={roomType}>{roomType}</option>)}
              </select>
            </div>

            <div className="search-field" style={{ flex: 1 }}>
              <label>Khoảng giá</label>
              <select
                value={
                  !minPrice && !maxPrice
                    ? ""
                    : maxPrice === "2000000"
                    ? "u2"
                    : minPrice === "2000000" && maxPrice === "4000000"
                    ? "2-4"
                    : minPrice === "4000000" && maxPrice === "7000000"
                    ? "4-7"
                    : minPrice === "7000000"
                    ? "o7"
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "u2") {
                    setQuickPrice("", "2000000");
                  } else if (val === "2-4") {
                    setQuickPrice("2000000", "4000000");
                  } else if (val === "4-7") {
                    setQuickPrice("4000000", "7000000");
                  } else if (val === "o7") {
                    setQuickPrice("7000000", "");
                  } else {
                    setQuickPrice("", "");
                  }
                }}
                style={{ color: "var(--text-primary)", background: "transparent" }}
              >
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="">Tất cả mức giá</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="u2">Dưới 2 triệu</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="2-4">2 - 4 triệu</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="4-7">4 - 7 triệu</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="o7">Trên 7 triệu</option>
              </select>
            </div>

            <div className="search-field" style={{ flex: 1 }}>
              <label>Diện tích</label>
              <select
                style={{ color: "var(--text-primary)", background: "transparent" }}
                value={
                  !minArea && !maxArea
                    ? ""
                    : maxArea === "20"
                    ? "u20"
                    : minArea === "20" && maxArea === "30"
                    ? "20-30"
                    : minArea === "30"
                    ? "o30"
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "u20") {
                    setMinArea("");
                    setMaxArea("20");
                  } else if (val === "20-30") {
                    setMinArea("20");
                    setMaxArea("30");
                  } else if (val === "o30") {
                    setMinArea("30");
                    setMaxArea("");
                  } else {
                    setMinArea("");
                    setMaxArea("");
                  }
                }}
              >
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="">Tất cả diện tích</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="u20">Dưới 20 m²</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="20-30">20 - 30 m²</option>
                <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="o30">Trên 30 m²</option>
              </select>
            </div>

            <button className="btn rooms-search-submit" type="submit" style={{ padding: "0 28px", fontWeight: "bold" }}>
              <Search size={16} style={{ marginRight: 6 }} /> Tìm phòng
            </button>
          </form>

          <div className="rooms-quick-prices" aria-label="Lọc nhanh theo giá">
            <span>Giá nhanh:</span>
            {[
              { label: "Dưới 2 triệu", min: "", max: "2000000" },
              { label: "2 – 4 triệu", min: "2000000", max: "4000000" },
              { label: "4 – 7 triệu", min: "4000000", max: "7000000" },
              { label: "Trên 7 triệu", min: "7000000", max: "" },
            ].map((price) => {
              const active = minPrice === price.min && maxPrice === price.max;
              return (
                <button
                  key={price.label}
                  type="button"
                  className={`rooms-quick-price${active ? " active" : ""}`}
                  onClick={() => setQuickPrice(active ? "" : price.min, active ? "" : price.max)}
                >
                  {price.label}
                </button>
              );
            })}
            <button type="button" className="rooms-advanced-trigger" onClick={() => setShowAdvancedFilters(true)}>
              <SlidersHorizontal size={15} /> Bộ lọc nâng cao
            </button>
          </div>

          {/* Quick Landmark Recommendations (Đề xuất khu vực & trường học gần nhất) */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 4 }}>
              🔥 Gợi ý gần các trường & địa điểm hot:
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {POPULAR_LANDMARKS.map((lm) => {
                const isSelected = proximityLocation && 
                  Math.abs(proximityLocation[0] - lm.coords[0]) < 0.001 && 
                  Math.abs(proximityLocation[1] - lm.coords[1]) < 0.001;

                return (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        clearProximitySearch();
                      } else {
                        setProximityQuery(lm.name);
                        setProximityLocation(lm.coords);
                        setProximityRadius(3); // Mặc định 3km
                        setSelectedSuggestion({ label: lm.name, query: lm.name });
                        setPage(0);
                        toast.success(`Đang tìm các phòng trọ quanh ${lm.name} (bán kính 3 km) 📍`);
                      }
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border-color)",
                      background: isSelected ? "var(--accent)" : "var(--bg-card)",
                      color: isSelected ? "#fff" : "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 2px 8px rgba(245, 158, 11, 0.25)" : "none"
                    }}
                  >
                    <span>{lm.icon}</span>
                    <span>{lm.name}</span>
                    {isSelected && <span style={{ marginLeft: 2, fontSize: 11 }}>✕</span>}
                  </button>
                );
              })}
              {proximityLocation && (
                <button
                  type="button"
                  onClick={clearProximitySearch}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    color: "var(--danger)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Xóa lọc vị trí
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN LAYOUT: SIDEBAR BỘ LỌC + DANH SÁCH BÀI ĐĂNG PHÒNG TRỌ */}
      <div className={`results-wrap${viewMode === "MAP" ? " is-map-view" : viewMode === "GRID" ? " is-grid-view" : " is-list-view"}`}>
        <div className="rooms-results-column">
        {/* SIDEBAR BỘ LỌC BÊN TRÁI */}
        <aside
          className="filters"
          style={{
            alignSelf: "start",
            position: "sticky",
            top: 76,
            maxHeight: "calc(100vh - 90px)",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            padding: "20px 18px 36px",
            boxSizing: "border-box",
            scrollbarWidth: "thin",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={18} color="var(--primary)" /> Bộ Lọc Phòng
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setShowAdvancedFilters(true)} className="btn-clear" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <SlidersHorizontal size={13} /> Nâng cao
              </button>
              <button onClick={clearAllFilters} className="btn-clear" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <RotateCcw size={12} /> Xóa lọc
              </button>
            </div>
          </div>

          {/* Trạng thái / Nhu cầu */}
          <div className="filter-group">
            <h4>Trạng thái & Nhu cầu</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "ALL", label: "Tất cả phòng" },
                { key: "AVAILABLE", label: "🟢 Còn phòng trống" },
                { key: "ROOMMATE", label: "🔥 Đang tìm ở ghép" },
                { key: "RENTED", label: "🔒 Đã có người thuê" },
              ].map((st) => (
                <label key={st.key} className="check-row" style={{ cursor: "pointer", margin: 0 }}>
                  <input
                    type="radio"
                    name="statusFilter"
                    checked={statusFilter === st.key}
                    onChange={() => setStatusFilter(st.key)}
                  />
                  <span>{st.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Khoảng giá (Từ - Đến) */}
          <div className="filter-group">
            <h4>Khoảng giá (VNĐ)</h4>
            <div className="price-range">
              <input
                type="number"
                placeholder="Từ (VNĐ)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Đến (VNĐ)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Diện tích */}
          <div className="filter-group">
            <h4>Diện tích phòng</h4>
            <div className="area-pills">
              {[
                { label: "<20m²", min: "", max: "20" },
                { label: "20-30m²", min: "20", max: "30" },
                { label: "30-50m²", min: "30", max: "50" },
                { label: ">50m²", min: "50", max: "" },
              ].map((pill) => {
                const isActive = minArea === pill.min && maxArea === pill.max;
                return (
                  <button
                    key={pill.label}
                    type="button"
                    className={`area-pill ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (isActive) {
                        setMinArea("");
                        setMaxArea("");
                      } else {
                        setMinArea(pill.min);
                        setMaxArea(pill.max);
                      }
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tiện ích */}
          <div className="filter-group" style={{ paddingBottom: 16 }}>
            <h4>Tiện ích phòng</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 6px" }}>
              {amenityOptions.map(({ name: amenity }) => (
                <label
                  key={amenity}
                  className="check-row"
                  style={{
                    cursor: "pointer",
                    margin: 0,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "2px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    style={{ margin: 0, flexShrink: 0, cursor: "pointer" }}
                  />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={amenity}>
                    {amenity}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Đăng tin trọ dành cho chủ trọ */}
          {user?.role === "LANDLORD" && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <Link
                to="/forum/create"
                className="btn btn-primary btn-block"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700 }}
              >
                <Plus size={16} /> + Đăng Tin Cho Thuê
              </Link>
            </div>
          )}

          <div style={{ height: 24 }} />
        </aside>

        {/* NỘI DUNG CHÍNH (DANH SÁCH BÀI ĐĂNG PHÒNG TRỌ) */}
        <main className="rooms-list-pane">
          {/* Modern Header: Tabs (Tất cả / Của tôi / Người khác) & Bộ lọc sắp xếp */}
          <div className="rooms-results-toolbar" style={{ background: "var(--bg-card)", borderRadius: 16, padding: "16px 20px", border: "1px solid var(--border-color)", marginBottom: 20, boxShadow: "var(--shadow-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              {/* Tab phân loại bài đăng */}
              <div style={{ display: "flex", gap: 8, background: "var(--bg-primary)", padding: 4, borderRadius: 12 }}>
                <button
                  onClick={() => setPostTab("ALL")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13.5,
                    fontWeight: postTab === "ALL" ? 700 : 500,
                    background: postTab === "ALL" ? "var(--bg-card)" : "transparent",
                    color: postTab === "ALL" ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: postTab === "ALL" ? "var(--shadow-soft)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s"
                  }}
                >
                  <Sparkles size={15} color={postTab === "ALL" ? "var(--accent)" : "currentColor"} />
                  Tất cả bài đăng ({posts.length})
                </button>

                {user && (
                  <>
                    <button
                      onClick={() => setPostTab("MY_POSTS")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13.5,
                        fontWeight: postTab === "MY_POSTS" ? 700 : 500,
                        background: postTab === "MY_POSTS" ? "var(--bg-card)" : "transparent",
                        color: postTab === "MY_POSTS" ? "var(--text-primary)" : "var(--text-secondary)",
                        boxShadow: postTab === "MY_POSTS" ? "var(--shadow-soft)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s"
                      }}
                    >
                      <ShieldCheck size={15} color={postTab === "MY_POSTS" ? "var(--success)" : "currentColor"} />
                      Bài đăng của tôi ({myPostsCount})
                    </button>

                    <button
                      onClick={() => setPostTab("OTHERS")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13.5,
                        fontWeight: postTab === "OTHERS" ? 700 : 500,
                        background: postTab === "OTHERS" ? "var(--bg-card)" : "transparent",
                        color: postTab === "OTHERS" ? "var(--text-primary)" : "var(--text-secondary)",
                        boxShadow: postTab === "OTHERS" ? "var(--shadow-soft)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s"
                      }}
                    >
                      <Users size={15} />
                      Bài của cộng đồng ({otherPostsCount})
                    </button>
                  </>
                )}
              </div>

              {/* Sắp xếp */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Sắp xếp:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    fontSize: 13,
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="recommended">🌟 Được quan tâm nhiều</option>
                  <option value="newest">✨ Mới nhất</option>
                  <option value="today">⏱️ Mới đăng hôm nay</option>
                  <option value="price-asc">💵 Giá thấp đến cao</option>
                  <option value="price-desc">💎 Giá cao đến thấp</option>
                  <option value="area-desc">📐 Diện tích rộng nhất</option>
                  <option value="rating">⭐ Đánh giá cao nhất</option>
                </select>
                <div className="rooms-view-toggle" role="group" aria-label="Chế độ hiển thị">
                  <button type="button" className={viewMode === "GRID" ? "active" : ""} onClick={() => setViewMode("GRID")} aria-label="Dạng lưới" title="Dạng lưới">
                    <LayoutGrid size={16} />
                  </button>
                  <button type="button" className={viewMode === "LIST" ? "active" : ""} onClick={() => setViewMode("LIST")} aria-label="Dạng danh sách" title="Dạng danh sách">
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "MAP" ? "active" : ""}
                    onClick={() => {
                      if (window.matchMedia("(max-width: 820px)").matches) {
                        setShowFullMap(true);
                      } else {
                        setViewMode("MAP");
                      }
                    }}
                    aria-label="Danh sách và bản đồ"
                    title="Danh sách và bản đồ"
                  >
                    <MapPin size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Tìm thấy <strong style={{ color: "var(--accent)" }}>{visiblePosts.length}</strong> bài đăng phòng trọ phù hợp
              </span>
              {viewMode !== "MAP" && (
                <button
                  onClick={() => setShowFullMap(true)}
                  className="btn btn-outline"
                  style={{ padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 5, borderRadius: 6 }}
                >
                  <Maximize2 size={13} /> Mở bản đồ toàn màn hình
                </button>
              )}
            </div>
            {activeFilters.length > 0 && (
              <div className="rooms-active-filters">
                {activeFilters.map((filter) => (
                  <button
                    type="button"
                    key={filter.label}
                    className="rooms-filter-tag"
                    onClick={filter.kind === "proximity" ? clearProximitySearch : filter.clear}
                  >
                    {filter.label}<X size={13} />
                  </button>
                ))}
                <button type="button" className="rooms-clear-filters" onClick={clearAllFilters}>Xóa tất cả bộ lọc</button>
              </div>
            )}
          </div>

          {/* Thông báo bài đăng đang chờ Admin duyệt của chủ trọ */}
          {user?.role === "LANDLORD" && landlordMyPosts.some((p) => p.moderationStatus === "PENDING") && (
            <div style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1.5px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "14px",
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>⏳</span>
                <div>
                  <strong style={{ color: "var(--accent, #f59e0b)", fontSize: 14 }}>
                    Bạn có {landlordMyPosts.filter((p) => p.moderationStatus === "PENDING").length} bài đăng trọ đang chờ Admin duyệt
                  </strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12.5, color: "#b45309" }}>
                    Bài đăng này chưa hiển thị công khai cho khách thuê cho đến khi Quản trị viên duyệt.
                  </p>
                </div>
              </div>
              <Link
                to="/landlord/management?tab=posts"
                className="btn btn-accent"
                style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                Xem trạng thái duyệt →
              </Link>
            </div>
          )}

          {/* Flash Announcement: Nếu có phòng vừa được duyệt (hiển thị có giới hạn, tự đóng) */}
          <AnimatePresence>
            {showFlashBanner && recentRentedPost && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
                transition={{ duration: 0.3 }}
                className="rented-alert-banner"
                style={{
                  marginBottom: 20,
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div className="rented-pulse-indicator">
                    <span className="rented-dot-pulse"></span>
                    <strong>
                      ⚡ TIN MỚI: "{recentRentedPost.title}" vừa được chủ trọ duyệt thành công!
                    </strong>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                    Khách thuê vẫn có thể nhắn tin hỏi thêm các phòng trống lân cận cùng khu vực!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDismissFlashBanner}
                  title="Đóng thông báo"
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "none",
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#dc2626",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"; }}
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Danh sách phòng */}
          {loading ? (
            <div className="forum-posts-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="forum-card skeleton-shimmer" style={{ minHeight: '280px', borderRadius: '16px' }}></div>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state" style={{ background: "var(--bg-card)", borderRadius: 16, padding: "60px 20px", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Rất tiếc, chưa tìm thấy phòng khớp 100% tiêu chí của bạn!</h3>
              <p style={{ color: "var(--text-muted)", margin: "8px 0 16px 0", fontSize: 14 }}>
                Bạn có thể bỏ bớt bộ lọc, nới rộng khoảng giá hoặc chọn khu vực lân cận để xem thêm phòng.
              </p>
              <button onClick={clearAllFilters} className="btn btn-primary btn-ripple">
                <RotateCcw size={14} style={{ marginRight: 6 }} /> Bỏ bớt bộ lọc
              </button>
            </div>
          ) : (
            <motion.div layout className={`forum-posts-list rooms-cards-list${viewMode === "GRID" ? " is-grid" : ""}`} style={{ gap: 20 }}>
              <AnimatePresence>
                {currentItems.map((post) => (
                  <motion.div
                    key={post.id}
                    id={`room-card-${post.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`forum-card hover-card-effect${String(activeRoomId) === String(post.id) ? " is-map-active" : ""}`}
                    onMouseEnter={() => setActiveRoomId(post.id)}
                    onMouseLeave={() => setActiveRoomId(null)}
                  >
                  {/* Photo Carousel */}
                  <PostImageCarousel images={post.images || post.imageUrls} post={post} />

                  {/* Body Content */}
                  <div className="forum-card-body">
                    {/* Header: Author & Badges */}
                    <div className="forum-card-header">
                      <div className="forum-card-author">
                        <div className="avatar forum-author-avatar">
                          {(post.landlordName || "C")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="forum-author-name">
                            <span>{post.landlordName || "Chủ trọ"}</span>
                            <span className="badge-verified">✓ Chính chủ</span>
                          </div>
                          <div className="forum-post-time">
                            <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            {timeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Badges: ĐÃ THUÊ / Ở GHÉP / BÀI ĐĂNG CỦA BẠN */}
                      <div className="forum-card-badges">
                        {user && isUserPost(post, user) && (
                          <span className="badge-user-post">
                            👤 Bài đăng của bạn
                          </span>
                        )}
                        {post.isRented ? (
                          <span className="rented-badge-flashing">
                            ⚡ ĐÃ CÓ NGƯỜI THUÊ
                          </span>
                        ) : (
                          <span className="badge-available">
                            🟢 Còn phòng trống
                          </span>
                        )}
                        {post.roommateNeeded && (
                          <span className="roommate-badge-flashing">
                            🔥 TÌM {post.roommateCount || 1} BẠN Ở GHÉP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Room Title & Price */}
                    <div className="forum-card-title-row">
                      <Link to={`/rooms/${post.id}`} className="forum-card-title">
                        {post.title}
                      </Link>
                      <div className="forum-card-price">
                        {formatVnd(post.price)}
                        <span className="forum-price-unit">/tháng</span>
                      </div>
                    </div>

                    {/* Specs: Price, Area, Type */}
                    <div className="forum-card-specs">
                      {post.roomArea && (
                        <div className="forum-spec-item">
                          📐 {post.roomArea} m²
                        </div>
                      )}
                      {post.roomType && (
                        <div className="forum-spec-item">
                          🏠 {post.roomType}
                        </div>
                      )}
                    </div>

                    {/* Address & Distance from search target */}
                    <div className="forum-card-address">
                      <div className="forum-address-text">
                        <MapPin size={14} className="address-pin-icon" />
                        <span>{formatFullAddress(post)}</span>
                      </div>
                      {post.distanceToTarget != null && (
                        <span className="forum-distance-badge">
                          📍 Cách đích {formatDistance(post.distanceToTarget)}
                        </span>
                      )}
                    </div>

                    {/* Description preview */}
                    {post.description && (
                      <p className="forum-card-desc">
                        {post.description.length > 130
                          ? post.description.substring(0, 130) + "..."
                          : post.description}
                      </p>
                    )}

                    {/* Utilities tags */}
                    {post.utilities && (
                      <div className="forum-card-utilities">
                        {post.utilities.split(",").slice(0, 5).map((u, idx) => (
                          <span key={idx} className="utility-tag">
                            ✓ {u.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Roommate Note Highlight (nếu có) */}
                    {post.roommateNeeded && post.roommateNote && (
                      <div className="forum-roommate-note">
                        <strong>🤝 Tiêu chí ở ghép:</strong> {post.roommateNote}
                      </div>
                    )}

                    {/* Contact Phone & Actions */}
                    <div className="forum-card-footer">
                      {post.contactPhone && (
                        <a href={`tel:${post.contactPhone}`} className="forum-contact-phone">
                          <Phone size={14} />
                          {post.contactPhone}
                        </a>
                      )}

                      <div className="forum-card-actions">
                        {/* 1. Gửi yêu cầu thuê */}
                        <button
                          onClick={() => {
                            setRentalModalPost(post);
                            setRentalForm({ occupants: 1, moveInDate: "", note: "" });
                          }}
                          className="btn btn-primary forum-action-btn"
                        >
                          <Zap size={14} />
                          ⚡ Yêu cầu thuê
                        </button>

                        {/* 2. Tìm bạn ở ghép */}
                        <button
                          onClick={() => {
                            setRoommateModalPost(post);
                            setRoommateForm({
                              roommateNeeded: true,
                              roommateCount: post.roommateCount || 1,
                              gender: "ALL",
                              expectedCost: "",
                              roommateNote: post.roommateNote || "",
                            });
                          }}
                          className="btn btn-accent forum-action-btn"
                        >
                          <Users size={14} />
                          👥 Ở ghép
                        </button>

                        {/* 3. Xem chi tiết */}
                        <Link to={`/rooms/${post.id}`} className="btn forum-action-btn">
                          <Eye size={14} />
                          Chi tiết
                        </Link>

                        {/* 4. Nhắn tin */}
                        <Link to={`/rooms/${post.id}`} className="btn btn-outline forum-action-btn">
                          <MessageCircle size={14} />
                          Nhắn tin
                        </Link>
                        
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Phân trang (Chỉ hiện ở LIST view) */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 32 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={i === page ? "active" : ""}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Trang sau
              </button>
            </div>
          )}
        </main>
        </div>

        {/* CỘT BÊN PHẢI: MAP THU NHỎ VUÔNG VỪA PHẢI + TIỆN ÍCH BỔ SUNG */}
        <aside className="rooms-right-sidebar">
          {/* Widget Bản đồ thu nhỏ góc phải */}
          <div className="compact-map-card">
            <div className="compact-map-header">
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={16} color="var(--primary)" /> Bản đồ vị trí ({visiblePosts.length} phòng)
              </span>
              <button
                type="button"
                onClick={() => setShowFullMap(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-2)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Maximize2 size={13} /> Phóng to
              </button>
            </div>

            <div 
              className="compact-map-preview"
              onClick={() => setShowFullMap(true)}
              title="Nhấn để phóng to bản đồ tìm phòng"
            >
              <MapView
                rooms={mapPosts}
                height="100%"
                defaultZoom={12}
                activeRoomId={activeRoomId}
                onMarkerClick={handleMarkerClick}
                onMarkerHover={setActiveRoomId}
                onBoundsChange={handleMapBoundsChange}
                searchTarget={proximityLocation}
                searchRadiusMeters={proximityLocation ? proximityRadius * 1000 : null}
                isVisible={true}
                onRoomGeocoded={handleRoomGeocoded}
              />
              <div className="compact-map-overlay">
                <Maximize2 size={24} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Nhấn để mở rộng toàn màn hình</span>
              </div>
            </div>

            {/* Quick search by location inside card */}
            <div className="rooms-nearby-search" style={{ padding: "12px 14px", background: "var(--bg-card)", borderTop: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={proximityQuery}
                  onChange={(e) => setProximityQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && proximitySuggestionsOpen) {
                      e.preventDefault();
                      setActiveSuggestionIndex((index) => Math.min(index + 1, proximitySuggestions.length - 1));
                      return;
                    }
                    if (e.key === "ArrowUp" && proximitySuggestionsOpen) {
                      e.preventDefault();
                      setActiveSuggestionIndex((index) => Math.max(index - 1, 0));
                      return;
                    }
                    if (e.key === "Escape") {
                      setProximitySuggestionsOpen(false);
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (activeSuggestionIndex >= 0 && proximitySuggestions[activeSuggestionIndex]) {
                        chooseProximitySuggestion(proximitySuggestions[activeSuggestionIndex]);
                      } else {
                        handleProximitySearch(e);
                      }
                    }
                  }}
                  placeholder="Gõ tên trường ĐH, địa điểm..."
                  role="combobox"
                  aria-expanded={proximitySuggestionsOpen}
                  aria-controls="proximity-location-suggestions"
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    fontSize: 12.5,
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={handleProximitySearch}
                  className="btn btn-primary"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                  disabled={proximityLoading}
                >
                  {proximityLoading ? "..." : "Tìm"}
                </button>
              </div>
              {proximitySuggestionsLoading && <div className="rooms-suggestion-status">Đang tìm địa điểm...</div>}
              {proximitySuggestionsOpen && proximitySuggestions.length > 0 && (
                <div id="proximity-location-suggestions" className="rooms-location-suggestions" role="listbox">
                  {proximitySuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.label}-${suggestion.address}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestionIndex}
                      className={index === activeSuggestionIndex ? "active" : ""}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseProximitySuggestion(suggestion)}
                    >
                      <MapPin size={14} />
                      <span><strong>{suggestion.label}</strong><small>{suggestion.address}</small></span>
                    </button>
                  ))}
                </div>
              )}
              {proximityError && <div className="rooms-suggestion-error">{proximityError}</div>}
            </div>
          </div>

          {/* Banner thông tin hỗ trợ */}
          <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "18px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Sparkles size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Đăng tin nhanh, tìm bạn dễ dàng
                </h4>
                <p style={{ margin: "4px 0 10px 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Mọi bài đăng đều được xác minh danh tính và hỗ trợ liên hệ chat trực tiếp.
                </p>
                {user?.role === "LANDLORD" ? (
                  <Link
                    to="/forum/create"
                    className="btn btn-primary"
                    style={{ fontSize: 12.5, padding: "7px 12px", width: "100%", justifyContent: "center", fontWeight: 700 }}
                  >
                    + Đăng bài trọ ngay
                  </Link>
                ) : (
                  <Link
                    to="/roommates"
                    className="btn btn-outline"
                    style={{ fontSize: 12.5, padding: "7px 12px", width: "100%", justifyContent: "center" }}
                  >
                    Khám phá tìm bạn ở ghép
                  </Link>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            className="rooms-filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowAdvancedFilters(false);
            }}
          >
            <motion.aside
              className="rooms-filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rooms-filter-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
            >
              <div className="rooms-filter-drawer-header">
                <div>
                  <span className="rooms-drawer-eyebrow">TÙY CHỈNH KẾT QUẢ</span>
                  <h2 id="rooms-filter-title">Bộ lọc nâng cao</h2>
                </div>
                <button type="button" className="rooms-drawer-close" onClick={() => setShowAdvancedFilters(false)} aria-label="Đóng bộ lọc">
                  <X size={20} />
                </button>
              </div>

              <div className="rooms-filter-drawer-content">
                <section className="rooms-drawer-section">
                  <div className="rooms-drawer-section-title">
                    <div><strong>Khoảng giá</strong><span>Điều chỉnh ngân sách của bạn</span></div>
                    <strong className="rooms-price-range-value">{formatVnd(priceRange[0])} – {priceRange[1] >= 15000000 ? "15.000.000đ+" : formatVnd(priceRange[1])}</strong>
                  </div>
                  <div className="rooms-price-chart" aria-label="Phân bổ giá phòng">
                    {priceDistribution.map((height, index) => (
                      <span key={index} style={{ height: `${height}%` }} title={`${index === 6 ? "12" : index * 2}–${index === 6 ? "15+" : (index + 1) * 2} triệu`} />
                    ))}
                  </div>
                  <div className="rooms-dual-range">
                    <input
                      aria-label="Giá thấp nhất"
                      type="range"
                      min="1000000"
                      max="15000000"
                      step="250000"
                      value={priceRange[0]}
                      onChange={(event) => updatePriceRange(0, event.target.value)}
                    />
                    <input
                      aria-label="Giá cao nhất"
                      type="range"
                      min="1000000"
                      max="15000000"
                      step="250000"
                      value={priceRange[1]}
                      onChange={(event) => updatePriceRange(1, event.target.value)}
                    />
                  </div>
                  <div className="rooms-range-labels"><span>1 triệu</span><span>15 triệu+</span></div>
                </section>

                <section className="rooms-drawer-section">
                  <div className="rooms-drawer-section-title">
                    <div><strong>Loại hình phòng</strong><span>Chọn loại phòng phù hợp</span></div>
                  </div>
                  <div className="rooms-type-options">
                    <button type="button" className={!roomTypeFilter ? "active" : ""} onClick={() => setRoomTypeFilter("")}>Tất cả</button>
                    {roomTypes.map((roomType) => (
                      <button type="button" key={roomType} className={roomTypeFilter === roomType ? "active" : ""} onClick={() => setRoomTypeFilter(roomType)}>
                        {roomType}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rooms-drawer-section">
                  <div className="rooms-drawer-section-title">
                    <div><strong>Tiện ích & cơ sở vật chất</strong><span>Chọn một hoặc nhiều tiện ích</span></div>
                  </div>
                  {AMENITY_GROUPS.map((group) => {
                    const amenities = amenityOptions.filter(({ name }) =>
                      group.keywords.some((keyword) => name.toLowerCase().includes(keyword)),
                    );
                    if (amenities.length === 0) return null;
                    return (
                      <div key={group.label} className="rooms-amenity-group">
                        <h4>{group.icon} {group.label}</h4>
                        <div className="rooms-amenity-grid">
                          {amenities.map(({ name }) => (
                            <label key={name} className="rooms-amenity-option">
                              <input type="checkbox" checked={selectedAmenities.includes(name)} onChange={() => toggleAmenity(name)} />
                              <span>{name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {amenityOptions.some(({ name }) => !AMENITY_GROUPS.some((group) => group.keywords.some((keyword) => name.toLowerCase().includes(keyword)))) && (
                    <div className="rooms-amenity-group">
                      <h4>✨ Tiện ích khác</h4>
                      <div className="rooms-amenity-grid">
                        {amenityOptions
                          .filter(({ name }) => !AMENITY_GROUPS.some((group) => group.keywords.some((keyword) => name.toLowerCase().includes(keyword))))
                          .map(({ name }) => (
                            <label key={name} className="rooms-amenity-option">
                              <input type="checkbox" checked={selectedAmenities.includes(name)} onChange={() => toggleAmenity(name)} />
                              <span>{name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="rooms-drawer-section">
                  <div className="rooms-drawer-section-title">
                    <div><strong>Gần địa điểm bạn quan tâm</strong><span>Tìm quanh trường học, trạm xe buýt hoặc metro</span></div>
                  </div>
                  {proximityLocation ? (
                    <div className="rooms-radius-control">
                      <MapPin size={17} />
                      <span>{selectedSuggestion?.label || proximityQuery}</span>
                      <select value={proximityRadius} onChange={(event) => setProximityRadius(Number(event.target.value))} aria-label="Bán kính tìm kiếm">
                        {[1, 3, 5, 10].map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
                      </select>
                    </div>
                  ) : (
                    <p className="rooms-location-hint">Chọn một trường/địa điểm gợi ý phía trên hoặc dùng ô tìm địa điểm trên bản đồ để bật lọc bán kính.</p>
                  )}
                </section>
              </div>

              <div className="rooms-filter-drawer-footer">
                <button type="button" className="rooms-drawer-reset" onClick={clearAllFilters}>Xóa tất cả</button>
                <button type="button" className="rooms-drawer-apply" onClick={() => setShowAdvancedFilters(false)}>
                  Hiển thị {visiblePosts.length} phòng
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL GỬI YÊU CẦU THUÊ PHÒNG */}
      {rentalModalPost && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                ⚡ Yêu cầu thuê trọ #{rentalModalPost.id}
              </h3>
              <button
                onClick={() => setRentalModalPost(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{rentalModalPost.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Chủ trọ: <strong>{rentalModalPost.landlordName}</strong> • Giá: <strong style={{ color: "var(--primary)" }}>{formatVnd(rentalModalPost.price)}/tháng</strong>
              </div>
            </div>

            <form onSubmit={handleRentalSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Số người ở dự kiến
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rentalForm.occupants}
                    onChange={(e) => setRentalForm({ ...rentalForm, occupants: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Ngày dự kiến dọn vào
                  </label>
                  <input
                    type="date"
                    value={rentalForm.moveInDate}
                    onChange={(e) => setRentalForm({ ...rentalForm, moveInDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Lời nhắn gửi chủ trọ
                </label>
                <textarea
                  rows="3"
                  placeholder="Ví dụ: Em là sinh viên/người đi làm, muốn xem phòng vào cuối tuần..."
                  value={rentalForm.note}
                  onChange={(e) => setRentalForm({ ...rentalForm, note: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRentalModalPost(null)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingRental}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  {submittingRental ? "Đang gửi..." : "Gửi yêu cầu thuê phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHU CẦU Ở GHÉP */}
      {roommateModalPost && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                👥 Đăng nhu cầu tìm người ở ghép
              </h3>
              <button
                onClick={() => setRoommateModalPost(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#fff7ed", border: "1px dashed #fdba74", padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#c2410c" }}>{roommateModalPost.title}</div>
              <div style={{ fontSize: "0.82rem", color: "#9a3412", marginTop: 2 }}>
                Giá phòng gốc: <strong>{formatVnd(roommateModalPost.price)}/tháng</strong>
              </div>
            </div>

            <form onSubmit={handleRoommateSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Cần tìm số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={roommateForm.roommateCount}
                    onChange={(e) => setRoommateForm({ ...roommateForm, roommateCount: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Yêu cầu giới tính
                  </label>
                  <select
                    value={roommateForm.gender}
                    onChange={(e) => setRoommateForm({ ...roommateForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  >
                    <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="ALL">Nam hoặc Nữ</option>
                    <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="MALE">Chỉ Nam</option>
                    <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value="FEMALE">Chỉ Nữ</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Chi phí dự kiến mỗi bạn chia nhau (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 1500000"
                  value={roommateForm.expectedCost}
                  onChange={(e) => setRoommateForm({ ...roommateForm, expectedCost: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Tiêu chí & Lưu ý khi ở ghép
                </label>
                <textarea
                  rows="3"
                  placeholder="Ví dụ: Sạch sẽ, không hút thuốc, sinh viên Bách Khoa/PTIT, giờ giấc tự do..."
                  value={roommateForm.roommateNote}
                  onChange={(e) => setRoommateForm({ ...roommateForm, roommateNote: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRoommateModalPost(null)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingRoommate}
                  className="btn btn-accent"
                  style={{ fontWeight: 700 }}
                >
                  {savingRoommate ? "Đang lưu..." : "Bật tìm bạn ở ghép ngay 🔥"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO BẢN ĐỒ TOÀN MÀN HÌNH (FULLSCREEN MAP DIALOG) */}
      {showFullMap && (
        <div className="full-map-modal" onClick={() => setShowFullMap(false)}>
          <div className="full-map-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Header Dialog */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
                    Bản Đồ Tìm Phòng Trọ Toàn Màn Hình
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                    Hiển thị {mapPosts.length} phòng trên toàn hệ thống • Bấm vào ghim để xem chi tiết phòng
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFullMap(false)}
                style={{
                  background: "var(--border)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--ink)"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content: Search Bar on top of map + Leaflet Map */}
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
              {/* Floating Proximity Search inside modal */}
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "var(--bg-card)", border: "1px solid var(--border)", backdropFilter: "blur(6px)", padding: "10px 14px", borderRadius: 12, boxShadow: "var(--shadow-card)", display: "flex", gap: 8, alignItems: "center", maxWidth: 450, width: "calc(100% - 24px)" }}>
                <MapPin size={16} color="var(--primary)" />
                <input
                  value={proximityQuery}
                  onChange={(e) => setProximityQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleProximitySearch(e);
                    }
                  }}
                  placeholder="Nhập địa điểm, trường học..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    background: "transparent",
                    color: "var(--text)"
                  }}
                />
                <select
                  value={proximityRadius}
                  onChange={(e) => setProximityRadius(Number(e.target.value))}
                  style={{ border: "1px solid var(--border-color)", borderRadius: 6, padding: "4px 8px", fontSize: 12, background: "var(--bg-card)", color: "var(--text-primary)" }}
                >
                  <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value={1}>1 km</option>
                  <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value={3}>3 km</option>
                  <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value={5}>5 km</option>
                  <option style={{ background: "var(--bg-card)", color: "var(--text-primary)" }} value={10}>10 km</option>
                </select>
                <button
                  type="button"
                  onClick={handleProximitySearch}
                  className="btn btn-primary"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  disabled={proximityLoading}
                >
                  {proximityLoading ? "..." : "Tìm"}
                </button>
                {proximityLocation && (
                  <button
                    type="button"
                    onClick={clearProximitySearch}
                    className="btn btn-outline"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                  >
                    Xóa
                  </button>
                )}
              </div>

              <MapView
                rooms={mapPosts}
                height="100%"
                defaultZoom={13}
                activeRoomId={activeRoomId}
                onMarkerClick={(room) => {
                  handleMarkerClick(room);
                  setShowFullMap(false);
                }}
                onMarkerHover={setActiveRoomId}
                onBoundsChange={handleMapBoundsChange}
                searchTarget={proximityLocation}
                searchRadiusMeters={proximityLocation ? proximityRadius * 1000 : null}
                isVisible={true}
                onRoomGeocoded={handleRoomGeocoded}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
