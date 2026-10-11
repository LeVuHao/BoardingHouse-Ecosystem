import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, CheckCircle2, Users, FileText, Wrench, Receipt, 
  Plus, Search, Phone, MessageSquare, Printer, ExternalLink, 
  Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Home, Calendar,
  DollarSign, ArrowRight, RefreshCw, Zap, Activity, Clock, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyApi, contractApi, rentalApi, maintenanceApi, forumApi, authApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

import LandlordProperties from './LandlordProperties';
import LandlordRequests from './LandlordRequests';
import LandlordTickets from './LandlordTickets';
import LandlordBills from './LandlordBills';
import MyContracts from './MyContracts';

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const ACTION_MAP = {
  LANDLORD_CREATE_PROPERTY: { label: 'Thêm khu trọ', color: '#16a34a', bg: '#dcfce7', icon: '🏢' },
  LANDLORD_UPDATE_PROPERTY: { label: 'Sửa khu trọ', color: '#2563eb', bg: '#eff6ff', icon: '✏️' },
  LANDLORD_DELETE_PROPERTY: { label: 'Xóa khu trọ', color: '#dc2626', bg: '#fef2f2', icon: '🗑️' },
  LANDLORD_CREATE_ROOM: { label: 'Thêm phòng mới', color: '#16a34a', bg: '#dcfce7', icon: '🚪' },
  LANDLORD_UPDATE_ROOM: { label: 'Sửa phòng', color: '#2563eb', bg: '#eff6ff', icon: '🛠️' },
  LANDLORD_DELETE_ROOM: { label: 'Xóa phòng', color: '#dc2626', bg: '#fef2f2', icon: '🗑️' },
  APPROVE_POST: { label: 'Admin duyệt bài', color: '#059669', bg: '#ecfdf5', icon: '✅' },
  REJECT_POST: { label: 'Admin từ chối bài', color: '#dc2626', bg: '#fef2f2', icon: '❌' },
};

const formatRealTime = (dateStr) => {
  if (!dateStr) return { relative: '', exact: '' };
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  
  let relative = 'Vừa xong';
  if (diffSec < 60) relative = `${Math.max(1, diffSec)} giây trước`;
  else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)} phút trước`;
  else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)} giờ trước`;
  else relative = `${Math.floor(diffSec / 86400)} ngày trước`;
  
  const timeFormatted = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateFormatted = date.toLocaleDateString('vi-VN');
  
  return { relative, exact: `${timeFormatted} ${dateFormatted}` };
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
];

