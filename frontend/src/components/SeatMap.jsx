export default function SeatMap({ seats, selectedSeats, onSeatClick }) {
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

    // Group seats by row
    const rows = {};
    seats.forEach(seat => {
        if (!rows[seat.rowLabel]) rows[seat.rowLabel] = [];
        rows[seat.rowLabel].push(seat);
    });

    // Sort each row by column
    Object.values(rows).forEach(row => row.sort((a, b) => a.colNumber - b.colNumber));

    // Get unique price tiers for legend
    const priceTiers = {};
    seats.forEach(seat => {
        if (!priceTiers[seat.seatType]) {
            priceTiers[seat.seatType] = seat.price;
        }
    });

    const getSeatClass = (seat) => {
        const isSelected = selectedSeats.includes(seat.id);
        let cls = 'seat';
        cls += ` seat-${seat.seatType?.toLowerCase() || 'standard'}`;
        if (seat.status !== 'AVAILABLE') cls += ' seat-taken';
        if (isSelected) cls += ' seat-selected';
        return cls;
    };

    const sortedRows = Object.keys(rows).sort();

    return (
        <div className="seat-map-container">
            {/* Screen / Stage */}
            <div className="stage">
                <div className="stage-inner">SÂN KHẤU / MÀN HÌNH</div>
            </div>

            {/* Legend with prices */}
            <div className="seat-legend">
                {priceTiers['VIP'] !== undefined && (
                    <div className="legend-item">
                        <div className="seat-mini seat-vip"></div>
                        <span>VIP — {formatPrice(priceTiers['VIP'])}đ</span>
                    </div>
                )}
                {priceTiers['STANDARD'] !== undefined && (
                    <div className="legend-item">
                        <div className="seat-mini seat-standard"></div>
                        <span>Standard — {formatPrice(priceTiers['STANDARD'])}đ</span>
                    </div>
                )}
                {priceTiers['ECONOMY'] !== undefined && (
                    <div className="legend-item">
                        <div className="seat-mini seat-economy"></div>
                        <span>Economy — {formatPrice(priceTiers['ECONOMY'])}đ</span>
                    </div>
                )}
                <div className="legend-item">
                    <div className="seat-mini seat-taken"></div>
                    <span>Đã đặt</span>
                </div>
                <div className="legend-item">
                    <div className="seat-mini seat-selected"></div>
                    <span>Đang chọn</span>
                </div>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid">
                {sortedRows.map(rowLabel => {
                    const rowSeats = rows[rowLabel];
                    const rowType = rowSeats[0]?.seatType || 'STANDARD';
                    const rowPrice = rowSeats[0]?.price || 0;
                    return (
                        <div key={rowLabel} className="seat-row">
                            <span className="row-label">{rowLabel}</span>
                            <div className="row-seats">
                                {rowSeats.map(seat => (
                                    <button
                                        key={seat.id}
                                        className={getSeatClass(seat)}
                                        disabled={seat.status !== 'AVAILABLE'}
                                        onClick={() => onSeatClick(seat)}
                                        title={`${seat.rowLabel}${seat.colNumber} — ${seat.seatType} — ${formatPrice(seat.price)}đ`}
                                    >
                                        {seat.colNumber}
                                    </button>
                                ))}
                            </div>
                            <span className="row-price-tag">
                                {formatPrice(rowPrice)}đ
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
