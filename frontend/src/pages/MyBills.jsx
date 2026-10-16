import React, { useState, useEffect } from 'react';
import { billingApi } from '../api/apiClient';
import toast from 'react-hot-toast';
import {
  Receipt, Home, Zap, Droplet, PlusCircle, CalendarClock,
  CheckCircle, AlertCircle, QrCode, Copy, Check, RefreshCw, X, Sparkles
} from 'lucide-react';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal QR SePay
  const [qrModalData, setQrModalData] = useState(null);
  const [loadingQrId, setLoadingQrId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getMyBills();
      setBills(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  // Mở Modal Quét mã VietQR SePay
  const handleOpenPayModal = async (bill) => {
    try {
      setLoadingQrId(bill.id);
      const res = await billingApi.getBillPaymentQr(bill.id);
      const data = res.data?.data || res.data;
      setQrModalData({
        ...data,
        originalBill: bill,
      });
    } catch (err) {
      toast.error(err.message || 'Không thể lấy thông tin VietQR thanh toán');
    } finally {
      setLoadingQrId(null);
    }
  };

  // Auto-polling kiểm tra trạng thái thanh toán khi Modal QR đang mở
  useEffect(() => {
    let timer = null;
    if (qrModalData && qrModalData.status !== 'PAID') {
      timer = setInterval(async () => {
        try {
          const res = await billingApi.getMyBills();
          const latestBills = res.data || [];
          setBills(latestBills);

          const current = latestBills.find((b) => b.id === qrModalData.billId);
          if (current && current.status === 'PAID') {
            setQrModalData((prev) => (prev ? { ...prev, status: 'PAID' } : null));
            toast.success('🎉 Thanh toán thành công! Hóa đơn đã được gạch nợ tự động.');
          }
        } catch {
          // Im lặng khi poll nền
        }
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrModalData]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
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
            Theo dõi chi tiết tiền phòng, điện nước & thanh toán tự động qua mã VietQR SePay
          </p>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} color="#f59e0b" /> Chưa thanh toán
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
            {money(totalUnpaid)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            {bills.filter((b) => b.status === 'UNPAID').length} hóa đơn cần đóng
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} color="#10b981" /> Đã thanh toán
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
            {money(totalPaid)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            {bills.filter((b) => b.status === 'PAID').length} hóa đơn đã hoàn tất
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt size={16} color="var(--primary)" /> Tổng hóa đơn nhận được
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {bills.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
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
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', color: 'var(--text-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          Đang tải hóa đơn của bạn...
        </div>
      ) : filteredBills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', color: 'var(--text-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-soft)' }}>
          <Receipt size={40} style={{ opacity: 0.3, marginBottom: '0.8rem', color: 'var(--text-secondary)' }} />
          <h4 style={{ margin: '0 0 0.3rem', color: 'var(--text-primary)' }}>Chưa có hóa đơn nào</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
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
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderRadius: '16px',
                  border: isPaid ? '1px solid var(--border-color)' : '1.5px solid rgba(245, 158, 11, 0.4)',
                  padding: '1.4rem',
                  boxShadow: 'var(--shadow-card)',
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
                        background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isPaid ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHƯA THANH TOÁN'}
                    </span>
                  </div>

                  {/* Fee items breakdown */}
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.9rem', borderRadius: '10px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
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
                    onClick={() => handleOpenPayModal(bill)}
                    disabled={loadingQrId === bill.id}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                  >
                    <QrCode size={18} /> {loadingQrId === bill.id ? 'Đang tạo mã QR...' : 'Thanh toán VietQR SePay'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL QUÉT MÃ VIETQR SEPAY THANH TOÁN TỰ ĐỘNG */}
      {qrModalData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid var(--border)'
          }}>
            {/* Close button */}
            <button
              onClick={() => setQrModalData(null)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                background: qrModalData.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                color: qrModalData.status === 'PAID' ? '#10b981' : '#2563eb',
                marginBottom: '8px'
              }}>
                <Sparkles size={14} /> {qrModalData.status === 'PAID' ? 'GIAO DỊCH THÀNH CÔNG' : 'CỔNG THANH TOÁN VIETQR SEPAY'}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.35rem', fontWeight: 800 }}>
                {qrModalData.status === 'PAID' ? 'Hóa đơn đã thanh toán!' : `Thanh toán Hóa đơn tháng ${qrModalData.monthYear}`}
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {qrModalData.status === 'PAID'
                  ? 'Hệ thống đã nhận được tiền và tự động gạch nợ hóa đơn.'
                  : 'Mở app ngân hàng bất kỳ để quét mã và chuyển khoản chính xác.'}
              </p>
            </div>

            {qrModalData.status === 'PAID' ? (
              /* Success State */
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle size={44} />
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                  Thanh Toán Hoàn Tất!
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 380, margin: '0 auto 24px' }}>
                  Hóa đơn kỳ tháng <strong>{qrModalData.monthYear}</strong> với số tiền <strong>{money(qrModalData.amount)}</strong> đã được ghi nhận. Chủ trọ cũng đã nhận được thông báo.
                </p>
                <button
                  onClick={() => setQrModalData(null)}
                  className="btn btn-primary"
                  style={{ padding: '10px 32px', fontWeight: 700 }}
                >
                  Đóng & Hoàn tất
                </button>
              </div>
            ) : (
              /* Payment QR State */
              <div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'var(--bg-primary)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  marginBottom: '20px'
                }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 18px rgba(0,0,0,0.08)' }}>
                    <img
                      src={qrModalData.qrImageUrl}
                      alt="VietQR SePay"
                      style={{ width: '240px', height: '240px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#2563eb', fontWeight: 600 }}>
                    <RefreshCw size={13} className="animate-spin" /> Hệ thống tự động đối soát khi có tiền vào...
                  </div>
                </div>

                {/* Transfer Info Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Số tiền cần đóng:</span>
                    <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.15rem' }}>
                      {money(qrModalData.amount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nội dung chuyển khoản (Bắt buộc đúng):</div>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: 0.5 }}>{qrModalData.paymentCode}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(qrModalData.paymentCode, 'Nội dung')}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedField === 'Nội dung' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      {copiedField === 'Nội dung' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Số tài khoản nhận:</div>
                      <span style={{ fontWeight: 800 }}>{qrModalData.bankAccount}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(qrModalData.bankAccount, 'Số tài khoản')}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedField === 'Số tài khoản' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ngân hàng & Chủ TK:</span>
                    <span style={{ fontWeight: 600, textAlign: 'right' }}>
                      {qrModalData.bankName} <br />
                      <strong style={{ color: 'var(--text-primary)' }}>{qrModalData.accountHolder}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  💡 Gợi ý: Sau khi quét mã QR trên ứng dụng ngân hàng, số tiền và nội dung sẽ tự động điền sẵn.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBills;