const LandlordHub = ({ defaultTab = 'properties' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab ưu tiên từ query param ?tab=... nếu không có thì lấy defaultTab
  const currentTab = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(currentTab);

  // Stats data
  const [properties, setProperties] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [ticketStats, setTicketStats] = useState({ activeCount: 0, urgentCount: 0 });
  const [myForumPosts, setMyForumPosts] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Search filter cho tab "Trọ đã cho thuê"
  const [occupiedSearch, setOccupiedSearch] = useState('');

  // Đồng bộ tab khi URL thay đổi
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || defaultTab;
    setActiveTab(tabFromUrl);
  }, [searchParams, defaultTab]);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Load summary metrics cho toàn bộ trọ của chủ trọ
  const loadSummaryData = async () => {
    try {
      setLoadingSummary(true);
      const [propsRes, contractsRes, reqsRes, ticketsRes, forumPostsRes] = await Promise.allSettled([
        propertyApi.getMyProperties(),
        contractApi.getLandlordContracts(),
        rentalApi.getLandlordRequests({ status: 'PENDING' }),
        maintenanceApi.getLandlordStats(),
        forumApi.getMyPosts(),
      ]);

      if (propsRes.status === 'fulfilled') {
        setProperties(propsRes.value.data || []);
      }
      if (contractsRes.status === 'fulfilled') {
        setContracts(contractsRes.value.data || []);
      }
      if (reqsRes.status === 'fulfilled') {
        const data = reqsRes.value.data?.content || reqsRes.value.data?.data?.content || reqsRes.value.data?.data || reqsRes.value.data || [];
        setPendingRequestsCount(Array.isArray(data) ? data.length : 0);
      }
      if (ticketsRes.status === 'fulfilled') {
        const stats = ticketsRes.value.data?.data || ticketsRes.value.data || {};
        setTicketStats({
          activeCount: stats.activeCount || 0,
          urgentCount: stats.urgentCount || 0,
        });
      }
      if (forumPostsRes.status === 'fulfilled') {
        const posts = forumPostsRes.value.data || [];
        setMyForumPosts(Array.isArray(posts) ? posts : []);
      }
    } catch (e) {
      console.warn('Lỗi khi tải tổng quan trọ:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Load nhật ký hoạt động thời gian thực của chủ trọ
  const loadActivities = async () => {
    try {
      setLoadingActivities(true);
      const res = await authApi.getMyAuditLogs({ page: 0, size: 50 });
      const items = res.data?.data?.content || res.data?.content || [];
      setActivities(Array.isArray(items) ? items : []);
    } catch (e) {
      console.warn('Lỗi khi tải nhật ký hoạt động:', e);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
    loadActivities();
    const timer = setInterval(() => {
      loadActivities();
    }, 12000); // Tự động cập nhật real-time mỗi 12s
    return () => clearInterval(timer);
  }, []);

  // Đổi trạng thái đã cho thuê / còn trống của bài đăng
  const handleToggleRentalStatus = async (post) => {
    const nextRented = !post.isRented;
    try {
      await forumApi.updateRentalStatus(post.id, { isRented: nextRented });
      toast.success(
        nextRented
          ? 'Đã chuyển thành: ĐÃ CÓ NGƯỜI THUÊ (Tự động ẩn khỏi trang tìm phòng diễn đàn)!'
          : 'Đã mở lại phòng THÀNH PHÒNG TRỐNG (Hiển thị công khai ngoài diễn đàn)!'
      );
      loadSummaryData();
      loadActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái thuê phòng');
    }
  };

  // Bật / tắt nhu cầu tìm người ở ghép
  const handleToggleRoommateStatus = async (post) => {
    const nextRoommate = !post.roommateNeeded;
    try {
      await forumApi.updateRoommateStatus(post.id, {
        roommateNeeded: nextRoommate,
        roommateCount: post.roommateCount || 1,
        roommateNote: post.roommateNote || 'Cần tìm bạn ở ghép lịch sự, sạch sẽ'
      });
      toast.success(
        nextRoommate
          ? 'Đã BẬT tìm người ở ghép (Bài viết sẽ hiển thị công khai trên diễn đàn với huy hiệu Tìm Ở Ghép)!'
          : 'Đã TẮT tìm người ở ghép!'
      );
      loadSummaryData();
      loadActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi trạng thái ở ghép');
    }
  };

  // Tính toán các chỉ số KPI
  const totalProperties = properties.length;
  const totalRooms = useMemo(() => {
    return properties.reduce((sum, p) => sum + (p.rooms ? p.rooms.length : (p.totalRooms || 0)), 0);
  }, [properties]);

  const occupiedContracts = useMemo(() => {
    return contracts.filter((c) => c.status === 'ACTIVE');
  }, [contracts]);

  const occupiedRoomsCount = occupiedContracts.length;
  const availableRoomsCount = Math.max(0, totalRooms - occupiedRoomsCount);
  const occupancyRate = totalRooms > 0
    ? Math.min(100, Math.round((occupiedRoomsCount / totalRooms) * 100))
    : (totalProperties > 0 ? 80 : 0);

  const monthlyRevenue = useMemo(() => {
    return occupiedContracts.reduce((sum, c) => sum + Number(c.rentalPrice || 0), 0);
  }, [occupiedContracts]);

  const totalDepositHeld = useMemo(() => {
    return occupiedContracts.reduce((sum, c) => sum + Number(c.depositAmount || c.rentalPrice || 0), 0);
  }, [occupiedContracts]);

  // Đếm số bài đăng diễn đàn đang chờ duyệt
  const pendingModerationCount = useMemo(() => {
    return myForumPosts.filter((p) => p.moderationStatus === 'PENDING').length;
  }, [myForumPosts]);

  // Lọc danh sách phòng đã cho thuê
  const filteredOccupiedContracts = useMemo(() => {
    if (!occupiedSearch.trim()) return occupiedContracts;
    const term = occupiedSearch.toLowerCase();
    return occupiedContracts.filter((c) => 
      (c.roomNumber && c.roomNumber.toLowerCase().includes(term)) ||
      (c.propertyTitle && c.propertyTitle.toLowerCase().includes(term)) ||
      (c.tenantName && c.tenantName.toLowerCase().includes(term)) ||
      (c.tenantPhone && c.tenantPhone.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  }, [occupiedContracts, occupiedSearch]);

  // In / Xuất hợp đồng PDF (A4) trực tiếp từ tab phòng đã thuê
  const handlePrintContractDirect = (contract) => {
    if (!contract) return;
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      toast.error('Vui lòng cho phép popup trình duyệt để in hợp đồng');
      return;
    }
    const startDateStr = contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
    const endDateStr = contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : '12 tháng';

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
          @media print { body { padding: 0; } .no-print { display: none !important; } }
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
        <div class="section-title">BÊN CHO THUÊ (BÊN A):</div>
        <p>
          - Họ và tên: <strong>${user?.fullName || contract.landlordName || 'Chủ nhà trọ'}</strong><br/>
          - Số điện thoại liên hệ: ${user?.phoneNumber || contract.landlordPhone || 'Chính chủ'}<br/>
          - Đại diện quản lý khu trọ Roomily Ecosystem
        </p>
        <div class="section-title">BÊN THUÊ PHÒNG (BÊN B):</div>
        <p>
          - Họ và tên: <strong>${contract.tenantName || 'Khách thuê phòng (ID #' + contract.tenantId + ')'}</strong><br/>
          - Số điện thoại / Định danh: ${contract.tenantPhone || 'Đã xác thực trên hệ thống'}<br/>
        </p>
        <div class="section-title">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & HIỆN TRẠNG</div>
        <p>
          - Phòng số: <strong>${contract.roomNumber || contract.roomId}</strong> - Khu trọ: ${contract.propertyTitle || 'Roomily'}<br/>
          - Địa chỉ: ${contract.address || 'Khu vực Dĩ An, TP.HCM'}<br/>
          - Diện tích sử dụng: ${contract.roomArea || 25} m²
        </p>
        <div class="section-title">ĐIỀU 2: GIÁ THUÊ & TIỀN CỌC</div>
        <p>
          - Giá thuê phòng: <strong>${formatVnd(contract.rentalPrice)}/tháng</strong><br/>
          - Tiền đặt cọc bảo đảm: <strong>${formatVnd(contract.depositAmount || contract.rentalPrice)}</strong><br/>
          - Thời hạn thuê: Từ ngày ${startDateStr} đến ngày ${endDateStr}
        </p>
        <div class="signatures">
          <div class="sig-box">
            <strong>ĐẠI DIỆN BÊN B (BÊN THUÊ)</strong><br/><em>(Ký điện tử)</em>
            <div class="sig-space"><span class="badge-verified">✓ ĐÃ KÝ ĐIỆN TỬ</span></div>
            <strong>${contract.tenantName || 'Bên thuê'}</strong>
          </div>
          <div class="sig-box">
            <strong>ĐẠI DIỆN BÊN A (BÊN CHO THUÊ)</strong><br/><em>(Ký điện tử)</em>
            <div class="sig-space"><span class="badge-verified">✓ ĐÃ XÁC THỰC ROOMILY</span></div>
            <strong>${user?.fullName || 'Chủ nhà trọ'}</strong>
          </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 35px;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨️ Nhấn vào đây để In / Lưu file PDF (A4)
          </button>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(contractHtml);
    printWindow.document.close();
  };

  const tabsConfig = [
    {
      id: 'properties',
      label: 'Trọ của tôi (Khu & Phòng)',
      badge: totalProperties > 0 ? totalProperties : null,
      badgeColor: '#2563eb',
    },
    {
      id: 'posts',
      label: 'Tin đăng & Quản lý tin',
      badge: pendingModerationCount > 0 ? `${pendingModerationCount} chờ duyệt` : (myForumPosts.length > 0 ? myForumPosts.length : null),
      badgeColor: pendingModerationCount > 0 ? '#ea580c' : '#2563eb',
    },
    {
      id: 'occupied',
      label: 'Trọ đã cho thuê',
      badge: occupiedRoomsCount > 0 ? occupiedRoomsCount : null,
      badgeColor: '#059669',
    },
    {
      id: 'requests',
      label: 'Khách thuê & Yêu cầu',
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} mới` : null,
      badgeColor: '#ea580c',
    },
    {
      id: 'contracts',
      label: 'Hợp đồng thuê (In PDF)',
      badge: contracts.length > 0 ? contracts.length : null,
      badgeColor: '#7c3aed',
    },
    {
      id: 'tickets',
      label: 'Sự cố & Báo hỏng',
      badge: ticketStats.urgentCount > 0 ? `${ticketStats.urgentCount} khẩn` : (ticketStats.activeCount > 0 ? ticketStats.activeCount : null),
      badgeColor: '#ef4444',
    },
    {
      id: 'bills',
      label: 'Quản lý hóa đơn',
      badge: null,
      badgeColor: null,
    },
    {
      id: 'activity',
      label: 'Nhật ký hoạt động',
      badge: activities.length > 0 ? activities.length : null,
      badgeColor: '#0ea5e9',
    },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '70px' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          MASTER HERO HEADER
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
        color: '#ffffff',
        padding: '36px 0 28px 0',
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.2)'
      }}>
        <div className="wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', padding: '5px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '700', marginBottom: '12px' }}>
                <span>TRUNG TÂM ĐIỀU HÀNH CHỦ TRỌ ROOMILY</span>
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                Quản Lý Trọ Của Tôi
              </h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14.5px', maxWidth: '680px', lineHeight: 1.5 }}>
                Không gian quản trị toàn diện: theo dõi các khu trọ, danh sách phòng đã cho thuê, khách thuê, hợp đồng số, hóa đơn và sự cố báo hỏng.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={loadSummaryData}
                className="btn btn-outline"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600 }}
                title="Làm mới số liệu"
              >
                Làm mới
              </button>
              <Link
                to="/forum/create"
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontWeight: 700, background: '#10b981', borderColor: '#10b981', color: '#fff', fontSize: '14px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
              >
                + Đăng Tin Cho Thuê
              </Link>
            </div>
          </div>

          {/* 6 MINI-ANALYTICS KPI CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            marginTop: '28px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '11.5px', opacity: 0.82, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Khu trọ / Số phòng</div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{totalProperties} khu · {totalRooms} phòng</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '11.5px', opacity: 0.82, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Đã cho thuê & Lấp đầy</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#6ee7b7' }}>{occupiedRoomsCount} phòng ({occupancyRate}%)</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '11.5px', opacity: 0.82, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Phòng còn trống</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#fde047' }}>{availableRoomsCount} phòng trống</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '11.5px', opacity: 0.82, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Yêu cầu chờ duyệt</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: pendingRequestsCount > 0 ? '#fca5a5' : '#ffffff' }}>
                {pendingRequestsCount} yêu cầu {pendingRequestsCount > 0 ? '⚠️' : ''}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '11.5px', opacity: 0.82, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Sự cố cần sửa</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: ticketStats.urgentCount > 0 ? '#f87171' : '#ffffff' }}>
                {ticketStats.activeCount} sự cố {ticketStats.urgentCount > 0 ? `(${ticketStats.urgentCount} khẩn)` : ''}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '11.5px', opacity: 0.82, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Doanh thu dự kiến</div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: '#93c5fd' }}>
                {monthlyRevenue > 0 ? formatVnd(monthlyRevenue) : '0đ/tháng'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          UNIFIED TAB NAVIGATION BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* BANNER THÔNG BÁO BÀI ĐĂNG ĐANG CHỜ ADMIN DUYỆT */}
        {pendingModerationCount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                ⏳
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', color: '#92400e', fontSize: '15px', fontWeight: 800 }}>
                  Bạn có {pendingModerationCount} bài đăng trọ đang ở trạng thái CHỜ ADMIN DUYỆT
                </h4>
                <p style={{ margin: 0, color: '#b45309', fontSize: '13px' }}>
                  Bài đăng này chưa hiển thị ra diễn đàn công khai. Ngay sau khi Quản trị viên kiểm duyệt, bài sẽ tự động xuất hiện để người thuê tìm kiếm.
                </p>
              </div>
            </div>
            <button
              onClick={() => switchTab('posts')}
              className="btn btn-accent"
              style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              Xem bài chờ duyệt →
            </button>
          </div>
        )}
        
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '8px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          marginBottom: '26px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--ink)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  flexShrink: 0
                }}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    background: isActive ? '#ffffff' : tab.badgeColor,
                    color: isActive ? '#2563eb' : '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '20px',
                    lineHeight: 1.2
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: TRỌ CỦA CHỦ TRỌ (KHU TRỌ & PHÒNG TRỌ)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'properties' && (
          <div>
            <LandlordProperties hideAnalytics={true} embedded={true} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: TRỌ ĐÃ CHO THUÊ (OCCUPIED ROOMS & TENANTS)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'occupied' && (
          <div>
            {/* Top Bar Filter */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '20px 24px',
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
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
                  Danh Sách Trọ Đã Cho Thuê ({occupiedContracts.length} phòng)
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Tổng tiền cọc đang quản lý: <strong>{formatVnd(totalDepositHeld)}</strong> • Doanh thu phòng: <strong>{formatVnd(monthlyRevenue)}/tháng</strong>
                </p>
              </div>

              {/* Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={occupiedSearch}
                    onChange={(e) => setOccupiedSearch(e.target.value)}
                    placeholder="Tìm theo số phòng, tên khách..."
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {filteredOccupiedContracts.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '60px 20px',
                textAlign: 'center',
                border: '1px solid var(--border)'
              }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
                  {occupiedSearch ? 'Không tìm thấy phòng đã thuê phù hợp với từ khóa' : 'Chưa có phòng trọ nào được cho thuê'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Khi bạn phê duyệt yêu cầu thuê phòng từ khách thuê, phòng và hợp đồng sẽ tự động hiển thị trong danh sách này.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => switchTab('requests')} className="btn btn-primary" style={{ padding: '9px 20px', fontWeight: 700 }}>
                    Xem yêu cầu thuê phòng
                  </button>
                  <button onClick={() => switchTab('properties')} className="btn btn-outline" style={{ padding: '9px 20px', fontWeight: 700 }}>
                    Quản lý phòng trọ
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {filteredOccupiedContracts.map((c) => {
                  const photo = (c.images && c.images.length > 0) ? c.images[0] : fallbackImages[0];
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Top Photo & Status */}
                      <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden' }}>
                        <img src={photo} alt={c.propertyTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute', top: '12px', left: '12px',
                          background: 'rgba(16, 185, 129, 0.92)', backdropFilter: 'blur(6px)',
                          color: '#fff', padding: '4px 10px', borderRadius: '9999px',
                          fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px'
                        }}>
                          <CheckCircle2 size={13} /> ĐANG THUÊ
                        </div>
                        <div style={{
                          position: 'absolute', bottom: '12px', right: '12px',
                          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                          color: '#fff', padding: '3px 9px', borderRadius: '8px',
                          fontSize: '12px', fontWeight: 700
                        }}>
                          Hợp đồng: #HD-{c.id}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
                              {c.roomNumber ? `PHÒNG ${c.roomNumber}` : `PHÒNG #${c.roomId}`}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {c.roomArea || 25} m²
                            </span>
                          </div>

                          <h4 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
                            {c.propertyTitle || `Phòng trọ tiện nghi #${c.roomNumber || c.roomId}`}
                          </h4>

                          <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            📍 {c.address ? `${c.address}, ${c.ward || ''}, ${c.district || ''}` : 'Khu trọ Roomily'}
                          </p>

                          {/* Price & Deposit Strip */}
                          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #edf2f7', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Giá thuê mỗi tháng:</span>
                              <strong style={{ color: '#2563eb' }}>{formatVnd(c.rentalPrice)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Tiền cọc an toàn:</span>
                              <strong style={{ color: '#059669' }}>{formatVnd(c.depositAmount || c.rentalPrice)}</strong>
                            </div>
                          </div>

                          {/* Tenant Info Box */}
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', marginBottom: '4px' }}>
                              👤 Khách thuê đang lưu trú:
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)' }}>
                              {c.tenantName || `Khách thuê (ID #${c.tenantId})`}
                            </div>
                            {c.tenantPhone && (
                              <div style={{ fontSize: '12.5px', color: '#166534', marginTop: '2px' }}>
                                SĐT: {c.tenantPhone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                          <button
                            onClick={() => handlePrintContractDirect(c)}
                            className="btn btn-outline"
                            style={{ padding: '7px 10px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#1d4ed8', borderColor: '#bfdbfe', background: '#eff6ff' }}
                          >
                            <Printer size={13} /> In PDF (A4)
                          </button>
                          <button
                            onClick={() => switchTab('contracts')}
                            className="btn btn-outline"
                            style={{ padding: '7px 10px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <FileText size={13} /> Hợp đồng
                          </button>
                          <button
                            onClick={() => switchTab('bills')}
                            className="btn btn-primary"
                            style={{ padding: '7px 10px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', gridColumn: 'span 2' }}
                          >
                            <Receipt size={13} /> Tạo Hóa Đơn Điện Nước
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: KHÁCH THUÊ & YÊU CẦU THUÊ PHÒNG
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div>
            <LandlordRequests embedded={true} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: HỢP ĐỒNG THUÊ PHÒNG (IN PDF)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'contracts' && (
          <div>
            <MyContracts embedded={true} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: SỰ CỐ & BÁO HỎNG
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div>
            <LandlordTickets embedded={true} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 6: TẠO HÓA ĐƠN TIỀN TRỌ
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'bills' && (
          <div>
            <LandlordBills embedded={true} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 7: TIN ĐĂNG TRỌ & TRẠNG THÁI KIỂM DUYỆT CỦA ADMIN
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Tin đăng trọ trên Diễn đàn ({myForumPosts.length})
                </h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Theo dõi trạng thái kiểm duyệt bởi Admin: Chờ duyệt ⏳, Đã hiển thị công khai 🟢, hoặc Bị từ chối ❌.
                </p>
              </div>
              <Link to="/forum/create" className="btn btn-primary" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> + Đăng tin mới
              </Link>
            </div>

            {myForumPosts.length === 0 ? (
              <div style={{ background: '#fff', padding: '50px 20px', borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <h3 style={{ margin: 0 }}>Bạn chưa có bài đăng trọ nào</h3>
                <p style={{ color: 'var(--text-muted)', margin: '8px 0 16px 0' }}>Đăng tin để quảng bá phòng trọ đến hàng nghìn sinh viên và người thuê.</p>
                <Link to="/forum/create" className="btn btn-primary">+ Đăng tin ngay</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myForumPosts.map((post) => {
                  const isPending = post.moderationStatus === 'PENDING';
                  const isApproved = post.moderationStatus === 'APPROVED';
                  const isRejected = post.moderationStatus === 'REJECTED';
                  const img = post.images?.[0] || post.imageUrls?.[0] || fallbackImages[0];

                  return (
                    <div
                      key={post.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: isPending ? '1.5px solid #fde68a' : isRejected ? '1.5px solid #fca5a5' : '1px solid var(--border)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        padding: '18px 20px',
                        display: 'grid',
                        gridTemplateColumns: '120px 1fr auto',
                        gap: '20px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ width: 120, height: 90, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                            Mã #{post.id} · {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          {isPending && (
                            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 800 }}>
                              ĐANG CHỜ ADMIN DUYỆT
                            </span>
                          )}
                          {isApproved && (
                            <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 800 }}>
                              ĐÃ HIỂN THỊ CÔNG KHAI
                            </span>
                          )}
                          {isRejected && (
                            <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 800 }}>
                              BỊ TỪ CHỐI
                            </span>
                          )}
                          {post.isRented && !post.roommateNeeded && (
                            <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                              ĐÃ CÓ NGƯỜI THUÊ (Tự động ẩn khỏi tìm kiếm)
                            </span>
                          )}
                          {post.isRented && post.roommateNeeded && (
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 800 }}>
                              ĐANG TÌM NGƯỜI Ở GHÉP (Hiển thị công khai)
                            </span>
                          )}
                          {!post.isRented && (
                            <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                              PHÒNG TRỐNG (Hiển thị công khai)
                            </span>
                          )}
                        </div>

                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16.5px', fontWeight: 800, color: 'var(--ink)' }}>
                          {post.title}
                        </h3>

                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ color: '#dc2626', fontWeight: 800, fontSize: 14.5 }}>
                            {formatVnd(post.price)}/tháng
                          </span>
                          {post.roomArea && <span>{post.roomArea} m²</span>}
                          <span>{post.address}, {post.district}, {post.city}</span>
                        </div>

                        {/* Thanh nút gạt nhanh: Đã thuê / Tìm ở ghép */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleToggleRentalStatus(post)}
                            className="btn"
                            style={{
                              background: post.isRented ? '#f0fdf4' : '#f8fafc',
                              color: post.isRented ? '#16a34a' : '#475569',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              borderRadius: 8
                            }}
                            title="Nếu đã thuê mà không tìm ở ghép thì phòng sẽ tự ẩn khỏi tìm kiếm công khai"
                          >
                            {post.isRented ? 'Đổi thành Phòng Trống' : 'Đánh dấu Đã Thuê'}
                          </button>
                          <button
                            onClick={() => handleToggleRoommateStatus(post)}
                            className="btn"
                            style={{
                              background: post.roommateNeeded ? '#fef3c7' : '#f8fafc',
                              color: post.roommateNeeded ? '#b45309' : '#475569',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              borderRadius: 8
                            }}
                            title="Nếu phòng đã thuê nhưng muốn tìm người ở cùng thì bật tính năng này để hiển thị trên diễn đàn"
                          >
                            {post.roommateNeeded ? 'Tắt Tìm Người Ở Ghép' : 'Bật Tìm Người Ở Ghép'}
                          </button>
                        </div>

                        {isRejected && post.rejectReason && (
                          <div style={{ marginTop: 8, background: '#fef2f2', color: '#991b1b', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                            <strong>Lý do từ chối:</strong> {post.rejectReason}
                          </div>
                        )}
                        {isPending && (
                          <div style={{ marginTop: 6, fontSize: 12, color: '#92400e' }}>
                            Bài đăng đã được gửi tới Quản trị viên. Trong lúc chờ duyệt, bài viết chưa hiển thị công khai ngoài diễn đàn.
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                        {isApproved && (
                          <Link
                            to={`/rooms/${post.id}`}
                            className="btn btn-outline"
                            style={{ padding: '7px 12px', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                          >
                            <ExternalLink size={13} /> Xem bài đăng
                          </Link>
                        )}
                        <Link
                          to={`/rooms`}
                          className="btn"
                          style={{ background: '#f1f5f9', color: 'var(--ink)', padding: '7px 12px', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        >
                          Ra diễn đàn
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 8: NHẬT KÝ HOẠT ĐỘNG THỜI GIAN THỰC (REAL-TIME ACTIVITY AUDIT)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '22px 24px',
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
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
                  Nhật Ký Hoạt Động (Thời Gian Thực)
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Hệ thống tự động ghi nhận mọi thao tác thêm, sửa, xóa khu trọ & phòng trọ theo thời gian thực chính xác từng giây.
                </p>
              </div>
              <button
                onClick={loadActivities}
                disabled={loadingActivities}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <RefreshCw size={15} className={loadingActivities ? 'animate-spin' : ''} />
                Làm mới ngay
              </button>
            </div>

            {loadingActivities && activities.length === 0 ? (
              <div style={{ background: '#fff', padding: 50, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
                Đang tải nhật ký hoạt động thời gian thực...
              </div>
            ) : activities.length === 0 ? (
              <div style={{ background: '#fff', padding: '60px 20px', borderRadius: 20, textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Activity size={32} />
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 800 }}>Chưa có hoạt động nào được ghi nhận</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 450, margin: '0 auto 16px' }}>
                  Khi bạn thêm khu trọ, sửa phòng hoặc xóa phòng, các thao tác sẽ xuất hiện ở đây theo thời gian thực.
                </p>
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: '#64748b', fontSize: '12.5px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 20px', textAlign: 'left' }}>Thời gian thực</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left' }}>Loại thao tác</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left' }}>Chi tiết nội dung</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left' }}>Địa chỉ IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act, index) => {
                      const timeInfo = formatRealTime(act.createdAt);
                      const actMeta = ACTION_MAP[act.action] || { label: act.action, color: '#475569', bg: '#f1f5f9', icon: '📌' };

                      return (
                        <tr
                          key={act.id || index}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s'
                          }}
                        >
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{timeInfo.relative}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>{timeInfo.exact}</div>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: actMeta.bg,
                              color: actMeta.color,
                              padding: '5px 12px',
                              borderRadius: 20,
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              <span>{actMeta.icon}</span>
                              <span>{actMeta.label}</span>
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', color: 'var(--ink)', fontWeight: 600 }}>
                            {act.details || 'Không có mô tả'}
                          </td>
                          <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {act.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default LandlordHub;
