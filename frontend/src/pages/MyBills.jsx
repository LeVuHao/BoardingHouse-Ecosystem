import React, { useState, useEffect } from 'react';
import { billingApi } from '../api/apiClient';
import { Receipt, Home, Zap, Droplet, PlusCircle, CalendarClock, CheckCircle, AlertCircle, QrCode, Filter, ChevronRight } from 'lucide-react';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getMyBills();
      setBills(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handlePayBill = async (bill) => {
    try {
      const res = await billingApi.createBillPaymentUrl(bill.id, bill.totalAmount);
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      alert(err.message || 'Lỗi tạo liên kết thanh toán');
    }
  };

  const filteredBills = bills.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const totalUnpaid = bills
    .filter((b) => b.status === 'UNPAID')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const totalPaid = bills
    .filter((b) => b.status === 'PAID')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className="container" style={{ maxWidth: '1000px', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <Receipt className="text-primary" size={28} /> Hóa Đơn Tiền Trọ Của Tôi
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0', fontSize: '0.92rem' }}>
            Theo dõi chi tiết các khoản tiền phòng, điện nước & phí sinh hoạt hàng tháng do chủ trọ gửi
          </p>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} color="#f59e0b" /> Chưa thanh toán
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
            {money(totalUnpaid)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {bills.filter((b) => b.status === 'UNPAID').length} hóa đơn cần đóng
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} color="#10b981" /> Đã thanh toán
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
            {money(totalPaid)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {bills.filter((b) => b.status === 'PAID').length} hóa đơn đã hoàn tất
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt size={16} color="var(--primary)" /> Tổng hóa đơn nhận được
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {bills.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Toàn bộ lịch sử các tháng
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
        >
          Tất cả ({bills.length})
        </button>
        <button
          onClick={() => setStatusFilter('UNPAID')}
          className={`btn ${statusFilter === 'UNPAID' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
        >
          Chưa thanh toán ({bills.filter((b) => b.status === 'UNPAID').length})
        </button>
        <button
          onClick={() => setStatusFilter('PAID')}
          className={`btn ${statusFilter === 'PAID' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
        >
          Đã thanh toán ({bills.filter((b) => b.status === 'PAID').length})
        </button>
      </div>

      {/* Bills List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '14px' }}>
          Đang tải hóa đơn của bạn...
        </div>
      ) : filteredBills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <Receipt size={40} style={{ opacity: 0.3, marginBottom: '0.8rem' }} />
          <h4 style={{ margin: '0 0 0.3rem' }}>Chưa có hóa đơn nào</h4>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Hàng tháng khi chủ trọ lập hóa đơn tiền phòng & điện nước, thông tin sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {filteredBills.map((bill) => {
            const isPaid = bill.status === 'PAID';
            return (
              <div
                key={bill.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: isPaid ? '1px solid var(--border)' : '1.5px solid #fde68a',
                  padding: '1.4rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {!isPaid && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hóa đơn kỳ</span>
                      <h4 style={{ margin: '0.1rem 0 0', fontSize: '1.15rem' }}>Tháng {bill.monthYear}</h4>
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.3rem 0.7rem',
                        borderRadius: '20px',
                        background: isPaid ? '#d1fae5' : '#fef3c7',
                        color: isPaid ? '#065f46' : '#92400e',
                      }}
                    >
                      {isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHƯA THANH TOÁN'}
                    </span>
                  </div>

                  {/* Fee items breakdown */}
                  <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Home size={14} /> Tiền phòng:
                      </span>
                      <span style={{ fontWeight: 600 }}>{money(bill.roomAmount)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Zap size={14} color="#f59e0b" /> Tiền điện:
                      </span>
                      <span style={{ fontWeight: 600 }}>{money(bill.electricityAmount)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Droplet size={14} color="#06b6d4" /> Tiền nước:
                      </span>
                      <span style={{ fontWeight: 600 }}>{money(bill.waterAmount)}</span>
                    </div>

                    {Number(bill.otherAmount) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <PlusCircle size={14} /> Phí khác (rác, wifi):
                        </span>
                        <span style={{ fontWeight: 600 }}>{money(bill.otherAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Amount */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0.8rem 0' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tổng thanh toán:</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {money(bill.totalAmount)}
                    </span>
                  </div>

                  {bill.dueDate && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
                      <CalendarClock size={13} /> Hạn thanh toán: {new Date(bill.dueDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                {!isPaid && (
                  <button
                    onClick={() => handlePayBill(bill)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600 }}
                  >
                    <QrCode size={16} /> Thanh toán qua QR / VNPay
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBills;
