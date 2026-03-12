import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { stripeVerify, getOrder } from '../api/axios';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        processPayment();
    }, []);

    const processPayment = async () => {
        try {
            const simulated = searchParams.get('simulated');
            const orderId = searchParams.get('orderId');
            const sessionId = searchParams.get('session_id');

            if (simulated && orderId) {
                // Simulated payment - fetch order details
                const { data } = await getOrder(orderId);
                setResult(data);
            } else if (sessionId && orderId) {
                // Stripe callback - verify payment
                const { data } = await stripeVerify(sessionId, orderId);
                setResult(data);
            } else {
                setError('Thông tin thanh toán không hợp lệ');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Thanh toán thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    if (loading) {
        return (
            <div className="payment-result-page">
                <div className="result-card">
                    <div className="loading-spinner"></div>
                    <h2>Đang xử lý thanh toán...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-result-page">
            <div className="result-card">
                {error ? (
                    <>
                        <div className="result-icon error">✕</div>
                        <h2>Thanh toán thất bại</h2>
                        <p className="error-message">{error}</p>
                        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
                    </>
                ) : (
                    <>
                        <div className="result-icon success">✓</div>
                        <h2>Thanh toán thành công!</h2>
                        <div className="result-details">
                            <div className="detail-row">
                                <span>Mã đơn hàng:</span>
                                <strong>#{result?.id}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Sự kiện:</span>
                                <strong>{result?.eventTitle}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Ghế:</span>
                                <strong>{result?.seats?.join(', ')}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Tổng tiền:</span>
                                <strong className="price">{formatPrice(result?.totalAmount)}</strong>
                            </div>
                        </div>
                        <p className="success-note">
                            📧 Vé PDF đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!
                        </p>
                        <div className="result-actions">
                            <Link to="/orders" className="btn btn-primary">Xem đơn hàng</Link>
                            <Link to="/" className="btn btn-outline">Về trang chủ</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
