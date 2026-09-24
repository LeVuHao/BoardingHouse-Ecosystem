import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X, MapPin, DollarSign, Phone, Home, Send, Maximize2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { forumApi } from "../api/apiClient";

const CreateForumPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    contactPhone: user?.phoneNumber || "",
    roomArea: "",
    roomType: "",
    utilities: "",
    roommateNeeded: false,
    roommateCount: 1,
    roommateNote: "",
  });

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      toast.error("Tối đa 10 ảnh!");
      return;
    }
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" quá lớn (tối đa 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [...prev, { url: event.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.address || !form.city || !form.district || !form.ward) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        roomArea: form.roomArea ? parseFloat(form.roomArea) : null,
        roommateCount: form.roommateNeeded ? parseInt(form.roommateCount, 10) || 1 : null,
        imageUrls: images.map((img) => img.url),
        landlordName: user?.fullName || "Chủ trọ",
      };
      await forumApi.createPost(payload);
      toast.success("Đăng bài thành công! 🎉");
      navigate("/forum");
    } catch (err) {
      toast.error(err?.message || "Đăng bài thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="forum-create-page">
          {/* Header */}
          <div className="forum-create-header">
            <div className="forum-create-header-icon">
              <Home size={24} />
            </div>
            <div>
              <h1>Đăng bài cho thuê trọ</h1>
              <p className="muted">Bài đăng sẽ hiển thị ngay trên diễn đàn cho mọi người xem</p>
            </div>
          </div>

          {/* Create Post Card */}
          <form className="forum-create-card" onSubmit={handleSubmit}>
            {/* Author section */}
            <div className="forum-create-author">
              <div className="avatar">{(user?.fullName || "C")[0]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.fullName || "Chủ trọ"}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Đăng công khai trên diễn đàn</div>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label>
                Tiêu đề bài đăng <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="VD: Phòng trọ sạch đẹp gần ĐH Bách Khoa, giá rẻ"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Mô tả chi tiết</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả về phòng trọ: tiện nghi, xung quanh có gì, điều kiện thuê..."
                rows={5}
              />
            </div>

            {/* Price & Area Row */}
            <div className="forum-create-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  <DollarSign size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Giá thuê/tháng (VNĐ) <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="VD: 2500000"
                  min="0"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  <Maximize2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Diện tích (m²)
                </label>
                <input
                  name="roomArea"
                  type="number"
                  value={form.roomArea}
                  onChange={handleChange}
                  placeholder="VD: 25"
                  min="0"
                />
              </div>
            </div>

            {/* Room type & Utilities */}
            <div className="forum-create-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Loại phòng</label>
                <select name="roomType" value={form.roomType} onChange={handleChange}>
                  <option value="">-- Chọn loại phòng --</option>
                  <option value="Phòng đơn">Phòng đơn</option>
                  <option value="Phòng có gác">Phòng có gác</option>
                  <option value="Chung cư mini">Chung cư mini</option>
                  <option value="Phòng ghép">Phòng ghép</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tiện ích</label>
                <input
                  name="utilities"
                  value={form.utilities}
                  onChange={handleChange}
                  placeholder="VD: Wifi, máy giặt, bãi xe, tủ lạnh"
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="forum-create-section-title">
              <MapPin size={16} />
              Địa chỉ phòng trọ
            </div>

            <div className="forum-create-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Tỉnh/Thành phố <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="VD: TP. Hồ Chí Minh"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Quận/Huyện <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="VD: Bình Thạnh"
                />
              </div>
            </div>

            <div className="forum-create-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Phường/Xã <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="ward"
                  value={form.ward}
                  onChange={handleChange}
                  placeholder="VD: Phường 25"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Địa chỉ chi tiết <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="VD: 123 Điện Biên Phủ, Phường 25"
                />
              </div>
            </div>

            {/* Contact phone */}
            <div className="form-group">
              <label>
                <Phone size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Số điện thoại liên hệ
              </label>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="VD: 0901234567"
              />
            </div>

            {/* Roommate Option */}
            <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  name="roommateNeeded"
                  checked={form.roommateNeeded}
                  onChange={handleChange}
                  style={{ width: 18, height: 18 }}
                />
                <span>🔥 Phòng này đang có nhu cầu tìm người ở ghép cùng</span>
              </label>

              {form.roommateNeeded && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                      Số lượng người cần tìm ở ghép (bạn)
                    </label>
                    <input
                      type="number"
                      name="roommateCount"
                      min="1"
                      max="10"
                      value={form.roommateCount}
                      onChange={handleChange}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                      Tiêu chí / Ghi chú cho người ở ghép
                    </label>
                    <input
                      type="text"
                      name="roommateNote"
                      value={form.roommateNote}
                      onChange={handleChange}
                      placeholder="VD: Ưu tiên sinh viên, không hút thuốc, tính tình gọn gàng..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="forum-create-section-title">
              <ImagePlus size={16} />
              Ảnh phòng trọ (tối đa 10 ảnh, mỗi ảnh ≤ 5MB)
            </div>

            <div className="forum-upload-zone">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                id="forum-image-input"
                style={{ display: "none" }}
              />
              <label htmlFor="forum-image-input" className="forum-upload-trigger">
                <ImagePlus size={32} strokeWidth={1.5} />
                <span>Bấm để chọn ảnh từ máy</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  Hỗ trợ JPG, PNG, WEBP
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="forum-image-previews">
                {images.map((img, i) => (
                  <div key={i} className="forum-preview-item">
                    <img src={img.url} alt={img.name} />
                    <button
                      type="button"
                      className="forum-preview-remove"
                      onClick={() => removeImage(i)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary forum-submit-btn"
              disabled={loading}
            >
              <Send size={16} />
              {loading ? "Đang đăng..." : "Đăng bài cho thuê"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateForumPost;
