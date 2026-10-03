import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { isInWishlist, toggleWishlist } from "../utils/wishlist";
import toast from "react-hot-toast";

const WishlistButton = ({ post, style = {}, showText = true }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(isInWishlist(post.id));
  }, [post.id]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(post);
    const saved = isInWishlist(post.id);
    setIsSaved(saved);
    if (saved) {
      toast.success("Đã lưu phòng vào danh sách yêu thích");
    } else {
      toast.success("Đã bỏ lưu phòng");
    }
  };

  return (
    <button 
      onClick={handleToggle}
      style={{ 
        background: "transparent", 
        border: "none", 
        display: "flex", 
        alignItems: "center", 
        gap: "8px", 
        color: isSaved ? "#e11d48" : "#64748b", 
        fontWeight: "500", 
        cursor: "pointer", 
        fontSize: "14px",
        ...style 
      }}
    >
      <Heart size={18} fill={isSaved ? "#e11d48" : "none"} color={isSaved ? "#e11d48" : "#64748b"} />
      {showText && (isSaved ? "Đã yêu thích" : "Yêu thích")}
    </button>
  );
};

export default WishlistButton;
