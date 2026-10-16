import React, { useState } from 'react';
import { 
  X, 
  Flag, 
  ShieldAlert, 
  DollarSign, 
  ImageOff, 
  PhoneOff, 
  AlertTriangle, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportApi } from '../api/apiClient';

const REASON_OPTIONS = [
  {
    id: 'SCAM',
    icon: ShieldAlert,
    color: '#EF4444',
    title: 'Tin giả / Phòng không có thật / Lừa đảo tiền cọc',
    desc: 'Phòng không tồn tại, địa chỉ ma, lừa chuyển cọc giữ chỗ'
  },
  {
    id: 'FAKE_PRICE',
    icon: DollarSign,
    color: '#F59E0B',
    title: 'Giá thuê thực tế khác xa với giá đăng',
    desc: 'Giá đến xem cao hơn giá niêm yết, phát sinh chi phí vô lý'
  },
  {
    id: 'MISLEADING_PHOTOS',
    icon: ImageOff,
    color: '#8B5CF6',
    title: 'Ảnh đăng tải sai lệch nghiêm trọng so với thực tế',
    desc: 'Ảnh lấy từ mạng, ảnh đã qua chỉnh sửa sai sự thật'
  },
  {
    id: 'UNREACHABLE_OR_HARASSMENT',
    icon: PhoneOff,
    color: '#EC4899',
    title: 'Không liên lạc được hoặc có hành vi quấy rối',
    desc: 'Số điện thoại ảo, chủ trọ thái độ xúc phạm hoặc quấy rối'
  },
  {
    id: 'SENSITIVE_CONTENT',
    icon: AlertTriangle,
    color: '#64748B',
    title: 'Nội dung nhạy cảm, ngôn từ thù địch, spam',
    desc: 'Tin đăng rác, ngôn từ không phù hợp thuần phong mỹ tục'
  }
];

const ReportModal = ({ isOpen, onClose, targetType = 'ROOM', targetId, targetTitle = '' }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 3) {
      toast.error('Bạn chỉ có thể đính kèm tối đa 3 ảnh bằng chứng');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ảnh ${file.name} vượt quá 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => {
          if (prev.length >= 3) return prev;
          return [...prev, reader.result];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error('Vui lòng chọn 1 lý do vi phạm');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Vui lòng nhập mô tả chi tiết sự việc (ít nhất 10 ký tự)');
      return;
    }

    setSubmitting(true);
    try {
      await reportApi.createReport({
        targetType,
        targetId: Number(targetId),
        reason: selectedReason,
        description: description.trim(),
        evidenceImages: images
      });

      toast.success('Cảm ơn bạn! Đội ngũ Admin sẽ kiểm duyệt và xử lý trong vòng 24h.', {
        duration: 5000,
        icon: '🛡️'
      });

      // Reset state and close
      setSelectedReason('');
      setDescription('');
      setImages([]);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div 
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-primary, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                Báo cáo vi phạm
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                {targetTitle ? `Đối tượng: ${targetTitle}` : 'Giúp chúng tôi giữ môi trường phòng trọ an toàn, minh bạch'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary, #64748b)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <form id="report-form" onSubmit={handleSubmit}>
            {/* Reason selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
                Chọn lý do vi phạm <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {REASON_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedReason === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedReason(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected 
                          ? `2px solid ${opt.color}` 
                          : '1px solid var(--border-color, #e2e8f0)',
                        background: isSelected 
                          ? `${opt.color}0D` 
                          : 'var(--bg-primary, #f8fafc)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div 
                        style={{
                          marginTop: '2px',
                          color: opt.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: isSelected ? '600' : '500', color: isSelected ? opt.color : 'inherit' }}>
                          {opt.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                          {opt.desc}
                        </div>
                      </div>
                      <div 
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? `5px solid ${opt.color}` : '2px solid var(--border-color, #cbd5e1)',
                          background: isSelected ? '#ffffff' : 'transparent',
                          marginTop: '2px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description textarea */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Mô tả chi tiết sự việc <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng cung cấp thêm thông tin chi tiết về trải nghiệm của bạn (thời gian, nội dung trao đổi, địa điểm...)"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'var(--bg-primary, #f8fafc)',
                  color: 'inherit',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', textAlign: 'right', marginTop: '4px' }}>
                {description.length} ký tự (tối thiểu 10)
              </div>
            </div>

            {/* Evidence attachment (1-3 images) */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Đính kèm bằng chứng <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary, #64748b)' }}>(Tùy chọn, tối đa 3 ảnh chụp tin nhắn, chuyển tiền...)</span>
              </label>

              {/* Image previews */}
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        position: 'relative',
                        width: '84px',
                        height: '84px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color, #e2e8f0)'
                      }}
                    >
                      <img 
                        src={img} 
                        alt="Bằng chứng" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        disabled={submitting}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 3 && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '2px dashed var(--border-color, #cbd5e1)',
                    background: 'var(--bg-primary, #f8fafc)',
                    color: 'var(--text-secondary, #64748b)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  <UploadCloud size={18} />
                  <span>Chọn ảnh bằng chứng từ thiết bị ({images.length}/3)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={submitting}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div 
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            background: 'var(--bg-primary, #f8fafc)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'transparent',
              color: 'var(--text-secondary, #64748b)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="report-form"
            disabled={submitting}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: '#EF4444',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '14px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Flag size={16} />
                <span>Gửi báo cáo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
