/**
 * DEMO RACE CONDITION TEST SCRIPT (REDISSON DISTRIBUTED LOCK)
 * Giả lập nhiều request duyệt xin vào ở ghép đồng thời khi phòng chỉ còn đúng 1 slot.
 *
 * Hướng dẫn chạy:
 *   1. Chạy docker-compose (MySQL, Redis, RabbitMQ) và các Services (Eureka, Gateway, Property-Service, Auth-Service)
 *   2. Cài axios: npm install axios (nếu chưa có)
 *   3. Chạy script: node scripts/demo-race-condition.js
 */
const axios = require("axios");

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8080";
const LANDLORD_EMAIL = process.env.LANDLORD_EMAIL || "landlord@roomily.com";
const LANDLORD_PASSWORD = process.env.LANDLORD_PASSWORD || "123456";

// Danh sách các JoinRequest IDs cần test duyệt đồng thời
const REQUEST_IDS = (process.env.REQUEST_IDS || "1,2,3")
  .split(",")
  .map((id) => Number(id.trim()))
  .filter(Number.isInteger);
const EXPECTED_APPROVED = Number(process.env.EXPECTED_APPROVED || 1);

async function getLandlordToken() {
  if (process.env.LANDLORD_TOKEN) {
    console.log("[AUTH] Su dung LANDLORD_TOKEN tu bien moi truong.");
    return process.env.LANDLORD_TOKEN;
  }

  try {
    console.log(`[AUTH] Đang đăng nhập Landlord (${LANDLORD_EMAIL})...`);
    const res = await axios.post(`${GATEWAY_URL}/api/v1/auth/login`, {
      email: LANDLORD_EMAIL,
      password: LANDLORD_PASSWORD,
    });
    const token = res.data?.data?.accessToken || res.data?.data?.token;
    if (token) {
      console.log(`[AUTH] Đăng nhập thành công, đã lấy JWT Token.`);
      return token;
    }
    throw new Error("Không nhận được access token từ response");
  } catch (err) {
    console.warn(
      `[AUTH] Tự động đăng nhập không thành công (${err.response?.data?.message || err.message}).`,
    );
    throw new Error(
      "Khong lay duoc token. Hay set LANDLORD_TOKEN de chay test.",
    );
  }
}

async function approveRequest(requestId, token) {
  const startTime = Date.now();
  try {
    console.log(`⏱️ [START] Gửi request duyệt JoinRequest ID = ${requestId}`);
    const response = await axios.post(
      `${GATEWAY_URL}/api/v1/rental/posts/requests/${requestId}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    const duration = Date.now() - startTime;
    console.log(
      `✅ [APPROVED] Request ID ${requestId} (${duration}ms):`,
      response.data?.data?.message || response.data,
    );
    return { id: requestId, status: "APPROVED", data: response.data };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errData = error.response ? error.response.data : error.message;
    console.log(
      `❌ [REJECTED/BLOCKED] Request ID ${requestId} (${duration}ms):`,
      errData,
    );
    return { id: requestId, status: "REJECTED", error: errData };
  }
}

async function runConcurrencyTest() {
  console.log(
    "================================================================",
  );
  console.log("🚀 BẮT ĐẦU TEST TRANH CHẤP CHỖ Ở (REDIS DISTRIBUTED LOCK)");
  console.log(
    "================================================================",
  );

  const token = await getLandlordToken();

  console.log(
    `\n🔥 Đang kích hoạt đồng thời ${REQUEST_IDS.length} requests duyệt xin ở ghép...`,
  );
  const promises = REQUEST_IDS.map((id) => approveRequest(id, token));
  const results = await Promise.all(promises);

  console.log(
    "\n================================================================",
  );
  console.log("📊 TỔNG KẾT KẾT QUẢ TEST:");
  const approved = results.filter((r) => r.status === "APPROVED");
  const rejected = results.filter((r) => r.status === "REJECTED");
  console.log(`- Số lượng được duyệt (APPROVED): ${approved.length}`);
  console.log(`- Số lượng bị chặn/từ chối (REJECTED): ${rejected.length}`);
  const passed =
    approved.length === EXPECTED_APPROVED &&
    approved.length + rejected.length === results.length;
  console.log(`- Kỳ vọng APPROVED: ${EXPECTED_APPROVED}`);
  console.log(
    passed
      ? "🎯 Kết luận: Redisson Distributed Lock đã bảo vệ tính nhất quán dữ liệu thành công!"
      : "❌ Kết luận: Kết quả không đúng kỳ vọng, cần kiểm tra lock hoặc dữ liệu test.",
  );
  console.log(
    "================================================================\n",
  );
  if (!passed) process.exitCode = 1;
}

runConcurrencyTest();
