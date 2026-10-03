export const getWishlist = () => {
  const data = localStorage.getItem("roomily_wishlist");
  return data ? JSON.parse(data) : [];
};

export const toggleWishlist = (post) => {
  let list = getWishlist();
  const index = list.findIndex(item => item.id === post.id);
  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(post);
  }
  localStorage.setItem("roomily_wishlist", JSON.stringify(list));
  return list;
};

export const isInWishlist = (id) => {
  const list = getWishlist();
  return list.some(item => item.id === id);
};
