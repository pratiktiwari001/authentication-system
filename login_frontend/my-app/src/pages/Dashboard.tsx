import { useEffect, useState } from 'react';
import api from "../api/axios";
import { useNavigate } from 'react-router-dom';
import styles from '../stlyles/login.module.css';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    updatedAt: string;
}

interface ActiveSession {
    _id: string;
    deviceName: string;
    ipAddress: string;
    createdAt: string;
    updatedAt: string;
    isCurrentDevice: boolean;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [hoveredSession, setHoveredSession] = useState<string | null>(null);

    // ⚡ Accordion UI toggle state variable
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    // Helper to capitalize the first letter of each word in the user's name
    const capitalizeName = (str?: string) => {
        if (!str) return "";
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    // Helper to determine device icon with smart mapping
    const getDeviceIcon = (name?: string) => {
        const safeName = (name || "").toLowerCase();
        if (safeName.includes('mobile') || safeName.includes('android') || safeName.includes('iphone')) return "📱";
        if (safeName.includes('tablet') || safeName.includes('ipad')) return "📟";
        return "💻";
    };

    // Session monitor real-time active duration string formatting utility
    const formatActiveTime = (timestamp?: string) => {
        if (!timestamp) return "Checking...";
        const diffInMs = new Date().getTime() - new Date(timestamp).getTime();
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMins / 60);

        if (diffInMins < 1) return "Just now";
        if (diffInMins < 60) return `${diffInMins}m ago`;
        return `${diffInHours}h ${diffInMins % 60}m ago`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, sessionsRes] = await Promise.all([
                    api.get('/auth/profile'),
                    api.get('/sessions')
                ]);

