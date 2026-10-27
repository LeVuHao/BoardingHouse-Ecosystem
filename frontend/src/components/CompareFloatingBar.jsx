import React from 'react';
import { X, BarChart2, Trash2 } from 'lucide-react';
import { useCompare } from '../context/CompareContext';

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200';

const CompareFloatingBar = () => {
  const { compareList, removeFromCompare, clearCompare, openCompareModal, MAX_COMPARE } = useCompare();

  const isVisible = compareList.length >= 1;

  return (
    <>
      {/* Overlay backdrop blur khi bar visible */}
      <style>{`
        .compare-floating-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          transform: translateY(100%);
          transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        .compare-floating-bar.is-visible {
          transform: translateY(0);
          pointer-events: auto;
        }
        .compare-bar-inner {
          margin: 0 auto;
          max-width: 1100px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          border-top: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px 20px 0 0;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.35);
        }
        .compare-bar-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .compare-bar-label svg {
          color: #7c3aed;
        }
        .compare-bar-slots {
          display: flex;
          gap: 12px;
          flex: 1;
          align-items: center;
        }
        .compare-slot {
          position: relative;
          background: rgba(255,255,255,0.08);
          border: 1.5px dashed rgba(255,255,255,0.2);
          border-radius: 12px;
          width: 120px;
          min-width: 100px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .compare-slot.is-filled {
          border: 1.5px solid rgba(124, 58, 237, 0.5);
          background: rgba(124, 58, 237, 0.1);
        }
        .compare-slot-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }
        .compare-slot-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.75));
          border-radius: 0 0 10px 10px;
          padding: 4px 6px;
        }
        .compare-slot-price {
          font-size: 11px;
          font-weight: 700;
          color: #a78bfa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .compare-slot-title {
          font-size: 10px;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .compare-slot-remove {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 22px;
          height: 22px;
          background: #ef4444;
          border: 2px solid #1a1a2e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s;
          color: white;
          z-index: 1;
        }
        .compare-slot-remove:hover {
          transform: scale(1.2);
          background: #dc2626;
        }
        .compare-slot-empty-text {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          text-align: center;
        }
        .compare-slot-number {
          position: absolute;
          top: 6px;
          left: 8px;
          font-size: 10px;
          font-weight: 800;
          color: rgba(255,255,255,0.4);
        }
        .compare-bar-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
          align-items: center;
        }
        .compare-bar-count {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        .compare-bar-btn-start {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
        }
        .compare-bar-btn-start:hover {
          background: linear-gradient(135deg, #6d28d9, #5b21b6);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
        }
        .compare-bar-btn-start:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .compare-bar-btn-clear {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .compare-bar-btn-clear:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.3);
        }
        @media (max-width: 640px) {
          .compare-bar-inner {
            padding: 10px 14px;
            gap: 10px;
            border-radius: 16px 16px 0 0;
          }
          .compare-slot {
            width: 80px;
            min-width: 70px;
            height: 56px;
          }
          .compare-bar-label span {
            display: none;
          }
          .compare-bar-btn-start span {
            display: none;
          }
        }
      `}</style>

      <div className={`compare-floating-bar${isVisible ? ' is-visible' : ''}`}>
        <div className="compare-bar-inner">
          {/* Label */}
          <div className="compare-bar-label">
            <BarChart2 size={20} />
            <span>So sánh phòng</span>
          </div>

          {/* Slots */}
          <div className="compare-bar-slots">
            {Array.from({ length: MAX_COMPARE }).map((_, idx) => {
              const post = compareList[idx];
              if (post) {
                const imgSrc = (post.images || post.imageUrls || [])[0] || FALLBACK_IMG;
                return (
                  <div key={post.id} className="compare-slot is-filled">
                    <img src={imgSrc} alt={post.title} className="compare-slot-img" />
                    <div className="compare-slot-info">
                      <div className="compare-slot-price">{formatVnd(post.price)}/th</div>
                      <div className="compare-slot-title">{post.title || `Phòng ${post.id}`}</div>
                    </div>
                    <button
                      className="compare-slot-remove"
                      onClick={() => removeFromCompare(post.id)}
                      title="Xóa khỏi so sánh"
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              }
              return (
                <div key={`empty-${idx}`} className="compare-slot">
                  <div className="compare-slot-number">{idx + 1}</div>
                  <div className="compare-slot-empty-text">Chưa chọn</div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="compare-bar-actions">
            <span className="compare-bar-count">{compareList.length}/{MAX_COMPARE}</span>
            <button
              className="compare-bar-btn-clear"
              onClick={clearCompare}
              title="Xóa tất cả"
            >
              <Trash2 size={14} />
              <span>Xóa tất cả</span>
            </button>
            <button
              className="compare-bar-btn-start"
              onClick={openCompareModal}
              disabled={compareList.length < 2}
            >
              <BarChart2 size={15} />
              <span>Bắt đầu so sánh</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompareFloatingBar;
