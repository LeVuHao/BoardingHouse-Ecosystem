import React, { useState, useEffect, useMemo } from 'react';
import { billingApi, contractApi } from '../api/apiClient';
import {
  Receipt, FileText, Home, User, CalendarDays, Zap, Droplet,
  PlusCircle, Wallet, CalendarClock, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

const money = (n) =>
  (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

const emptyForm = {
  contractId: '',
  roomId: '',
  tenantId: '',
  monthYear: '',
  roomAmount: '',
  electricityAmount: '',
  waterAmount: '',
  otherAmount: '',
  dueDate: '',
};

const LandlordCreateBill = () => {
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await contractApi.getLandlordContracts();
        setContracts((res.data || []).filter((c) => c.status === 'ACTIVE'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContracts(false);
      }
    };
    fetchContracts();
  }, []);

  const selectedContract = useMemo(
    () => contracts.find((c) => String(c.id) === String(form.contractId)),
    [contracts, form.contractId]
  );

  const total =
    (Number(form.roomAmount) || 0) +
    (Number(form.electricityAmount) || 0) +
    (Number(form.waterAmount) || 0) +
    (Number(form.otherAmount) || 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectContract = (e) => {
    const contractId = e.target.value;
    const c = contracts.find((x) => String(x.id) === String(contractId));
    setForm({
      ...form,
      contractId,
      roomId: c ? String(c.roomId) : '',
      tenantId: c ? String(c.userId) : '',
      roomAmount: c ? String(c.rentalPrice) : form.roomAmount,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await billingApi.createBill({
        ...form,
        contractId: Number(form.contractId),
        roomId: Number(form.roomId),
        tenantId: Number(form.tenantId),
        roomAmount: Number(form.roomAmount),
        electricityAmount: form.electricityAmount ? Number(form.electricityAmount) : 0,
        waterAmount: form.waterAmount ? Number(form.waterAmount) : 0,
        otherAmount: form.otherAmount ? Number(form.otherAmount) : 0,
      });
      setMessage({ type: 'success', text: 'Tạo hóa đơn thành công! Người thuê sẽ nhận được thông báo.' });
      setForm(emptyForm);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Lỗi tạo hóa đơn',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 10px 20px -8px rgba(79, 70, 229, 0.5)',
          }}
        >
          <Receipt size={26} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Tạo hóa đơn hàng tháng</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Chọn hợp đồng đang hiệu lực rồi nhập tiền phòng / điện / nước cho người thuê
          </p>
        </div>
      </div>

      {message && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.9rem 1.1rem',
            borderRadius: 'var(--radius)',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.92rem',
            background: message.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          {message.text}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'flex-start',
        }}
        className="create-bill-grid"
      >
        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-card)',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Contract picker */}
          <div className="form-group">
            <label>
              <FileText size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Chọn hợp đồng
            </label>
            {loadingContracts ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                <Loader2 size={16} className="spin" /> Đang tải danh sách hợp đồng...
              </div>
            ) : contracts.length === 0 ? (
              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                }}
              >
                Bạn chưa có hợp đồng nào đang hiệu lực. Hãy duyệt yêu cầu thuê phòng trước khi tạo hóa đơn.
              </div>
            ) : (
              <select name="contractId" value={form.contractId} onChange={handleSelectContract} required>
                <option value="">-- Chọn hợp đồng đang hiệu lực --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    HĐ #{c.id} · Phòng #{c.roomId} · Người thuê #{c.userId} · {money(c.rentalPrice)}/tháng
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Auto-filled read-only info once a contract is picked */}
          {selectedContract && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                padding: '0.9rem 1rem',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark)' }}>
                <Home size={15} /> Phòng #{selectedContract.roomId}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark)' }}>
                <User size={15} /> Người thuê #{selectedContract.userId}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              <CalendarDays size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Tháng thanh toán
            </label>
            <input
              name="monthYear"
              type="month"
              value={form.monthYear}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>
                <Home size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Tiền phòng
              </label>
              <input
                name="roomAmount"
                type="number"
                min="0"
                placeholder="0"
                value={form.roomAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Zap size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: '#f59e0b' }} />
                Tiền điện
              </label>
              <input
                name="electricityAmount"
                type="number"
                min="0"
                placeholder="0"
                value={form.electricityAmount}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>
                <Droplet size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: '#06b6d4' }} />
                Tiền nước
              </label>
              <input
                name="waterAmount"
                type="number"
                min="0"
                placeholder="0"
                value={form.waterAmount}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>
                <PlusCircle size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Phí dịch vụ khác
              </label>
              <input
                name="otherAmount"
                type="number"
                min="0"
                placeholder="0"
                value={form.otherAmount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <CalendarClock size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Hạn thanh toán
            </label>
            <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || contracts.length === 0}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Đang tạo...
              </>
            ) : (
              <>
                <Receipt size={18} /> Tạo hóa đơn
              </>
            )}
          </button>
        </form>

        {/* Summary card */}
        <div
          style={{
            background: 'linear-gradient(160deg, var(--primary) 0%, #7c3aed 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            color: 'white',
            position: 'sticky',
            top: '90px',
            boxShadow: '0 20px 40px -12px rgba(79, 70, 229, 0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Wallet size={16} /> TỔNG QUAN HÓA ĐƠN
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Tiền phòng</span>
              <span>{money(form.roomAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Tiền điện</span>
              <span>{money(form.electricityAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Tiền nước</span>
              <span>{money(form.waterAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Phí khác</span>
              <span>{money(form.otherAmount)}</span>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '1.1rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tổng cộng</span>
            <span style={{ fontWeight: 800, fontSize: '1.6rem' }}>{money(total)}</span>
          </div>

          {form.dueDate && (
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalendarClock size={14} /> Hạn thanh toán: {new Date(form.dueDate).toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 800px) {
          .create-bill-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LandlordCreateBill;
