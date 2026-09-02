import React, { useState, useEffect } from 'react';
import { rentalApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Plus } from 'lucide-react';

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

  const fetchPosts = async () => {
    try {
      const res = await rentalApi.getRoommatePosts();
      setPosts(res.data.content || []);
    } catch (err) {
      console.error(err);
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
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Lỗi tạo bài');
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

      <div className="rooms-grid">
        {posts.map((post) => (
          <div key={post.id} className="room-card" style={{ padding: '1.5rem' }}>
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

            <button
              onClick={() => setSelectedPost(post)}
              disabled={post.status !== 'OPEN'}
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              <UserPlus size={16} /> Xin vào ở ghép
            </button>
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
