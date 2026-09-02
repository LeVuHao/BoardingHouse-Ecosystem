/**
 * DEMO RACE CONDITION TEST SCRIPT
 * Chạy đồng thời 3 request xin/duyệt ở ghép với 1 phòng chỉ còn đúng 1 chỗ trống.
 * Yêu cầu: Đã cài đặt Node.js và axios (npm i axios).
 */
const axios = require('axios');

const GATEWAY_URL = 'http://localhost:8080';
// Thay đổi token của Landlord sau khi login
const LANDLORD_TOKEN = 'YOUR_LANDLORD_JWT_TOKEN_HERE';

// 3 JoinRequest IDs cần test duyệt đồng thời
const requestIds = [1, 2, 3];

async function approveRequest(requestId) {
    try {
        console.log(`[START] Gửi request duyệt JoinRequest ID = ${requestId}`);
        const response = await axios.post(
            `${GATEWAY_URL}/api/v1/rental/posts/requests/${requestId}/approve`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${LANDLORD_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[SUCCESS] Request ID ${requestId} result:`, response.data);
    } catch (error) {
        console.error(`[FAILED/REJECTED] Request ID ${requestId}:`, error.response ? error.response.data : error.message);
    }
}

async function runConcurrencyTest() {
    console.log('=== BẮT ĐẦU TEST DUYỆT ĐỒNG THỜI VỚI REDIS LOCK ===');
    const promises = requestIds.map(id => approveRequest(id));
    await Promise.all(promises);
    console.log('=== HOÀN TẤT TEST CONCURRENCY ===');
}

runConcurrencyTest();
