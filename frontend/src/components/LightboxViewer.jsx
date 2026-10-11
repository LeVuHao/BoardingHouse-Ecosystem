import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, 
  Maximize2, Image as ImageIcon 
} from 'lucide-react';

const LightboxViewer = ({ 
  images = [], 
  initialIndex = 0, 
  isOpen = false, 
  onClose = () => {},
  title = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Cập nhật index khi initialIndex thay đổi hoặc khi mở modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
    }
  }, [isOpen, initialIndex]);

  // Khóa cuộn body khi mở Lightbox
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const total = images.length;

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.8));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Bắt phím tắt bàn phím: ESC để đóng, Mũi tên Trái/Phải để chuyển ảnh
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      className="lightbox-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh phóng to"
    >
      {/* Nút bấm & Tiêu đề thanh công cụ trên cùng */}
      <div className="lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-title-wrap">
          <ImageIcon size={18} className="lightbox-title-icon" />
          <span className="lightbox-counter">
            {currentIndex + 1} / {total}
          </span>
          {title && <span className="lightbox-image-title">— {title}</span>}
        </div>

        <div className="lightbox-actions">
          <button 
            type="button" 
            className="lightbox-tool-btn" 
            onClick={handleZoomIn} 
            title="Phóng to (+)"
            aria-label="Phóng to ảnh"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            type="button" 
            className="lightbox-tool-btn" 
            onClick={handleZoomOut} 
            title="Thu nhỏ (-)"
            aria-label="Thu nhỏ ảnh"
          >
            <ZoomOut size={18} />
          </button>
          {zoomLevel !== 1 && (
            <button 
              type="button" 
              className="lightbox-tool-btn" 
              onClick={handleResetZoom} 
              title="Khôi phục kích thước gốc"
              aria-label="Khôi phục kích thước ảnh"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button 
            type="button" 
            className="lightbox-tool-btn lightbox-close-btn" 
            onClick={onClose} 
            title="Đóng (ESC)"
            aria-label="Đóng trình xem ảnh"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Vùng hiển thị ảnh chính */}
      <div className="lightbox-main-stage" onClick={(e) => e.stopPropagation()}>
        {total > 1 && (
          <button
            type="button"
            className="lightbox-nav-btn lightbox-prev"
            onClick={goToPrev}
            title="Ảnh trước (Mũi tên trái)"
            aria-label="Xem ảnh trước"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div className="lightbox-image-viewport">
          <img
            src={currentImage}
            alt={title || `Ảnh phòng ${currentIndex + 1}`}
            className="lightbox-main-image"
            style={{
              transform: `scale(${zoomLevel})`,
              transition: zoomLevel === 1 ? 'transform 0.25s ease' : 'transform 0.1s ease',
            }}
            draggable={false}
          />
        </div>

        {total > 1 && (
          <button
            type="button"
            className="lightbox-nav-btn lightbox-next"
            onClick={goToNext}
            title="Ảnh kế tiếp (Mũi tên phải)"
            aria-label="Xem ảnh kế tiếp"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Dải ảnh thumbnails nhỏ bên dưới */}
      {total > 1 && (
        <div className="lightbox-thumbnail-strip" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className={`lightbox-thumb-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              title={`Ảnh ${idx + 1}`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LightboxViewer;
