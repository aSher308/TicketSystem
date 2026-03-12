import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { scanCheckin } from '../api/axios';
import AdminLayout from '../components/AdminLayout';

export default function Checkin() {
    const [qrContent, setQrContent] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [isMirrored, setIsMirrored] = useState(false);
    const [scanError, setScanError] = useState('');
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    const startScanner = () => {
        setScanError('');
        setResult(null);
        setScanning(true);

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        };

        const html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader", config, /* verbose= */ false
        );

        html5QrCodeRef.current = html5QrcodeScanner;

        html5QrcodeScanner.render((decodedText) => {
            setQrContent(decodedText);
            stopScanner();
            handleCheckin(decodedText);
        }, (error) => {
            // Ignore normal scan errors (no qr found in frame)
        });
    };

    const stopScanner = () => {
        if (html5QrCodeRef.current) {
            try {
                html5QrCodeRef.current.clear();
            } catch (e) {
                console.error(e);
            }
            html5QrCodeRef.current = null;
        }
        setScanning(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setResult(null);
        setScanError('');
        try {
            const html5QrCode = new Html5Qrcode("qr-reader-hidden");
            const decoded = await html5QrCode.scanFileV2(file, true);
            const text = decoded?.decodedText || decoded;
            setQrContent(text);
            handleCheckin(text);
            html5QrCode.clear();
        } catch (err) {
            setScanError('Không thể đọc mã QR từ ảnh. Hãy đảm bảo ảnh rõ nét và mã QR nằm trọn trong hình.');
        }
        e.target.value = '';
    };

    const handleCheckin = async (content) => {
        const qr = content || qrContent;
        if (!qr.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const { data } = await scanCheckin({ qrContent: qr });
            setResult(data);
        } catch (err) {
            setResult({
                valid: false,
                message: err.response?.data?.error || err.response?.data?.message || 'Check-in thất bại!'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetAll = () => {
        setQrContent('');
        setResult(null);
        setScanError('');
    };

    return (
        <AdminLayout>
            <div className="ci-page">
                {/* Header */}
                <div className="ci-header">
                    <div className="ci-header-icon">🎫</div>
                    <h1>Check-in Sự kiện</h1>
                    <p>Quét hoặc nhập mã QR trên vé để xác nhận check-in</p>
                </div>

                {/* Scanner Section */}
                <div className="ci-scanner-section">
                    {/* Mode Buttons */}
                    <div className="ci-modes">
                        <button
                            className={`ci-mode-btn ${scanning ? 'active' : ''}`}
                            onClick={scanning ? stopScanner : startScanner}
                        >
                            <span className="ci-mode-icon">{scanning ? '⏹' : '📷'}</span>
                            <span className="ci-mode-label">{scanning ? 'Dừng camera' : 'Camera'}</span>
                        </button>

                        <label className="ci-mode-btn">
                            <span className="ci-mode-icon">🖼️</span>
                            <span className="ci-mode-label">Upload ảnh</span>
                            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>

                        <button className="ci-mode-btn" onClick={() => document.getElementById('manual-input')?.focus()}>
                            <span className="ci-mode-icon">⌨️</span>
                            <span className="ci-mode-label">Nhập tay</span>
                        </button>
                    </div>

                    {/* Camera View */}
                    <div id="qr-reader" className={`ci-camera-container ${scanning ? 'active' : ''}`}></div>
                    <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

                    {scanError && (
                        <div className="ci-error">
                            <span>⚠️</span> {scanError}
                        </div>
                    )}

                    {/* Manual Input */}
                    <div className="ci-manual">
                        <div className="ci-input-wrapper">
                            <textarea
                                id="manual-input"
                                value={qrContent}
                                onChange={(e) => setQrContent(e.target.value)}
                                placeholder="Nội dung QR tự động xuất hiện khi quét, hoặc dán/nhập thủ công..."
                                rows={2}
                            />
                            {qrContent && (
                                <button className="ci-clear-btn" onClick={resetAll} title="Xóa">✕</button>
                            )}
                        </div>
                        <button
                            className="ci-submit-btn"
                            onClick={() => handleCheckin()}
                            disabled={loading || !qrContent.trim()}
                        >
                            {loading ? (
                                <><span className="ci-spinner"></span> Đang kiểm tra...</>
                            ) : (
                                '🔍 Kiểm tra vé'
                            )}
                        </button>
                    </div>
                </div>

                {/* Result */}
                {result && (
                    <div className={`ci-result ${result.valid ? 'success' : 'error'}`}>
                        <div className="ci-result-badge">
                            {result.valid ? '✅' : '❌'}
                        </div>
                        <h2>{result.valid ? 'Check-in thành công!' : 'Check-in thất bại!'}</h2>
                        {result.message && <p className="ci-result-msg">{result.message}</p>}

                        {result.valid && (
                            <div className="ci-result-info">
                                <div className="ci-info-row">
                                    <div className="ci-info-icon">🎤</div>
                                    <div>
                                        <span className="ci-info-label">Sự kiện</span>
                                        <strong>{result.eventTitle}</strong>
                                    </div>
                                </div>
                                <div className="ci-info-row">
                                    <div className="ci-info-icon">👤</div>
                                    <div>
                                        <span className="ci-info-label">Khách hàng</span>
                                        <strong>{result.userName}</strong>
                                    </div>
                                </div>
                                <div className="ci-info-row">
                                    <div className="ci-info-icon">💺</div>
                                    <div>
                                        <span className="ci-info-label">Ghế ngồi</span>
                                        <strong>{result.seats}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button className="ci-again-btn" onClick={resetAll}>
                            🔄 Check-in vé khác
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
