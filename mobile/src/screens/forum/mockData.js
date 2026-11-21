// Dữ liệu demo — chỉ hiện khi không gọi được backend, để vẫn trình diễn được giao diện.
const ago = (m) => new Date(Date.now() - m * 60000).toISOString();

export const MOCK_ROOMMATE_POSTS = [
  { id: 1, roomId: 11, creatorId: 3, creatorName: 'Nguyễn Minh Anh', title: 'Tìm nữ ở ghép gần PTIT Hà Đông', priceShare: 1500000, status: 'OPEN', createdAt: ago(25),
    description: 'Phòng 25m², có gác lửng, wifi + máy lạnh. Mình là sinh viên năm 3, sống gọn gàng.\n---\n#truong: PTIT\n#gioitinh: Nữ\n#giogiac: Ngủ 23h, dậy 6h30\n#thoiquen: Không hút thuốc, Sạch sẽ' },
  { id: 2, roomId: 12, creatorId: 8, creatorName: 'Trần Quốc Bảo', title: 'Cần 1 bạn nam share phòng Bình Thạnh', priceShare: 2200000, status: 'OPEN', createdAt: ago(180),
    description: 'Gần HUTECH, đi bộ 5 phút. Phòng có ban công, bếp riêng.\n---\n#truong: HUTECH\n#gioitinh: Nam\n#giogiac: Ngủ 0h, dậy 7h\n#thoiquen: Có nuôi mèo' },
  { id: 3, roomId: 13, creatorId: 5, creatorName: 'Lê Thu Hà', title: 'Ở ghép Q.7 gần UEH, giá mềm', priceShare: 1800000, status: 'OPEN', createdAt: ago(1500),
    description: 'Mình đi làm part-time buổi tối, cần bạn ở cùng yên tĩnh.\n---\n#truong: UEH\n#gioitinh: Không yêu cầu\n#giogiac: Ngủ 22h30, dậy 6h\n#thoiquen: Không hút thuốc, Dậy sớm' },
];

export const MOCK_FORUM_POSTS = [
  { id: 101, landlordId: 20, landlordName: 'Chú Tư', title: 'Phòng trọ mới xây, full nội thất', price: 3200000, district: 'Hà Đông', city: 'Hà Nội',
    roommateNeeded: true, roommateCount: 1, images: [], createdAt: ago(60), description: 'Phòng 20m², đầy đủ tiện nghi.' },
  { id: 102, landlordId: 21, landlordName: 'Cô Lan', title: 'Phòng gác lửng gần chợ Thủ Đức', price: 2500000, district: 'Thủ Đức', city: 'TP.HCM',
    roommateNeeded: false, images: [], createdAt: ago(600), description: 'Giờ giấc tự do, có chỗ để xe.' },
];

export const MOCK_CONTRACTS = [
  { id: 1, roomId: 11, roomNumber: 'P203', propertyTitle: 'Nhà trọ Hà Đông', rentalPrice: 3000000, status: 'ACTIVE' },
  { id: 2, roomId: 15, roomNumber: 'P101', propertyTitle: 'Nhà trọ Bình Thạnh', rentalPrice: 4200000, status: 'ACTIVE' },
];

export const MOCK_INBOX = [
  { id: 1, postId: 101, postTitle: 'Phòng trọ mới xây, full nội thất', senderId: 20, senderName: 'Chú Tư', receiverId: 1, content: 'Phòng còn trống, bạn qua xem lúc nào?', isRead: false, createdAt: ago(10) },
  { id: 2, postId: 102, postTitle: 'Phòng gác lửng gần chợ Thủ Đức', senderId: 1, senderName: 'Bạn', receiverId: 21, content: 'Dạ cho em hỏi giá điện bao nhiêu ạ?', isRead: true, createdAt: ago(300) },
];

export const MOCK_CHAT = (otherUserId, myId) => [
  { id: 1, senderId: myId, receiverId: otherUserId, content: 'Chào bạn, mình thấy tin ở ghép của bạn.', createdAt: ago(40) },
  { id: 2, senderId: otherUserId, receiverId: myId, content: 'Chào bạn! Phòng vẫn còn chỗ nhé.', createdAt: ago(35) },
  { id: 3, senderId: myId, receiverId: otherUserId, content: 'Mình có thể qua xem phòng tối nay không?', createdAt: ago(30) },
  { id: 4, senderId: otherUserId, receiverId: myId, content: 'Được, 7h tối nha. Mình gửi địa chỉ cụ thể sau.', createdAt: ago(28) },
];
