import React, { useState, useEffect } from 'react';
import { billingApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Receipt, Home, Zap, Droplet, PlusCircle, CalendarClock,
  CheckCircle, AlertCircle, QrCode, Copy, Check, RefreshCw, X, Sparkles, Printer
} from 'lucide-react';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

const MyBills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal QR SePay
  const [qrModalData, setQrModalData] = useState(null);
  const [loadingQrId, setLoadingQrId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // In hóa đơn / biên lai A4 chuyên nghiệp
  const handlePrintInvoice = (bill) => {
    const isPaid = bill.status === 'PAID';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn popup. Vui lòng cho phép popup để in biên lai!');
      return;
    }

    const tenantName = user?.fullName || 'Khách thuê trọ (ID #' + (bill.tenantId || '') + ')';
    const tenantPhone = user?.phoneNumber || 'Đã liên kết tài khoản';
    const printDate = new Date().toLocaleDateString('vi-VN');
    const createdDate = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('vi-VN') : printDate;
    const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('vi-VN') : 'Theo thỏa thuận';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Biên Lai Thu Tiền Trọ - #BILL-${bill.id}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 20px;
            font-size: 13.5pt;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .brand {
            font-size: 20pt;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 10pt;
            color: #64748b;
            font-family: sans-serif;
          }
          .receipt-title {
            text-align: center;
            margin: 25px 0 15px;
          }
          .receipt-title h1 {
            font-size: 22pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            color: #0f172a;
          }
          .receipt-title p {
            font-size: 11pt;
            color: #475569;
            font-style: italic;
            margin: 4px 0 0;
          }
          .meta-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            padding: 14px 18px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-bottom: 25px;
            font-size: 11pt;
          }
          .meta-info div { margin-bottom: 3px; }
          table.billing-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          table.billing-table th, table.billing-table td {
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            text-align: left;
          }
          table.billing-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            font-size: 11.5pt;
          }
          table.billing-table .text-right {
            text-align: right;
          }
          table.billing-table .total-row td {
            font-size: 13pt;
            font-weight: bold;
            background-color: #eff6ff;
            color: #1e3a8a;
          }
          .status-stamp {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 10.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stamp-paid {
            background: #dcfce7;
            color: #15803d;
            border: 1.5px solid #22c55e;
          }
          .stamp-unpaid {
            background: #fef3c7;
            color: #b45309;
            border: 1.5px solid #f59e0b;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            text-align: center;
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .sig-box {
            font-size: 12pt;
          }
          .sig-box em {
            font-size: 10pt;
            color: #64748b;
          }
          .sig-space {
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .watermark-badge {
            display: inline-block;
            padding: 4px 12px;
            border: 1.5px dashed #22c55e;
            color: #16a34a;
            font-weight: bold;
            font-size: 10pt;
            border-radius: 4px;
            transform: rotate(-5deg);
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ROOMILY ECOSYSTEM</div>
            <div class="brand-sub">Hệ thống Quản lý & Thuê trọ Thông minh</div>
          </div>
          <div style="text-align: right; font-size: 10pt; color: #475569;">
            <div>Hotline hỗ trợ: 1900 8890</div>
            <div>Hệ sinh thái Quản lý Nhà trọ Roomily</div>
          </div>
        </div>

        <div class="receipt-title">
          <h1>PHIẾU BÁO CƯỚC & BIÊN LAI TIỀN TRỌ</h1>
          <p>Mã hóa đơn: #BILL-${bill.id} • Kỳ thu cước: Tháng ${bill.monthYear}</p>
        </div>

        <div class="meta-info">
          <div>
            <div><strong>Khách thuê:</strong> ${tenantName}</div>
            <div><strong>Điện thoại:</strong> ${tenantPhone}</div>
            <div><strong>Phòng số:</strong> Phòng #${bill.roomId || 'N/A'} (Hợp đồng: #${bill.contractId || 'N/A'})</div>
          </div>
          <div>
            <div><strong>Ngày phát hành:</strong> ${createdDate}</div>
            <div><strong>Hạn thanh toán:</strong> ${dueDate}</div>
            <div>
              <strong>Trạng thái: </strong>
              <span class="status-stamp ${isPaid ? 'stamp-paid' : 'stamp-unpaid'}">
                ${isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHƯA THANH TOÁN'}
              </span>
            </div>
          </div>
        </div>

        <table class="billing-table">
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">STT</th>
              <th>Danh mục chi phí</th>
              <th style="width: 28%;">Kỳ hạn / Ghi chú</th>
              <th class="text-right" style="width: 25%;">Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td><strong>Tiền thuê phòng trọ</strong></td>
              <td>Kỳ tháng ${bill.monthYear}</td>
              <td class="text-right"><strong>${money(bill.roomAmount)}</strong></td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td><strong>Tiền điện sinh hoạt</strong></td>
              <td>Theo công tơ đo đếm</td>
              <td class="text-right"><strong>${money(bill.electricityAmount)}</strong></td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td><strong>Tiền nước sinh hoạt</strong></td>
              <td>Theo chỉ số thực tế / định mức</td>
              <td class="text-right"><strong>${money(bill.waterAmount)}</strong></td>
            </tr>
            ${Number(bill.otherAmount) > 0 ? `
            <tr>
              <td style="text-align: center;">4</td>
              <td><strong>Phí dịch vụ khác</strong></td>
              <td>Rác thải, vệ sinh, wifi</td>
              <td class="text-right"><strong>${money(bill.otherAmount)}</strong></td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 15px;">TỔNG CỘNG THANH TOÁN:</td>
              <td class="text-right">${money(bill.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 10.5pt; color: #334155; margin-bottom: 25px;">
          <em>* Ghi chú: Biên lai có giá trị xác nhận nghĩa vụ tài chính giữa Khách thuê và Bên cho thuê trên nền tảng Roomily.</em>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <strong>NGƯỜI THUÊ PHÒNG</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
            <div class="sig-space">
              ${isPaid ? '<span class="watermark-badge">✓ XÁC NHẬN NỘP TIỀN</span>' : ''}
            </div>
            <strong>${tenantName}</strong>
          </div>
          <div class="sig-box">
            <strong>ĐẠI DIỆN CHỦ TRỌ / QUẢN LÝ</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
            <div class="sig-space">
              <span class="watermark-badge" style="border-color: #2563eb; color: #2563eb;">✓ ROOMILY SYSTEM VERIFIED</span>
            </div>
            <strong>Hệ thống Roomily Ecosystem</strong>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
          <button onclick="window.print()" style="padding: 12px 28px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer;">
            🖨️ Nhấn vào đây để In biên lai hoặc Lưu file PDF (A4)
          </button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

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

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handlePrintInvoice(bill)}
                    className="btn btn-outline"
                    style={{
                      flex: isPaid ? 1 : '0 0 auto',
                      padding: '0.65rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem'
                    }}
                    title="In biên lai A4 hoặc xuất file PDF"
                  >
                    <Printer size={16} /> In biên lai
                  </button>

                  {!isPaid && (
                    <button
                      onClick={() => handleOpenPayModal(bill)}
                      disabled={loadingQrId === bill.id}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontWeight: 700,
                        fontSize: '0.88rem'
                      }}
                    >
                      <QrCode size={16} /> {loadingQrId === bill.id ? 'Tạo QR...' : 'Thanh toán QR'}
                    </button>
                  )}
                </div>
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
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (qrModalData.originalBill) {
                        handlePrintInvoice({ ...qrModalData.originalBill, status: 'PAID' });
                      } else {
                        handlePrintInvoice({
                          id: qrModalData.billId,
                          monthYear: qrModalData.monthYear,
                          totalAmount: qrModalData.amount,
                          roomAmount: qrModalData.amount,
                          electricityAmount: 0,
                          waterAmount: 0,
                          status: 'PAID'
                        });
                      }
                    }}
                    className="btn btn-outline"
                    style={{ padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={16} /> In biên lai
                  </button>
                  <button
                    onClick={() => setQrModalData(null)}
                    className="btn btn-primary"
                    style={{ padding: '10px 28px', fontWeight: 700 }}
                  >
                    Đóng & Hoàn tất
                  </button>
                </div>
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
