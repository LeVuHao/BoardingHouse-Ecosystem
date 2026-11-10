import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, DollarSign, Home, MapPin, Phone, 
  MessageSquare, Star, CheckCircle2, Shield, Users, 
  ChevronLeft, ChevronRight, ExternalLink, Zap, Clock, 
  AlertCircle, Receipt, Edit3, Trash2, ShieldCheck, ArrowRight, Printer, Wrench,
  QrCode, Copy, Check, RefreshCw, X, Sparkles, CalendarClock, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contractApi, reviewApi, billingApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const fallbackImages = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
];

const MyContracts = ({ embedded = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState({});

  // Review states per contract
  const [reviewsMap, setReviewsMap] = useState({});
  const [ratingMap, setRatingMap] = useState({});
  const [hoverRatingMap, setHoverRatingMap] = useState({});
  const [commentMap, setCommentMap] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [contractModal, setContractModal] = useState(null);

  // Billing VietQR Modal states
  const [qrModalData, setQrModalData] = useState(null);
  const [loadingQrId, setLoadingQrId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Mở Modal Quét mã VietQR SePay cho hóa đơn
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

  // In hóa đơn / biên lai A4 chuyên nghiệp
  const handlePrintInvoice = (bill, contract) => {
    const isPaid = bill.status === 'PAID';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn popup. Vui lòng cho phép popup để in biên lai!');
      return;
    }

    const tenantName = user?.fullName || 'Khách thuê trọ (ID #' + (bill.tenantId || '') + ')';
    const tenantPhone = user?.phoneNumber || 'Đã liên kết tài khoản';
    const landlordName = contract?.landlordName || 'Chủ nhà trọ Roomily';
    const landlordPhone = contract?.landlordPhone || '1900 8890';
    const roomInfo = contract?.roomNumber ? `Phòng ${contract.roomNumber}` : `Phòng #${bill.roomId || 'N/A'}`;
    const propertyTitle = contract?.propertyTitle || 'Hệ sinh thái Quản lý Nhà trọ Roomily';
    const printDate = new Date().toLocaleDateString('vi-VN');
    const createdDate = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('vi-VN') : printDate;
    const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('vi-VN') : 'Theo thỏa thuận';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Bien_Lai_Tien_Tro_BILL_${bill.id}.pdf</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; color: #111; background: #fff; margin: 0; padding: 20px; font-size: 13.5pt; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .brand { font-size: 20pt; font-weight: bold; color: #2563eb; letter-spacing: -0.5px; }
          .brand-sub { font-size: 10pt; color: #64748b; font-family: sans-serif; }
          .receipt-title { text-align: center; margin: 25px 0 15px; }
          .receipt-title h1 { font-size: 22pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a; }
          .receipt-title p { font-size: 11pt; color: #475569; font-style: italic; margin: 4px 0 0; }
          .meta-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-size: 11pt; }
          .meta-info div { margin-bottom: 3px; }
          table.billing-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          table.billing-table th, table.billing-table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
          table.billing-table th { background-color: #f1f5f9; font-weight: bold; font-size: 11.5pt; }
          table.billing-table .text-right { text-align: right; }
          table.billing-table .total-row td { font-size: 13pt; font-weight: bold; background-color: #eff6ff; color: #1e3a8a; }
          .status-stamp { display: inline-block; padding: 5px 14px; border-radius: 6px; font-weight: bold; font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.5px; }
          .stamp-paid { background: #dcfce7; color: #15803d; border: 1.5px solid #22c55e; }
          .stamp-unpaid { background: #fef3c7; color: #b45309; border: 1.5px solid #f59e0b; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 40px; page-break-inside: avoid; }
          .sig-box { font-size: 12pt; }
          .sig-box em { font-size: 10pt; color: #64748b; }
          .sig-space { height: 80px; display: flex; align-items: center; justify-content: center; }
          .watermark-badge { display: inline-block; padding: 4px 12px; border: 1.5px dashed #22c55e; color: #16a34a; font-weight: bold; font-size: 10pt; border-radius: 4px; transform: rotate(-5deg); }
          @media print { .no-print { display: none !important; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ROOMILY ECOSYSTEM</div>
            <div class="brand-sub">${propertyTitle}</div>
          </div>
          <div style="text-align: right; font-size: 10pt; color: #475569;">
            <div>Chủ trọ: ${landlordName} (${landlordPhone})</div>
            <div>Hotline đối soát: 1900 8890</div>
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
            <div><strong>Vị trí:</strong> ${roomInfo} (Hợp đồng: #${bill.contractId || contract?.id || 'N/A'})</div>
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
              <td class="text-right"><strong>${formatVnd(bill.roomAmount)}</strong></td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td><strong>Tiền điện sinh hoạt</strong></td>
              <td>Theo công tơ đo đếm</td>
              <td class="text-right"><strong>${formatVnd(bill.electricityAmount)}</strong></td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td><strong>Tiền nước sinh hoạt</strong></td>
              <td>Theo chỉ số thực tế / định mức</td>
              <td class="text-right"><strong>${formatVnd(bill.waterAmount)}</strong></td>
            </tr>
            ${Number(bill.otherAmount) > 0 ? `
            <tr>
              <td style="text-align: center;">4</td>
              <td><strong>Phí dịch vụ khác</strong></td>
              <td>Rác thải, vệ sinh, wifi</td>
              <td class="text-right"><strong>${formatVnd(bill.otherAmount)}</strong></td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 15px;">TỔNG CỘNG THANH TOÁN:</td>
              <td class="text-right">${formatVnd(bill.totalAmount)}</td>
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
            <strong>${landlordName}</strong>
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

  // In / Xuất hợp đồng thuê phòng ra file PDF chuẩn mẫu văn bản tiếng Việt
  const handlePrintContract = (contract) => {
    if (!contract) return;
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      toast.error('Vui lòng cho phép trình duyệt mở popup để in hợp đồng');
      return;
    }

    const startDateStr = contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
    const endDateStr = contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : '12 tháng kể từ ngày bắt đầu';

    const contractHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Hop_Dong_Thue_Phong_${contract.roomNumber || contract.id}.pdf</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #111; padding: 25px; font-size: 13pt; }
          .national-header { text-align: center; margin-bottom: 25px; }
          .national-header h3 { margin: 0; font-size: 12.5pt; text-transform: uppercase; font-weight: bold; }
          .national-header h4 { margin: 4px 0 0; font-size: 11.5pt; font-weight: normal; }
          .national-header hr { width: 160px; border: 0.5px solid #222; margin: 8px auto; }
          .doc-title { text-align: center; margin: 25px 0 15px; }
          .doc-title h1 { margin: 0; font-size: 17pt; text-transform: uppercase; font-weight: bold; }
          .doc-title p { margin: 4px 0; font-style: italic; font-size: 11pt; color: #555; }
          .section-title { font-weight: bold; margin-top: 16px; margin-bottom: 6px; text-transform: uppercase; font-size: 12.5pt; }
          p { margin: 5px 0; text-align: justify; }
          .signatures { display: flex; justify-content: space-between; margin-top: 45px; page-break-inside: avoid; }
          .sig-box { width: 45%; text-align: center; }
          .sig-space { height: 75px; display: flex; align-items: center; justify-content: center; }
          .badge-verified { display: inline-block; padding: 4px 10px; border: 1.5px solid #16a34a; color: #16a34a; font-size: 10pt; border-radius: 6px; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="national-header">
          <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
          <h4>Độc lập – Tự do – Hạnh phúc</h4>
          <hr />
        </div>

        <div class="doc-title">
          <h1>HỢP ĐỒNG THUÊ PHÒNG TRỌ ĐIỆN TỬ</h1>
          <p>Mã số hợp đồng: #ROOMILY-${contract.id} • Lập ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <p>Hôm nay, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}, hai bên chúng tôi gồm có:</p>

        <div class="section-title">BÊN CHO THUÊ (BÊN A):</div>
        <p>
          - Họ và tên: <strong>${user?.role === 'LANDLORD' ? (user?.fullName || contract.landlordName || 'Chủ nhà trọ') : (contract.landlordName || 'Chủ nhà trọ')}</strong><br/>
          - Số điện thoại liên hệ: ${user?.role === 'LANDLORD' ? (user?.phoneNumber || contract.landlordPhone || 'Chính chủ') : (contract.landlordPhone || 'Chính chủ')}<br/>
          - Đại diện quản lý khu trọ Roomily Ecosystem
        </p>

        <div class="section-title">BÊN THUÊ PHÒNG (BÊN B):</div>
        <p>
          - Họ và tên: <strong>${user?.role === 'LANDLORD' ? (contract.tenantName || 'Khách thuê phòng (ID #' + contract.tenantId + ')') : (user?.fullName || contract.tenantName || 'Khách thuê trọ')}</strong><br/>
          - Số điện thoại / Định danh: ${user?.role === 'LANDLORD' ? (contract.tenantPhone || 'Đã xác thực tài khoản') : (user?.phoneNumber || 'Đã xác thực tài khoản')}<br/>
          - Email: ${user?.role === 'LANDLORD' ? (contract.tenantEmail || 'Đã liên kết tài khoản') : (user?.email || 'N/A')}
        </p>

        <p>Sau khi bàn bạc và thống nhất, hai bên nhất trí ký kết hợp đồng thuê phòng trọ với các điều khoản như sau:</p>

        <div class="section-title">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & HIỆN TRẠNG</div>
        <p>
          1.1. Bên A đồng ý cho Bên B thuê phòng số: <strong>${contract.roomNumber || contract.roomId}</strong><br/>
          1.2. Địa chỉ khu trọ: <strong>${contract.address || 'Hệ thống nhà trọ Roomily'}</strong><br/>
          1.3. Diện tích sử dụng: <strong>${contract.roomArea || 25} m²</strong>. Mục đích: Dùng để ở và sinh hoạt hợp pháp.
        </p>

        <div class="section-title">ĐIỀU 2: GIÁ THUÊ, TIỀN CỌC & THANH TOÁN</div>
        <p>
          2.1. Giá thuê phòng cố định: <strong>${formatVnd(contract.rentalPrice)} / tháng</strong> (Bằng chữ: ${Number(contract.rentalPrice || 0).toLocaleString('vi-VN')} VNĐ).<br/>
          2.2. Tiền đặt cọc bảo đảm: <strong>${formatVnd(contract.depositAmount || contract.rentalPrice)}</strong>.<br/>
          2.3. Thời hạn thuê: Từ ngày <strong>${startDateStr}</strong> đến ngày <strong>${endDateStr}</strong>.<br/>
          2.4. Tiền điện, tiền nước và phí dịch vụ phát sinh được chốt chỉ số và thanh toán hàng tháng qua cổng thanh toán VNPay / Chuyển khoản.
        </p>

        <div class="section-title">ĐIỀU 3: QUYỀN VÀ TRÁCH NHIỆM HAI BÊN</div>
        <p>
          3.1. Bên A có trách nhiệm bảo đảm an ninh trật tự, cung cấp đầy đủ nguồn điện, nước và sửa chữa các hư hỏng kết cấu chung.<br/>
          3.2. Bên B cam kết thanh toán chi phí đúng hạn, giữ gìn tài sản trong phòng, chấp hành nội quy an ninh phòng cháy chữa cháy.<br/>
          3.3. Khi chấm dứt hợp đồng hợp lệ, Bên A hoàn trả đầy đủ tiền đặt cọc cho Bên B.
        </p>

        <div class="signatures">
          <div class="sig-box">
            <strong>ĐẠI DIỆN BÊN B (BÊN THUÊ)</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
            <div class="sig-space">
              <span class="badge-verified">✓ ĐÃ KÝ ĐIỆN TỬ</span>
            </div>
            <strong>${user?.role === 'LANDLORD' ? (contract.tenantName || 'Khách thuê phòng') : (user?.fullName || contract.tenantName || 'Bên thuê')}</strong>
          </div>
          <div class="sig-box">
            <strong>ĐẠI DIỆN BÊN A (BÊN CHO THUÊ)</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
            <div class="sig-space">
              <span class="badge-verified">✓ ĐÃ XÁC THỰC ROOMILY</span>
            </div>
            <strong>${user?.role === 'LANDLORD' ? (user?.fullName || contract.landlordName || 'Chủ nhà trọ') : (contract.landlordName || 'Chủ nhà trọ')}</strong>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px dashed #ccc;">
          <button onclick="window.print()" style="padding: 12px 28px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer;">
            🖨️ Nhấn vào đây để In hoặc Lưu file PDF (A4)
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

    printWindow.document.write(contractHtml);
    printWindow.document.close();
  };

  const fetchContracts = async () => {
    try {
      const [contractsRes, billsRes] = await Promise.allSettled([
        user?.role === 'LANDLORD' ? contractApi.getLandlordContracts() : contractApi.getMyContracts(),
        billingApi.getMyBills()
      ]);
      const list = contractsRes.status === 'fulfilled' ? (contractsRes.value?.data || []) : [];
      const billList = billsRes.status === 'fulfilled' ? (billsRes.value?.data || []) : [];
      setContracts(list);
      setBills(billList);

      // Tải reviews cho các bài đăng gắn với hợp đồng
      list.forEach(async (c) => {
        if (c.postId) {
          try {
            const rRes = await reviewApi.getReviewsByPost(c.postId);
            const rList = rRes.data?.data || rRes.data || [];
            setReviewsMap((prev) => ({ ...prev, [c.id]: rList }));
            const myRev = rList.find((r) => r.reviewerId === user?.id);
            if (myRev) {
              setRatingMap((prev) => ({ ...prev, [c.id]: myRev.rating || 5 }));
              setCommentMap((prev) => ({ ...prev, [c.id]: myRev.comment || '' }));
            }
          } catch (e) {
            console.warn(e);
          }
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin trọ của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  // Gửi hoặc cập nhật đánh giá 5 sao
  const handleSaveReview = async (contract) => {
    if (!user) return;
    const postId = contract.postId;
    if (!postId) {
      toast.error('Chưa liên kết bài đăng diễn đàn cho phòng này');
      return;
    }
    const myRating = ratingMap[contract.id] || 5;
    const myComment = commentMap[contract.id] || '';
    const existing = (reviewsMap[contract.id] || []).find((r) => r.reviewerId === user?.id);

    setSubmittingReview(true);
    try {
      if (existing) {
        await reviewApi.updateReview(existing.id, {
          rating: myRating,
          comment: myComment,
        });
        toast.success('Cập nhật đánh giá thành công! ✨');
      } else {
        await reviewApi.createReview({
          postId: Number(postId),
          reviewerName: user.fullName || 'Người thuê trọ',
          rating: myRating,
          comment: myComment,
        });
        toast.success('Cảm ơn bạn đã gửi đánh giá 5 sao cho phòng trọ! ⭐');
      }
      fetchContracts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      await reviewApi.deleteReview(reviewId);
      toast.success('Đã xóa đánh giá thành công!');
      fetchContracts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa đánh giá');
    }
  };

  // Trả phòng / Thanh lý hợp đồng
  const handleTerminateContract = async (contractId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xác nhận trả phòng và thanh lý hợp đồng #HD-${contractId}? Hệ thống sẽ cập nhật lại số chỗ trống của phòng.`)) {
      return;
    }
    try {
      await contractApi.terminateContract(contractId);
      toast.success('Đã thanh lý hợp đồng và hoàn tất trả phòng thành công! ✨');
      fetchContracts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi thanh lý hợp đồng');
    }
  };

  if (loading) {
    return (
      <div className="page-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3 style={{ fontWeight: 700, color: 'var(--ink)' }}>Đang tải không gian trọ của bạn...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "page-shell"} style={embedded ? { background: 'transparent', paddingBottom: '30px' } : { background: 'var(--bg-primary)', paddingBottom: '60px' }}>
      <div className={embedded ? "" : "wrap"} style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* TOP HERO HEADER */}
        {!embedded && (
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)',
            borderRadius: '24px',
            padding: '36px 32px',
            color: 'white',
            marginTop: '24px',
            marginBottom: '28px',
            boxShadow: '0 12px 36px rgba(37, 99, 235, 0.22)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '14px' }}>
                <Zap size={15} color="#fbbf24" fill="#fbbf24" />
                <span>{user?.role === 'LANDLORD' ? 'CỔNG QUẢN LÝ HỢP ĐỒNG CHO THUÊ' : 'CỔNG THÔNG TIN CƯ DÂN CHÍNH THỨC'}</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                {user?.role === 'LANDLORD' ? 'Quản lý Hợp đồng Cho thuê Phòng' : 'Trọ của tôi & Hợp đồng cư dân'}
              </h1>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.92, maxWidth: '640px', lineHeight: 1.5 }}>
                {user?.role === 'LANDLORD'
                  ? 'Theo dõi toàn bộ hợp đồng thuê phòng của khách thuê, tải/in hợp đồng điện tử pháp lý khổ A4 và quản lý tiền phòng, tiền cọc.'
                  : 'Không gian căn phòng bạn đang thuê, ngày phê duyệt thuê, liên kết bài đăng gốc, thông tin liên lạc chủ trọ và hóa đơn hàng tháng.'}
              </p>
            </div>
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
          </div>
        )}

        {contracts.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderRadius: '20px',
            padding: '70px 24px',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--primary)'
            }}>
              <Home size={40} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--ink)' }}>
              {user?.role === 'LANDLORD'
                ? 'Hiện chưa có hợp đồng cho thuê phòng nào được ký kết'
                : 'Bạn chưa có hợp đồng thuê trọ nào đang kích hoạt'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              {user?.role === 'LANDLORD'
                ? 'Khi bạn phê duyệt yêu cầu thuê phòng từ khách thuê, hợp đồng điện tử sẽ tự động xuất hiện tại đây để bạn theo dõi và in ấn.'
                : 'Khi chủ trọ phê duyệt yêu cầu thuê của bạn, toàn bộ hợp đồng điện tử và không gian phòng trọ sẽ tự động xuất hiện tại đây.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {user?.role === 'LANDLORD' ? (
                <>
                  <Link to="/landlord/requests" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
                    Xem yêu cầu thuê phòng
                  </Link>
                  <Link to="/landlord/properties" className="btn btn-outline" style={{ padding: '10px 24px', fontWeight: '700' }}>
                    Quản lý khu trọ
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/rooms" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
                    Khám phá phòng trọ ngay
                  </Link>
                  <Link to="/forum" className="btn btn-outline" style={{ padding: '10px 24px', fontWeight: '700' }}>
                    Xem diễn đàn trọ
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {contracts.map((c) => {
              const photoList = (c.images && c.images.length > 0) ? c.images : fallbackImages;
              const curIdx = activePhotoIdx[c.id] || 0;
              const existingReview = (reviewsMap[c.id] || []).find((r) => r.reviewerId === user?.id);
              const curRating = ratingMap[c.id] || (existingReview ? existingReview.rating : 5);
              const curHover = hoverRatingMap[c.id] || 0;
              const curComment = commentMap[c.id] !== undefined ? commentMap[c.id] : (existingReview ? existingReview.comment : '');

              return (
                <div key={c.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden'
                }}>
                  
                  {/* CARD TOP BAR: CONTRACT BADGE & ROOM TITLE */}
                  <div style={{
                    padding: '20px 28px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: 'var(--bg-card)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: c.status === 'TERMINATED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: c.status === 'TERMINATED' ? '#ef4444' : '#10b981',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.82rem',
                        fontWeight: '800'
                      }}>
                        <CheckCircle2 size={15} />
                        {c.status === 'TERMINATED' ? 'ĐÃ THANH LÝ / TRẢ PHÒNG' : 'HỢP ĐỒNG ĐÃ KÍCH HOẠT (ACTIVE)'}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.82rem',
                        fontWeight: '800'
                      }}>
                        <CalendarClock size={14} />
                        Duyệt ngày: {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : (c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'Đã duyệt')}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(99, 102, 241, 0.18)',
                        color: '#818cf8',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.82rem',
                        fontWeight: '800'
                      }}>
                        MÃ PHÒNG: MP-{c.roomId}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Mã hợp đồng: <strong style={{ color: 'var(--text-primary)' }}>#HD-{c.id}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {user?.role !== 'LANDLORD' && c.status !== 'TERMINATED' && (
                        <Link
                          to={`/maintenance-tickets?roomId=${c.roomId}`}
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)', fontWeight: 700 }}
                          title="Gửi báo hỏng cho phòng này"
                        >
                          <Wrench size={14} /> Báo hỏng phòng này
                        </Link>
                      )}
                      <button
                        onClick={() => handlePrintContract(c)}
                        className="btn btn-outline"
                        style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--border-color)', background: 'var(--bg-primary)', fontWeight: 700 }}
                        title="In hoặc xuất hợp đồng ra file PDF"
                      >
                        <Printer size={14} /> In / Xuất PDF
                      </button>
                      <button
                        onClick={() => setContractModal(c)}
                        className="btn btn-outline"
                        style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                      >
                        <FileText size={14} /> Xem Hợp đồng điện tử
                      </button>
                      {c.status !== 'TERMINATED' && (
                        <button
                          onClick={() => handleTerminateContract(c.id)}
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)', fontWeight: 700 }}
                          title="Xác nhận trả phòng và thanh lý hợp đồng"
                        >
                          Trả phòng / Thanh lý
                        </button>
                      )}
                      {user?.role === 'LANDLORD' && c.status !== 'TERMINATED' && (
                        <Link
                          to="/landlord/create-bill"
                          className="btn btn-primary"
                          style={{ padding: '6px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', background: 'var(--primary)', color: '#ffffff' }}
                        >
                          <Receipt size={14} /> Tạo hóa đơn
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* 5 QUICK METRIC TILES */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '1px',
                    background: 'var(--border)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ background: 'var(--bg-card)', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tiền phòng mỗi tháng</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#2563eb', fontFamily: 'Manrope, sans-serif' }}>
                        {formatVnd(c.rentalPrice)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tiền cọc an toàn</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#059669', fontFamily: 'Manrope, sans-serif' }}>
                        {formatVnd(c.depositAmount || c.rentalPrice)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ngày chủ trọ duyệt thuê</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#059669' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : (c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'Đã duyệt')}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ngày bắt đầu ở</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--ink)' }}>
                        {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'Đã dọn vào'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Thời hạn hợp đồng</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#7c3aed' }}>
                        {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '12 tháng (Dài hạn)'}
                      </div>
                    </div>
                  </div>

                  {/* MAIN CONTENT: PHOTO GALLERY & ROOM DETAILS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', padding: '28px' }}>
                    
                    {/* LEFT COLUMN: INTERACTIVE PHOTO GALLERY */}
                    <div>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '360px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#0f172a',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                      }}>
                        <img
                          src={photoList[curIdx]}
                          alt="Ảnh phòng trọ đang thuê"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {photoList.length > 1 && (
                          <>
                            <button
                              onClick={() => setActivePhotoIdx({
                                ...activePhotoIdx,
                                [c.id]: curIdx === 0 ? photoList.length - 1 : curIdx - 1
                              })}
                              style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={() => setActivePhotoIdx({
                                ...activePhotoIdx,
                                [c.id]: curIdx === photoList.length - 1 ? 0 : curIdx + 1
                              })}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}

                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '12px',
                          background: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(6px)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: '700'
                        }}>
                          📷 Ảnh {curIdx + 1} / {photoList.length} - Phòng đang ở
                        </div>
                      </div>

                      {/* THUMBNAIL STRIP */}
                      {photoList.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {photoList.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setActivePhotoIdx({ ...activePhotoIdx, [c.id]: i })}
                              style={{
                                width: '70px',
                                height: '52px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: curIdx === i ? '2.5px solid #2563eb' : '1px solid var(--border)',
                                padding: 0,
                                cursor: 'pointer',
                                opacity: curIdx === i ? 1 : 0.65,
                                flexShrink: 0
                              }}
                            >
                              <img src={img} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: ROOM DETAILS & LANDLORD CARD */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800' }}>
                            {c.roomNumber ? `PHÒNG ${c.roomNumber}` : 'PHÒNG TRỌ CAO CẤP'}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            📐 {c.roomArea || 25} m² • Tối đa {c.capacity || 2} người
                          </span>
                        </div>

                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                          {c.propertyTitle || `Phòng trọ tiện nghi #${c.roomNumber || c.roomId}`}
                        </h2>

                        {c.postId && (
                          <div style={{
                            margin: '10px 0 16px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                letterSpacing: '0.3px'
                              }}>
                                ⚡ ĐÃ CÓ NGƯỜI THUÊ
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>
                                Bài đăng gốc của phòng trên Diễn đàn
                              </span>
                            </div>
                            <Link
                              to={`/rooms/${c.postId}`}
                              style={{
                                fontSize: '12.5px',
                                color: '#2563eb',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Xem bài đăng <ExternalLink size={13} />
                            </Link>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '18px', lineHeight: 1.5 }}>
                          <MapPin size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{c.address ? `${c.address}, ${c.ward || ''}, ${c.district || ''}, ${c.city || ''}` : 'Khu vực Dĩ An, gần các trường đại học TP.HCM'}</span>
                        </div>

                        {/* Tiện ích phòng trọ */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                            Tiện ích phòng đã trang bị:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(c.utilities ? c.utilities.split(',') : ['Wifi tốc độ cao', 'Máy giặt', 'Điều hòa', 'Chỗ để xe', 'Gác lửng', 'Giờ giấc tự do', 'Camera an ninh']).map((u, idx) => (
                              <span key={idx} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600' }}>
                                ✓ {u.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bạn cùng phòng */}
                        {c.roommates && c.roommates.length > 0 && (
                          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '4px' }}>
                              <Users size={16} color="#059669" />
                              <span>Bạn cùng phòng đang lưu trú ({c.roommates.length}):</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {c.roommates.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CONTACT BOX: LANDLORD OR TENANT */}
                      <div style={{
                        background: 'var(--bg-primary)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: user?.role === 'LANDLORD'
                              ? 'linear-gradient(135deg, #059669, #10b981)'
                              : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            color: 'white',
                            fontWeight: '900',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {user?.role === 'LANDLORD' ? (c.tenantName || 'K')[0].toUpperCase() : (c.landlordName || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--ink)' }}>
                              {user?.role === 'LANDLORD'
                                ? `Khách thuê: ${c.tenantName || 'Cư dân đang thuê (ID #' + c.tenantId + ')'}`
                                : (c.landlordName || 'Chủ nhà trọ')}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={13} /> {user?.role === 'LANDLORD' ? 'Hợp đồng pháp lý đã ký' : 'Đã xác minh chính chủ'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {(user?.role === 'LANDLORD' ? c.tenantPhone : c.landlordPhone) && (
                            <>
                              <a
                                href={`tel:${user?.role === 'LANDLORD' ? c.tenantPhone : c.landlordPhone}`}
                                className="btn btn-outline"
                                style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Phone size={14} color="#2563eb" /> Gọi điện
                              </a>
                              <a
                                href={`https://zalo.me/${(user?.role === 'LANDLORD' ? c.tenantPhone : c.landlordPhone).replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.3)', background: 'rgba(2, 132, 199, 0.08)', fontWeight: 700 }}
                              >
                                💬 Nhắn Zalo
                              </a>
                            </>
                          )}
                          <Link
                            to="/forum/messages"
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', background: 'var(--primary)', color: '#ffffff' }}
                          >
                            <MessageSquare size={14} /> Nhắn tin
                          </Link>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* INTEGRATED BILLING SECTION FOR THIS ROOM */}
                  <div style={{
                    padding: '24px 28px',
                    background: 'var(--bg-primary)',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Receipt size={18} color="#2563eb" />
                          Hóa đơn tiền phòng & Dịch vụ sinh hoạt
                        </h4>
                        <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                          Toàn bộ hóa đơn tiền phòng, tiền điện, nước và dịch vụ hàng tháng của phòng này.
                        </p>
                      </div>

                      {user?.role === 'LANDLORD' && (
                        <Link
                          to="/landlord/create-bill"
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                        >
                          <PlusCircle size={14} /> + Tạo hóa đơn tháng này
                        </Link>
                      )}
                    </div>

                    {/* Bills list for this contract */}
                    {(() => {
                      const roomBills = bills.filter((b) => b.contractId === c.id || (b.roomId && b.roomId === c.roomId));
                      if (roomBills.length === 0) {
                        return (
                          <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            padding: '28px 20px',
                            textAlign: 'center',
                            border: '1px dashed var(--border)'
                          }}>
                            <Receipt size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                              Chưa có hóa đơn nào cho phòng này
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px auto 0', maxWidth: 440 }}>
                              {user?.role === 'LANDLORD'
                                ? 'Bạn có thể bấm nút "+ Tạo hóa đơn" ở trên để gửi bảng tính tiền phòng và điện nước cho khách thuê.'
                                : 'Chủ trọ sẽ phát hành hóa đơn định kỳ hàng tháng. Khi có hóa đơn mới, bạn sẽ nhận được thông báo để kiểm tra và thanh toán tại đây.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {roomBills.map((bill) => {
                            const isPaid = bill.status === 'PAID';
                            const isPartial = bill.status === 'PARTIALLY_PAID';
                            return (
                              <div
                                key={bill.id}
                                style={{
                                  background: 'var(--bg-card)',
                                  borderRadius: '16px',
                                  border: isPaid ? '1px solid rgba(16, 185, 129, 0.3)' : isPartial ? '1px solid rgba(37, 99, 235, 0.3)' : '1.5px solid rgba(245, 158, 11, 0.35)',
                                  padding: '18px 20px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '14px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      fontWeight: '800',
                                      background: isPaid ? 'rgba(16, 185, 129, 0.15)' : isPartial ? 'rgba(37, 99, 235, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      color: isPaid ? '#10b981' : isPartial ? '#2563eb' : '#d97706',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      {isPaid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                                      {isPaid ? 'ĐÃ THANH TOÁN' : isPartial ? 'THANH TOÁN 1 PHẦN' : 'CHƯA THANH TOÁN'}
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ink)' }}>
                                      Kỳ cước: Tháng {bill.monthYear}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                      Mã hóa đơn: #BILL-{bill.id}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    Hạn thanh toán: <strong>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('vi-VN') : 'Theo thông báo'}</strong>
                                  </div>
                                </div>

                                {/* Fee Breakdown Tiles */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                  gap: '8px',
                                  background: 'var(--bg-primary)',
                                  padding: '12px 14px',
                                  borderRadius: '12px',
                                  border: '1px solid var(--border)'
                                }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tiền phòng</div>
                                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--ink)' }}>{formatVnd(bill.roomAmount)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tiền điện</div>
                                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#eab308' }}>{formatVnd(bill.electricityAmount)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tiền nước</div>
                                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#06b6d4' }}>{formatVnd(bill.waterAmount)}</div>
                                  </div>
                                  {Number(bill.otherAmount) > 0 && (
                                    <div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dịch vụ khác</div>
                                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--ink)' }}>{formatVnd(bill.otherAmount)}</div>
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tổng thanh toán</div>
                                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#2563eb' }}>{formatVnd(bill.totalAmount)}</div>
                                  </div>
                                  {isPartial && (
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#16a34a' }}>Đã đóng</div>
                                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#16a34a' }}>{formatVnd(bill.paidAmount)} (Còn: {formatVnd(bill.remainingAmount)})</div>
                                    </div>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => handlePrintInvoice(bill, c)}
                                    className="btn btn-outline"
                                    style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                                    title="In biên lai thu tiền khổ A4"
                                  >
                                    <Printer size={13} /> In biên lai A4
                                  </button>

                                  {!isPaid && (
                                    <>
                                      {c.landlordPhone && (
                                        <a
                                          href={`https://zalo.me/${c.landlordPhone.replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-outline"
                                          style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.3)', background: 'rgba(2, 132, 199, 0.08)', fontWeight: 700 }}
                                        >
                                          💬 Báo tiền qua Zalo
                                        </a>
                                      )}
                                      <button
                                        onClick={() => handleOpenPayModal(bill)}
                                        disabled={loadingQrId === bill.id}
                                        className="btn btn-primary"
                                        style={{ padding: '6px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}
                                      >
                                        <QrCode size={14} /> {loadingQrId === bill.id ? 'Đang tạo QR...' : 'Quét VietQR SePay'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 5-STAR RATING & REVIEW SECTION EMBEDDED DIRECTLY IN MY ROOM */}
                  <div style={{
                    padding: '24px 28px',
                    background: 'var(--bg-card)',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Star size={18} color="#f59e0b" fill="#f59e0b" />
                          {user?.role === 'LANDLORD' ? 'Đánh giá từ khách thuê trọ' : 'Đánh giá 5 sao & Cảm nhận của bạn về trọ này'}
                        </h4>
                        <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                          {user?.role === 'LANDLORD'
                            ? 'Các đánh giá thực tế từ khách thuê đã được ký hợp đồng xác thực trên hệ thống Roomily.'
                            : 'Vì bạn là cư dân đã ký hợp đồng ở trọ, đánh giá của bạn sẽ mang huy hiệu xác thực trên diễn đàn Roomily.'}
                        </p>
                      </div>

                      {c.postId && (
                        <Link
                          to={`/rooms/${c.postId}`}
                          style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Xem bài đăng trọ trên diễn đàn <ExternalLink size={13} />
                        </Link>
                      )}
                    </div>

                    {user?.role === 'LANDLORD' ? (
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: 'var(--shadow-soft)'
                      }}>
                        {(reviewsMap[c.id] && reviewsMap[c.id].length > 0) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {reviewsMap[c.id].map((rev) => (
                              <div key={rev.id} style={{ padding: '12px 14px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)' }}>
                                    {rev.reviewerName || 'Khách thuê trọ'}
                                  </div>
                                  <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '13px' }}>
                                    {'⭐'.repeat(rev.rating || 5)} ({rev.rating || 5}/5)
                                  </div>
                                </div>
                                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                  {rev.comment || 'Khách thuê không để lại nhận xét bằng lời.'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                            Phòng này hiện chưa nhận được đánh giá nào từ khách thuê.
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Interactive review box for tenant */
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: 'var(--shadow-soft)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)' }}>Chấm điểm:</span>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setRatingMap({ ...ratingMap, [c.id]: s })}
                                  onMouseEnter={() => setHoverRatingMap({ ...hoverRatingMap, [c.id]: s })}
                                  onMouseLeave={() => setHoverRatingMap({ ...hoverRatingMap, [c.id]: 0 })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                                >
                                  <Star
                                    size={24}
                                    color="#f59e0b"
                                    fill={s <= (curHover || curRating) ? '#f59e0b' : 'none'}
                                  />
                                </button>
                              ))}
                            </div>
                            <span style={{ fontWeight: '800', color: '#d97706', fontSize: '13.5px', marginLeft: '6px' }}>
                              {curRating === 5 ? '⭐⭐⭐⭐⭐ Rất hài lòng / Tuyệt vời' : `${curRating} Sao`}
                            </span>
                          </div>

                          {existingReview && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                                ✓ Đã có đánh giá của bạn
                              </span>
                              <button
                                onClick={() => handleDeleteReview(existingReview.id)}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fca5a5', fontSize: '12px' }}
                                title="Xóa đánh giá này"
                              >
                                <Trash2 size={13} /> Xóa
                              </button>
                            </div>
                          )}
                        </div>

                        <textarea
                          rows={3}
                          value={curComment}
                          onChange={(e) => setCommentMap({ ...commentMap, [c.id]: e.target.value })}
                          placeholder="Chia sẻ trải nghiệm thực tế của bạn: phòng có thoáng không, thái độ chủ trọ thế nào, an ninh khu vực, tiền điện nước..."
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            type="button"
                            onClick={() => handleSaveReview(c)}
                            disabled={submittingReview}
                            className="btn btn-primary"
                            style={{ padding: '8px 22px', fontSize: '13.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Star size={15} />
                            {existingReview ? 'Lưu cập nhật đánh giá' : 'Gửi đánh giá 5 sao cho phòng này'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* MODAL XEM CHI TIẾT HỢP ĐỒNG ĐIỆN TỬ */}
        {contractModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', letterSpacing: '0.5px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '900', color: 'var(--ink)' }}>
                    HỢP ĐỒNG THUÊ PHÒNG TRỌ ĐIỆN TỬ
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mã số: #ROOMILY-CONTRACT-{contractModal.id}</div>
                </div>
                <button
                  onClick={() => setContractModal(null)}
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: '700' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                <p><strong style={{ color: 'var(--text-primary)' }}>BÊN CHO THUÊ (BÊN A):</strong> {user?.role === 'LANDLORD' ? (user?.fullName || contractModal.landlordName || 'Chủ nhà trọ') : (contractModal.landlordName || 'Chủ nhà trọ')}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>BÊN THUÊ (BÊN B):</strong> {user?.role === 'LANDLORD' ? (contractModal.tenantName || 'Khách thuê phòng (ID #' + contractModal.tenantId + ')') : (user?.fullName || 'Người thuê phòng')} (CCCD/SĐT: {user?.role === 'LANDLORD' ? (contractModal.tenantPhone || 'Đã xác thực') : (user?.phoneNumber || 'Đã xác thực')})</p>
                <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '14px 0' }} />
                <p><strong style={{ color: 'var(--text-primary)' }}>ĐIỀU 1. ĐỐI TƯỢNG THUÊ:</strong></p>
                <p>- Phòng số: <strong style={{ color: 'var(--text-primary)' }}>{contractModal.roomNumber || contractModal.roomId}</strong></p>
                <p>- Địa chỉ: {contractModal.address || 'Khu trọ Roomily Ecosystem'}</p>
                <p>- Diện tích: {contractModal.roomArea || 25} m²</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>ĐIỀU 2. GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN:</strong></p>
                <p>- Giá thuê cố định: <strong style={{ color: '#2563eb' }}>{formatVnd(contractModal.rentalPrice)}/tháng</strong></p>
                <p>- Tiền đặt cọc bảo đảm: <strong style={{ color: '#10b981' }}>{formatVnd(contractModal.depositAmount || contractModal.rentalPrice)}</strong></p>
                <p>- Thời hạn thuê: Từ ngày {contractModal.startDate} đến ngày {contractModal.endDate || 'Gia hạn hàng năm'}.</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>ĐIỀU 3. TRẠNG THÁI HIỆU LỰC:</strong></p>
                <p style={{ color: '#16a34a', fontWeight: '700' }}>✓ Hợp đồng đã được ký số và có giá trị pháp lý trên nền tảng Roomily.</p>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handlePrintContract(contractModal)}
                  className="btn btn-outline"
                  style={{ padding: '8px 20px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                >
                  <Printer size={16} /> In / Xuất File PDF
                </button>
                <button
                  onClick={() => setContractModal(null)}
                  className="btn btn-primary"
                  style={{ padding: '8px 24px', fontWeight: '700', background: 'var(--primary)', color: '#ffffff' }}
                >
                  Đã hiểu & Đóng
                </button>
              </div>
            </div>
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
                    <CheckCircle2 size={44} />
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    Thanh Toán Hoàn Tất!
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 380, margin: '0 auto 24px' }}>
                    Hóa đơn kỳ tháng <strong>{qrModalData.monthYear}</strong> với số tiền <strong>{formatVnd(qrModalData.amount)}</strong> đã được ghi nhận. Chủ trọ cũng đã nhận được thông báo.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        if (qrModalData.originalBill) {
                          handlePrintInvoice({ ...qrModalData.originalBill, status: 'PAID' }, contracts.find(c => c.id === qrModalData.originalBill.contractId));
                        }
                      }}
                      className="btn btn-outline"
                      style={{ padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={16} /> In biên lai A4
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
                    <div style={{
                      background: '#fff',
                      padding: '12px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      marginBottom: '12px'
                    }}>
                      <img
                        src={qrModalData.qrImageUrl || '/qr_bidv_admin.png'}
                        alt="VietQR Payment"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/qr_bidv_admin.png';
                        }}
                        style={{ width: '230px', height: '230px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Quét mã bằng app ngân hàng (BIDV, MB, Vietcombank,...) hoặc chuyển khoản theo thông tin:
                    </div>
                  </div>

                  {/* Transfer Details with copy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Ngân hàng thụ hưởng:</span>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{qrModalData.bankName || 'BIDV'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Số tài khoản:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#2563eb' }}>{qrModalData.accountNumber || '8867375252'}</strong>
                        <button
                          onClick={() => copyToClipboard(qrModalData.accountNumber || '8867375252', 'Số tài khoản')}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                          title="Sao chép"
                        >
                          {copiedField === 'Số tài khoản' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chủ tài khoản:</span>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{qrModalData.accountName || 'LE VU HAO'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Số tiền cần chuyển:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '16px', color: '#16a34a', fontWeight: '900' }}>{formatVnd(qrModalData.amount)}</strong>
                        <button
                          onClick={() => copyToClipboard(String(qrModalData.amount), 'Số tiền')}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                          title="Sao chép"
                        >
                          {copiedField === 'Số tiền' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, display: 'block' }}>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
                        <strong style={{ fontSize: '15px', color: '#1e40af', letterSpacing: '0.5px' }}>{qrModalData.transferContent || `SEPAYBILL${qrModalData.billId}`}</strong>
                      </div>
                      <button
                        onClick={() => copyToClipboard(qrModalData.transferContent || `SEPAYBILL${qrModalData.billId}`, 'Nội dung chuyển khoản')}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px', background: '#fff', borderColor: '#2563eb', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copiedField === 'Nội dung chuyển khoản' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        {copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={13} className="animate-spin" />
                    Đang tự động đối soát giao dịch chuyển khoản...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyContracts;
