import React, { useState, useMemo } from 'react';
import { Calculator, Users, Bike, Zap, Droplets, Wifi, ChevronDown, ChevronUp } from 'lucide-react';

const formatVnd = (value) => `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`;

// Giá điện nhà nước bậc thang (đ/kWh) - mặc định nếu không có thông tin riêng
const DEFAULT_ELEC_PRICE = 3500; // trung bình bậc 3
const DEFAULT_WATER_PRICE = 15000; // đ/m³
const DEFAULT_PARKING_FEE = 80000; // đ/xe/tháng
const DEFAULT_WIFI_PRICE = 100000; // đ/tháng nếu không tách riêng

// Mức tiêu thụ điện ước tính theo thói quen
const ELEC_HABITS = [
  { id: 'saving', label: 'Tiết kiệm', desc: 'Ít dùng điều hòa, thiết bị cơ bản', kwh: 50, icon: '🌿' },
  { id: 'normal', label: 'Bình thường', desc: 'Dùng điều hòa vừa phải (~4h/ngày)', kwh: 100, icon: '🌤️' },
  { id: 'heavy', label: 'Dùng máy lạnh nhiều', desc: 'Bật điều hòa cả ngày (~8-12h/ngày)', kwh: 180, icon: '❄️' },
];

// Tiêu thụ nước ước tính (m³/người/tháng)
const WATER_PER_PERSON = 4;

