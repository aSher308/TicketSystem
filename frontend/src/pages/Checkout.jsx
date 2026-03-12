export default function Checkout() {
    // This page is not used directly since we redirect to Stripe
    // Kept for potential future use
    return (
        <div className="checkout-page">
            <h1>Đang chuyển hướng thanh toán...</h1>
            <p>Bạn sẽ được chuyển đến cổng thanh toán bảo mật Stripe.</p>
        </div>
    );
}
