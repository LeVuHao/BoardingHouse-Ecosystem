import React, { useState } from 'react';
import { AlertTriangle, MessageSquare, UserX, CheckCircle, XCircle, Trash2, Search, Eye, ShieldBan, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('DISPUTES');
  const [disputes, setDisputes] = useState([]);
  const [forumReports, setForumReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Warning Modal State
  const [warningModal, setWarningModal] = useState({ isOpen: false, reportId: null, message: '' });

  const handleResolveDispute = (id, action) => {
    setDisputes(disputes.map(d => d.id === id ? { ...d, status: 'RESOLVED' } : d));
    toast.success(`Đã xử lý khiếu nại ${id} (${action})`);
  };

  const handleResolveForumReport = (id, action) => {
    if (action === 'WARNING') {
      setWarningModal({ isOpen: true, reportId: id, message: '' });
      return;
    }
    
    setForumReports(forumReports.map(f => f.id === id ? { ...f, status: 'RESOLVED' } : f));
    if (action === 'DELETE_POST') toast.success(`Đã xóa bài viết vi phạm và đóng báo cáo ${id}`);
    else if (action === 'BAN_USER') toast.success(`Đã khóa tài khoản vi phạm vĩnh viễn`);
    else toast.success(`Đã bỏ qua báo cáo ${id}`);
  };

  const submitWarning = () => {
    if (!warningModal.message.trim()) {
      toast.error('Vui lòng nhập nội dung thư cảnh cáo');
      return;
    }
    setForumReports(forumReports.map(f => f.id === warningModal.reportId ? { ...f, status: 'RESOLVED' } : f));
    toast.success('Đã gửi thư cảnh cáo tới người đăng bài');
    setWarningModal({ isOpen: false, reportId: null, message: '' });
  };

  const matches = (item) => !searchQuery.trim() || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());

  const getStatusBadge = (status) => {
    if (status === 'RESOLVED') return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '600' }}>Đã giải quyết</span>;
    if (status === 'REJECTED') return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: '600' }}>Từ chối</span>;
    return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '600' }}>Chờ xử lý</span>;
  };

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)', fontWeight: '700' }}>Quản lý Khiếu nại & Báo cáo</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Xử lý các tranh chấp và nội dung vi phạm trên nền tảng</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setActiveTab('DISPUTES')} style={{ padding: '8px 20px', border: 'none', background: activeTab === 'DISPUTES' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'DISPUTES' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'DISPUTES' ? '600' : '500', borderRadius: '8px', cursor: 'pointer', boxShadow: activeTab === 'DISPUTES' ? 'var(--shadow-soft)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}><UserX size={18} />Tranh chấp người dùng</button>
          <button onClick={() => setActiveTab('FORUM')} style={{ padding: '8px 20px', border: 'none', background: activeTab === 'FORUM' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'FORUM' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'FORUM' ? '600' : '500', borderRadius: '8px', cursor: 'pointer', boxShadow: activeTab === 'FORUM' ? 'var(--shadow-soft)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}><MessageSquare size={18} />Bài đăng vi phạm</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '10px', width: '300px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input type="text" placeholder="Tìm kiếm báo cáo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '14px', background: 'transparent', color: 'var(--text-primary)' }} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--border-color)' }}>
        {activeTab === 'DISPUTES' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Mã KQ</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Người Tố Cáo / Bị Tố Cáo</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Lý Do</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {disputes.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>Chưa có khiếu nại nào cần xử lý.</td>
                  </tr>
                )}
                {disputes.filter((d) => matches(d)).map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{d.id}</td>
                    <td style={{ padding: '16px' }}><div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{d.reporter}</div><div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12}/> {d.target}</div></td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '250px' }}>{d.reason}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(d.status)}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {d.status === 'PENDING' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleResolveDispute(d.id, 'Đã cảnh cáo')} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldBan size={14} /> Cảnh cáo</button>
                          <button onClick={() => handleResolveDispute(d.id, 'Giải quyết ổn thỏa')} style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Đóng</button>
                        </div>
                      ) : (<button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Eye size={18} /></button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'FORUM' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Mã Báo Cáo</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Bài Viết Vi Phạm</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Lý Do Báo Cáo</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Người Báo Cáo</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Trạng Thái</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {forumReports.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>Chưa có báo cáo bài đăng vi phạm nào.</td>
                  </tr>
                )}
                {forumReports.filter((f) => matches(f)).map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{f.id}</td>
                    <td style={{ padding: '16px', maxWidth: '250px' }}><div style={{ fontSize: '13px', color: '#8B5CF6', fontWeight: '600', marginBottom: '4px' }}>{f.targetPostId} - {f.targetAuthor}</div><div style={{ fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '8px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '3px solid var(--border-color)' }}>"{f.contentSnippet}"</div></td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#EF4444', fontWeight: '500' }}>{f.reason}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-primary)' }}>{f.reporter}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(f.status)}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {f.status === 'PENDING' ? (
                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleResolveForumReport(f.id, 'WARNING')} style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={14} /> Cảnh cáo</button>
                          <button onClick={() => handleResolveForumReport(f.id, 'DELETE_POST')} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={14} /> Xóa Bài</button>
                          <button onClick={() => handleResolveForumReport(f.id, 'BAN_USER')} style={{ padding: '6px 12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldBan size={14} /> Khóa TK</button>
                       </div>
                      ) : (<button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Eye size={18} /></button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      {warningModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '500px', maxWidth: '90%', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#F59E0B" /> Gửi Thư Cảnh Cáo
              </h3>
              <button onClick={() => setWarningModal({ isOpen: false, reportId: null, message: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Thư này sẽ được gửi trực tiếp vào hòm thư thông báo của chủ bài đăng. Viết rõ lý do để người dùng biết và sửa đổi.
            </p>
            
            <textarea 
              rows={5}
              value={warningModal.message}
              onChange={(e) => setWarningModal({ ...warningModal, message: e.target.value })}
              placeholder="Nhập nội dung cảnh cáo (ví dụ: Bài đăng của bạn có ngôn từ không phù hợp, nếu tiếp tục vi phạm sẽ bị khóa tài khoản...)"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setWarningModal({ isOpen: false, reportId: null, message: '' })} style={{ padding: '8px 16px', background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Hủy
              </button>
              <button onClick={submitWarning} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Gửi cảnh cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;