import  { useEffect, useState } from 'react';
import api from "../api/axios";
import { useNavigate } from 'react-router-dom';
import styles from '../stlyles/login.module.css'; 

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    isEmailVerified: boolean; // ⚡ Added field
    isPhoneVerified: boolean;  // ⚡ Added field
    updatedAt: string;         // ⚡ Added field to read RefreshToken activity timestamp
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    // ⚡ Session monitor real-time active duration string formatting utility
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
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/profile');
                setProfile(response.data.user);
            } catch (err: any) {
                setError("Session expired. Redirecting to login...");
                setTimeout(() => navigate('/login'), 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error("Logout failed on backend", err);
        } finally {
            navigate('/login');
        }
    };

    // ⚡ New feature: Dispatches global wipe call to remove all active DB session tokens
    const handleLogoutAll = async () => {
        if (!window.confirm("Are you sure you want to log out of ALL active devices?")) return;
        
        setLoading(true);
        try {
            await api.post('/logout/all');
            navigate('/login');
        } catch (err: any) {
            console.error("Global logout failed on backend", err);
            setError(err.response?.data?.message || "Global logout failed.");
            setLoading(false);
        }
    };

    // Helper function to render a premium styled verification badge
    const renderBadge = (isVerified: boolean) => {
        return isVerified ? (
            <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 255, 102, 0.15)',
                color: '#00ff66',
                border: '1px solid rgba(0, 255, 102, 0.3)',
                marginLeft: '8px'
            }}>
                ✓ Verified
            </span>
        ) : (
            <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 74, 74, 0.15)',
                color: '#ff4a4a',
                border: '1px solid rgba(255, 74, 74, 0.3)',
                marginLeft: '8px',
                cursor: 'pointer'
            }}
            onClick={() => navigate('/verify-otp', { state: { email: profile?.email } })}
            >
                ⚠️ Unverified (Verify Now)
            </span>
        );
    };

    if (loading) return <div className={styles.authContainer}><p>Loading your profile...</p></div>;
    if (error) return <div className={styles.authContainer} style={{ color: '#ff4a4a' }}><p>{error}</p></div>;

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>Your Profile</h1>
                
                <div className={styles.authForm} style={{ gap: '24px', background: '#1c1c1e', padding: '24px', borderRadius: '12px' }}>
                    
                    {/* Display Name */}
                    <div>
                        <label style={{ color: '#8e8e93', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '600' }}>{profile?.name}</p>
                    </div>
                    
                    {/* Display Email + Verification Status Badge */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={{ color: '#8e8e93', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                            {profile && renderBadge(profile.isEmailVerified)}
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '16px', opacity: 0.9 }}>{profile?.email}</p>
                    </div>

                    {/* Display Phone + Verification Status Badge */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={{ color: '#8e8e93', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
                            {profile && renderBadge(profile.isPhoneVerified)}
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '16px', opacity: 0.9 }}>{profile?.phone}</p>
                    </div>

                    {/* ⚡ New Feature Component: Session Activity Monitor Card */}
                    <div style={{ background: '#242426', padding: '14px', borderRadius: '8px', border: '1px solid #2c2c2e', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Session Status</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '12px', color: '#00ff66', fontWeight: '600' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00ff66', marginRight: '6px', display: 'inline-block' }}></span>
                                Synchronized
                            </span>
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#ffffff', opacity: 0.8 }}>
                            Last device ping: <strong style={{ color: '#ffcc00' }}>{formatActiveTime(profile?.updatedAt)}</strong>
                        </p>
                    </div>

                    {/* ⚡ Layout Action Area: Vertical button list stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        <button onClick={handleLogout} className={styles.submitBtn} style={{ background: '#242426', color: '#ff4a4a', marginTop: '0px' }}>
                            Log Out Current Device
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleLogoutAll} 
                            className={styles.submitBtn} 
                            style={{ background: 'transparent', color: '#ff4a4a', border: '1px solid rgba(255, 74, 74, 0.4)', marginTop: '0px' }}
                        >
                            💥 Log Out From All Devices
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}