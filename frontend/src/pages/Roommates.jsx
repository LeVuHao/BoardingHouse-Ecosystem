import React, { useState, useEffect } from 'react';
import { rentalApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Plus, Eye, Check } from 'lucide-react';

const Roommates = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [introduction, setIntroduction] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceShare, setPriceShare] = useState('');

  // Xem & Duyệt danh sách Join Requests
  const [viewRequestsPost, setViewRequestsPost] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await rentalApi.getRoommatePosts();
      setPosts(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleJoin = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập!');
      return;
    }
    try {
      await rentalApi.sendJoinRequest(selectedPost.id, { introduction });
      alert('Đã gửi yêu cầu ở ghép thành công!');
      setSelectedPost(null);
      setIntroduction('');
    } catch (err) {
      alert(err.message || 'Lỗi gửi yêu cầu');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await rentalApi.createRoommatePost({
        roomId: Number(roomId),
        title,
        description,
        priceShare: Number(priceShare),
      });
      alert('Đăng bài tìm bạn ở ghép thành công!');
      setShowCreateModal(false);
      setRoomId('');
      setTitle('');
      setDescription('');
      setPriceShare('');
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Lỗi tạo bài');
    }
  };

  const handleViewJoinRequests = async (post) => {
    setViewRequestsPost(post);
    setLoadingRequests(true);
    try {
      const res = await rentalApi.getJoinRequests(post.id);
      setJoinRequests(res.data || []);
    } catch (err) {
      alert(err.message || 'Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveJoin = async (requestId) => {
    try {
      const res = await rentalApi.approveJoinRequest(requestId);
      if (res.data?.approved) {
        alert(`Duyệt thành công! ${res.data.message || ''}`);
      } else {
        alert(`Từ chối: ${res.data?.message || 'Phòng đã đủ chỗ'}`);
      }
      if (viewRequestsPost) {
        handleViewJoinRequests(viewRequestsPost);
      }
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Lỗi khi duyệt yêu cầu');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Tìm Bạn Ở Ghép & Chia Sẻ Tiền Phòng</h2>
          <p style={{ color: 'var(--text-muted)' }}>Kết nối những người bạn cùng phòng văn minh, tiết kiệm chi phí</p>
        </div>
        {user && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} /> Đăng bài tìm bạn
          </button>
        )}
      </div>

      {loadingPosts ? (
        <div className="rooms-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="room-card" style={{ padding: '1.5rem', height: '240px' }}>
              <div style={{ height: '20px', width: '30%', marginBottom: '1rem' }} className="skeleton" />
              <div style={{ height: '24px', width: '80%', marginBottom: '0.8rem' }} className="skeleton" />
              <div style={{ height: '40px', width: '100%', marginBottom: '1rem' }} className="skeleton" />
              <div style={{ height: '36px', width: '100%', marginTop: 'auto' }} className="skeleton" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3>Chưa có bài đăng tìm người ở ghép nào</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Hãy là người đầu tiên đăng bài để tìm bạn cùng chia sẻ tiền phòng!</p>
          {user && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              <Plus size={18} /> Đăng bài ngay
            </button>
          )}
        </div>
      ) : (
        <div className="rooms-grid">
          {posts.map((post) => (
            <div key={post.id} className="room-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className={`badge ${post.status === 'OPEN' ? 'badge-success' : 'badge-danger'}`}>
                  {post.status}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>{post.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem', flex: 1 }}>
                {post.description}
              </p>

              <div className="room-price" style={{ fontSize: '1.15rem' }}>
                Chia sẻ: {Number(post.priceShare).toLocaleString('vi-VN')} đ/người
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setSelectedPost(post)}
                  disabled={post.status !== 'OPEN'}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <UserPlus size={16} /> Xin ở ghép
                </button>

              {(user?.role === 'ROLE_LANDLORD' || user?.id === post.creatorId) && (
                <button
                  onClick={() => handleViewJoinRequests(post)}
                  className="btn btn-outline"
                  title="Xem & Duyệt danh sách xin ở ghép"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Join Request Modal */}
      {selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Xin vào ở ghép bài: {selectedPost.title}</h3>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Giới thiệu bản thân (thói quen, tính cách, nghề nghiệp...)</label>
              <textarea
                rows={4}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Chào bạn, mình là người gọn gàng, không hút thuốc..."
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPost(null)} className="btn btn-outline">Hủy</button>
              <button onClick={handleJoin} className="btn btn-primary">Gửi lời nhắn</button>
            </div>
          </div>
        </div>
      )}

      {/* View Join Requests Modal (Landlord / Post Creator) */}
      {viewRequestsPost && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <h3>Danh sách xin ở ghép: {viewRequestsPost.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Phòng ID: {viewRequestsPost.roomId} (Được kiểm soát tranh chấp bởi Redis Distributed Lock)
            </p>

            {loadingRequests ? (
              <p>Đang tải...</p>
            ) : joinRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: '1.5rem 0' }}>Chưa có ai gửi yêu cầu xin ở ghép.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '350px', overflowY: 'auto' }}>
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-main)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div>
                        <strong>User #{req.userId}</strong> - Trạng thái:{' '}
                        <span
                          className={`badge ${
                            req.status === 'APPROVED'
                              ? 'badge-success'
                              : req.status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        Lời nhắn: {req.introduction || 'Không có'}
                      </div>
                    </div>

                    {req.status === 'PENDING' && user?.role === 'ROLE_LANDLORD' && (
                      <button
                        onClick={() => handleApproveJoin(req.id)}
                        className="btn btn-success"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        <Check size={14} /> Duyệt (Redis Lock)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setViewRequestsPost(null)} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Đăng bài tìm người ở ghép</h3>
            <form onSubmit={handleCreatePost} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Mã phòng của bạn (Room ID)</label>
                <input
                  type="number"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Nhập ID phòng bạn đang thuê..."
                />
              </div>
              <div className="form-group">
                <label>Tiêu đề bài đăng</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tìm bạn nữ ở ghép phòng full đồ..."
                />
              </div>
              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chi phí điện nước, nội thất, yêu cầu lối sống..."
                />
              </div>
              <div className="form-group">
                <label>Giá chia sẻ mỗi người (VNĐ)</label>
                <input
                  type="number"
                  required
                  value={priceShare}
                  onChange={(e) => setPriceShare(e.target.value)}
                  placeholder="1500000"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Đăng bài</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roommates;
