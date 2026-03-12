import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../api/axios';

export default function Home() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [venueFilter, setVenueFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('UPCOMING');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const { data } = await getEvents();
            setEvents(data);
        } catch (err) {
            console.error('Failed to load events:', err);
        } finally {
            setLoading(false);
        }
    };

    const uniqueVenues = [...new Set(events.filter(e => e.venueName).map(e => e.venueName))];

    const filtered = events.filter(e => {
        const textMatch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.venueName?.toLowerCase().includes(search.toLowerCase());
        const venueMatch = venueFilter === 'ALL' || e.venueName === venueFilter;
        const statusMatch = statusFilter === 'ALL' || e.status === statusFilter;
        return textMatch && venueMatch && statusMatch;
    });

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Khám Phá Sự Kiện <span className="gradient-text">Tuyệt Vời</span></h1>
                    <p>Đặt vé nhanh chóng, an toàn. Trải nghiệm những sự kiện đáng nhớ nhất!</p>
                    <div className="search-bar" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '30px' }}>
                        <div style={{ position: 'relative', flex: '1', minWidth: '300px', maxWidth: '500px' }}>
                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm sự kiện, địa điểm..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', paddingLeft: '45px', height: '50px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>
                        <select
                            value={venueFilter} onChange={e => setVenueFilter(e.target.value)}
                            style={{ height: '50px', padding: '0 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                        >
                            <option value="ALL" style={{ color: 'black' }}>Tất cả địa điểm 📍</option>
                            {uniqueVenues.map(v => <option key={v} value={v} style={{ color: 'black' }}>{v}</option>)}
                        </select>
                        <select
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            style={{ height: '50px', padding: '0 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                        >
                            <option value="ALL" style={{ color: 'black' }}>Tất cả trạng thái 🎟️</option>
                            <option value="UPCOMING" style={{ color: 'black' }}>Sắp diễn ra</option>
                            <option value="COMPLETED" style={{ color: 'black' }}>Đã kết thúc</option>
                            <option value="CANCELLED" style={{ color: 'black' }}>Đã hủy</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            <section className="events-section">
                <h2>
                    {statusFilter === 'UPCOMING' ? 'Sự kiện sắp diễn ra' :
                        statusFilter === 'COMPLETED' ? 'Sự kiện đã kết thúc' :
                            statusFilter === 'CANCELLED' ? 'Sự kiện đã hủy' :
                                'Tất cả sự kiện'} ({filtered.length})
                </h2>
                <div className="events-grid">
                    {filtered.map(event => (
                        <Link to={`/events/${event.id}`} key={event.id} className="event-card">
                            <div className="event-image">
                                <img
                                    src={event.imageUrl || `https://picsum.photos/seed/event${event.id}/400/200`}
                                    alt={event.title}
                                    onError={e => { e.target.src = `https://picsum.photos/seed/event${event.id}/400/200`; }}
                                />
                                <div className={`event-badge status-${event.status?.toLowerCase()}`}>
                                    {event.status === 'UPCOMING' ? 'Sắp diễn ra' : event.status === 'COMPLETED' ? 'Đã kết thúc' : event.status === 'CANCELLED' ? 'Đã hủy' : event.status}
                                </div>
                                <div className="event-price-tag">{formatPrice(event.price)}</div>
                            </div>
                            <div className="event-info">
                                <h3>{event.title}</h3>
                                <div className="event-meta">
                                    <span className="meta-item">📅 {formatDate(event.eventDate)}</span>
                                    <span className="meta-item">📍 {event.venueName}</span>
                                    <span className="meta-item">
                                        💺 Còn {event.availableSeats}/{event.totalSeats} ghế
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="empty-state">
                        <p>Không tìm thấy sự kiện nào 😕</p>
                    </div>
                )}
            </section>
        </div>
    );
}
