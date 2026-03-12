import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders, downloadTicket, getQrCode, cancelOrder, getPaymentUrl, simulatePayment } from '../api/axios';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQr, setShowQr] = useState(null);
    const [qrImageUrl, setQrImageUrl] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const { data } = await getMyOrders();
            setOrders(data);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}/download-ticket`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (err) {
            alert('Không thể tải vé: ' + err.message);
        }
    };

    const handleShowQr = async (orderId) => {
        if (showQr === orderId) {
            setShowQr(null);
            if (qrImageUrl) {
                window.URL.revokeObjectURL(qrImageUrl);
                setQrImageUrl(null);
            }
            return;
        }

        try {
            const response = await getQrCode(orderId);
            const blob = new Blob([response.data], { type: 'image/png' });
            const url = window.URL.createObjectURL(blob);
            setQrImageUrl(url);
            setShowQr(orderId);
        } catch (err) {
            alert('Không thể tải QR code: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleCancel = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Ghế của bạn sẽ được giải phóng cho người khác.')) return;

        try {
            await cancelOrder(orderId);
            alert('Hủy đơn hàng thành công!');
            loadOrders(); // reload the list
        } catch (err) {
            alert('Không thể hủy đơn: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
        }
    };

    const handleStripePayment = async (orderId) => {
        try {
            const { data } = await getPaymentUrl(orderId);
            if (data && data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            alert('Không thể tạo liên kết thanh toán Stripe: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSimulatePayment = async (orderId) => {
        try {
            await simulatePayment(orderId);
            navigate('/payment-result?simulated=true&orderId=' + orderId);
        } catch (err) {
            alert('Thanh toán thất bại: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PAID': return 'status-paid';
            case 'PENDING': return 'status-pending';
            case 'CANCELLED': return 'status-cancelled';
            default: return '';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PAID': return '✅ Đã thanh toán';
            case 'PENDING': return '⏳ Chờ thanh toán';
            case 'CANCELLED': return '❌ Đã hủy';
            default: return status;
        }
    };

    const getFilteredAndSortedOrders = () => {
        let result = [...orders];

        // 1. Phân loại và lọc
        if (filter !== 'ALL') {
            if (filter === 'PAID') result = result.filter(o => o.status === 'PAID');
            else if (filter === 'PENDING') result = result.filter(o => o.status === 'PENDING');
            else if (filter === 'CANCELLED') result = result.filter(o => o.status === 'CANCELLED');
            else if (filter === 'CHECKED_IN') result = result.filter(o => o.status === 'PAID' && o.checkInTime);
            else if (filter === 'NOT_CHECKED_IN') result = result.filter(o => o.status === 'PAID' && !o.checkInTime);
        }

        // 2. Sắp xếp mặc định
        // Ưu tiên các vé đang chờ thanh toán (PENDING) lên đầu, 
        // Sau đó đến các vé đã thanh toán mới nhất.
        result.sort((a, b) => {
            const getPriority = (status) => {
                if (status === 'PENDING') return 1;
                if (status === 'PAID') return 2;
                return 3; // CANCELLED
            };

            const pA = getPriority(a.status);
            const pB = getPriority(b.status);

            if (pA !== pB) return pA - pB;

            // Nếu cùng nhóm ưu tiên thì sắp xếp theo thời gian mới nhất
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return result;
    };

    const displayOrders = getFilteredAndSortedOrders();

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="orders-page">
            <h1>📋 Lịch sử đơn hàng</h1>

            <div className="order-filters" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                    className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('ALL')}
                >Tất cả</button>
                <button
                    className={`btn btn-sm ${filter === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('PENDING')}
                >⏳ Chưa thanh toán</button>
                <button
                    className={`btn btn-sm ${filter === 'PAID' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('PAID')}
                >✅ Đã thanh toán</button>
                <button
                    className={`btn btn-sm ${filter === 'NOT_CHECKED_IN' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('NOT_CHECKED_IN')}
                >🎫 Chưa Check-in</button>
                <button
                    className={`btn btn-sm ${filter === 'CHECKED_IN' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('CHECKED_IN')}
                >🎪 Đã Check-in</button>
                <button
                    className={`btn btn-sm ${filter === 'CANCELLED' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('CANCELLED')}
                >❌ Đã hủy</button>
            </div>

            {displayOrders.length === 0 ? (
                <div className="empty-state">
                    <p>Không có đơn hàng nào phù hợp với bộ lọc 🎫</p>
                </div>
            ) : (
                <div className="orders-list">
                    {displayOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <div>
                                    <h3>#{order.id} - {order.eventTitle}</h3>
                                    <span className={`order-status ${getStatusClass(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>
                                <div className="order-amount">{formatPrice(order.totalAmount)}</div>
                            </div>
                            <div className="order-details">
                                <div className="order-detail-row">
                                    <span>📍 Địa điểm:</span>
                                    <span>{order.venueName}</span>
                                </div>
                                <div className="order-detail-row">
                                    <span>📅 Thời gian:</span>
                                    <span>{formatDate(order.eventDate)}</span>
                                </div>
                                <div className="order-detail-row">
                                    <span>💺 Ghế:</span>
                                    <span>{order.seats?.join(', ') || '-'}</span>
                                </div>
                                <div className="order-detail-row">
                                    <span>🕐 Đặt lúc:</span>
                                    <span>{formatDate(order.createdAt)}</span>
                                </div>
                                {order.paymentTime && (
                                    <div className="order-detail-row">
                                        <span>💳 Thanh toán lúc:</span>
                                        <span>{formatDate(order.paymentTime)}</span>
                                    </div>
                                )}
                                {order.checkInTime && (
                                    <div className="order-detail-row">
                                        <span>🎪 Check-in lúc:</span>
                                        <span>{formatDate(order.checkInTime)}</span>
                                    </div>
                                )}
                            </div>

                            {/* QR Code Display */}
                            {showQr === order.id && qrImageUrl && (
                                <div className="qr-display">
                                    <img src={qrImageUrl} alt="QR Code" />
                                    <p className="qr-hint">Xuất trình mã QR này khi check-in tại sự kiện</p>
                                </div>
                            )}

                            {order.status === 'PENDING' && (
                                <div className="order-pending-alert" style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--error)',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    margin: '16px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    ⏳ Vé sẽ tự động hủy nếu bạn không thanh toán trong 5 phút
                                </div>
                            )}

                            <div className="order-actions">
                                {order.status === 'PAID' && (
                                    <>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleDownload(order.id)}
                                        >
                                            📄 Tải vé PDF
                                        </button>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleShowQr(order.id)}
                                        >
                                            {showQr === order.id ? '🔽 Ẩn QR' : '📱 Xem mã QR'}
                                        </button>
                                    </>
                                )}

                                {order.status === 'PENDING' && (
                                    <>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStripePayment(order.id)}
                                        >
                                            💳 Thanh toán ngay
                                        </button>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleSimulatePayment(order.id)}
                                        >
                                            💳 Thanh toán giả lập
                                        </button>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                                            onClick={() => handleCancel(order.id)}
                                        >
                                            ❌ Hủy đơn hàng
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
