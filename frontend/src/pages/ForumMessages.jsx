import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  MessageSquare, Phone, Clock, Eye, Send, Search, 
  User, CheckCheck, Sparkles, Building, ArrowLeft 
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { forumApi } from "../api/apiClient";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const ForumMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvKey, setActiveConvKey] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Tải toàn bộ tin nhắn 2 chiều để lập danh sách cuộc trò chuyện
  const fetchAllMessages = async () => {
    try {
      const res = await forumApi.getMyAllMessages();
      const list = res.data?.data || res.data || [];

      // Nhóm theo: postId + otherUserId (người đối thoại)
      const convMap = {};
      list.forEach((msg) => {
        const isMine = msg.senderId === user?.id;
        const otherUserId = isMine ? msg.receiverId : msg.senderId;
        const otherUserName = isMine ? "Người nhận #" + msg.receiverId : (msg.senderName || "Khách thuê");
        const otherUserPhone = isMine ? "" : (msg.senderPhone || "");
        const key = `${msg.postId}_${otherUserId}`;

        if (!convMap[key]) {
          convMap[key] = {
            key,
            postId: msg.postId,
            postTitle: msg.postTitle || `Bài đăng #${msg.postId}`,
            otherUserId,
            otherUserName,
            otherUserPhone,
            lastMessage: msg.content,
            lastTime: msg.createdAt,
            unreadCount: !isMine && !msg.isRead ? 1 : 0,
            messages: [],
          };
        } else {
          if (!isMine && !msg.isRead) {
            convMap[key].unreadCount += 1;
          }
          if (new Date(msg.createdAt) > new Date(convMap[key].lastTime)) {
            convMap[key].lastMessage = msg.content;
            convMap[key].lastTime = msg.createdAt;
          }
        }
        convMap[key].messages.push(msg);
      });

      const convList = Object.values(convMap).sort(
        (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
      );

      setConversations(convList);

      // Nếu chưa chọn conversation nào thì chọn conversation đầu tiên
      if (convList.length > 0 && !activeConvKey) {
        setActiveConvKey(convList[0].key);
        setChatMessages(convList[0].messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      }
    } catch (err) {
      console.error("Không thể tải tin nhắn", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMessages();
    const interval = setInterval(fetchAllMessages, 8000); // Polling mỗi 8 giây
    return () => clearInterval(interval);
  }, [user]);

  // Khi chọn conversation khác
  const handleSelectConv = (conv) => {
    setActiveConvKey(conv.key);
    // Sắp xếp tin nhắn theo thứ tự thời gian tăng dần
    const sorted = [...conv.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setChatMessages(sorted);

    // Đánh dấu đã đọc các tin nhắn chưa đọc
    conv.messages.forEach((m) => {
      if (!m.isRead && m.senderId !== user?.id) {
        forumApi.markMessageRead(m.id).catch(() => {});
      }
    });

    conv.unreadCount = 0;
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Gửi tin nhắn trả lời 2 chiều
  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeConv) return;

    const textToSend = replyText.trim();
    setSending(true);

    try {
      const payload = {
        content: textToSend,
        senderName: user.fullName || "Tôi",
        senderPhone: user.phoneNumber || "",
      };

      const res = await forumApi.replyMessage(activeConv.postId, activeConv.otherUserId, payload);
      const newMsg = res.data?.data || res.data;

      // Thêm ngay vào feed chat
      setChatMessages((prev) => [...prev, newMsg || {
        id: Date.now(),
        postId: activeConv.postId,
        senderId: user.id,
        senderName: user.fullName,
        receiverId: activeConv.otherUserId,
        content: textToSend,
        createdAt: new Date().toISOString(),
      }]);

      setReplyText("");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi tin nhắn phản hồi");
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.key === activeConvKey);

  // Lọc theo tìm kiếm
  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.postTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-shell">
      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 50 }}>
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={26} color="var(--brand-primary, #2563eb)" />
              Hộp thư Messenger Roomily
            </h1>
            <p className="muted" style={{ margin: "4px 0 0 0", fontSize: "0.85rem" }}>
              Trò chuyện trực tiếp 2 chiều giữa Khách thuê và Chủ trọ thời gian thực
            </p>
          </div>
          <Link to="/forum" className="btn btn-outline" style={{ fontSize: "0.85rem", gap: 6 }}>
            <ArrowLeft size={15} /> Diễn đàn trọ
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <b>Đang tải hộp thư...</b>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>💬</div>
            <b>Chưa có cuộc trò chuyện nào</b>
            <p className="muted" style={{ marginTop: 6, maxWidth: 460 }}>
              Khi bạn gửi hoặc nhận tin nhắn liên hệ về các bài đăng trên Diễn đàn, các cuộc trò chuyện sẽ tự động xuất hiện tại đây.
            </p>
            <Link to="/forum" className="btn btn-primary" style={{ marginTop: 16 }}>
              Khám phá bài đăng trên Diễn đàn
            </Link>
          </div>
        ) : (
          /* MESSENGER 2-COLUMN DASHBOARD */
          <div className="messenger-container">
            {/* LEFT COLUMN: CONVERSATION LIST */}
            <div className="messenger-sidebar">
              <div className="messenger-search-bar">
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc bài trọ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="messenger-conv-list">
                {filteredConversations.map((conv) => {
                  const isActive = conv.key === activeConvKey;
                  return (
                    <div
                      key={conv.key}
                      className={`messenger-conv-item ${isActive ? "active" : ""}`}
                      onClick={() => handleSelectConv(conv)}
                    >
                      <div className="messenger-conv-avatar">
                        {(conv.otherUserName || "U").charAt(0).toUpperCase()}
                        {conv.unreadCount > 0 && <span className="messenger-unread-dot"></span>}
                      </div>

                      <div className="messenger-conv-info">
                        <div className="messenger-conv-top">
                          <span className="messenger-conv-name">{conv.otherUserName}</span>
                          <span className="messenger-conv-time">{timeAgo(conv.lastTime)}</span>
                        </div>
                        <div className="messenger-conv-post-title">
                          <Building size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          {conv.postTitle}
                        </div>
                        <div className="messenger-conv-preview">
                          {conv.lastMessage}
                        </div>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="messenger-unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE CHAT WINDOW */}
            {activeConv ? (
              <div className="messenger-chat-window">
                {/* Chat Header */}
                <div className="messenger-chat-header">
                  <div className="messenger-chat-header-user">
                    <div className="avatar" style={{ width: 44, height: 44, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white" }}>
                      {(activeConv.otherUserName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--ink)" }}>
                        {activeConv.otherUserName}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        {activeConv.otherUserPhone && (
                          <span>
                            <Phone size={12} style={{ verticalAlign: "middle" }} /> {activeConv.otherUserPhone}
                          </span>
                        )}
                        <span>• Bài: <strong>{activeConv.postTitle}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Link 
                      to={`/forum/${activeConv.postId}`} 
                      className="btn btn-outline" 
                      style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                    >
                      <Eye size={14} /> Xem bài đăng
                    </Link>
                  </div>
                </div>

                {/* Messages Stream (Bong bóng chat 2 chiều) */}
                <div className="messenger-messages-stream">
                  {chatMessages.map((msg, index) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div 
                        key={msg.id || index} 
                        className={`messenger-bubble-wrapper ${isMine ? "bubble-mine" : "bubble-theirs"}`}
                      >
                        {!isMine && (
                          <div className="messenger-bubble-avatar">
                            {(msg.senderName || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="messenger-bubble-container">
                          {!isMine && (
                            <div className="messenger-bubble-author-name">
                              {msg.senderName || "Khách"}
                            </div>
                          )}
                          <div className="messenger-bubble-content">
                            {msg.content}
                          </div>
                          <div className="messenger-bubble-time">
                            {formatTime(msg.createdAt)}
                            {isMine && <CheckCheck size={12} style={{ marginLeft: 4 }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar (Thanh nhập tin nhắn trả lời) */}
                <form className="messenger-input-bar" onSubmit={handleSendReply}>
                  <textarea
                    rows={1}
                    placeholder="Nhập tin nhắn trả lời... (Nhấn Enter để gửi)"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary messenger-send-btn"
                    disabled={sending || !replyText.trim()}
                  >
                    <Send size={16} />
                    {sending ? "..." : "Gửi"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="messenger-empty-chat">
                <MessageSquare size={48} color="var(--text-muted)" />
                <h3>Chọn một cuộc trò chuyện để bắt đầu chat</h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumMessages;
