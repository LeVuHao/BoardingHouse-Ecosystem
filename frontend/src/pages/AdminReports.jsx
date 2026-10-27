
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  ImageOff, 
  PhoneOff, 
  Search, 
  Eye, 
  ShieldBan, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  X, 
  Flag, 
  Clock, 
  User, 
  Home, 
  MessageSquare, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  FileText,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api/apiClient';

const REASON_CONFIG = {
  SCAM: {
    label: 'Lừa đảo / Tin giả',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: ShieldAlert,
    severity: 'CAO'
  },
  FAKE_PRICE: {
    label: 'Sai lệch giá thuê',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: DollarSign,
    severity: 'TRUNG BÌNH'
  },
  MISLEADING_PHOTOS: {
    label: 'Ảnh sai thực tế',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)',
    icon: ImageOff,
    severity: 'TRUNG BÌNH'
  },
  UNREACHABLE_OR_HARASSMENT: {
    label: 'Quấy rối / Số ảo',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
    icon: PhoneOff,
    severity: 'CAO'
  },
  SENSITIVE_CONTENT: {
    label: 'Nội dung spam / nhạy cảm',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.3)',
    icon: AlertTriangle,
    severity: 'THẤP'
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ PENDING: 0, RESOLVED: 0, DISMISSED: 0, ALL: 0 });
  const [activeTab, setActiveTab] = useState('PENDING'); // ALL | PENDING | RESOLVED | DISMISSED
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL'); // ALL | ROOM | FORUM_POST
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail & Action Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [actionType, setActionType] = useState(null); // 'WARNING' | 'HIDE_POST' | 'BAN_USER' | 'DISMISS'
  const [adminNote, setAdminNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch reports & stats
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        adminApi.getReports({
          status: activeTab === 'ALL' ? undefined : activeTab,
          targetType: targetTypeFilter === 'ALL' ? undefined : targetTypeFilter,
          keyword: searchQuery.trim() || undefined,
          page,
          size: 10
        }),
        adminApi.getReportStats()
      ]);

      const data = res?.data?.data || res?.data || res;
      setReports(data.content || []);
      setTotalPages(data.totalPages || 1);

      const statsData = statsRes?.data?.data || statsRes?.data || statsRes;
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách báo cáo: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [activeTab, targetTypeFilter, searchQuery, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Open modal for detail / action
  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setActionType(null);
    setAdminNote('');
  };

  // Submit action on report
  const handleResolve = async (action, defaultNote = '') => {
    if (!selectedReport) return;
    
    // Nếu là WARNING và chưa nhập note thì mở ô nhập
    if (action === 'WARNING' && !adminNote.trim()) {
      setActionType('WARNING');
      setAdminNote('Bạn đã đăng thông tin vi phạm quy định nền tảng. Yêu cầu kiểm tra và chỉnh sửa lại trong vòng 24 giờ.');
      return;
    }

    if (action === 'BAN_USER' && !window.confirm(`Bạn có chắc chắn muốn KHÓA TÀI KHOẢN của chủ trọ "${selectedReport.targetOwnerName}" không? Hành động này sẽ vô hiệu hóa quyền truy cập của người dùng!`)) {
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await adminApi.resolveReport(selectedReport.id, {
        action,
        adminNote: adminNote.trim() || defaultNote || undefined
      });

      const updated = res?.data?.data || res?.data;
      toast.success(
        action === 'WARNING' ? 'Đã gửi thư cảnh cáo tới chủ trọ thành công' :
        action === 'HIDE_POST' ? 'Đã tạm ẩn nội dung vi phạm thành công' :
        action === 'BAN_USER' ? 'Đã khóa tài khoản chủ trọ vi phạm' :
        'Đã bỏ qua báo cáo'
      );

      // Cập nhật lại danh sách và đóng modal
      setSelectedReport(null);
      setActionType(null);
      setAdminNote('');
      fetchReports();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Xử lý thất bại');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'RESOLVED') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={12} /> Đã xử lý
        </span>
      );
    }
    if (status === 'DISMISSED') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: 'rgba(100, 116, 139, 0.15)', color: '#64748B', border: '1px solid rgba(100, 116, 139, 0.3)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={12} /> Đã từ chối
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={12} /> Chờ xử lý
      </span>
    );
  };

  const getReasonBadge = (reasonCode) => {
    const config = REASON_CONFIG[reasonCode] || {
      label: reasonCode || 'Khác',
      color: '#64748B',
      bg: 'rgba(100, 116, 139, 0.1)',
      border: 'rgba(100, 116, 139, 0.2)',
      icon: AlertTriangle
    };
    const Icon = config.icon;
    return (
      <span 
        style={{ 
          padding: '4px 10px', 
          borderRadius: '8px', 
          fontSize: '12px', 
          background: config.bg, 
          color: config.color, 
          border: `1px solid ${config.border}`, 
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Icon size={13} />
        {config.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flag size={24} color="#EF4444" /> Quản lý Báo cáo & Tin Vi Phạm
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Kiểm duyệt và xử lý khiếu nại phòng trọ, tin đăng sai sự thật từ người dùng
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-primary, #f1f5f9)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'PENDING', label: 'Chờ xử lý', count: stats.PENDING },
            { id: 'RESOLVED', label: 'Đã xử lý', count: stats.RESOLVED },
            { id: 'DISMISSED', label: 'Đã từ chối', count: stats.DISMISSED },
            { id: 'ALL', label: 'Tất cả', count: stats.ALL },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(0); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? '600' : '500',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontSize: '13px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 6px', 
                borderRadius: '10px', 
                background: activeTab === tab.id ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.06)',
                color: activeTab === tab.id ? '#EF4444' : 'inherit',
                fontWeight: '700'
              }}>
                {tab.count || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Target Type Filter & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(0); }}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <option value="ALL">Mọi loại đối tượng</option>
            <option value="ROOM">Phòng trọ (Room)</option>
            <option value="FORUM_POST">Bài đăng diễn đàn (Forum)</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px 14px', borderRadius: '10px', width: '280px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Tìm kiếm báo cáo..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }} 
              style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '13px', background: 'transparent', color: 'var(--text-primary)' }} 
            />
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Đang tải danh sách báo cáo vi phạm...</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={40} color="#10B981" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--text-primary)' }}>Không có báo cáo nào</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {activeTab === 'PENDING' ? 'Tuyệt vời! Hiện tại không có báo cáo nào đang chờ xử lý.' : 'Không tìm thấy kết quả phù hợp với bộ lọc.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-primary, #f8fafc)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Mã / Thời gian</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Đối tượng bị báo cáo</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Người báo cáo</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Lý do vi phạm</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                    {/* ID & Time */}
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>#{report.id}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {formatTimeAgo(report.createdAt)}
                      </div>
                    </td>

                    {/* Target info */}
                    <td style={{ padding: '16px', maxWidth: '320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '2px 6px', 
                          borderRadius: '6px',
                          background: report.targetType === 'ROOM' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                          color: report.targetType === 'ROOM' ? '#2563EB' : '#7C3AED'
                        }}>
                          {report.targetType === 'ROOM' ? '🏠 PHÒNG TRỌ' : '📝 DIỄN ĐÀN'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {report.targetId}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.targetTitle || `Đối tượng #${report.targetId}`}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Chủ: <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{report.targetOwnerName || `Chủ trọ #${report.targetOwnerId}`}</span>
                      </div>
                    </td>

                    {/* Reporter info */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {report.reporterName || `User #${report.reporterId}`}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {report.reporterEmail || `ID: ${report.reporterId}`}
                      </div>
                    </td>

                    {/* Reason badge */}
                    <td style={{ padding: '16px' }}>
                      {getReasonBadge(report.reason)}
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{report.description}"
                      </div>
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(report.status)}
                      {report.adminAction && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Xử lý: <b>{report.adminAction}</b>
                        </div>
                      )}
                    </td>

                    {/* Action button */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenDetail(report)}
                        style={{
                          padding: '7px 14px',
                          background: report.status === 'PENDING' ? '#EF4444' : 'var(--bg-primary, #f1f5f9)',
                          color: report.status === 'PENDING' ? '#ffffff' : 'var(--text-primary)',
                          border: report.status === 'PENDING' ? 'none' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: report.status === 'PENDING' ? '0 2px 6px rgba(239, 68, 68, 0.25)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Eye size={14} />
                        <span>{report.status === 'PENDING' ? 'Xem & Xử lý' : 'Chi tiết'}</span>
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              Trang trước
            </button>
            <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Trang {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              Trang sau
            </button>

          </div>
        )}
      </div>


      {/* DETAIL & ACTION MODAL */}
      {selectedReport && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingAction) setSelectedReport(null);
          }}
        >
          <div 
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '92vh',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                    Chi tiết Báo cáo #{selectedReport.id}
                  </h3>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Gửi lúc: {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                disabled={submittingAction}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content (scrollable) */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target & Owner Info Box */}
              <div style={{ background: 'var(--bg-primary, #f8fafc)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Đối tượng bị báo cáo
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {selectedReport.targetTitle}
                    </h4>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      📍 {selectedReport.targetAddress || 'Chưa cập nhật địa chỉ'}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      👤 Chủ sở hữu: <b style={{ color: 'var(--text-primary)' }}>{selectedReport.targetOwnerName}</b> (ID: {selectedReport.targetOwnerId})
                    </p>
                  </div>
                  <a
                    href={selectedReport.targetType === 'ROOM' ? `/rooms/${selectedReport.targetId}` : `/forum/${selectedReport.targetId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary, #2563EB)',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    Xem bài đăng <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Reporter Info Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--bg-primary, #f8fafc)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Người gửi báo cáo
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedReport.reporterName} (ID: {selectedReport.reporterId})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Email: {selectedReport.reporterEmail || 'Không có'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary, #f8fafc)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Phân loại lý do
                  </div>
                  <div>{getReasonBadge(selectedReport.reason)}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Nội dung mô tả vi phạm từ người dùng:
                </label>
                <div style={{ background: 'var(--bg-primary, #f8fafc)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {selectedReport.description}
                </div>
              </div>

              {/* Evidence Images */}
              {selectedReport.evidenceImages && selectedReport.evidenceImages.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Hình ảnh bằng chứng đính kèm ({selectedReport.evidenceImages.length}):
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {selectedReport.evidenceImages.map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setPreviewImage(img)}
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '2px solid var(--border-color)',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <img src={img} alt={`Bằng chứng ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }}>
                          Bấm phóng to
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Note / Warning message box */}
              {actionType && (
                <div style={{ background: actionType === 'WARNING' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-primary)', padding: '16px', borderRadius: '14px', border: actionType === 'WARNING' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: actionType === 'WARNING' ? '#D97706' : 'var(--text-primary)' }}>
                      {actionType === 'WARNING' ? '✉️ Soạn thư cảnh cáo gửi tới chủ trọ:' : '📝 Ghi chú xử lý của Quản trị viên:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Đóng ô nhập
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={actionType === 'WARNING' ? 'Nhập nội dung cảnh cáo vi phạm...' : 'Nhập lý do hoặc ghi chú nội bộ...'}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  {actionType === 'WARNING' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button
                        onClick={() => handleResolve('WARNING')}
                        disabled={submittingAction || !adminNote.trim()}
                        style={{
                          padding: '8px 18px',
                          background: '#F59E0B',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: submittingAction || !adminNote.trim() ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {submittingAction ? 'Đang gửi...' : 'Gửi cảnh cáo ngay'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Already resolved info */}
              {selectedReport.status !== 'PENDING' && (
                <div style={{ background: 'var(--bg-primary, #f8fafc)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Kết quả xử lý:
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Hành động: <b style={{ color: 'var(--text-primary)' }}>{selectedReport.adminAction}</b>
                    {selectedReport.resolvedAt && ` · Lúc: ${new Date(selectedReport.resolvedAt).toLocaleString('vi-VN')}`}
                  </div>
                  {selectedReport.adminNote && (
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px', fontStyle: 'italic' }}>
                      Ghi chú Admin: "{selectedReport.adminNote}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-primary, #f8fafc)' }}>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                disabled={submittingAction}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer' }}
              >
                Đóng
              </button>

              {/* 4 distinct Admin action buttons for PENDING reports */}
              {selectedReport.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Dismiss button */}
                  <button
                    onClick={() => handleResolve('DISMISS', 'Báo cáo không đủ căn cứ vi phạm')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Bỏ qua báo cáo nếu xác định không vi phạm"
                  >
                    <CheckCircle size={14} /> Bỏ qua
                  </button>

                  {/* Send Warning button */}
                  <button
                    onClick={() => handleResolve('WARNING')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Gửi thư cảnh cáo vào hòm thư chủ trọ"
                  >
                    <AlertTriangle size={14} /> Cảnh cáo chủ trọ
                  </button>

                  {/* Hide Post button */}
                  <button
                    onClick={() => handleResolve('HIDE_POST', 'Bài đăng bị ẩn do vi phạm tiêu chuẩn cộng đồng')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#EF4444',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)'
                    }}
                    title="Tạm ẩn hoặc khóa bài đăng/phòng trọ này"
                  >
                    <Trash2 size={14} /> Ẩn bài đăng
                  </button>

                  {/* Ban Landlord button */}
                  <button
                    onClick={() => handleResolve('BAN_USER', 'Khóa tài khoản do hành vi lừa đảo/vi phạm nghiêm trọng')}
                    disabled={submittingAction}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#DC2626',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: submittingAction ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Khóa tài khoản chủ trọ vi phạm vĩnh viễn"
                  >
                    <ShieldBan size={14} /> Khóa tài khoản
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Image Modal */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={previewImage} 
              alt="Bằng chứng phóng to" 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }} 
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;