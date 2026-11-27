import React, { useState, useEffect, useMemo } from 'react';
import { billingApi, contractApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { VIETNAM_BANKS, formatMoney, numberToWordsVN, generateVietQrUrl } from '../utils/billingUtils';
import toast from 'react-hot-toast';
import {
  Receipt, Home, Zap, Droplet, Trash2, Wifi, PlusCircle,
  Calendar, CalendarClock, CreditCard, Building2, Check,
  Sparkles, CheckCircle2, ArrowLeft, Loader2, Info, Eye
} from 'lucide-react';

const LandlordCreateBill = ({
  embedded = false,
  defaultContractId = null,
  onCreated = null,
  onCancel = null
}) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Defaults for dates
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Local storage bank info
  const savedBankInfo = (() => {
    try {
      const saved = localStorage.getItem('roomily_landlord_bank_info');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  })();

  // Form State
  const [contractId, setContractId] = useState(defaultContractId || '');
  const [monthYear, setMonthYear] = useState(currentMonthStr);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(nextWeekStr);

  // Toggles for fee categories
  const [applyRoom, setApplyRoom] = useState(true);
  const [roomAmount, setRoomAmount] = useState('');

  const [applyElec, setApplyElec] = useState(false);
  const [elecAmount, setElecAmount] = useState('');
  const [elecCalc, setElecCalc] = useState({ oldIndex: '', newIndex: '', unitPrice: 3500 });
  const [showElecCalc, setShowElecCalc] = useState(false);

  const [applyWater, setApplyWater] = useState(false);
  const [waterAmount, setWaterAmount] = useState('');
  const [waterCalc, setWaterCalc] = useState({ oldIndex: '', newIndex: '', unitPrice: 25000 });
  const [showWaterCalc, setShowWaterCalc] = useState(false);

  const [applyGarbage, setApplyGarbage] = useState(false);
  const [garbageAmount, setGarbageAmount] = useState('');

  const [applyWifi, setApplyWifi] = useState(false);
  const [wifiAmount, setWifiAmount] = useState('');

  const [applyOther, setApplyOther] = useState(false);
  const [otherAmount, setOtherAmount] = useState('');
  const [otherDescription, setOtherDescription] = useState('');

  // Bank & VietQR info
  const [bankName, setBankName] = useState(savedBankInfo?.bankName || 'MB');
  const [bankAccount, setBankAccount] = useState(savedBankInfo?.bankAccount || '');
  const [bankOwner, setBankOwner] = useState(savedBankInfo?.bankOwner || (user?.fullName?.toUpperCase() || ''));
  const [note, setNote] = useState('');
  const [saveBankDefault, setSaveBankDefault] = useState(true);

  // Load contracts
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoadingContracts(true);
        const res = await contractApi.getLandlordContracts();
        const active = (res.data || []).filter((c) => c.status === 'ACTIVE');
        setContracts(active);

        // Pre-select contract if default passed
        if (defaultContractId) {
          const found = active.find((c) => String(c.id) === String(defaultContractId));
          if (found) {
            setContractId(found.id);
            setRoomAmount(found.rentalPrice || '');
            setNote(`BILL MP${found.roomId} T${currentMonthStr.replace('-', '')}`);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách hợp đồng:', err);
        toast.error('Không thể tải danh sách hợp đồng đang hiệu lực');
      } finally {
        setLoadingContracts(false);
      }
    };
    fetchContracts();
  }, [defaultContractId]);

  // Selected contract details
  const selectedContract = useMemo(
    () => contracts.find((c) => String(c.id) === String(contractId)),
    [contracts, contractId]
  );

  // Handle contract selection
  const handleSelectContract = (e) => {
    const val = e.target.value;
    setContractId(val);
    const c = contracts.find((x) => String(x.id) === String(val));
    if (c) {
      setRoomAmount(c.rentalPrice || '');
      setApplyRoom(true);
      const roomCode = c.roomNumber || `P${c.roomId}`;
      setNote(`BILL ${roomCode.replace(/\s+/g, '')} T${monthYear.replace('-', '')}`);
    } else {
      setRoomAmount('');
    }
  };

  // Auto calculate Electricity from indices
  useEffect(() => {
    if (showElecCalc) {
      const oldIdx = Number(elecCalc.oldIndex) || 0;
      const newIdx = Number(elecCalc.newIndex) || 0;
      const price = Number(elecCalc.unitPrice) || 0;
      if (newIdx >= oldIdx && price > 0) {
        setElecAmount((newIdx - oldIdx) * price);
      }
    }
  }, [elecCalc, showElecCalc]);

  // Auto calculate Water from indices
  useEffect(() => {
    if (showWaterCalc) {
      const oldIdx = Number(waterCalc.oldIndex) || 0;
      const newIdx = Number(waterCalc.newIndex) || 0;
      const price = Number(waterCalc.unitPrice) || 0;
      if (newIdx >= oldIdx && price > 0) {
        setWaterAmount((newIdx - oldIdx) * price);
      }
    }
  }, [waterCalc, showWaterCalc]);

  // Total sum of all checked fees
  const totalAmount = useMemo(() => {
    let sum = 0;
    if (applyRoom) sum += Number(roomAmount) || 0;
    if (applyElec) sum += Number(elecAmount) || 0;
    if (applyWater) sum += Number(waterAmount) || 0;
    if (applyGarbage) sum += Number(garbageAmount) || 0;
    if (applyWifi) sum += Number(wifiAmount) || 0;
    if (applyOther) sum += Number(otherAmount) || 0;
    return sum;
  }, [applyRoom, roomAmount, applyElec, elecAmount, applyWater, waterAmount, applyGarbage, garbageAmount, applyWifi, wifiAmount, applyOther, otherAmount]);

  // Live VietQR preview URL
  const qrPreviewUrl = useMemo(() => {
    return generateVietQrUrl({
      bankCode: bankName,
      bankAccount: bankAccount,
      amount: totalAmount,
      addInfo: note || `BILL${selectedContract?.roomId || ''}`,
      accountName: bankOwner
    });
  }, [bankName, bankAccount, totalAmount, note, bankOwner, selectedContract]);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractId) {
      toast.error('Vui lòng chọn phòng / hợp đồng cần lập hóa đơn');
      return;
    }
    if (!monthYear) {
      toast.error('Vui lòng chọn kỳ thanh toán (tháng/năm)');
      return;
    }
    if (!dueDate) {
      toast.error('Vui lòng chọn hạn thanh toán');
      return;
    }
    if (totalAmount <= 0) {
      toast.error('Tổng tiền hóa đơn phải lớn hơn 0 đ');
      return;
    }

    setSubmitting(true);
    try {
      // Save default bank info if enabled
      if (saveBankDefault && bankAccount) {
        localStorage.setItem('roomily_landlord_bank_info', JSON.stringify({
          bankName,
          bankAccount,
          bankOwner
        }));
      }

      const payload = {
        contractId: Number(contractId),
        roomId: Number(selectedContract?.roomId || 0),
        tenantId: Number(selectedContract?.tenantId || 0),
        monthYear,
        issueDate: issueDate || todayStr,
        dueDate,
        roomAmount: applyRoom ? (Number(roomAmount) || 0) : 0,
        electricityAmount: applyElec ? (Number(elecAmount) || 0) : 0,
        waterAmount: applyWater ? (Number(waterAmount) || 0) : 0,
        garbageAmount: applyGarbage ? (Number(garbageAmount) || 0) : 0,
        wifiAmount: applyWifi ? (Number(wifiAmount) || 0) : 0,
        otherAmount: applyOther ? (Number(otherAmount) || 0) : 0,
        otherDescription: applyOther ? (otherDescription || 'Phụ phí khác') : null,
        bankName,
        bankAccount,
        bankOwner: (bankOwner || '').toUpperCase(),
        note: note || `BILL MP${selectedContract?.roomId || ''} T${monthYear}`
      };

      await billingApi.createBill(payload);
      toast.success('🎉 Đã lập và gửi hóa đơn thành công! Người thuê đã nhận được thông báo.');

      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tạo hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: embedded ? '0' : '24px 16px' }}>
      
      {/* Header Bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 46, height: 46, borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Receipt size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Lập Hóa Đơn Tiền Trọ & Sinh Mã VietQR
            </h2>
            <p style={{ margin: '3px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Tick chọn các khoản phí linh hoạt (tiền nhà, điện, nước, rác, wifi, phụ phí). Không bắt buộc thu mọi mục.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={15} /> Quay lại danh sách
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'flex-start'
        }} className="bill-create-grid">
          
          {/* LEFT COLUMN: FORM CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* CARD 1: CONTRACT & DATES */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={18} color="#2563eb" /> 1. Chọn Phòng Trọ & Thời Hạn Hóa Đơn
              </h3>

              {/* Contract Picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}>
                  Phòng trọ / Hợp đồng đang thuê <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {loadingContracts ? (
                  <div style={{ padding: '10px', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={15} className="animate-spin" /> Đang tải danh sách phòng...
                  </div>
                ) : (
                  <select
                    value={contractId}
                    onChange={handleSelectContract}
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13.5, outline: 'none'
                    }}
                  >
                    <option value="">-- Chọn phòng trọ cần gửi hóa đơn --</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.propertyTitle ? `${c.propertyTitle} - ` : ''}Phòng: {c.roomNumber || `P${c.roomId}`} (HĐ #{c.id}) · {c.tenantName || `Khách #${c.tenantId}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Contract Info Box */}
              {selectedContract && (
                <div style={{
                  background: 'rgba(37, 99, 235, 0.06)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  fontSize: '12.5px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Khu trọ: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedContract.propertyTitle || 'Nhà trọ Roomily'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phòng: </span>
                    <strong style={{ color: '#2563eb' }}>{selectedContract.roomNumber || `Phòng ${selectedContract.roomId}`}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Khách thuê: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedContract.tenantName || `Khách #${selectedContract.tenantId}`}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>SĐT: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedContract.tenantPhone || 'Đã liên kết'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Giá thuê HĐ: </span>
                    <strong style={{ color: '#16a34a' }}>{formatMoney(selectedContract.rentalPrice)}</strong>
                  </div>
                </div>
              )}

              {/* Dates Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Kỳ thu tiền (Tháng/Năm) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="month"
                    value={monthYear}
                    onChange={(e) => {
                      setMonthYear(e.target.value);
                      if (selectedContract) {
                        const roomCode = selectedContract.roomNumber || `P${selectedContract.roomId}`;
                        setNote(`BILL ${roomCode.replace(/\s+/g, '')} T${e.target.value.replace('-', '')}`);
                      }
                    }}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Ngày lập / xuất hóa đơn
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Hạn nộp tiền cho khách <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: ITEMIZED FEES WITH CHECKBOXES */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#16a34a" /> 2. Danh Mục Các Khoản Phí (Tick Chọn Để Thu)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Không tick = Không thu / Miễn phí
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. TIỀN PHÒNG */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: applyRoom ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-primary)',
                  border: applyRoom ? '1.5px solid #2563eb' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={applyRoom}
                        onChange={(e) => setApplyRoom(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#2563eb' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        🏠 Tiền thuê phòng trọ
                      </span>
                    </label>

                    {applyRoom && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Nhập số tiền..."
                          value={roomAmount}
                          onChange={(e) => setRoomAmount(e.target.value)}
                          style={{
                            width: 170, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>VNĐ</span>
                      </div>
                    )}
                  </div>
                  {!applyRoom && (
                    <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, marginLeft: 28 }}>
                      ✓ Đã tắt: Tháng này không tính tiền phòng (hoặc đã thu riêng).
                    </div>
                  )}
                </div>

                {/* 2. TIỀN ĐIỆN */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: applyElec ? 'rgba(234, 179, 8, 0.08)' : 'var(--bg-primary)',
                  border: applyElec ? '1.5px solid #eab308' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={applyElec}
                        onChange={(e) => setApplyElec(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#eab308' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706' }}>
                        ⚡ Tiền điện sinh hoạt
                      </span>
                    </label>

                    {applyElec && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowElecCalc(!showElecCalc)}
                          style={{
                            fontSize: 11.5, padding: '4px 8px', borderRadius: 6,
                            background: showElecCalc ? '#d97706' : 'var(--bg-card)',
                            color: showElecCalc ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid var(--border)', cursor: 'pointer'
                          }}
                        >
                          {showElecCalc ? 'Ẩn tính chỉ số' : '🧮 Tính theo kWh'}
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Số tiền điện..."
                          value={elecAmount}
                          onChange={(e) => setElecAmount(e.target.value)}
                          style={{
                            width: 170, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>VNĐ</span>
                      </div>
                    )}
                  </div>

                  {applyElec && showElecCalc && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', background: 'var(--bg-card)',
                      borderRadius: 8, border: '1px dashed var(--border)', display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10, fontSize: 12
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Chỉ số cũ:</span>
                        <input
                          type="number"
                          placeholder="VD: 1250"
                          value={elecCalc.oldIndex}
                          onChange={(e) => setElecCalc({ ...elecCalc, oldIndex: e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: 3 }}
                        />
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Chỉ số mới:</span>
                        <input
                          type="number"
                          placeholder="VD: 1320"
                          value={elecCalc.newIndex}
                          onChange={(e) => setElecCalc({ ...elecCalc, newIndex: e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: 3 }}
                        />
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Đơn giá (đ/kWh):</span>
                        <input
                          type="number"
                          value={elecCalc.unitPrice}
                          onChange={(e) => setElecCalc({ ...elecCalc, unitPrice: e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: 3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. TIỀN NƯỚC */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: applyWater ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-primary)',
                  border: applyWater ? '1.5px solid #06b6d4' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={applyWater}
                        onChange={(e) => setApplyWater(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#06b6d4' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0891b2' }}>
                        💧 Tiền nước sinh hoạt
                      </span>
                    </label>

                    {applyWater && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowWaterCalc(!showWaterCalc)}
                          style={{
                            fontSize: 11.5, padding: '4px 8px', borderRadius: 6,
                            background: showWaterCalc ? '#0891b2' : 'var(--bg-card)',
                            color: showWaterCalc ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid var(--border)', cursor: 'pointer'
                          }}
                        >
                          {showWaterCalc ? 'Ẩn tính khối' : '🧮 Tính theo m³'}
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Số tiền nước..."
                          value={waterAmount}
                          onChange={(e) => setWaterAmount(e.target.value)}
                          style={{
                            width: 170, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>VNĐ</span>
                      </div>
                    )}
                  </div>

                  {applyWater && showWaterCalc && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', background: 'var(--bg-card)',
                      borderRadius: 8, border: '1px dashed var(--border)', display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10, fontSize: 12
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Số khối cũ:</span>
                        <input
                          type="number"
                          placeholder="VD: 54"
                          value={waterCalc.oldIndex}
                          onChange={(e) => setWaterCalc({ ...waterCalc, oldIndex: e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: 3 }}
                        />
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Số khối mới:</span>
                        <input
                          type="number"
                          placeholder="VD: 58"
                          value={waterCalc.newIndex}
                          onChange={(e) => setWaterCalc({ ...waterCalc, newIndex: e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: 3 }}
                        />
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Đơn giá (đ/m³):</span>
                        <input
                          type="number"
                          value={waterCalc.unitPrice}
                          onChange={(e) => setWaterCalc({ ...waterCalc, unitPrice: e.target.value })}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: 3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. TIỀN RÁC */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: applyGarbage ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
                  border: applyGarbage ? '1.5px solid #10b981' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={applyGarbage}
                        onChange={(e) => setApplyGarbage(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#10b981' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
                        🗑️ Tiền rác & vệ sinh môi trường
                      </span>
                    </label>

                    {applyGarbage ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[30000, 50000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setGarbageAmount(val)}
                            style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            {val / 1000}k
                          </button>
                        ))}
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Tiền rác..."
                          value={garbageAmount}
                          onChange={(e) => setGarbageAmount(e.target.value)}
                          style={{
                            width: 150, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>VNĐ</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                        Miễn phí rác
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. TIỀN WIFI */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: applyWifi ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-primary)',
                  border: applyWifi ? '1.5px solid #6366f1' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={applyWifi}
                        onChange={(e) => setApplyWifi(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#6366f1' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5' }}>
                        📶 Tiền mạng Wifi Internet
                      </span>
                    </label>

                    {applyWifi ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[50000, 80000, 100000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setWifiAmount(val)}
                            style={{ fontSize: 11, padding: '3px 7px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            {val / 1000}k
                          </button>
                        ))}
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Tiền Wifi..."
                          value={wifiAmount}
                          onChange={(e) => setWifiAmount(e.target.value)}
                          style={{
                            width: 150, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>VNĐ</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                        Bao trọn Wifi miễn phí
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. PHỤ PHÍ KHÁC */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: applyOther ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-primary)',
                  border: applyOther ? '1.5px solid #a855f7' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={applyOther}
                        onChange={(e) => setApplyOther(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#a855f7' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7e22ce' }}>
                        ➕ Phụ phí phát sinh khác (Gửi xe, giặt là...)
                      </span>
                    </label>

                    {applyOther && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Tên phụ phí (VD: Gửi 2 xe máy)..."
                          value={otherDescription}
                          onChange={(e) => setOtherDescription(e.target.value)}
                          style={{
                            width: 180, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontSize: 12.5, outline: 'none'
                          }}
                        />
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Số tiền..."
                          value={otherAmount}
                          onChange={(e) => setOtherAmount(e.target.value)}
                          style={{
                            width: 130, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>VNĐ</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* CARD 3: LANDLORD BANKING INFO FOR VIETQR */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#2563eb" /> 3. Thông Tin Ngân Hàng Thụ Hưởng & Mã QR Của Chủ Trọ
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Thông tin này sẽ đính kèm trực tiếp vào hóa đơn của người thuê để người thuê chuyển khoản hoặc quét mã QR ngân hàng.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: 14 }}>
                {/* Bank Select */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Ngân hàng thụ hưởng
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  >
                    {VIETNAM_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0346123456"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value.replace(/\s+/g, ''))}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                {/* Account Holder */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Tên chủ tài khoản (In hoa không dấu)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: NGUYEN VAN A"
                    value={bankOwner}
                    onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Note / Syntax */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 6, color: 'var(--text-primary)' }}>
                  Nội dung chuyển khoản gợi ý cho người thuê
                </label>
                <input
                  type="text"
                  placeholder="VD: BILL P101 T112026"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                    color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={saveBankDefault}
                  onChange={(e) => setSaveBankDefault(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                />
                Lưu thông tin ngân hàng này làm mặc định cho các lần tạo hóa đơn tiếp theo
              </label>
            </div>

          </div>

          {/* RIGHT COLUMN: PREVIEW & ACTIONS (STICKY) */}
          <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* LIVE TOTAL SUMMARY CARD */}
            <div style={{
              background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 12px 30px -8px rgba(37, 99, 235, 0.45)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, opacity: 0.9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  TỔNG CỘNG HÓA ĐƠN
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                  Tháng {monthYear}
                </span>
              </div>

              <div style={{ fontSize: '28px', fontWeight: 900, marginBottom: 4 }}>
                {formatMoney(totalAmount)}
              </div>
              <div style={{ fontSize: '12.5px', fontStyle: 'italic', opacity: 0.9, marginBottom: 16, minHeight: 18 }}>
                {numberToWordsVN(totalAmount)}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '14px 0' }} />

              {/* Items Breakdown Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: applyRoom ? 1 : 0.6 }}>
                  <span>Tiền phòng:</span>
                  <strong>{applyRoom ? formatMoney(roomAmount) : 'Không thu'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: applyElec ? 1 : 0.6 }}>
                  <span>Tiền điện:</span>
                  <strong>{applyElec ? formatMoney(elecAmount) : 'Không thu'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: applyWater ? 1 : 0.6 }}>
                  <span>Tiền nước:</span>
                  <strong>{applyWater ? formatMoney(waterAmount) : 'Không thu'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: applyGarbage ? 1 : 0.6 }}>
                  <span>Tiền rác:</span>
                  <strong>{applyGarbage ? formatMoney(garbageAmount) : 'Miễn phí'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: applyWifi ? 1 : 0.6 }}>
                  <span>Tiền Wifi:</span>
                  <strong>{applyWifi ? formatMoney(wifiAmount) : 'Miễn phí'}</strong>
                </div>
                {applyOther && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{otherDescription || 'Phụ phí'}:</span>
                    <strong>{formatMoney(otherAmount)}</strong>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '14px 0' }} />

              <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarClock size={14} /> Hạn thanh toán: {dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : '—'}
              </div>
            </div>

            {/* LIVE VIETQR PREVIEW CARD */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                <Eye size={15} color="#2563eb" /> Xem Trước Mã VietQR Của Hóa Đơn
              </div>

              <div style={{
                background: '#ffffff',
                padding: '12px',
                borderRadius: '14px',
                display: 'inline-block',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                marginBottom: 12
              }}>
                <img
                  src={qrPreviewUrl}
                  alt="VietQR Preview"
                  style={{ width: 190, height: 190, objectFit: 'contain', display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div>Ngân hàng: <strong>{bankName}</strong> · STK: <strong>{bankAccount || 'Chưa nhập'}</strong></div>
                <div>Chủ TK: <strong>{bankOwner || 'CHƯA NHẬP'}</strong></div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  Nội dung CK: <code style={{ color: '#2563eb', fontWeight: 700 }}>{note || 'BILL...'}</code>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="submit"
                disabled={submitting || !contractId}
                className="btn btn-primary"
                style={{
                  padding: '13px 20px',
                  fontWeight: 800,
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  borderColor: '#16a34a',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: submitting || !contractId ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Đang tạo & gửi hóa đơn...
                  </>
                ) : (
                  <>
                    <Check size={18} /> Xác Nhận & Gửi Hóa Đơn Cho Người Thuê
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn btn-outline"
                  style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13.5 }}
                >
                  Hủy bỏ
                </button>
              )}
            </div>

          </div>

        </div>
      </form>

      <style>{`
        @media (max-width: 900px) {
          .bill-create-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LandlordCreateBill;