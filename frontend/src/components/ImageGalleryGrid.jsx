import React, { useState } from 'react';
import { Images, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import LightboxViewer from './LightboxViewer';

const fallbackImages = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
];

const ImageGalleryGrid = ({ images = [], title = '' }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [mobileSlide, setMobileSlide] = useState(0);

  // Danh sách ảnh thực tế hoặc ảnh mẫu nếu rỗng
  const displayImages = images && images.length > 0 ? images : fallbackImages;
  const total = displayImages.length;

  const openLightbox = (index = 0) => {
    setActivePhotoIdx(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleMobileNext = (e) => {
    e.stopPropagation();
    setMobileSlide((prev) => (prev + 1) % total);
  };

  const handleMobilePrev = (e) => {
    e.stopPropagation();
    setMobileSlide((prev) => (prev - 1 + total) % total);
  };

  return (
    <div className="airbnb-gallery-container" data-testid="airbnb-image-gallery">
      {/* ─────────────────────────────────────────────────────────────
          1. GIAO DIỆN DESKTOP / TABLET (Chuẩn Airbnb 5 Khung Ảnh)
          ───────────────────────────────────────────────────────────── */}
      <div className={`airbnb-grid-desktop layout-count-${Math.min(total, 5)}`}>
        {/* Ảnh chính lớn nhất bên trái (chiếm 50% diện tích) */}
        <div 
          className="airbnb-grid-cell airbnb-cell-main"
          onClick={() => openLightbox(0)}
          role="button"
          tabIndex={0}
          title="Nhấp để phóng to ảnh chính"
        >
          <img 
            src={displayImages[0]} 
            alt={title ? `${title} - Ảnh chính` : 'Ảnh chính'} 
            className="airbnb-img"
            loading="eager"
          />
          <div className="airbnb-cell-overlay"></div>
        </div>

        {/* Cột 4 ảnh nhỏ bên phải xếp lưới 2x2 */}
        {total > 1 && (
          <div className="airbnb-grid-side">
            {displayImages.slice(1, 5).map((imgUrl, i) => {
              const actualIdx = i + 1;
              const isLastCell = i === 3 || actualIdx === total - 1;

              return (
                <div
                  key={actualIdx}
                  className={`airbnb-grid-cell airbnb-cell-sub cell-${actualIdx}`}
                  onClick={() => openLightbox(actualIdx)}
                  role="button"
                  tabIndex={0}
                  title={`Nhấp để phóng to ảnh ${actualIdx + 1}`}
                >
                  <img 
                    src={imgUrl} 
                    alt={title ? `${title} - Ảnh ${actualIdx + 1}` : `Ảnh ${actualIdx + 1}`} 
                    className="airbnb-img"
                    loading="lazy"
                  />
                  <div className="airbnb-cell-overlay"></div>

                  {/* Nút badge nổi bật ở góc dưới bên phải nếu là ô cuối cùng */}
                  {isLastCell && (
                    <button
                      type="button"
                      className="airbnb-view-all-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(0);
                      }}
                      title="Xem toàn bộ album ảnh"
                    >
                      <Grid size={16} />
                      <span>🖼️ Xem tất cả {total} ảnh</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Nút badge dự phòng nếu số lượng ảnh < 5 */}
        {total < 5 && total > 1 && (
          <button
            type="button"
            className="airbnb-view-all-btn airbnb-view-all-floating"
            onClick={() => openLightbox(0)}
            title="Xem toàn bộ album ảnh"
          >
            <Grid size={16} />
            <span>🖼️ Xem tất cả {total} ảnh</span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. GIAO DIỆN MOBILE (< 768px): TRƯỢT NGANG (SLIDER / CAROUSEL)
          ───────────────────────────────────────────────────────────── */}
      <div className="airbnb-slider-mobile">
        <div 
          className="airbnb-mobile-viewport"
          onClick={() => openLightbox(mobileSlide)}
        >
          <img 
            src={displayImages[mobileSlide]} 
            alt={title ? `${title} - ${mobileSlide + 1}` : `Ảnh ${mobileSlide + 1}`} 
            className="airbnb-mobile-img"
          />
          
          {/* Nút điều hướng Carousel trên mobile */}
          {total > 1 && (
            <>
              <button 
                type="button" 
                className="airbnb-mobile-arrow arrow-left"
                onClick={handleMobilePrev}
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                type="button" 
                className="airbnb-mobile-arrow arrow-right"
                onClick={handleMobileNext}
                aria-label="Ảnh tiếp"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Badge đếm số ảnh trên Mobile */}
          <div className="airbnb-mobile-counter">
            {mobileSlide + 1} / {total}
          </div>

          <button
            type="button"
            className="airbnb-mobile-all-badge"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(0);
            }}
          >
            <Images size={14} />
            <span>Xem tất cả {total} ảnh</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FULLSCREEN LIGHTBOX MODAL
          ───────────────────────────────────────────────────────────── */}
      <LightboxViewer
        images={displayImages}
        initialIndex={activePhotoIdx}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        title={title}
      />
    </div>
  );
};

export default ImageGalleryGrid;
