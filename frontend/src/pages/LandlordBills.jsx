import React, { useState, useEffect, useMemo } from 'react';
import { billingApi, contractApi } from '../api/apiClient';
import toast from 'react-hot-toast';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

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

const LandlordBills = ({ embedded = false }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [search, setSearch] = useState('');

  // Form state for creating bill
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsRes, contractsRes] = await Promise.all([
        billingApi.getLandlordBills(),
        contractApi.getLandlordContracts().catch(() => ({ data: [] }))
      ]);
      setBills(billsRes.data || []);
      setContracts((contractsRes.data || []).filter(c => c.status === 'ACTIVE'));
    } catch (err) {
      console.error('Lỗi tải dữ liệu hóa đơn:', err);
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick stats
  const stats = useMemo(() => {
    const totalCount = bills.length;
    const paidBills = bills.filter(b => b.status === 'PAID');
    const unpaidBills = bills.filter(b => b.status !== 'PAID');

    const totalPaidAmount = paidBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
    const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
    const totalAmount = totalPaidAmount + totalUnpaidAmount;

    return {
      totalCount,
      paidCount: paidBills.length,
      unpaidCount: unpaidBills.length,
      totalPaidAmount,
      totalUnpaidAmount,
      totalAmount,
      collectionRate: totalAmount > 0 ? Math.round((totalPaidAmount / totalAmount) * 100) : 0
    };
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      if (filterStatus === 'PAID' && b.status !== 'PAID') return false;
      if (filterStatus === 'UNPAID' && b.status === 'PAID') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRoom = String(b.roomId).includes(q) || `mp-${b.roomId}`.includes(q);
        const matchId = String(b.id).includes(q) || `hdn-${b.id}`.includes(q);
        const matchMonth = (b.monthYear || '').toLowerCase().includes(q);
        const matchContract = String(b.contractId).includes(q);
        return matchRoom || matchId || matchMonth || matchContract;
      }
      return true;
    });
  }, [bills, filterStatus, search]);

  // Handle Mark Paid / Unpaid
  const handleUpdateStatus = async (billId, newStatus) => {
    const actionText = newStatus === 'PAID' ? 'xác nhận đã thanh toán' : 'chuyển sang chưa thanh toán';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho hóa đơn #${billId}?`)) return;

    try {
      await billingApi.updateBillStatus(billId, newStatus);
      toast.success(newStatus === 'PAID' ? 'Đã xác nhận thanh toán thành công!' : 'Đã chuyển thành chưa thanh toán!');
      // Update local state immediately
      setBills(prev => prev.map(b => b.id === billId ? { ...b, status: newStatus } : b));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật hóa đơn');
    }
  };

  // Form Handlers
  const handleSelectContract = (e) => {
    const contractId = e.target.value;
    const c = contracts.find(x => String(x.id) === String(contractId));
    setForm({
      ...form,
      contractId,
      roomId: c ? String(c.roomId) : '',
      tenantId: c ? String(c.tenantId) : '',
      roomAmount: c ? String(c.rentalPrice) : form.roomAmount,
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.contractId || !form.monthYear || !form.roomAmount || !form.dueDate) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    setSubmitting(true);
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
      toast.success('Tạo hóa đơn thành công! Đã gửi thông báo cho người thuê.');
      setForm(emptyForm);
      setViewMode('list');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi tạo hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedContract = useMemo(
    () => contracts.find((c) => String(c.id) === String(form.contractId)),
    [contracts, form.contractId]
  );

  const createTotal =
    (Number(form.roomAmount) || 0) +
    (Number(form.electricityAmount) || 0) +
    (Number(form.waterAmount) || 0) +
    (Number(form.otherAmount) || 0);

  return (
    <div style={{ padding: embedded ? '0' : '24px 0', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* TOP HEADER */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>
            Quản Lý Hóa Đơn & Thu Phí
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Theo dõi trạng thái thanh toán hàng tháng, xác nhận thu tiền và xuất hóa đơn cho người thuê.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'create' : 'list')}
            className="btn btn-primary"
            style={{ padding: '9px 18px', fontWeight: 700, fontSize: '13.5px' }}
          >
            {viewMode === 'list' ? '+ Tạo hóa đơn mới' : 'Quay lại danh sách'}
          </button>
          <button
            onClick={loadData}
            className="btn btn-outline"
            style={{ padding: '9px 16px', fontWeight: 600, fontSize: '13.5px' }}
            title="Làm mới dữ liệu"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* VIEW: CREATE BILL */}
      {viewMode === 'create' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          maxWidth: '780px',
          margin: '0 auto 30px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ink)' }}>
            Lập hóa đơn tiền trọ tháng mới
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '0 0 20px 0' }}>
            Chọn hợp đồng đang thuê để tự động điền mã phòng và khách thuê tương ứng.
          </p>

          <form onSubmit={handleCreateSubmit}>
            {/* Chọn hợp đồng */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                Chọn phòng / Hợp đồng đang thuê *
              </label>
              <select
                value={form.contractId}
                onChange={handleSelectContract}
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                }}
              >
                <option value="">-- Chọn hợp đồng cần lập hóa đơn --</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    HĐ #{c.id} - Mã phòng: MP-{c.roomId} (Phòng {c.roomNumber || c.roomId} - {c.propertyTitle}) - Khách thuê: ID #{c.tenantId}
                  </option>
                ))}
              </select>
              {contracts.length === 0 && (
                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                  Hiện chưa có hợp đồng nào đang ở trạng thái ACTIVE để lập hóa đơn.
                </div>
              )}
            </div>

            {/* Thông tin tự động từ hợp đồng */}
            {selectedContract && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '12px 16px', marginBottom: 16, fontSize: 13, lineHeight: 1.6
              }}>
                <div><strong>Khu trọ:</strong> {selectedContract.propertyTitle}</div>
                <div><strong>Mã phòng:</strong> MP-{selectedContract.roomId} (Phòng: {selectedContract.roomNumber})</div>
                <div><strong>Khách thuê:</strong> {selectedContract.tenantName || `Khách thuê ID #${selectedContract.tenantId}`}</div>
                <div><strong>Giá thuê cơ bản theo HĐ:</strong> {money(selectedContract.rentalPrice)}</div>
              </div>
            )}

            {/* Kỳ thu & Hạn nộp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Kỳ thanh toán (Tháng/Năm) *
                </label>
                <input
                  type="text"
                  placeholder="VD: 10/2026 hoặc 2026-10"
                  value={form.monthYear}
                  onChange={e => setForm({ ...form, monthYear: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Hạn thanh toán *
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Các khoản tiền */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Tiền phòng (VNĐ) *
                </label>
                <input
                  type="number"
                  placeholder="VD: 3500000"
                  value={form.roomAmount}
                  onChange={e => setForm({ ...form, roomAmount: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Tiền điện (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="VD: 250000"
                  value={form.electricityAmount}
                  onChange={e => setForm({ ...form, electricityAmount: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Tiền nước (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="VD: 100000"
                  value={form.waterAmount}
                  onChange={e => setForm({ ...form, waterAmount: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Chi phí khác (Rác, WiFi, Xe...)
                </label>
                <input
                  type="number"
                  placeholder="VD: 50000"
                  value={form.otherAmount}
                  onChange={e => setForm({ ...form, otherAmount: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Tổng cộng */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
              padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                  Tổng tiền hóa đơn:
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#15803d' }}>
                  {money(createTotal)}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: '#166534' }}>
                Trạng thái ban đầu: <strong>CHƯA THANH TOÁN (UNPAID)</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="btn btn-outline"
                style={{ padding: '10px 20px', fontWeight: 600 }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: 700 }}
              >
                {submitting ? 'Đang tạo...' : 'Xác nhận tạo hóa đơn'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: BILLS LIST */}
      {viewMode === 'list' && (
        <>
          {/* KPI CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 22px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Tổng số hóa đơn
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink)' }}>
                {stats.totalCount} hóa đơn
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tổng giá trị: <strong>{money(stats.totalAmount)}</strong>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 22px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Đã thanh toán ({stats.collectionRate}%)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a' }}>
                {stats.paidCount} hóa đơn
              </div>
              <div style={{ fontSize: '12.5px', color: '#166534', marginTop: '4px' }}>
                Đã thu về: <strong>{money(stats.totalPaidAmount)}</strong>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 22px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Chưa thanh toán
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626' }}>
                {stats.unpaidCount} hóa đơn
              </div>
              <div style={{ fontSize: '12.5px', color: '#991b1b', marginTop: '4px' }}>
                Còn phải thu: <strong>{money(stats.totalUnpaidAmount)}</strong>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'ALL', label: `Tất cả (${stats.totalCount})` },
                { id: 'UNPAID', label: `Chưa thanh toán (${stats.unpaidCount})` },
                { id: 'PAID', label: `Đã thanh toán (${stats.paidCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: filterStatus === tab.id ? '#2563eb' : 'var(--border)',
                    background: filterStatus === tab.id ? '#2563eb' : '#ffffff',
                    color: filterStatus === tab.id ? '#ffffff' : 'var(--ink)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div style={{ width: '280px' }}>
              <input
                type="text"
                placeholder="Tìm mã HĐ, mã phòng (MP-11)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* BILLS TABLE */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              Đang tải danh sách hóa đơn...
            </div>
          ) : filteredBills.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800 }}>
                {search ? 'Không tìm thấy hóa đơn phù hợp với từ khóa' : 'Chưa có hóa đơn nào trong danh mục này'}
              </h4>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                Bạn có thể tạo hóa đơn mới cho người thuê phòng hàng tháng.
              </p>
              <button
                onClick={() => setViewMode('create')}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontWeight: 700 }}
              >
                + Lập hóa đơn ngay
              </button>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflowX: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Mã HĐN</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Phòng</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Khách thuê</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Kỳ thu</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Chi tiết phí</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Tổng tiền</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Hạn nộp</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Trạng thái</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => {
                    const isPaid = b.status === 'PAID';
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--ink)' }}>
                          #HDN-{b.id}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700 }}>Mã phòng: MP-{b.roomId}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>HĐ: #HD-{b.contractId}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 600 }}>ID #{b.tenantId}</span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#2563eb' }}>
                          Tháng {b.monthYear}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '12px', lineHeight: 1.5 }}>
                          <div>Phòng: {money(b.roomAmount)}</div>
                          {(Number(b.electricityAmount) > 0 || Number(b.waterAmount) > 0) && (
                            <div style={{ color: 'var(--text-muted)' }}>
                              Điện: {money(b.electricityAmount)} · Nước: {money(b.waterAmount)}
                            </div>
                          )}
                          {Number(b.otherAmount) > 0 && (
                            <div style={{ color: 'var(--text-muted)' }}>Khác: {money(b.otherAmount)}</div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 900, color: isPaid ? '#16a34a' : '#dc2626', fontSize: '14.5px' }}>
                          {money(b.totalAmount)}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          {b.dueDate ? new Date(b.dueDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {isPaid ? (
                            <span style={{
                              background: '#dcfce7', color: '#15803d',
                              padding: '4px 10px', borderRadius: '12px',
                              fontSize: '11.5px', fontWeight: 800, display: 'inline-block'
                            }}>
                              ĐÃ THANH TOÁN
                            </span>
                          ) : (
                            <span style={{
                              background: '#fee2e2', color: '#b91c1c',
                              padding: '4px 10px', borderRadius: '12px',
                              fontSize: '11.5px', fontWeight: 800, display: 'inline-block'
                            }}>
                              CHƯA THANH TOÁN
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          {isPaid ? (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'UNPAID')}
                              className="btn btn-outline"
                              style={{ padding: '5px 10px', fontSize: '12px', color: '#64748b' }}
                              title="Chuyển về trạng thái chưa thanh toán"
                            >
                              Đổi: Chưa thu
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'PAID')}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, background: '#16a34a', borderColor: '#16a34a' }}
                              title="Xác nhận khách đã thanh toán (Tiền mặt / Chuyển khoản)"
                            >
                              Xác nhận đã thu
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default LandlordBills;
