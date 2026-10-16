import React, { useState, useEffect } from 'react';
import { rentalApi, contractApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Plus, Eye, Check, Search, Filter, Home, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

const Roommates = () => {
  const { user } = useAuth();
  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'ROLE_LANDLORD';

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Join Modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [introduction, setIntroduction] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myContracts, setMyContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceShare, setPriceShare] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Xem & Duyệt danh sách Join Requests
  const [viewRequestsPost, setViewRequestsPost] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const params = {};
      if (cityFilter) params.city = cityFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await rentalApi.getRoommatePosts(params);
      setPosts(res.data?.content || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách bài đăng ở ghép');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [cityFilter, statusFilter]);

  const handleOpenCreateModal = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng bài tìm bạn ở ghép!');
      return;
    }
    setShowCreateModal(true);
    setLoadingContracts(true);
    try {
      const res = await contractApi.getMyContracts();
      const activeList = (res.data || []).filter((c) => c.status === 'ACTIVE');
      setMyContracts(activeList);
      if (activeList.length > 0) {
        setRoomId(String(activeList[0].roomId));
      }
    } catch (err) {
      console.error('Lỗi lấy hợp đồng:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập!');
      return;
    }
    if (!introduction.trim()) {
      toast.error('Vui lòng nhập đôi dòng giới thiệu bản thân!');
      return;
    }
    try {
      setSubmittingJoin(true);
      await rentalApi.sendJoinRequest(selectedPost.id, { introduction });
      toast.success('🎉 Đã gửi yêu cầu ở ghép thành công! Vui lòng chờ chủ trọ duyệt.');
      setSelectedPost(null);
      setIntroduction('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi gửi yêu cầu');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!roomId) {
      toast.error('Vui lòng chọn hoặc nhập mã phòng đang thuê!');
      return;
    }
    try {
      setSubmittingPost(true);
      await rentalApi.createRoommatePost({
        roomId: Number(roomId),
        title,
        description,
        priceShare: Number(priceShare),
      });
      toast.success('🎉 Đăng bài tìm bạn ở ghép thành công!');
      setShowCreateModal(false);
      setRoomId('');
      setTitle('');
      setDescription('');
      setPriceShare('');
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi tạo bài');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleViewJoinRequests = async (post) => {
    setViewRequestsPost(post);
    setLoadingRequests(true);
    try {
      const res = await rentalApi.getJoinRequests(post.id);
      setJoinRequests(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveJoin = async (requestId) => {
    try {
      const res = await rentalApi.approveJoinRequest(requestId);
      const data = res.data?.data || res.data;
      if (data?.approved) {
        toast.success(`Duyệt thành công! ${data.message || ''}`);
      } else {
        toast.error(`Từ chối: ${data?.message || 'Phòng đã đủ chỗ'}`);
      }
      if (viewRequestsPost) {
        handleViewJoinRequests(viewRequestsPost);
      }
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi duyệt yêu cầu');
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <Sparkles className="text-primary" size={26} /> Tìm Bạn Ở Ghép & Chia Sẻ Tiền Phòng
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0', fontSize: '0.92rem' }}>
            Kết nối những người bạn cùng phòng văn minh, chia sẻ chi phí sinh hoạt an toàn & tiện lợi
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
          <Plus size={18} /> Đăng bài tìm bạn
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '1rem 1.25rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tiêu đề, yêu cầu sống..."
            style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          style={{ padding: '0.55rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.88rem', cursor: 'pointer' }}
        >
          <option value="">Toàn quốc / Tất cả thành phố</option>
          <option value="Hà Nội">Hà Nội</option>
          <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.55rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.88rem', cursor: 'pointer' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="OPEN">Đang tìm bạn (Còn chỗ)</option>
          <option value="FULL">Đã đủ chỗ</option>
        </select>
      </div>

      {/* Posts List */}
      {loadingPosts ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          Đang tải danh sách bài đăng ở ghép...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <Home size={40} style={{ opacity: 0.3, marginBottom: '0.8rem' }} />
          <h4>Chưa có bài đăng ở ghép nào phù hợp</h4>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>Hãy là người đầu tiên đăng bài tìm bạn cùng phòng hôm nay!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      background: post.status === 'OPEN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: post.status === 'OPEN' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {post.status === 'OPEN' ? '🟢 ĐANG TÌM BẠN' : '🔴 ĐÃ ĐỦ NGƯỜI'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', margin: '0.4rem 0 0.6rem', lineHeight: 1.4, fontWeight: 700 }}>
                  {post.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5, minHeight: '40px' }}>
                  {post.description}
                </p>

                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chi phí chia sẻ:</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
                    {money(post.priceShare)}/tháng
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedPost(post)}
                  disabled={post.status !== 'OPEN'}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  <UserPlus size={16} /> Xin ở ghép
                </button>

                {(isLandlord || user?.id === post.creatorId) && (
                  <button
                    onClick={() => handleViewJoinRequests(post)}
                    className="btn btn-outline"
                    style={{ padding: '0.6rem 0.9rem' }}
                    title="Xem & Duyệt danh sách xin ở ghép"
                  >
                    <Eye size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL XIN Ở GHÉP */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '20px', maxWidth: '500px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 10px' }}>Xin vào ở ghép</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 16px' }}>
              Bài đăng: <strong>{selectedPost.title}</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                Giới thiệu bản thân (nghề nghiệp, lối sống, thói quen sinh hoạt):
              </label>
              <textarea
                rows={4}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Chào bạn, mình là sinh viên năm cuối, tính tình gọn gàng, không hút thuốc, ít tụ tập..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPost(null)} className="btn btn-outline" style={{ padding: '8px 18px' }}>
                Hủy
              </button>
              <button onClick={handleJoin} disabled={submittingJoin} className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                {submittingJoin ? 'Đang gửi...' : 'Gửi lời nhắn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM DANH SÁCH YÊU CẦU XIN Ở GHÉP */}
      {viewRequestsPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '20px', maxWidth: '580px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 4px' }}>Danh sách xin ở ghép</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Bài: <strong>{viewRequestsPost.title}</strong> • Phòng ID: {viewRequestsPost.roomId} (Kiểm soát tranh chấp Redis Lock)
            </p>

            {loadingRequests ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Đang tải yêu cầu...</p>
            ) : joinRequests.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'var(--bg-primary)', borderRadius: '12px' }}>
                Chưa có ai gửi yêu cầu xin ở ghép cho bài đăng này.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                        User #{req.userId} • Trạng thái:{' '}
                        <span style={{ color: req.status === 'APPROVED' ? '#10b981' : req.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                          {req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Lời nhắn: {req.introduction || 'Không có lời nhắn'}
                      </div>
                    </div>

                    {req.status === 'PENDING' && isLandlord && (
                      <button
                        onClick={() => handleApproveJoin(req.id)}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Check size={14} /> Duyệt (Redis Lock)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button onClick={() => setViewRequestsPost(null)} className="btn btn-outline" style={{ padding: '8px 20px' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO BÀI ĐĂNG TÌM Ở GHÉP */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '20px', maxWidth: '540px', width: '100%', padding: '26px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 6px' }}>Đăng bài tìm bạn ở ghép</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 18px' }}>
              Hệ thống sẽ đối soát bạn phải là người đang thuê phòng hợp lệ trước khi cho phép đăng bài.
            </p>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  Phòng bạn đang thuê:
                </label>
                {loadingContracts ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Đang kiểm tra phòng thuê của bạn...</div>
                ) : myContracts.length > 0 ? (
                  <select
                    required
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    {myContracts.map((c) => (
                      <option key={c.id} value={c.roomId}>
                        Phòng {c.roomNumber || c.roomId} - {c.propertyTitle || c.address || 'Khu trọ'} (Giá thuê: {money(c.rentalPrice)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="number"
                      required
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Nhập ID phòng bạn đang thuê..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      💡 Mẹo: Bạn có thể xem ID phòng trong mục <strong>Hợp đồng của tôi</strong>.
                    </small>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  Tiêu đề bài đăng:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tìm bạn nữ ở ghép phòng full đồ gần ĐH Bách Khoa..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  Mô tả chi tiết & Yêu cầu lối sống:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chi phí điện nước chia đều, phòng có sẵn máy giặt điều hòa, yêu cầu sạch sẽ không hút thuốc..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  Chi phí chia sẻ mỗi người (VNĐ/tháng):
                </label>
                <input
                  type="number"
                  required
                  min={100000}
                  step={50000}
                  value={priceShare}
                  onChange={(e) => setPriceShare(e.target.value)}
                  placeholder="1500000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" style={{ padding: '8px 20px' }}>
                  Hủy
                </button>
                <button type="submit" disabled={submittingPost} className="btn btn-primary" style={{ padding: '8px 24px', fontWeight: 700 }}>
                  {submittingPost ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roommates;
