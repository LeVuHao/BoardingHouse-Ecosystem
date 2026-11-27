import React, { useState, useEffect, useMemo } from 'react';
import { billingApi, contractApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { formatMoney, numberToWordsVN } from '../utils/billingUtils';
import LandlordCreateBill from './LandlordCreateBill';
import toast from 'react-hot-toast';
import {
  Receipt, Home, User, CalendarDays, CalendarClock,
  CheckCircle, AlertCircle, QrCode, Printer, Search,
  Plus, RefreshCw, X, ArrowUpDown, Filter, Eye, Copy, Check
} from 'lucide-react';

const LandlordBills = ({ embedded = false }) => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [search, setSearch] = useState('');

  // Modal QR & Detail preview
  const [previewModalBill, setPreviewModalBill] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsRes, contractsRes] = await Promise.all([
        billingApi.getLandlordBills(),
        contractApi.getLandlordContracts().catch(() => ({ data: [] }))
      ]);
      setBills(billsRes.data || []);
      setContracts(contractsRes.data || []);
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

  // Handle Mark Paid / Unpaid manually
  const handleUpdateStatus = async (billId, newStatus) => {
    const actionText = newStatus === 'PAID' ? 'xác nhận ĐÃ THU TIỀN' : 'chuyển sang CHƯA THU TIỀN';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho hóa đơn #${billId}?`)) return;

    try {
      await billingApi.updateBillStatus(billId, newStatus);
      toast.success(newStatus === 'PAID' ? '✓ Đã xác nhận thu tiền thành công!' : 'Đã chuyển thành chưa thanh toán!');
      // Update local state immediately
      setBills(prev => prev.map(b => b.id === billId ? { ...b, status: newStatus } : b));
      if (previewModalBill && previewModalBill.id === billId) {
        setPreviewModalBill(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái hóa đơn');
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Professional Vietnamese A4 printable receipt
  const handlePrintInvoice = (bill) => {
    const isPaid = bill.status === 'PAID';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn popup. Vui lòng cho phép popup để in biên lai!');
      return;
    }

    const contract = contracts.find(c => String(c.id) === String(bill.contractId));
    const tenantName = contract?.tenantName || `Khách thuê ID #${bill.tenantId}`;
    const tenantPhone = contract?.tenantPhone || 'Theo hợp đồng';
    const landlordName = user?.fullName || 'Chủ nhà trọ Roomily';
    const roomTitle = contract?.roomNumber ? `Phòng ${contract.roomNumber}` : `Phòng #${bill.roomId}`;
    const propertyTitle = contract?.propertyTitle || 'Hệ thống Quản lý Nhà trọ Roomily';

    const printDate = new Date().toLocaleDateString('vi-VN');
    const issueDateStr = bill.issueDate ? new Date(bill.issueDate).toLocaleDateString('vi-VN') : (bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('vi-VN') : printDate);
    const dueDateStr = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('vi-VN') : 'Theo thỏa thuận';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Bien_Lai_Thu_Tien_Tro_HDN_${bill.id}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 20px;
            font-size: 13pt;
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
          .brand { font-size: 19pt; font-weight: bold; color: #2563eb; }
          .brand-sub { font-size: 9.5pt; color: #64748b; font-family: sans-serif; }
          .receipt-title { text-align: center; margin: 25px 0 15px; }
          .receipt-title h1 { font-size: 21pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a; }
          .receipt-title p { font-size: 11pt; color: #475569; font-style: italic; margin: 4px 0 0; }
          .meta-info {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 12px;
            background: #f8fafc;
            padding: 14px 18px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-bottom: 25px;
            font-size: 11pt;
          }
          table.billing-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          table.billing-table th, table.billing-table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
          table.billing-table th { background-color: #f1f5f9; font-weight: bold; font-size: 11pt; }
          table.billing-table .text-right { text-align: right; }
          table.billing-table .total-row td { font-size: 12.5pt; font-weight: bold; background-color: #eff6ff; color: #1e3a8a; }
          .status-stamp {
            display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 10pt; text-transform: uppercase;
          }
          .stamp-paid { background: #dcfce7; color: #15803d; border: 1.5px solid #22c55e; }
          .stamp-unpaid { background: #fef3c7; color: #b45309; border: 1.5px solid #f59e0b; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 40px; page-break-inside: avoid; }
          .sig-box { font-size: 11.5pt; }
          .sig-box em { font-size: 9.5pt; color: #64748b; }
          .sig-space { height: 75px; display: flex; align-items: center; justify-content: center; }
          .watermark-badge {
            display: inline-block; padding: 4px 12px; border: 1.5px dashed #22c55e; color: #16a34a; font-weight: bold; font-size: 10pt; border-radius: 4px; transform: rotate(-5deg);
          }
          @media print { .no-print { display: none !important; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ROOMILY ECOSYSTEM</div>
            <div class="brand-sub">Hệ sinh thái Nhà trọ & Căn hộ cho thuê</div>
          </div>
          <div style="text-align: right; font-size: 10pt; color: #475569;">
            <div>Khu trọ: ${propertyTitle}</div>
            <div>Chủ trọ: ${landlordName}</div>
          </div>
        </div>

        <div class="receipt-title">
          <h1>HÓA ĐƠN THU TIỀN PHÒNG TRỌ</h1>
          <p>Mã hóa đơn: #HDN-${bill.id} • Kỳ cước: Tháng ${bill.monthYear}</p>
        </div>

        <div class="meta-info">
          <div>
            <div><strong>Khách thuê:</strong> ${tenantName}</div>
            <div><strong>Số điện thoại:</strong> ${tenantPhone}</div>
            <div><strong>Phòng:</strong> ${roomTitle} (HĐ: #${bill.contractId})</div>
          </div>
          <div>
            <div><strong>Ngày xuất HĐ:</strong> ${issueDateStr}</div>
            <div><strong>Hạn nộp tiền:</strong> ${dueDateStr}</div>
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
              <th>Khoản mục chi phí</th>
              <th style="width: 25%;">Chi tiết / Ghi chú</th>
              <th class="text-right" style="width: 25%;">Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td><strong>Tiền thuê phòng</strong></td>
              <td>Kỳ tháng ${bill.monthYear}</td>
              <td class="text-right">${formatMoney(bill.roomAmount)}</td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td><strong>Tiền điện sinh hoạt</strong></td>
              <td>Chỉ số công tơ thực tế</td>
              <td class="text-right">${Number(bill.electricityAmount) > 0 ? formatMoney(bill.electricityAmount) : '0 đ'}</td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td><strong>Tiền nước sinh hoạt</strong></td>
              <td>Khối nước / Định mức</td>
              <td class="text-right">${Number(bill.waterAmount) > 0 ? formatMoney(bill.waterAmount) : '0 đ'}</td>
            </tr>
            <tr>
              <td style="text-align: center;">4</td>
              <td><strong>Tiền rác & vệ sinh</strong></td>
              <td>${Number(bill.garbageAmount) > 0 ? 'Phí thu gom' : 'Miễn phí'}</td>
              <td class="text-right">${Number(bill.garbageAmount) > 0 ? formatMoney(bill.garbageAmount) : '0 đ (Miễn phí)'}</td>
            </tr>
            <tr>
              <td style="text-align: center;">5</td>
              <td><strong>Mạng Wifi Internet</strong></td>
              <td>${Number(bill.wifiAmount) > 0 ? 'Phí đường truyền' : 'Bao trọn gói'}</td>
              <td class="text-right">${Number(bill.wifiAmount) > 0 ? formatMoney(bill.wifiAmount) : '0 đ (Miễn phí)'}</td>
            </tr>
            ${Number(bill.otherAmount) > 0 ? `
            <tr>
              <td style="text-align: center;">6</td>
              <td><strong>Phụ phí: ${bill.otherDescription || 'Phát sinh'}</strong></td>
              <td>Dịch vụ bổ sung</td>
              <td class="text-right">${formatMoney(bill.otherAmount)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 15px;">TỔNG CỘNG THANH TOÁN:</td>
              <td class="text-right">${formatMoney(bill.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 11pt; color: #1e293b; margin-bottom: 20px;">
          <strong>Số tiền viết bằng chữ:</strong> <em>${numberToWordsVN(bill.totalAmount)}</em>
        </div>

        ${bill.bankAccount ? `
        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 25px; font-size: 10.5pt;">
          <strong>Thông tin chuyển khoản của chủ trọ:</strong> Ngân hàng <strong>${bill.bankName || 'MB'}</strong> · STK: <strong>${bill.bankAccount}</strong> · Chủ TK: <strong>${bill.bankOwner || landlordName}</strong> · Nội dung: <strong>BILL${bill.id}</strong>
        </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            <strong>NGƯỜI THUÊ PHÒNG</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
            <div class="sig-space">
              ${isPaid ? '<span class="watermark-badge">✓ ĐÃ NỘP TIỀN</span>' : ''}
            </div>
            <strong>${tenantName}</strong>
          </div>
          <div class="sig-box">
            <strong>CHỦ NHÀ TRỌ / BÊN THU TIỀN</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
            <div class="sig-space">
              ${isPaid ? '<span class="watermark-badge" style="border-color: #2563eb; color: #2563eb;">✓ ĐÃ XÁC NHẬN THU ĐỦ</span>' : ''}
            </div>
            <strong>${landlordName}</strong>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
          <button onclick="window.print()" style="padding: 12px 28px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer;">
            🖨️ Nhấn vào đây để In hóa đơn hoặc Lưu file PDF (A4)
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

  return (
    <div style={{ padding: embedded ? '0' : '24px 0', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* TOP HEADER */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Quản Lý Hóa Đơn & Thu Phí Tiền Trọ
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Lập hóa đơn tiền trọ linh hoạt từng khoản phí, gửi VietQR cho khách thuê và đối soát xác nhận thu tiền thủ công.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'create' : 'list')}
            className="btn btn-primary"
            style={{
              padding: '9px 18px', fontWeight: 700, fontSize: '13.5px',
              background: viewMode === 'list' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--bg-primary)',
              color: viewMode === 'list' ? '#ffffff' : 'var(--text-primary)',
              borderColor: viewMode === 'list' ? '#2563eb' : 'var(--border)'
            }}
          >
            {viewMode === 'list' ? '+ Lập hóa đơn mới' : '← Quay lại danh sách'}
          </button>
          <button
            onClick={loadData}
            className="btn btn-outline"
            style={{ padding: '9px 16px', fontWeight: 600, fontSize: '13.5px', background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Làm mới
          </button>
        </div>
      </div>

      {/* VIEW: CREATE BILL */}
      {viewMode === 'create' ? (
        <LandlordCreateBill
          embedded={true}
          onCreated={() => {
            setViewMode('list');
            loadData();
          }}
          onCancel={() => setViewMode('list')}
        />
      ) : (
        /* VIEW: BILLS LIST */
        <>
          {/* KPI METRIC TILES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '18px 22px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Tổng số hóa đơn đã xuất
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
                {stats.totalCount} hóa đơn
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Tổng cước: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(stats.totalAmount)}</strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '18px 22px', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Đã thanh toán ({stats.collectionRate}%)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
                {stats.paidCount} hóa đơn
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Đã thu về: <strong style={{ color: '#10b981' }}>{formatMoney(stats.totalPaidAmount)}</strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '18px 22px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Chưa thanh toán
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>
                {stats.unpaidCount} hóa đơn
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Còn phải thu: <strong style={{ color: '#ef4444' }}>{formatMoney(stats.totalUnpaidAmount)}</strong>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH CONTROLS */}
          <div style={{
            background: 'var(--bg-card)',
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
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                    background: filterStatus === tab.id ? '#2563eb' : 'var(--bg-primary)',
                    color: filterStatus === tab.id ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ width: '300px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm mã HĐ, mã phòng (MP-11)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
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
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <Receipt size={44} style={{ opacity: 0.3, marginBottom: 12, color: 'var(--text-muted)' }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {search ? 'Không tìm thấy hóa đơn phù hợp với từ khóa' : 'Chưa có hóa đơn nào trong danh mục này'}
              </h4>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                Bạn có thể tạo hóa đơn mới cho người thuê phòng hàng tháng.
              </p>
              <button
                onClick={() => setViewMode('create')}
                className="btn btn-primary"
                style={{ padding: '9px 22px', fontWeight: 700, background: '#2563eb', color: '#ffffff' }}
              >
                + Lập hóa đơn mới
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflowX: 'auto',
              boxShadow: 'var(--shadow-card)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Mã HĐN</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Phòng & Hợp đồng</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Kỳ thu & Ngày lập</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Chi tiết 6 khoản phí</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Tổng tiền</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Hạn nộp</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>Trạng thái</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Thao tác xác nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => {
                    const isPaid = b.status === 'PAID';
                    const isOverdue = !isPaid && b.dueDate && new Date(b.dueDate) < new Date();

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          #HDN-{b.id}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Mã phòng: MP-{b.roomId}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>HĐ: #{b.contractId} · Khách #{b.tenantId}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#2563eb' }}>Tháng {b.monthYear}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            Lập: {b.issueDate ? new Date(b.issueDate).toLocaleDateString('vi-VN') : (b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '—')}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '12px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          <div>Phòng: <strong>{formatMoney(b.roomAmount)}</strong></div>
                          {(Number(b.electricityAmount) > 0 || Number(b.waterAmount) > 0) && (
                            <div style={{ color: 'var(--text-secondary)' }}>
                              ⚡ Điện: {formatMoney(b.electricityAmount)} · 💧 Nước: {formatMoney(b.waterAmount)}
                            </div>
                          )}
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            🗑️ Rác: {Number(b.garbageAmount) > 0 ? formatMoney(b.garbageAmount) : 'Miễn phí'} · 📶 Wifi: {Number(b.wifiAmount) > 0 ? formatMoney(b.wifiAmount) : 'Miễn phí'}
                          </div>
                          {Number(b.otherAmount) > 0 && (
                            <div style={{ color: '#7e22ce', fontSize: '11.5px' }}>
                              ➕ {b.otherDescription || 'Phụ phí'}: {formatMoney(b.otherAmount)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 900, color: isPaid ? '#10b981' : '#ef4444', fontSize: '15px' }}>
                          {formatMoney(b.totalAmount)}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '12.5px' }}>
                          <div style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOverdue ? 700 : 500 }}>
                            {b.dueDate ? new Date(b.dueDate).toLocaleDateString('vi-VN') : '—'}
                          </div>
                          {isOverdue && (
                            <span style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                              Quá hạn
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {isPaid ? (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                              padding: '5px 12px', borderRadius: '12px',
                              fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              <CheckCircle size={13} /> ĐÃ THU
                            </span>
                          ) : (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                              padding: '5px 12px', borderRadius: '12px',
                              fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              <AlertCircle size={13} /> CHƯA THU
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Manual Confirm / Revert */}
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
                                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700, background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                                title="Xác nhận khách đã nộp đủ tiền"
                              >
                                ✓ Xác nhận đã thu
                              </button>
                            )}

                            {/* View QR modal */}
                            <button
                              onClick={() => setPreviewModalBill(b)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              title="Xem mã QR và thông tin chuyển khoản"
                            >
                              <QrCode size={14} />
                            </button>

                            {/* Print Invoice */}
                            <button
                              onClick={() => handlePrintInvoice(b)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              title="In hóa đơn khổ A4"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
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

      {/* MODAL PREVIEW HOÁ ĐƠN & VIETQR CHO CHỦ TRỌ */}
      {previewModalBill && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            borderRadius: '20px', maxWidth: '520px', width: '100%',
            padding: '26px', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button
              onClick={() => setPreviewModalBill(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'var(--bg-primary)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>
                Chi Tiết Hóa Đơn #HDN-{previewModalBill.id}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Kỳ cước: Tháng {previewModalBill.monthYear} · Phòng #{previewModalBill.roomId}
              </p>
            </div>

            {/* QR Image */}
            {previewModalBill.qrImageUrl && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  background: '#ffffff', padding: '12px', borderRadius: '14px',
                  display: 'inline-block', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}>
                  <img
                    src={previewModalBill.qrImageUrl}
                    alt="VietQR"
                    style={{ width: 220, height: 220, objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 8 }}>
                  Mã VietQR gắn sẵn số tiền {formatMoney(previewModalBill.totalAmount)} & nội dung BILL{previewModalBill.id}
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div style={{ background: 'var(--bg-primary)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: 16, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiền phòng:</span>
                <strong>{formatMoney(previewModalBill.roomAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiền điện:</span>
                <strong>{formatMoney(previewModalBill.electricityAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiền nước:</span>
                <strong>{formatMoney(previewModalBill.waterAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiền rác:</span>
                <strong>{Number(previewModalBill.garbageAmount) > 0 ? formatMoney(previewModalBill.garbageAmount) : 'Miễn phí'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiền Wifi:</span>
                <strong>{Number(previewModalBill.wifiAmount) > 0 ? formatMoney(previewModalBill.wifiAmount) : 'Miễn phí'}</strong>
              </div>
              {Number(previewModalBill.otherAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{previewModalBill.otherDescription || 'Phụ phí'}:</span>
                  <strong>{formatMoney(previewModalBill.otherAmount)}</strong>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700 }}>TỔNG CỘNG:</span>
                <span style={{ fontSize: '17px', fontWeight: 900, color: '#2563eb' }}>{formatMoney(previewModalBill.totalAmount)}</span>
              </div>
            </div>

            {/* Action in Modal */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => handlePrintInvoice(previewModalBill)}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} /> In biên lai A4
              </button>

              {previewModalBill.status === 'PAID' ? (
                <button
                  onClick={() => handleUpdateStatus(previewModalBill.id, 'UNPAID')}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13px', color: '#64748b' }}
                >
                  Đổi: Chưa thu
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(previewModalBill.id, 'PAID')}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700, background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                >
                  ✓ Xác nhận đã thu
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LandlordBills;