const MonthlyCostCalculator = ({ room }) => {
  const [occupants, setOccupants] = useState(1);
  const [motorbikes, setMotorbikes] = useState(1);
  const [habitId, setHabitId] = useState('normal');
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedHabit = ELEC_HABITS.find((h) => h.id === habitId) || ELEC_HABITS[1];

  // Lấy giá từ thông tin phòng hoặc dùng mặc định
  const elecPrice = Number(room?.electricityPrice || room?.electricPrice || DEFAULT_ELEC_PRICE);
  const waterPrice = Number(room?.waterPrice || DEFAULT_WATER_PRICE);
  const parkingFee = Number(room?.parkingFee || room?.parkingPrice || DEFAULT_PARKING_FEE);
  const wifiPrice = Number(room?.servicePrice || room?.serviceFee || room?.wifiPrice || DEFAULT_WIFI_PRICE);
  const baseRent = Number(room?.price || 0);

  const breakdown = useMemo(() => {
    const electricityCost = selectedHabit.kwh * elecPrice;
    const waterCost = occupants * WATER_PER_PERSON * waterPrice;
    const parkingCost = motorbikes * parkingFee;
    const wifiCost = wifiPrice;
    const total = baseRent + electricityCost + waterCost + parkingCost + wifiCost;

    return {
      baseRent,
      electricityCost,
      waterCost,
      parkingCost,
      wifiCost,
      total,
    };
  }, [baseRent, selectedHabit, elecPrice, occupants, waterPrice, motorbikes, parkingFee, wifiPrice]);

  const rows = [
    {
      icon: <span style={{ fontSize: 16 }}>🏠</span>,
      label: 'Tiền phòng',
      desc: 'Giá thuê cơ bản/tháng',
      value: breakdown.baseRent,
      color: '#a78bfa',
    },
    {
      icon: <Zap size={15} color="#fbbf24" />,
      label: 'Tiền điện',
      desc: `${selectedHabit.kwh} kWh × ${formatVnd(elecPrice)}/kWh`,
      value: breakdown.electricityCost,
      color: '#fbbf24',
    },
    {
      icon: <Droplets size={15} color="#60a5fa" />,
      label: 'Tiền nước',
      desc: `${occupants} người × ${WATER_PER_PERSON}m³ × ${formatVnd(waterPrice)}/m³`,
      value: breakdown.waterCost,
      color: '#60a5fa',
    },
    {
      icon: <Bike size={15} color="#34d399" />,
      label: 'Gửi xe máy',
      desc: `${motorbikes} xe × ${formatVnd(parkingFee)}/xe/tháng`,
      value: breakdown.parkingCost,
      color: '#34d399',
    },
    {
      icon: <Wifi size={15} color="#f472b6" />,
      label: 'Wifi / Dịch vụ',
      desc: room?.servicePrice ? 'Phí dịch vụ phòng' : 'Ước tính gói internet cơ bản',
      value: breakdown.wifiCost,
      color: '#f472b6',
    },
  ];

  return (
    <>
      <style>{`
        .mcc-card {
          background: var(--bg-card, #1e1e2e);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 18px;
          overflow: hidden;
          margin-top: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          transition: box-shadow 0.2s;
        }
        .mcc-card:hover {
          box-shadow: 0 8px 30px rgba(124,58,237,0.12);
        }
        .mcc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08));
          cursor: pointer;
          user-select: none;
          border-bottom: 1px solid rgba(124,58,237,0.12);
        }
        .mcc-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mcc-header-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(124,58,237,0.35);
        }
        .mcc-header-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary, #e2e8f0);
          line-height: 1.2;
        }
        .mcc-header-sub {
          font-size: 11px;
          color: var(--text-secondary, #94a3b8);
          margin-top: 1px;
          font-weight: 500;
        }
        .mcc-toggle-icon {
          color: var(--text-secondary, #94a3b8);
          transition: transform 0.2s;
        }
        .mcc-body {
          padding: 16px 18px;
        }
        /* Total Display */
        .mcc-total-display {
          text-align: center;
          padding: 16px 0 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 16px;
        }
        .mcc-total-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary, #94a3b8);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .mcc-total-amount {
          font-size: 32px;
          font-weight: 900;
          background: linear-gradient(135deg, #a78bfa, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          animation: mccPulse 0.3s ease;
        }
        @keyframes mccPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .mcc-total-unit {
          font-size: 13px;
          color: var(--text-secondary, #94a3b8);
          margin-top: 2px;
        }
        /* Controls */
        .mcc-controls {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 16px;
        }
        .mcc-control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mcc-control-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-primary, #e2e8f0);
        }
        .mcc-control-label svg {
          flex-shrink: 0;
        }
        /* Stepper & Slider row */
        .mcc-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mcc-slider {
          flex: 1;
          accent-color: #7c3aed;
          cursor: pointer;
          height: 6px;
          border-radius: 4px;
        }
        .mcc-stepper {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--bg-secondary, rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          overflow: hidden;
          width: fit-content;
        }
        .mcc-stepper-btn {
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #e2e8f0);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          line-height: 1;
        }
        .mcc-stepper-btn:hover:not(:disabled) {
          background: rgba(124,58,237,0.15);
          color: #a78bfa;
        }
        .mcc-stepper-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .mcc-stepper-val {
          min-width: 32px;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary, #e2e8f0);
          padding: 0 4px;
          border-left: 1px solid rgba(255,255,255,0.08);
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        /* Habit selector */
        .mcc-habit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
        }
        .mcc-habit-btn {
          padding: 8px 6px;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: var(--bg-secondary, rgba(255,255,255,0.04));
          cursor: pointer;
          text-align: center;
          transition: all 0.18s;
        }
        .mcc-habit-btn.is-active {
          border-color: #7c3aed;
          background: rgba(124,58,237,0.12);
        }
        .mcc-habit-icon {
          font-size: 18px;
          display: block;
          margin-bottom: 3px;
        }
        .mcc-habit-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-primary, #e2e8f0);
          display: block;
          line-height: 1.2;
        }
        .mcc-habit-desc {
          font-size: 9.5px;
          color: var(--text-secondary, #94a3b8);
          margin-top: 2px;
          display: block;
          line-height: 1.3;
        }
        .mcc-habit-kwh {
          font-size: 10px;
          font-weight: 700;
          color: #fbbf24;
          margin-top: 2px;
          display: block;
        }
        /* Breakdown rows */
        .mcc-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
        }
        .mcc-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .mcc-row:last-child {
          border-bottom: none;
        }
        .mcc-row:hover {
          background: rgba(255,255,255,0.03);
        }
        .mcc-row-left {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          flex: 1;
        }
        .mcc-row-icon {
          margin-top: 1px;
          flex-shrink: 0;
        }
        .mcc-row-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-primary, #e2e8f0);
          line-height: 1.2;
        }
        .mcc-row-desc {
          font-size: 10.5px;
          color: var(--text-secondary, #94a3b8);
          margin-top: 1px;
        }
        .mcc-row-amount {
          font-size: 13.5px;
          font-weight: 700;
          flex-shrink: 0;
          text-align: right;
        }
        .mcc-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent);
          margin: 14px 0;
        }
        .mcc-note {
          font-size: 10.5px;
          color: var(--text-secondary, #94a3b8);
          text-align: center;
          line-height: 1.5;
          margin-top: 12px;
          padding: 8px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>

      <div className="mcc-card">
        {/* Header (collapsible) */}
        <div className="mcc-header" onClick={() => setIsExpanded((v) => !v)}>
          <div className="mcc-header-left">
            <div className="mcc-header-icon">
              <Calculator size={17} />
            </div>
            <div>
              <div className="mcc-header-title">Ước tính chi phí hàng tháng</div>
              <div className="mcc-header-sub">Kéo thanh trượt để tính chính xác hơn</div>
            </div>
          </div>
          <div className="mcc-toggle-icon" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            <ChevronUp size={18} />
          </div>
        </div>

        {isExpanded && (
          <div className="mcc-body">
            {/* Total Display */}
            <div className="mcc-total-display">
              <div className="mcc-total-label">Tổng chi phí dự kiến</div>
              <div className="mcc-total-amount" key={breakdown.total}>
                {formatVnd(breakdown.total)}
              </div>
              <div className="mcc-total-unit">mỗi tháng</div>
            </div>

            {/* Controls */}
            <div className="mcc-controls">
              {/* Số người ở */}
              <div className="mcc-control-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="mcc-control-label">
                    <Users size={14} color="#a78bfa" />
                    Số người ở (tự nhân tiền nước)
                  </div>
                  <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700 }}>
                    {occupants} người × {WATER_PER_PERSON}m³
                  </span>
                </div>
                <div className="mcc-input-row">
                  <input
                    type="range"
                    className="mcc-slider"
                    min="1"
                    max="6"
                    step="1"
                    value={occupants}
                    onChange={(e) => setOccupants(Number(e.target.value))}
                  />
                  <div className="mcc-stepper">
                    <button
                      className="mcc-stepper-btn"
                      onClick={() => setOccupants((v) => Math.max(1, v - 1))}
                      disabled={occupants <= 1}
                    >
                      −
                    </button>
                    <div className="mcc-stepper-val">{occupants}</div>
                    <button
                      className="mcc-stepper-btn"
                      onClick={() => setOccupants((v) => Math.min(6, v + 1))}
                      disabled={occupants >= 6}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Số xe máy */}
              <div className="mcc-control-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="mcc-control-label">
                    <Bike size={14} color="#34d399" />
                    Số lượng xe máy (tự nhân phí xe)
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                    {motorbikes} xe
                  </span>
                </div>
                <div className="mcc-input-row">
                  <input
                    type="range"
                    className="mcc-slider"
                    min="0"
                    max="4"
                    step="1"
                    value={motorbikes}
                    onChange={(e) => setMotorbikes(Number(e.target.value))}
                    style={{ accentColor: '#34d399' }}
                  />
                  <div className="mcc-stepper">
                    <button
                      className="mcc-stepper-btn"
                      onClick={() => setMotorbikes((v) => Math.max(0, v - 1))}
                      disabled={motorbikes <= 0}
                    >
                      −
                    </button>
                    <div className="mcc-stepper-val">{motorbikes}</div>
                    <button
                      className="mcc-stepper-btn"
                      onClick={() => setMotorbikes((v) => Math.min(4, v + 1))}
                      disabled={motorbikes >= 4}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Thói quen dùng điện */}
              <div className="mcc-control-group">
                <div className="mcc-control-label">
                  <Zap size={14} color="#fbbf24" />
                  Thói quen dùng điện
                </div>
                <div className="mcc-habit-grid">
                  {ELEC_HABITS.map((habit) => (
                    <button
                      key={habit.id}
                      className={`mcc-habit-btn${habitId === habit.id ? ' is-active' : ''}`}
                      onClick={() => setHabitId(habit.id)}
                    >
                      <span className="mcc-habit-icon">{habit.icon}</span>
                      <span className="mcc-habit-label">{habit.label}</span>
                      <span className="mcc-habit-desc">{habit.desc}</span>
                      <span className="mcc-habit-kwh">~{habit.kwh} kWh/tháng</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mcc-divider" />

            {/* Breakdown */}
            <div className="mcc-breakdown">
              {rows.map((row) => (
                <div key={row.label} className="mcc-row">
                  <div className="mcc-row-left">
                    <div className="mcc-row-icon">{row.icon}</div>
                    <div>
                      <div className="mcc-row-label">{row.label}</div>
                      <div className="mcc-row-desc">{row.desc}</div>
                    </div>
                  </div>
                  <div className="mcc-row-amount" style={{ color: row.color }}>
                    {formatVnd(row.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mcc-note">
              ℹ️ Con số trên là <strong>ước tính</strong>, giá điện nước thực tế tuỳ chủ trọ.
              {elecPrice === DEFAULT_ELEC_PRICE && ' (Dùng giá điện trung bình vì chủ trọ chưa cập nhật)'}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MonthlyCostCalculator;