                setProfile(profileRes.data.user);
                setSessions(sessionsRes.data.sessions || []);
            } catch (err: any) {
                console.error("Profile check failed. Session invalid.");
                localStorage.removeItem("isLoggedIn"); // Wipe the flag
                navigate("/login", { replace: true }); // Boot to login
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error("Logout failed on backend", err);
        } finally {
            localStorage.removeItem("isLoggedIn");
            navigate('/login');
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm("Are you sure you want to log out of ALL active devices?")) return;

        setLoading(true);
        try {
            await api.post('/logout/all');
            localStorage.removeItem("isLoggedIn");
            navigate('/login');
        } catch (err: any) {
            console.error("Global logout failed on backend", err);
            setError(err.response?.data?.message || "Global logout failed.");
            setLoading(false);
        }
    };

    const renderBadge = (isVerified: boolean) => {
        return isVerified ? (
            <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 255, 102, 0.08)',
                color: '#00ff66',
                border: '1px solid rgba(0, 255, 102, 0.2)',
                marginLeft: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 8px rgba(0, 255, 102, 0.05)'
            }}>
                Verified
            </span>
        ) : (
            <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 74, 74, 0.08)',
                color: '#ff4a4a',
                border: '1px solid rgba(255, 74, 74, 0.2)',
                marginLeft: '8px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(255, 74, 74, 0.05)'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 74, 74, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 74, 74, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 74, 74, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 74, 74, 0.2)';
                }}
                onClick={() => navigate('/verify-otp', { state: { email: profile?.email } })}
            >
                Unverified
            </span>
        );
    };

    if (loading) return (
        <div className={styles.authContainer}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,204,0,0.1)', borderTopColor: '#ffcc00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <p style={{ color: '#8e8e93', fontSize: '14px', letterSpacing: '0.3px', margin: 0 }}>Establishing secure session payload...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.authContainer}>
            <div style={{ color: '#ff4a4a', background: 'rgba(255, 74, 74, 0.08)', padding: '12px 20px', borderRadius: '14px', border: '1px solid rgba(255, 74, 74, 0.15)', animation: 'cardAppear 0.3s ease forwards' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
            </div>
        </div>
    );

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard} style={{ maxWidth: '440px', gap: '24px' }}>

                {/* Profile Avatar & Title Block */}
                <div style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffdb4d 0%, #ffcc00 100%)',
                        margin: '0 auto 14px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000',
                        fontSize: '24px',
                        fontWeight: '800',
                        boxShadow: '0 8px 30px rgba(255, 204, 0, 0.25)',
                        animation: 'cardAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}>
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h1 className={styles.authTitle} style={{ fontSize: '24px', transition: 'transform 0.3s ease' }}>
                        {capitalizeName(profile?.name)}
                    </h1>
                    <p style={{ color: '#636366', fontSize: '13px', margin: '6px 0 0 0', letterSpacing: '0.2px' }}>Secure System Instance</p>
                </div>

                {/* Identity Metadata Container Card */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    background: 'linear-gradient(180deg, #161619 0%, #131316 100%)',
                    padding: '22px 20px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.02)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
                }}>
                    {/* Field Cell: Email */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                        <div>
                            <label style={{ color: '#636366', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>Email Address</label>
                            <span style={{ fontSize: '14px', color: '#e5e5ea', fontWeight: '500', letterSpacing: '0.2px' }}>{profile?.email}</span>
                        </div>
                        {profile && renderBadge(profile.isEmailVerified)}
                    </div>

                    {/* Field Cell: Phone */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
                        <div>
                            <label style={{ color: '#636366', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>Phone Number</label>
                            <span style={{ fontSize: '14px', color: '#e5e5ea', fontWeight: '500', letterSpacing: '0.2px' }}>{profile?.phone}</span>
                        </div>
                        {profile && renderBadge(profile.isPhoneVerified)}
                    </div>
                </div>

                {/* ⚡ Dynamic Collapsible Active Session Monitoring Drawer */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(180deg, #161619 0%, #131316 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.02)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                }}>

                    {/* Drawer Trigger Header Button Row */}
                    <div
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            background: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px' }}>🖥️</span>
                            <div>
                                <span style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                                    Active Sessions
                                </span>
                                <span style={{ fontSize: '11px', color: '#636366', marginTop: '2px', display: 'block' }}>
                                    Authorized device topology
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Dynamic Counter Indicator Pill */}
                            <span style={{
                                fontSize: '11px',
                                background: 'rgba(255, 204, 0, 0.1)',
                                color: '#ffcc00',
                                fontWeight: '700',
                                padding: '3px 9px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 204, 0, 0.2)'
                            }}>
                                {sessions.length} Online
                            </span>

                            {/* Smooth Rotating Chevron Arrow Indicator */}
                            <span style={{
                                fontSize: '11px',
                                color: '#636366',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>
                    </div>

                    {/* 🔄 Smooth Dropdown Collapsible Drawer Content Area */}
                    <div style={{
                        maxHeight: isExpanded ? '280px' : '0px',
                        overflowY: 'auto',
                        padding: isExpanded ? '0 20px 20px 20px' : '0 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                        scrollbarWidth: 'none'
                    }}>
                        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                        {/* Dynamic Session Map Loop Pipeline */}
                        {sessions.map((session, index) => {
                            const isCurrent = session.isCurrentDevice;
                            const isHovered = hoveredSession === session._id;

                            return (
                                <div
                                    key={session._id}
                                    onMouseOver={() => setHoveredSession(session._id)}
                                    onMouseLeave={() => setHoveredSession(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: isCurrent
                                            ? 'rgba(255, 204, 0, 0.02)'
                                            : isHovered ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.005)',
                                        border: isCurrent
                                            ? `1px solid ${isHovered ? 'rgba(255, 204, 0, 0.25)' : 'rgba(255, 204, 0, 0.12)'}`
                                            : `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'}`,
                                        borderRadius: '12px',
                                        opacity: isCurrent ? 1 : isHovered ? 0.85 : 0.5,
                                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                                        boxShadow: isHovered ? '0 6px 16px rgba(0, 0, 0, 0.2)' : 'none',
                                        transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                                        animation: isExpanded ? `cardAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s backwards` : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '18px', transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                                            {getDeviceIcon(session.deviceName)}
                                        </span>
                                        <div>
                                            <span style={{ fontSize: '13.5px', color: isCurrent ? '#ffffff' : '#e5e5ea', fontWeight: '600', display: 'block', maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {session.deviceName}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#636366', display: 'block', marginTop: '1px' }}>
                                                {session.ipAddress} • <span style={{ color: isCurrent ? '#ffcc00' : '#8e8e93' }}>{formatActiveTime(session.updatedAt)}</span>
                                            </span>
                                        </div>
                                    </div>
                                    {isCurrent && (
                                        <span style={{ fontSize: '9px', background: 'linear-gradient(135deg, #f5b800 0%, #ffcc00 100%)', color: '#000000', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Current
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Refined Mini Action Gateway Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            flex: 1,
                            background: '#1a1a1e',
                            color: '#e5e5ea',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#222226';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#1a1a1e';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Sign Out
                    </button>

                    <button
                        type="button"
                        onClick={handleLogoutAll}
                        style={{
                            flex: 1,
                            background: 'rgba(255, 74, 74, 0.04)',
                            color: '#ff4a4a',
                            border: '1px solid rgba(255, 74, 74, 0.15)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 74, 74, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255, 74, 74, 0.35)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 74, 74, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255, 74, 74, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Terminate Sessions
                    </button>
                </div>

            </div>
        </div>
    );
}