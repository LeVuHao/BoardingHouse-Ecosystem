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

  const matches = (item) => !searchQuery.trim() || JSON.stringify(item).toLowerCase().includes(searchQuery.trim().toLowerCase());

  const getStatusBadge = (status) => {
    if (status === 'RESOLVED') return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: '#DCFCE7', color: '#166534', fontWeight: '600' }}>Đã giải quyết</span>;
    if (status === 'REJECTED') return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: '#FEE2E2', color: '#991B1B', fontWeight: '600' }}>Từ chối</span>;
    return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: '#FEF3C7', color: '#92400E', fontWeight: '600' }}>Chờ xử lý</span>;
  };

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0F172A', fontWeight: '700' }}>Quản lý Khiếu nại & Báo cáo</h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Xử lý các tranh chấp và nội dung vi phạm trên nền tảng</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setActiveTab('DISPUTES')} style={{ padding: '8px 20px', border: 'none', background: activeTab === 'DISPUTES' ? 'white' : 'transparent', color: activeTab === 'DISPUTES' ? '#0F172A' : '#64748B', fontWeight: activeTab === 'DISPUTES' ? '600' : '500', borderRadius: '8px', cursor: 'pointer', boxShadow: activeTab === 'DISPUTES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}><UserX size={18} />Tranh chấp người dùng</button>
          <button onClick={() => setActiveTab('FORUM')} style={{ padding: '8px 20px', border: 'none', background: activeTab === 'FORUM' ? 'white' : 'transparent', color: activeTab === 'FORUM' ? '#0F172A' : '#64748B', fontWeight: activeTab === 'FORUM' ? '600' : '500', borderRadius: '8px', cursor: 'pointer', boxShadow: activeTab === 'FORUM' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}><MessageSquare size={18} />Bài đăng vi phạm</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '10px', width: '300px' }}>
          <Search size={18} color="#94A3B8" />
          <input type="text" placeholder="Tìm kiếm báo cáo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '14px' }} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
        {activeTab === 'DISPUTES' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '13px', textTransform: 'uppercase' }}>
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
                    <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Chưa có khiếu nại nào cần xử lý.</td>
                  </tr>
                )}
                {disputes.filter((d) => matches(d)).map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#0F172A' }}>{d.id}</td>
                    <td style={{ padding: '16px' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{d.reporter}</div><div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12}/> {d.target}</div></td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569', maxWidth: '250px' }}>{d.reason}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(d.status)}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {d.status === 'PENDING' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleResolveDispute(d.id, 'Đã cảnh cáo')} style={{ padding: '6px 12px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldBan size={14} /> Cảnh cáo</button>
                          <button onClick={() => handleResolveDispute(d.id, 'Giải quyết ổn thỏa')} style={{ padding: '6px 12px', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Đóng</button>
                        </div>
                      ) : (<button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Eye size={18} /></button>)}
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
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '13px', textTransform: 'uppercase' }}>
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
                    <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Chưa có báo cáo bài đăng vi phạm nào.</td>
                  </tr>
                )}
                {forumReports.filter((f) => matches(f)).map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#0F172A' }}>{f.id}</td>
                    <td style={{ padding: '16px', maxWidth: '250px' }}><div style={{ fontSize: '13px', color: '#8B5CF6', fontWeight: '600', marginBottom: '4px' }}>{f.targetPostId} - {f.targetAuthor}</div><div style={{ fontSize: '14px', color: '#475569', background: '#F8FAFC', padding: '8px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '3px solid #E2E8F0' }}>"{f.contentSnippet}"</div></td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#EF4444', fontWeight: '500' }}>{f.reason}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A' }}>{f.reporter}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(f.status)}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {f.status === 'PENDING' ? (
                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleResolveForumReport(f.id, 'WARNING')} style={{ padding: '6px 12px', background: '#FEF9C3', color: '#A16207', border: '1px solid #FEF08A', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={14} /> Cảnh cáo</button>
                          <button onClick={() => handleResolveForumReport(f.id, 'DELETE_POST')} style={{ padding: '6px 12px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={14} /> Xóa Bài</button>
                          <button onClick={() => handleResolveForumReport(f.id, 'BAN_USER')} style={{ padding: '6px 12px', background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldBan size={14} /> Khóa TK</button>
                       </div>
                      ) : (<button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Eye size={18} /></button>)}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#A16207" /> Gửi Thư Cảnh Cáo
              </h3>
              <button onClick={() => setWarningModal({ isOpen: false, reportId: null, message: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569' }}>
              Thư này sẽ được gửi trực tiếp vào hòm thư thông báo của chủ bài đăng. Viết rõ lý do để người dùng biết và sửa đổi.
            </p>
            
            <textarea 
              rows={5}
              value={warningModal.message}
              onChange={(e) => setWarningModal({ ...warningModal, message: e.target.value })}
              placeholder="Nhập nội dung cảnh cáo (ví dụ: Bài đăng của bạn có ngôn từ không phù hợp, nếu tiếp tục vi phạm sẽ bị khóa tài khoản...)"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', resize: 'none', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setWarningModal({ isOpen: false, reportId: null, message: '' })} style={{ padding: '8px 16px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Hủy
              </button>
              <button onClick={submitWarning} style={{ padding: '8px 16px', background: '#A16207', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
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