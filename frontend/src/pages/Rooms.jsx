import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Clock, Plus, ChevronLeft, ChevronRight,
  MessageCircle, Eye, Users, Zap, FileText, X, Search, Filter, RotateCcw,
  Phone, Maximize2, Sparkles, ShieldCheck, Layers
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { forumApi, rentalApi, unwrapApiData } from "../api/apiClient";
import useAmenities from "../hooks/useAmenities";
import MapView from "../components/MapView";
import WishlistButton from "../components/WishlistButton";

const PAGE_SIZE = 6;
const API_PAGE_SIZE = 100;

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

// Carousel ảnh bài đăng
const PostImageCarousel = ({ images }) => {
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
      </div>
    );
  }
  return (
    <div className="forum-card-photo">
      <img src={imgList[idx]} alt="Ảnh phòng trọ" />
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
  const [viewMode, setViewMode] = useState("LIST"); // LIST | MAP
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
    let result = [...posts];

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
      result = result.filter((p) => p.roommateNeeded);
    } else if (statusFilter === "RENTED") {
      result = result.filter((p) => p.isRented);
    }

    // Lọc theo tiện ích
    if (selectedAmenities.length > 0) {
      result = result.filter((p) => {
        const utilStr = (p.utilities || "").toLowerCase();
        return selectedAmenities.every((a) => utilStr.includes(a.toLowerCase()));
      });
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
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [posts, city, minPrice, maxPrice, minArea, maxArea, statusFilter, postTab, selectedAmenities, sort, user]);

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
  }, [city, minPrice, maxPrice, minArea, maxArea, statusFilter, postTab, selectedAmenities, sort]);

  const clearAllFilters = () => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setStatusFilter("ALL");
    setPostTab("ALL");
    setSelectedAmenities([]);
    setSort("newest");
    clearProximitySearch();
    setPage(0);
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="page-shell">
      {/* 1. TOP SEARCH BAR (Dải tìm kiếm nhanh trên cùng) */}
      <section className="search-strip" style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "18px 0" }}>
        <div className="wrap">
          <form
            className="search-box"
            style={{ margin: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
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
                  placeholder="VD: Bình Thạnh, Dĩ An, Thủ Đức, TP.HCM..."
                />
              </div>
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
                    setMinPrice("");
                    setMaxPrice("2000000");
                  } else if (val === "2-4") {
                    setMinPrice("2000000");
                    setMaxPrice("4000000");
                  } else if (val === "4-7") {
                    setMinPrice("4000000");
                    setMaxPrice("7000000");
                  } else if (val === "o7") {
                    setMinPrice("7000000");
                    setMaxPrice("");
                  } else {
                    setMinPrice("");
                    setMaxPrice("");
                  }
                }}
              >
                <option value="">Tất cả mức giá</option>
                <option value="u2">Dưới 2 triệu</option>
                <option value="2-4">2 - 4 triệu</option>
                <option value="4-7">4 - 7 triệu</option>
                <option value="o7">Trên 7 triệu</option>
              </select>
            </div>

            <div className="search-field" style={{ flex: 1 }}>
              <label>Diện tích</label>
              <select
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
                <option value="">Tất cả diện tích</option>
                <option value="u20">Dưới 20 m²</option>
                <option value="20-30">20 - 30 m²</option>
                <option value="o30">Trên 30 m²</option>
              </select>
            </div>

            <button className="btn btn-accent" type="submit" style={{ padding: "0 28px", fontWeight: "bold" }}>
              <Search size={16} style={{ marginRight: 6 }} /> Tìm phòng
            </button>
          </form>

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
                      border: isSelected ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                      background: isSelected ? "var(--ink)" : "#f8fafc",
                      color: isSelected ? "#fff" : "var(--ink)",
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "none"
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
      <div className={`results-wrap${viewMode === "MAP" ? " is-map-view" : " is-list-view"}`}>
        <div className="rooms-results-column">
        {/* SIDEBAR BỘ LỌC BÊN TRÁI */}
        <aside className="filters">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={18} color="var(--primary)" /> Bộ Lọc Phòng
            </h3>
            <button onClick={clearAllFilters} className="btn-clear" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <RotateCcw size={12} /> Xóa lọc
            </button>
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
          <div className="filter-group">
            <h4>Tiện ích phòng</h4>
            {amenityOptions.map(({ name: amenity }) => (
              <label key={amenity} className="check-row" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>

          {/* Đăng tin trọ dành cho chủ trọ */}
          {user?.role === "LANDLORD" && (
            <div style={{ marginTop: 20 }}>
              <Link
                to="/forum/create"
                className="btn btn-primary btn-block"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700 }}
              >
                <Plus size={16} /> + Đăng Tin Cho Thuê
              </Link>
            </div>
          )}
        </aside>

        {/* NỘI DUNG CHÍNH (DANH SÁCH BÀI ĐĂNG PHÒNG TRỌ) */}
        <main className="rooms-list-pane">
          {/* Modern Header: Tabs (Tất cả / Của tôi / Người khác) & Bộ lọc sắp xếp */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid var(--border)", marginBottom: 20, boxShadow: "var(--shadow-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              {/* Tab phân loại bài đăng */}
              <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: 4, borderRadius: 12 }}>
                <button
                  onClick={() => setPostTab("ALL")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13.5,
                    fontWeight: postTab === "ALL" ? 700 : 500,
                    background: postTab === "ALL" ? "#fff" : "transparent",
                    color: postTab === "ALL" ? "var(--ink)" : "var(--text-muted)",
                    boxShadow: postTab === "ALL" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
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
                        background: postTab === "MY_POSTS" ? "#fff" : "transparent",
                        color: postTab === "MY_POSTS" ? "var(--ink)" : "var(--text-muted)",
                        boxShadow: postTab === "MY_POSTS" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
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
                        background: postTab === "OTHERS" ? "#fff" : "transparent",
                        color: postTab === "OTHERS" ? "var(--ink)" : "var(--text-muted)",
                        boxShadow: postTab === "OTHERS" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
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
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Sắp xếp:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 13,
                    background: "#fff",
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="newest">✨ Mới nhất</option>
                  <option value="price-asc">💵 Giá thấp đến cao</option>
                  <option value="price-desc">💎 Giá cao đến thấp</option>
                  <option value="area-desc">📐 Diện tích rộng nhất</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Tìm thấy <strong style={{ color: "var(--ink)" }}>{visiblePosts.length}</strong> bài đăng phòng trọ phù hợp
              </span>
              <button 
                onClick={() => setShowFullMap(true)}
                className="btn btn-outline"
                style={{ padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 5, borderRadius: 6 }}
              >
                <Maximize2 size={13} /> Mở bản đồ toàn màn hình
              </button>
            </div>
          </div>

          {/* Flash Announcement: Nếu có phòng vừa được duyệt */}
          {recentRentedPost && (
            <div className="rented-alert-banner" style={{ marginBottom: 20 }}>
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
          )}

          {/* Danh sách phòng */}
          {loading ? (
            <div className="forum-posts-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="forum-card skeleton-shimmer" style={{ minHeight: '280px', borderRadius: '16px' }}></div>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state" style={{ background: "white", borderRadius: 16, padding: "60px 20px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Không tìm thấy phòng phù hợp</h3>
              <p style={{ color: "var(--text-muted)", margin: "8px 0 16px 0", fontSize: 14 }}>
                Thử nới rộng khoảng giá, đổi khu vực tìm kiếm hoặc bấm xóa bộ lọc.
              </p>
              <button onClick={clearAllFilters} className="btn btn-outline btn-ripple">
                <RotateCcw size={14} style={{ marginRight: 6 }} /> Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <motion.div layout className="forum-posts-list rooms-cards-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                  <PostImageCarousel images={post.images || post.imageUrls} />

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
                            {post.landlordName || "Chủ trọ"}
                            <span className="badge-verified">✓ Chính chủ</span>
                          </div>
                          <div className="forum-post-time">
                            <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            {timeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Badges: ĐÃ THUÊ / Ở GHÉP / BÀI ĐĂNG CỦA BẠN */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {user && (
                          (post.landlordId && user.id && String(post.landlordId) === String(user.id)) ||
                          (post.userId && user.id && String(post.userId) === String(user.id)) ||
                          (post.landlordName && user.fullName && post.landlordName.toLowerCase() === user.fullName.toLowerCase())
                        ) && (
                          <span style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, border: "1px solid #c7d2fe" }}>
                            👤 Bài đăng của bạn
                          </span>
                        )}
                        {post.isRented && (
                          <span className="rented-badge-flashing">
                            ⚡ ĐÃ CÓ NGƯỜI THUÊ
                          </span>
                        )}
                        {post.roommateNeeded && (
                          <span className="roommate-badge-flashing">
                            🔥 TÌM {post.roommateCount || 1} BẠN Ở GHÉP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Room Title */}
                    <Link to={`/rooms/${post.id}`} className="forum-card-title">
                      {post.title}
                    </Link>

                    {/* Specs: Price, Area, Type */}
                    <div className="forum-card-specs">
                      <div className="forum-card-price">
                        {formatVnd(post.price)}
                        <span className="forum-price-unit">/tháng</span>
                      </div>
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
                    <div className="forum-card-address" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 200 }}>
                        <MapPin size={14} style={{ color: "var(--brand-primary, #2563eb)", flexShrink: 0 }} />
                        <span>{post.address}, {post.ward}, {post.district}, {post.city}</span>
                      </div>
                      {post.distanceToTarget != null && (
                        <span style={{
                          background: "#ecfdf5",
                          color: "#059669",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid #a7f3d0",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}>
                          📍 Cách đích {formatDistance(post.distanceToTarget)}
                        </span>
                      )}
                    </div>

                    {/* Description preview */}
                    {post.description && (
                      <p className="forum-card-desc">
                        {post.description.length > 150
                          ? post.description.substring(0, 150) + "..."
                          : post.description}
                      </p>
                    )}

                    {/* Utilities tags */}
                    {post.utilities && (
                      <div className="forum-card-utilities">
                        {post.utilities.split(",").slice(0, 4).map((u, idx) => (
                          <span key={idx} className="utility-tag">
                            ✓ {u.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Roommate Note Highlight (nếu có) */}
                    {post.roommateNeeded && post.roommateNote && (
                      <div style={{ background: "#fff7ed", border: "1px dashed #fdba74", padding: "8px 12px", borderRadius: 8, margin: "10px 0", fontSize: "0.85rem", color: "#c2410c" }}>
                        <strong>🤝 Tiêu chí ở ghép:</strong> {post.roommateNote}
                      </div>
                    )}

                    {/* Contact Phone & Actions */}
                    <div className="forum-card-footer" style={{ marginTop: 12 }}>
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
                          style={{ fontWeight: 700 }}
                        >
                          <Zap size={15} />
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
                          style={{ fontWeight: 700 }}
                        >
                          <Users size={15} />
                          👥 Tìm bạn ở ghép
                        </button>

                        {/* 3. Xem chi tiết */}
                        <Link to={`/rooms/${post.id}`} className="btn forum-action-btn">
                          <Eye size={15} />
                          Xem chi tiết
                        </Link>

                        {/* 4. Nhắn tin */}
                        <Link to={`/rooms/${post.id}`} className="btn btn-outline forum-action-btn">
                          <MessageCircle size={15} />
                          Nhắn tin
                        </Link>
                        
                        {/* 5. Yêu thích */}
                        <WishlistButton post={post} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "#fff" }} showText={false} />
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
            <div style={{ padding: "12px 14px", background: "#fff", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={proximityQuery}
                  onChange={(e) => setProximityQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleProximitySearch(e);
                    }
                  }}
                  placeholder="Gõ tên trường ĐH, địa điểm..."
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
            </div>
          </div>

          {/* Banner thông tin hỗ trợ */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: 16, padding: "18px", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Sparkles size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#14532d" }}>
                  Đăng tin nhanh, tìm bạn dễ dàng
                </h4>
                <p style={{ margin: "4px 0 10px 0", fontSize: 12.5, color: "#166534", lineHeight: 1.4 }}>
                  Mọi bài đăng đều được xác minh danh tính và hỗ trợ liên hệ chat trực tiếp.
                </p>
                {user?.role === "LANDLORD" ? (
                  <Link
                    to="/forum/create"
                    className="btn btn-primary"
                    style={{ fontSize: 12.5, padding: "6px 12px", width: "100%", justifyContent: "center" }}
                  >
                    + Đăng bài trọ ngay
                  </Link>
                ) : (
                  <Link
                    to="/roommates"
                    className="btn btn-outline"
                    style={{ fontSize: 12.5, padding: "6px 12px", width: "100%", justifyContent: "center", background: "#fff" }}
                  >
                    Khám phá tìm bạn ở ghép
                  </Link>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

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

            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{rentalModalPost.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                Chủ trọ: <strong>{rentalModalPost.landlordName}</strong> • Giá: <strong style={{ color: "#2563eb" }}>{formatVnd(rentalModalPost.price)}/tháng</strong>
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
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  >
                    <option value="ALL">Nam hoặc Nữ</option>
                    <option value="MALE">Chỉ Nam</option>
                    <option value="FEMALE">Chỉ Nữ</option>
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
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
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
                  background: "#e2e8f0",
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
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(6px)", padding: "10px 14px", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", display: "flex", gap: 8, alignItems: "center", maxWidth: 450, width: "calc(100% - 24px)" }}>
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
                    background: "transparent"
                  }}
                />
                <select
                  value={proximityRadius}
                  onChange={(e) => setProximityRadius(Number(e.target.value))}
                  style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", fontSize: 12, background: "#fff" }}
                >
                  <option value={1}>1 km</option>
                  <option value={3}>3 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
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
