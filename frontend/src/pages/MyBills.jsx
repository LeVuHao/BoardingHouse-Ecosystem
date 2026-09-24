import React, { useState, useEffect } from 'react';
import { billingApi } from '../api/apiClient';

const MyBills = () => {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    billingApi.getMyBills()
      .then((res) => setBills(res.data || []))
      .catch(console.error);
  }, []);

  const handlePayBill = async (bill) => {
    try {
      const res = await billingApi.createBillPaymentUrl(bill.id, bill.totalAmount);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      alert(err.message || 'Lỗi tạo liên kết thanh toán');
    }
  };

  return (
    <div className="container">
      <h2>Hóa Đơn Của Tôi</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Theo dõi và thanh toán tiền phòng/điện nước hàng tháng qua VNPay</p>

      {bills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          Bạn chưa có hóa đơn nào cần thanh toán.
        </div>
      ) : (
        <div className="rooms-grid">
          {bills.map((bill) => (
            <div key={bill.id} className="room-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 'bold' }}>Tháng: {bill.monthYear}</span>
                <span className={`badge ${bill.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                  {bill.status}
                </span>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <div>Tiền phòng: {Number(bill.roomAmount).toLocaleString('vi-VN')} đ</div>
                <div>Tiền điện: {Number(bill.electricityAmount).toLocaleString('vi-VN')} đ</div>
                <div>Tiền nước: {Number(bill.waterAmount).toLocaleString('vi-VN')} đ</div>
              </div>

              <div className="room-price" style={{ margin: '1rem 0' }}>
                Tổng: {Number(bill.totalAmount).toLocaleString('vi-VN')} đ
              </div>

              {bill.status === 'UNPAID' && (
                <button onClick={() => handlePayBill(bill)} className="btn btn-primary" style={{ width: '100%' }}>
                  Thanh toán ngay qua VNPay
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBills;
