import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { propertyApi } from "../api/apiClient";

const PAGE_SIZE = 6;
const fallbackImage =
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900";
const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const statusLabel = {
  AVAILABLE: "Còn trống",
  ROOMMATE_OPEN: "Còn chỗ ở ghép",
  FULL: "Đã đủ người",
};

const Rooms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") || "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") || "");
  const [roomTypes, setRoomTypes] = useState(searchParams.getAll("roomType"));
  const [roommateOnly, setRoommateOnly] = useState(
    searchParams.get("roommateOnly") === "true",
  );
  const [amenities, setAmenities] = useState(searchParams.getAll("amenities"));
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const [areaPreset, setAreaPreset] = useState("");

  const filters = useMemo(
    () => ({
      city: city || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minArea: minArea || undefined,
      maxArea: maxArea || undefined,
      roomType: roomTypes.length ? roomTypes.join(",") : undefined,
      status: roommateOnly ? "ROOMMATE_OPEN" : undefined,
      amenities: amenities.length ? amenities.join(",") : undefined,
      sort,
      page,
      size: PAGE_SIZE,
    }),
    [
      amenities,
      city,
      maxArea,
      maxPrice,
      minArea,
      minPrice,
      page,
      roommateOnly,
      roomTypes,
      sort,
    ],
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await propertyApi.searchRooms(filters);
        const data = res.data || {};
        setRooms(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements ?? data.content?.length ?? 0);
      } catch (error) {
        setRooms([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const updateUrl = (nextPage = 0) => {
    const next = new URLSearchParams();
    Object.entries({
      city,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      sort,
      page: nextPage,
    }).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    roomTypes.forEach((type) => next.append("roomType", type));
    amenities.forEach((item) => next.append("amenities", item));
    if (roommateOnly) next.set("roommateOnly", "true");
    setSearchParams(next);
  };
  const scheduleSearch = () => {
    setPage(0);
    updateUrl(0);
  };
  const toggle = (value, values, setter) =>
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  const clearFilters = () => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setRoomTypes([]);
    setAmenities([]);
    setRoommateOnly(false);
    setAreaPreset("");
    setPage(0);
    setSearchParams({});
  };

  return (
    <div className="page-shell">
      <div className="search-strip">
        <div className="wrap">
          <div className="search-box">
            <div className="search-field">
              <label>Khu vực</label>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Bình Thạnh, Quận 3..."
              />
            </div>
            <div className="search-field">
              <label>Khoảng giá</label>
              <select
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              >
                <option value="">Tất cả mức giá</option>
                <option value="2000000">Dưới 2 triệu</option>
                <option value="4000000">2 - 4 triệu</option>
                <option value="7000000">4 - 7 triệu</option>
              </select>
            </div>
            <div className="search-field">
              <label>Diện tích</label>
              <select
                value={areaPreset}
                onChange={(event) => {
                  const [min, max] = event.target.value.split("-");
                  setAreaPreset(event.target.value);
                  setMinArea(min || "");
                  setMaxArea(max || "");
                }}
              >
                <option value="">Tất cả diện tích</option>
                <option value="15-25">15 - 25m²</option>
                <option value="25-35">25 - 35m²</option>
                <option value="35-999">Trên 35m²</option>
              </select>
            </div>
            <button className="btn btn-accent" onClick={scheduleSearch}>
              Tìm phòng
            </button>
          </div>
        </div>
      </div>
      <div className="wrap results-wrap">
        <aside className="filters">
          <div className="filter-group">
            <h4>Khoảng giá (VNĐ)</h4>
            <div className="price-range">
              <input
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Từ"
              />
              <span>-</span>
              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Đến"
              />
            </div>
          </div>
          <div className="filter-group">
            <h4>Diện tích</h4>
            <div className="area-pills">
              {[
                ["0-15", "<15m²"],
                ["15-25", "15-25m²"],
                ["25-35", "25-35m²"],
                ["35-999", ">35m²"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`area-pill ${areaPreset === value ? "active" : ""}`}
                  onClick={() => {
                    const [min, max] = value.split("-");
                    setAreaPreset(value);
                    setMinArea(min);
                    setMaxArea(max);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h4>Loại phòng</h4>
            {[
              ["SINGLE", "Phòng đơn"],
              ["LOFT", "Phòng có gác"],
              ["MINI_APARTMENT", "Chung cư mini"],
            ].map(([value, label]) => (
              <label className="check-row" key={value}>
                <input
                  type="checkbox"
                  checked={roomTypes.includes(value)}
                  onChange={() => toggle(value, roomTypes, setRoomTypes)}
                />
                <span>{label}</span>
              </label>
            ))}
            <label className="check-row">
              <input
                type="checkbox"
                checked={roommateOnly}
                onChange={(event) => setRoommateOnly(event.target.checked)}
              />
              <span>Còn chỗ ở ghép</span>
            </label>
          </div>
          <div className="filter-group">
            <h4>Tiện ích</h4>
            {["Wifi", "Máy giặt chung", "Chỗ để xe", "Camera an ninh"].map(
              (value) => (
                <label className="check-row" key={value}>
                  <input
                    type="checkbox"
                    checked={amenities.includes(value)}
                    onChange={() => toggle(value, amenities, setAmenities)}
                  />
                  <span>{value}</span>
                </label>
              ),
            )}
          </div>
          <button className="btn-clear" onClick={clearFilters}>
            Xóa tất cả bộ lọc
          </button>
        </aside>
        <main>
          <div className="results-head">
            <div>
              <h1>
                {loading
                  ? "Đang tìm phòng..."
                  : `${totalElements} phòng${city ? ` tại ${city}` : ""}`}
              </h1>
              <p>Lọc theo giá, diện tích, loại phòng và tiện ích</p>
            </div>
            <div className="sort">
              <span>Sắp xếp</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(0);
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="priceAsc">Giá tăng dần</option>
                <option value="priceDesc">Giá giảm dần</option>
              </select>
            </div>
          </div>
          <div className="listing" style={{ opacity: loading ? 0.55 : 1 }}>
            {rooms.length ? (
              rooms.map((room) => (
                <div className="list-card" key={room.id}>
                  <div className="list-photo">
                    <img
                      src={
                        room.images?.[0] || room.thumbnailUrl || fallbackImage
                      }
                      alt={room.propertyTitle || "Phòng trọ"}
                    />
                    <span className="verified">Chủ trọ đã xác thực</span>
                  </div>
                  <div className="list-info">
                    <div className="info-top">
                      <div>
                        <div className="title">
                          Phòng {room.roomNumber || ""}{" "}
                          {room.propertyTitle || "Phòng trọ"}
                        </div>
                        <div className="room-address">
                          {room.address ||
                            `${room.district || ""}, ${room.city || ""}`}
                        </div>
                      </div>
                      <div className="price">
                        {formatVnd(room.price)}
                        <small>/tháng</small>
                      </div>
                    </div>
                    <div className="info-tags">
                      {(room.utilities || "Wifi,Chỗ để xe")
                        .split(",")
                        .slice(0, 4)
                        .map((tag) => (
                          <span className="tag" key={tag}>
                            {tag.trim()}
                          </span>
                        ))}
                    </div>
                    <div className="info-bottom">
                      <div className="meta-line">
                        <span>{room.area || "--"}m²</span>
                        <span>
                          Đang ở {room.currentOccupants || 0}/
                          {room.capacity || "--"} người
                        </span>
                        <span className={`status-pill ${room.status}`}>
                          {statusLabel[room.status] || room.status}
                        </span>
                      </div>
                      <Link
                        to={`/rooms/${room.id}`}
                        className="btn btn-primary"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <b>Không tìm thấy phòng phù hợp</b>Thử nới rộng khoảng giá hoặc
                bỏ bớt tiện ích đang lọc.
              </div>
            )}
          </div>
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                className={index === page ? "active" : ""}
                key={index}
                onClick={() => {
                  setPage(index);
                  updateUrl(index);
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Rooms;
