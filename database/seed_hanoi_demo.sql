SET NAMES utf8mb4;

CREATE TEMPORARY TABLE demo_hanoi_properties (
    owner_email VARCHAR(100) NOT NULL,
    property_title VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    utilities VARCHAR(500) NOT NULL
);

INSERT INTO demo_hanoi_properties
    (owner_email, property_title, address, district, ward, latitude, longitude, utilities)
VALUES
    ('demo.chutro01@roomily.test', 'DEMO Khu trọ 01 - Đống Đa', 'Số 18 ngõ 75 phố Láng Hạ', 'Đống Đa', 'Láng Hạ', 21.0125000, 105.8021000, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro02@roomily.test', 'DEMO Khu trọ 02 - Cầu Giấy', 'Số 26 ngõ 68 phố Cầu Giấy', 'Cầu Giấy', 'Dịch Vọng', 21.0365000, 105.7907000, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro03@roomily.test', 'DEMO Khu trọ 03 - Hai Bà Trưng', 'Số 12 ngõ 45 phố Bạch Mai', 'Hai Bà Trưng', 'Bạch Mai', 21.0048000, 105.8452000, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro04@roomily.test', 'DEMO Khu trọ 04 - Thanh Xuân', 'Số 35 ngõ 29 phố Nhân Hòa', 'Thanh Xuân', 'Nhân Chính', 20.9997000, 105.8015000, 'WiFi,Điều hòa,Máy giặt,Bếp riêng'),
    ('demo.chutro05@roomily.test', 'DEMO Khu trọ 05 - Nam Từ Liêm', 'Số 20 ngõ 63 phố Lê Đức Thọ', 'Nam Từ Liêm', 'Mỹ Đình 1', 21.0288000, 105.7652000, 'WiFi,Điều hòa,Bãi xe,Thang máy'),
    ('demo.chutro06@roomily.test', 'DEMO Khu trọ 06 - Hà Đông', 'Số 16 ngõ 8 phố Quang Trung', 'Hà Đông', 'Mộ Lao', 20.9800000, 105.7750000, 'WiFi,Điều hòa,Bãi xe,Camera an ninh'),
    ('demo.chutro07@roomily.test', 'DEMO Khu trọ 07 - Long Biên', 'Số 22 ngõ 154 phố Ngọc Lâm', 'Long Biên', 'Ngọc Lâm', 21.0460000, 105.8775000, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('demo.chutro08@roomily.test', 'DEMO Khu trọ 08 - Hoàng Mai', 'Số 10 ngõ 139 phố Tân Mai', 'Hoàng Mai', 'Tân Mai', 20.9840000, 105.8585000, 'WiFi,Điều hòa,Bãi xe,Bếp riêng'),
    ('demo.chutro09@roomily.test', 'DEMO Khu trọ 09 - Ba Đình', 'Số 14 ngõ 189 phố Đội Cấn', 'Ba Đình', 'Đội Cấn', 21.0342000, 105.8237000, 'WiFi,Điều hòa,Máy giặt,Camera an ninh'),
    ('demo.chutro10@roomily.test', 'DEMO Khu trọ 10 - Tây Hồ', 'Số 28 ngõ 38 phố Xuân La', 'Tây Hồ', 'Xuân La', 21.0702000, 105.8122000, 'WiFi,Điều hòa,Bãi xe,Thang máy');

UPDATE db_auth.users
SET full_name = CONCAT('Demo Landlord ', LPAD(SUBSTRING(email, 12, 2), 2, '0'))
WHERE email LIKE 'demo.chutro%@roomily.test'
  AND role = 'LANDLORD';

CREATE TEMPORARY TABLE demo_hanoi_rooms (
    room_number VARCHAR(20) NOT NULL,
    room_index INT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    area DECIMAL(6, 2) NOT NULL,
    capacity INT NOT NULL,
    utilities VARCHAR(500) NOT NULL
);

INSERT INTO demo_hanoi_rooms
    (room_number, room_index, room_type, price, area, capacity, utilities)
VALUES
    ('P101', 1, 'Phòng trọ khép kín', 2500000, 18, 2, 'WiFi,Điều hòa,Bãi xe'),
    ('P102', 2, 'Phòng trọ khép kín', 3200000, 22, 2, 'WiFi,Điều hòa,Máy giặt,Bãi xe'),
    ('P103', 3, 'Studio', 4500000, 28, 2, 'WiFi,Điều hòa,Bếp riêng,Thang máy'),
    ('P104', 4, 'Studio', 5500000, 32, 3, 'WiFi,Điều hòa,Máy giặt,Bếp riêng'),
    ('P105', 5, 'Căn hộ mini', 6800000, 40, 3, 'WiFi,Điều hòa,Máy giặt,Bãi xe,Camera an ninh');

INSERT INTO db_property_rental.properties
    (landlord_id, title, description, address, city, district, ward, utilities, latitude, longitude)
SELECT u.id,
       d.property_title,
       'DỮ LIỆU DEMO GIẢ LẬP - khu trọ minh họa, không phải địa chỉ hoặc tin cho thuê đã xác minh.',
       d.address,
       'Hà Nội',
       d.district,
       d.ward,
       d.utilities,
       d.latitude,
       d.longitude
FROM demo_hanoi_properties d
JOIN db_auth.users u ON u.email = d.owner_email AND u.role = 'LANDLORD'
WHERE NOT EXISTS (
    SELECT 1
    FROM db_property_rental.properties existing
    WHERE existing.landlord_id = u.id
      AND existing.title LIKE 'DEMO Khu tr%'
);

UPDATE db_property_rental.properties p
JOIN db_auth.users u ON u.id = p.landlord_id AND u.role = 'LANDLORD'
JOIN demo_hanoi_properties d ON d.owner_email = u.email
SET p.title = d.property_title,
    p.description = 'DỮ LIỆU DEMO GIẢ LẬP - khu trọ minh họa, không phải địa chỉ hoặc tin cho thuê đã xác minh.',
    p.address = d.address,
    p.city = 'Hà Nội',
    p.district = d.district,
    p.ward = d.ward,
    p.utilities = d.utilities,
    p.latitude = d.latitude,
    p.longitude = d.longitude;

INSERT INTO db_property_rental.rooms
    (property_id, room_number, price, area, capacity, current_occupants, status, version)
SELECT p.id,
       r.room_number,
       r.price,
       r.area,
       r.capacity,
       0,
       'AVAILABLE',
       0
FROM demo_hanoi_properties d
JOIN db_auth.users u ON u.email = d.owner_email AND u.role = 'LANDLORD'
JOIN db_property_rental.properties p ON p.landlord_id = u.id AND p.title LIKE 'DEMO Khu tr%'
CROSS JOIN demo_hanoi_rooms r
WHERE NOT EXISTS (
    SELECT 1
    FROM db_property_rental.rooms existing
    WHERE existing.property_id = p.id
      AND existing.room_number = r.room_number
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
           'và chưa được chủ trọ xác minh. Khu vực: ', d.ward, ', ', d.district,
           ', Hà Nội. Tiện ích tham khảo: ', r.utilities, '. Liên hệ chỉ là số mẫu.'
       ),
       r.price,
       d.address,
       'Hà Nội',
       d.district,
       d.ward,
       CONCAT('000000', LPAD(CAST(((CAST(SUBSTRING(d.owner_email, 12, 2) AS UNSIGNED) - 1) * 5)
                                  + r.room_index AS CHAR), 4, '0')),
       r.area,
       r.room_type,
       r.utilities,
       room.id,
       b'0',
       b'0',
       NULL,
       NULL,
       d.latitude + ((r.room_index - 3) * 0.00008),
       d.longitude + ((r.room_index - 3) * 0.00008),
       JSON_ARRAY(
           JSON_OBJECT(
               'id', CONCAT('demo-place-', room.id),
               'name', 'Tiện ích khu vực (dữ liệu demo)',
               'category', 'amenity',
               'distanceMeters', 500,
               'latitude', d.latitude,
               'longitude', d.longitude
           )
       ),
       'ACTIVE',
       NOW(6),
       NOW(6)
FROM demo_hanoi_properties d
JOIN db_auth.users u ON u.email = d.owner_email AND u.role = 'LANDLORD'
JOIN db_property_rental.properties p ON p.landlord_id = u.id AND p.title LIKE 'DEMO Khu tr%'
CROSS JOIN demo_hanoi_rooms r
JOIN db_property_rental.rooms room ON room.property_id = p.id AND room.room_number = r.room_number
WHERE NOT EXISTS (
    SELECT 1
    FROM db_property_rental.forum_posts existing
    WHERE existing.room_id = room.id
       OR existing.title = CONCAT('[DEMO] ', r.room_type, ' ', r.room_number, ' - ', d.district, ' (tin minh họa)')
);

UPDATE db_property_rental.forum_posts post
JOIN db_property_rental.rooms room ON room.id = post.room_id
JOIN db_property_rental.properties p ON p.id = room.property_id
JOIN db_auth.users u ON u.id = p.landlord_id
JOIN demo_hanoi_properties d ON d.owner_email = u.email
JOIN demo_hanoi_rooms r ON r.room_number = room.room_number
SET post.landlord_id = u.id,
    post.landlord_name = u.full_name,
    post.title = CONCAT('[DEMO] ', r.room_type, ' ', r.room_number, ' - ', d.district, ' (tin minh họa)'),
    post.description = CONCAT(
        'TIN DEMO GIẢ LẬP - nội dung minh họa chức năng tìm phòng, không phải phòng có thật ',
        'và chưa được chủ trọ xác minh. Khu vực: ', d.ward, ', ', d.district,
        ', Hà Nội. Tiện ích tham khảo: ', r.utilities, '. Liên hệ chỉ là số mẫu.'
    ),
    post.price = r.price,
    post.address = d.address,
    post.city = 'Hà Nội',
    post.district = d.district,
    post.ward = d.ward,
    post.contact_phone = CONCAT('000000', LPAD(CAST(((CAST(SUBSTRING(d.owner_email, 12, 2) AS UNSIGNED) - 1) * 5)
                                                    + r.room_index AS CHAR), 4, '0')),
    post.room_area = r.area,
    post.room_type = r.room_type,
    post.utilities = r.utilities,
    post.latitude = d.latitude + ((r.room_index - 3) * 0.00008),
    post.longitude = d.longitude + ((r.room_index - 3) * 0.00008),
    post.nearby_places = JSON_ARRAY(
        JSON_OBJECT(
            'id', CONCAT('demo-place-', room.id),
            'name', 'Tiện ích khu vực (dữ liệu demo)',
            'category', 'amenity',
            'distanceMeters', 500,
            'latitude', d.latitude,
            'longitude', d.longitude
        )
    ),
    post.status = 'ACTIVE',
    post.updated_at = NOW(6)
WHERE post.room_id = room.id;
