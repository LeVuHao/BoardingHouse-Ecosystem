SET NAMES utf8mb4;

CREATE TEMPORARY TABLE demo_south_properties (
    owner_email VARCHAR(100) NOT NULL,
    property_title VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    utilities VARCHAR(500) NOT NULL
);

INSERT INTO demo_south_properties
    (owner_email, property_title, address, city, district, ward, latitude, longitude, utilities)
VALUES
    ('demo.chutro11@roomily.test', 'DEMO Khu trọ SG 11 - Bình Thạnh', 'Số 21 đường Nguyễn Gia Trí', 'TP. Hồ Chí Minh', 'Bình Thạnh', 'Phường 25', 10.8010, 106.7100, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro12@roomily.test', 'DEMO Khu trọ SG 12 - Thủ Đức', 'Số 15 đường Võ Văn Ngân', 'TP. Hồ Chí Minh', 'Thủ Đức', 'Linh Chiểu', 10.8490, 106.7530, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro13@roomily.test', 'DEMO Khu trọ SG 13 - Gò Vấp', 'Số 32 đường Quang Trung', 'TP. Hồ Chí Minh', 'Gò Vấp', 'Phường 10', 10.8380, 106.6650, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro14@roomily.test', 'DEMO Khu trọ SG 14 - Tân Bình', 'Số 18 đường Cộng Hòa', 'TP. Hồ Chí Minh', 'Tân Bình', 'Phường 4', 10.8010, 106.6520, 'WiFi,Điều hòa,Máy giặt,Bếp riêng'),
    ('demo.chutro15@roomily.test', 'DEMO Khu trọ SG 15 - Quận 10', 'Số 27 đường Thành Thái', 'TP. Hồ Chí Minh', 'Quận 10', 'Phường 14', 10.7720, 106.6670, 'WiFi,Điều hòa,Bãi xe,Thang máy'),
    ('demo.chutro16@roomily.test', 'DEMO Khu trọ SG 16 - Phú Nhuận', 'Số 11 đường Huỳnh Văn Bánh', 'TP. Hồ Chí Minh', 'Phú Nhuận', 'Phường 11', 10.7990, 106.6800, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro17@roomily.test', 'DEMO Khu trọ SG 17 - Tân Phú', 'Số 24 đường Lũy Bán Bích', 'TP. Hồ Chí Minh', 'Tân Phú', 'Tân Thới Hòa', 10.7910, 106.6270, 'WiFi,Điều hòa,Bãi xe,Bếp riêng'),
    ('demo.chutro18@roomily.test', 'DEMO Khu trọ SG 18 - Bình Tân', 'Số 19 đường Kinh Dương Vương', 'TP. Hồ Chí Minh', 'Bình Tân', 'An Lạc', 10.7490, 106.6050, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro19@roomily.test', 'DEMO Khu trọ SG 19 - Quận 7', 'Số 16 đường Nguyễn Thị Thập', 'TP. Hồ Chí Minh', 'Quận 7', 'Tân Phong', 10.7340, 106.7210, 'WiFi,Điều hòa,Thang máy,Camera an ninh'),
    ('demo.chutro20@roomily.test', 'DEMO Khu trọ SG 20 - Quận 3', 'Số 29 đường Cách Mạng Tháng 8', 'TP. Hồ Chí Minh', 'Quận 3', 'Phường 10', 10.7820, 106.6840, 'WiFi,Điều hòa,Bãi xe,Máy giặt'),
    ('demo.chutro21@roomily.test', 'DEMO Khu trọ ĐN 21 - Hải Châu', 'Số 17 đường Nguyễn Văn Linh', 'Đà Nẵng', 'Hải Châu', 'Nam Dương', 16.0610, 108.2200, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro22@roomily.test', 'DEMO Khu trọ ĐN 22 - Thanh Khê', 'Số 25 đường Điện Biên Phủ', 'Đà Nẵng', 'Thanh Khê', 'Chính Gián', 16.0700, 108.1900, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro23@roomily.test', 'DEMO Khu trọ ĐN 23 - Sơn Trà', 'Số 12 đường Ngô Quyền', 'Đà Nẵng', 'Sơn Trà', 'An Hải Bắc', 16.0800, 108.2390, 'WiFi,Điều hòa,Bếp riêng,Bãi xe'),
    ('demo.chutro24@roomily.test', 'DEMO Khu trọ ĐN 24 - Ngũ Hành Sơn', 'Số 30 đường Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Mỹ An', 16.0150, 108.2490, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro25@roomily.test', 'DEMO Khu trọ ĐN 25 - Liên Chiểu', 'Số 20 đường Nguyễn Lương Bằng', 'Đà Nẵng', 'Liên Chiểu', 'Hòa Khánh Bắc', 16.0730, 108.1470, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro26@roomily.test', 'DEMO Khu trọ ĐN 26 - Cẩm Lệ', 'Số 14 đường Ông Ích Đường', 'Đà Nẵng', 'Cẩm Lệ', 'Khuê Trung', 16.0130, 108.1910, 'WiFi,Điều hòa,Máy giặt,Bếp riêng'),
    ('demo.chutro27@roomily.test', 'DEMO Khu trọ ĐN 27 - Hải Châu', 'Số 22 đường 2 Tháng 9', 'Đà Nẵng', 'Hải Châu', 'Bình Hiên', 16.0470, 108.2210, 'WiFi,Điều hòa,Bãi xe,Thang máy'),
    ('demo.chutro28@roomily.test', 'DEMO Khu trọ ĐN 28 - Sơn Trà', 'Số 18 đường Lê Đức Thọ', 'Đà Nẵng', 'Sơn Trà', 'Thọ Quang', 16.1050, 108.2600, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro29@roomily.test', 'DEMO Khu trọ ĐN 29 - Hòa Vang', 'Số 10 đường Phạm Hùng', 'Đà Nẵng', 'Hòa Vang', 'Hòa Châu', 15.9900, 108.1900, 'WiFi,Điều hòa,Bãi xe,Bếp riêng'),
    ('demo.chutro30@roomily.test', 'DEMO Khu trọ ĐN 30 - Ngũ Hành Sơn', 'Số 26 đường Trần Đại Nghĩa', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Hòa Hải', 15.9900, 108.2630, 'WiFi,Điều hòa,Máy giặt,Bãi xe');

UPDATE db_auth.users
SET full_name = CONCAT('Demo Landlord ', LPAD(SUBSTRING(email, 12, 2), 2, '0'))
WHERE email REGEXP '^demo\\.chutro(1[1-9]|2[0-9]|30)@roomily\\.test$'
  AND role = 'LANDLORD';

CREATE TEMPORARY TABLE demo_south_rooms (
    room_number VARCHAR(20) NOT NULL,
    room_index INT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    area DECIMAL(6, 2) NOT NULL,
    capacity INT NOT NULL,
    utilities VARCHAR(500) NOT NULL
);

INSERT INTO demo_south_rooms
    (room_number, room_index, room_type, price, area, capacity, utilities)
VALUES
    ('P101', 1, 'Phòng trọ khép kín', 2500000, 18, 2, 'WiFi,Điều hòa,Bãi xe'),
    ('P102', 2, 'Phòng trọ khép kín', 3200000, 22, 2, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('P103', 3, 'Studio', 4500000, 28, 2, 'WiFi,Điều hòa,Bếp riêng,Thang máy'),
    ('P104', 4, 'Studio', 5500000, 32, 3, 'WiFi,Điều hòa,Máy giặt,Bếp riêng'),
    ('P105', 5, 'Căn hộ mini', 6800000, 40, 3, 'WiFi,Điều hòa,Máy giặt,Bãi xe,Camera an ninh');

INSERT INTO db_property_rental.properties
    (landlord_id, title, description, address, city, district, ward, utilities, latitude, longitude)
SELECT u.id, d.property_title,
       'DỮ LIỆU DEMO GIẢ LẬP - địa điểm và tin minh họa, không phải nhà/phòng cho thuê đã xác minh.',
       d.address, d.city, d.district, d.ward, d.utilities, d.latitude, d.longitude
FROM demo_south_properties d
JOIN db_auth.users u ON u.email = d.owner_email AND u.role = 'LANDLORD'
WHERE NOT EXISTS (
    SELECT 1
    FROM db_property_rental.properties existing
    WHERE existing.landlord_id = u.id
      AND existing.title LIKE 'DEMO Khu trọ %'
);

UPDATE db_property_rental.properties p
JOIN db_auth.users u ON u.id = p.landlord_id AND u.role = 'LANDLORD'
JOIN demo_south_properties d ON d.owner_email = u.email
SET p.title = d.property_title,
    p.description = 'DỮ LIỆU DEMO GIẢ LẬP - địa điểm và tin minh họa, không phải nhà/phòng cho thuê đã xác minh.',
    p.address = d.address,
    p.city = d.city,
    p.district = d.district,
    p.ward = d.ward,
    p.utilities = d.utilities,
    p.latitude = d.latitude,
    p.longitude = d.longitude;

INSERT INTO db_property_rental.rooms
    (property_id, room_number, price, area, capacity, current_occupants, status, version)
SELECT p.id, r.room_number, r.price, r.area, r.capacity, 0, 'AVAILABLE', 0
FROM demo_south_properties d
JOIN db_auth.users u ON u.email = d.owner_email AND u.role = 'LANDLORD'
JOIN db_property_rental.properties p ON p.landlord_id = u.id AND p.title = d.property_title
CROSS JOIN demo_south_rooms r
WHERE p.title = d.property_title
  AND NOT EXISTS (
      SELECT 1 FROM db_property_rental.rooms existing
      WHERE existing.property_id = p.id AND existing.room_number = r.room_number
  );

INSERT INTO db_property_rental.forum_posts
    (landlord_id, landlord_name, title, description, price, address, city, district, ward,
     contact_phone, room_area, room_type, utilities, room_id, is_rented, roommate_needed,
     roommate_count, roommate_note, latitude, longitude, nearby_places, status, created_at, updated_at)
SELECT u.id,
       u.full_name,
       CONCAT('[DEMO] ', r.room_type, ' ', r.room_number, ' - ', d.district, ' (tin minh họa)'),
       CONCAT(
           'TIN DEMO GIẢ LẬP - nội dung minh họa chức năng tìm phòng, không phải phòng có thật ',
           'và chưa được chủ trọ xác minh. Khu vực: ', d.ward, ', ', d.district, ', ', d.city,
           '. Tiện ích tham khảo: ', r.utilities, '. Liên hệ chỉ là số mẫu.'
       ),
       r.price, d.address, d.city, d.district, d.ward,
       CONCAT('000000', LPAD(CAST(((CAST(SUBSTRING(d.owner_email, 12, 2) AS UNSIGNED) - 11) * 5)
                                  + r.room_index AS CHAR), 4, '0')),
       r.area, r.room_type, r.utilities, room.id, b'0', b'0', NULL, NULL,
       d.latitude + ((r.room_index - 3) * 0.00008),
       d.longitude + ((r.room_index - 3) * 0.00008),
       JSON_ARRAY(JSON_OBJECT(
           'id', CONCAT('demo-place-', room.id),
           'name', 'Tiện ích khu vực (dữ liệu demo)',
           'category', 'amenity',
           'distanceMeters', 500,
           'latitude', d.latitude,
           'longitude', d.longitude
       )),
       'ACTIVE', NOW(6), NOW(6)
FROM demo_south_properties d
JOIN db_auth.users u ON u.email = d.owner_email AND u.role = 'LANDLORD'
JOIN db_property_rental.properties p ON p.landlord_id = u.id AND p.title = d.property_title
CROSS JOIN demo_south_rooms r
JOIN db_property_rental.rooms room ON room.property_id = p.id AND room.room_number = r.room_number
WHERE NOT EXISTS (
    SELECT 1 FROM db_property_rental.forum_posts existing
    WHERE existing.room_id = room.id
);

UPDATE db_property_rental.forum_posts post
JOIN db_property_rental.rooms room ON room.id = post.room_id
JOIN db_property_rental.properties p ON p.id = room.property_id
JOIN db_auth.users u ON u.id = p.landlord_id
JOIN demo_south_properties d ON d.owner_email = u.email
JOIN demo_south_rooms r ON r.room_number = room.room_number
SET post.landlord_id = u.id,
    post.landlord_name = u.full_name,
    post.title = CONCAT('[DEMO] ', r.room_type, ' ', r.room_number, ' - ', d.district, ' (tin minh họa)'),
    post.description = CONCAT(
        'TIN DEMO GIẢ LẬP - nội dung minh họa chức năng tìm phòng, không phải phòng có thật ',
        'và chưa được chủ trọ xác minh. Khu vực: ', d.ward, ', ', d.district, ', ', d.city,
        '. Tiện ích tham khảo: ', r.utilities, '. Liên hệ chỉ là số mẫu.'
    ),
    post.price = r.price,
    post.address = d.address,
    post.city = d.city,
    post.district = d.district,
    post.ward = d.ward,
    post.contact_phone = CONCAT('000000', LPAD(CAST(((CAST(SUBSTRING(d.owner_email, 12, 2) AS UNSIGNED) - 11) * 5)
                                                    + r.room_index AS CHAR), 4, '0')),
    post.room_area = r.area,
    post.room_type = r.room_type,
    post.utilities = r.utilities,
    post.latitude = d.latitude + ((r.room_index - 3) * 0.00008),
    post.longitude = d.longitude + ((r.room_index - 3) * 0.00008),
    post.nearby_places = JSON_ARRAY(JSON_OBJECT(
        'id', CONCAT('demo-place-', room.id),
        'name', 'Tiện ích khu vực (dữ liệu demo)',
        'category', 'amenity',
        'distanceMeters', 500,
        'latitude', d.latitude,
        'longitude', d.longitude
    )),
    post.status = 'ACTIVE',
    post.updated_at = NOW(6)
WHERE post.room_id = room.id;
