import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';
import FeatureModal from './FeatureModal';
import { schemes, mandiPrices } from '../data/featuresData';

const LOCATION_DATA = {
    "Assam": ["Kamrup", "Kamrup Metropolitan (Guwahati)", "Dibrugarh", "Jorhat", "Nagaon", "Cachar"],
    "West Bengal": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Murshidabad", "Nadia"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
    "Uttar Pradesh": ["Lucknow", "Kanpur Nagar", "Varanasi", "Prayagraj", "Agra"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Belagavi", "Dharwad"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
    "Odisha": ["Khordha", "Cuttack", "Puri", "Sambalpur", "Ganjam"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [profileMode, setProfileMode] = useState('view');
    const [editForm, setEditForm] = useState({
        name: '', mobileOrEmail: '', email: '', state: '', district: '', village: '', primaryCrop: '', farmArea: 0, language: 'English', notificationsEnabled: true
    });

    const [farmAreaInput, setFarmAreaInput] = useState(0);
    const [profilePictureInput, setProfilePictureInput] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [weatherData, setWeatherData] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [wheatPercent, setWheatPercent] = useState(12);
    const [ricePercent, setRicePercent] = useState(33);
    const [notifications, setNotifications] = useState([
        { id: 3, title: 'Heavy Rain Alert', time: '10m ago', text: 'Expected tomorrow evening in your region. Protect cut crops if possible.', icon: 'fas fa-cloud-showers-heavy text-blue-500' },
        { id: 2, title: 'Market Price Update', time: '2h ago', text: 'Soybean prices have surged by 5% at your favorite local Mandi today.', icon: 'fas fa-chart-line text-green-600' },
        { id: 1, title: 'Pest Warning', time: '1d ago', text: 'High risk of aphids reported in neighboring districts. Weekly check advised.', icon: 'fas fa-bug text-red-500' }
    ]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
    const [activeFeatureModal, setActiveFeatureModal] = useState(null);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [myBookings, setMyBookings] = useState([]);

    const allFeatures = [
        { id: 1, title: 'Crop Recommendation', icon: 'fas fa-seedling' },
        { id: 2, title: 'Fertilizer Calculator', icon: 'fas fa-vial' },
        { id: 3, title: 'Pest & Disease Detection', icon: 'fas fa-bug' },
        { id: 4, title: 'Weather Alerts', icon: 'fas fa-cloud-sun-rain' },
        { id: 5, title: 'Government Schemes', icon: 'fas fa-landmark' },
        { id: 6, title: 'Mandi Prices', icon: 'fas fa-rupee-sign' },
        { id: 7, title: 'Drone Spraying', icon: '🚁' },
        { id: 8, title: 'Satellite Mapping', icon: 'fas fa-satellite' },
        { id: 9, title: 'AI Assistant', icon: 'fas fa-robot' },
        { id: 10, title: 'Activity Summary', icon: 'fas fa-clipboard-list' },
    ];

    const sliderFeatures = [
        { id: 1, title: 'Crop Recommendation', img: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=1200' },
        { id: 2, title: 'Fertilizer Calculator', img: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=1200' },
        { id: 3, title: 'Pest Detection', img: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&q=80&w=1200' },
        { id: 4, title: 'Weather Alerts', img: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1200' },
        { id: 5, title: 'Government Schemes', img: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&q=80&w=1200' },
        { id: 6, title: 'Mandi Prices', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1200' }
    ];

    const getWeatherDetails = (code) => {
        if (code === 0) return { label: 'Sunny', icon: 'fas fa-sun text-yellow-400' };
        if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: 'fas fa-cloud-sun text-slate-100' };
        if (code >= 45 && code <= 48) return { label: 'Foggy', icon: 'fas fa-smog text-slate-400' };
        if (code >= 51 && code <= 67) return { label: 'Rainy', icon: 'fas fa-cloud-rain text-blue-300' };
        if (code >= 71 && code <= 82) return { label: 'Snow', icon: 'fas fa-snowflake text-sky-200' };
        if (code >= 95) return { label: 'Thunderstorm', icon: 'fas fa-poo-storm text-purple-400' };
        return { label: 'Clear', icon: 'fas fa-sun text-yellow-400' };
    };

    const fetchAndSetUserBookings = useCallback(async () => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) return;
        const parsed = JSON.parse(userInfo);
        const userId = parsed.user?._id || parsed._id;
        if (!userId) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/user/${userId}`);
            const data = await res.json();
            if(data.success && data.bookings) {
                const formattedBookings = data.bookings.map(b => ({
                    date: new Date(b.createdAt).toLocaleDateString(),
                    crop: b.cropName,
                    area: b.landArea,
                    slot: b.preferredTime,
                    status: b.paymentStatus === 'Paid' || b.paymentStatus === 'Pending (Cash)' ? 'Confirmed' : b.paymentStatus
                }));
                setMyBookings(formattedBookings);

                let generatedNotes = [];
                data.bookings.forEach(b => {
                    generatedNotes.push({
                        id: `book_${b._id}`,
                        title: 'Drone booking confirmed',
                        text: `Your drone spraying for ${b.cropName} is scheduled.`,
                        icon: '🚁',
                        timeMs: new Date(b.createdAt).getTime(),
                        isRead: true
                    });

                    if (b.paymentStatus === 'Paid') {
                        generatedNotes.push({
                            id: `pay_${b._id}`,
                            title: `Payment successful ₹${b.totalCost || 500}`,
                            text: `Payment received for ticket ${b.ticketId}.`,
                            icon: '💳',
                            timeMs: new Date(b.createdAt).getTime() + 5000,
                            isRead: true
                        });
                    }
                });

                const now = Date.now();
                generatedNotes.push({
                    id: 'mock_weather_1',
                    title: 'Heavy rain expected tomorrow',
                    text: 'Please hold off on any immediate spraying.',
                    icon: '🌧️',
                    timeMs: now - 7200000,
                    isRead: false
                });

                generatedNotes.push({
                    id: 'mock_scheme_1',
                    title: 'New scheme available',
                    text: 'PM-Kisan updates for this month.',
                    icon: '🏛️',
                    timeMs: now - 86400000,
                    isRead: true
                });

                generatedNotes.push({
                    id: 'mock_ai_1',
                    title: 'AI suggestions ready',
                    text: 'Crop health analysis completed.',
                    icon: '🤖',
                    timeMs: now - 172800000,
                    isRead: true
                });

                generatedNotes.sort((a, b) => b.timeMs - a.timeMs);
                
                const formatTime = (ms) => {
                    const diffMins = Math.floor((now - ms) / 60000);
                    if (diffMins < 60) return `${diffMins || 1} mins ago`;
                    const diffHrs = Math.floor(diffMins / 60);
                    if (diffHrs < 24) return `${diffHrs} hrs ago`;
                    return `${Math.floor(diffHrs / 24)} days ago`;
                };

                const finalNotes = generatedNotes.map(n => ({
                    ...n,
                    time: formatTime(n.timeMs)
                }));

                setNotifications(finalNotes);
                
                // If there are unread notifications, show the dot
                if (finalNotes.some(n => !n.isRead)) {
                    setHasSeenNotifications(false);
                }
            }
        } catch(e) { console.error("Failed to fetch bookings", e); }
    }, []);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsed = JSON.parse(userInfo);
            setUser(parsed);
            setFarmAreaInput(parsed.user?.farmArea || parsed.farmArea || 0);
            setProfilePictureInput(parsed.user?.profilePicture || parsed.profilePicture || '');
            
            const u = parsed.user || parsed;
            setEditForm({
                name: u.name || '',
                mobileOrEmail: u.mobileOrEmail || '',
                email: u.email || '',
                state: u.state || '',
                district: u.district || '',
                village: u.village || '',
                primaryCrop: u.primaryCrop || '',
                farmArea: u.farmArea || 0,
                language: u.language || 'English',
                notificationsEnabled: u.notificationsEnabled !== undefined ? u.notificationsEnabled : true
            });

            fetchAndSetUserBookings();
        } else {
            navigate('/login');
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const sliderTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderFeatures.length);
        }, 5000);

        const percentageTimer = setInterval(() => {
            setWheatPercent(prev => Math.min(100, Math.max(0, prev + (Math.floor(Math.random() * 5) - 2))));
            setRicePercent(prev => Math.min(100, Math.max(0, prev + (Math.floor(Math.random() * 5) - 2))));
        }, 12000);

        return () => {
            clearInterval(timer);
            clearInterval(sliderTimer);
            clearInterval(percentageTimer);
        };
    }, [navigate, fetchAndSetUserBookings]);

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                setWeatherLoading(true);
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
                const res = await fetch(url);
                const data = await res.json();
                setWeatherData(data);
            } catch (err) {
                console.error("Failed to fetch weather", err);
            } finally {
                setWeatherLoading(false);
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                async () => {
                    // Geolocation denied or failed, try IP-based location fallback
                    try {
                        const ipRes = await fetch("https://ipapi.co/json/");
                        const ipData = await ipRes.json();
                        if (ipData && ipData.latitude && ipData.longitude) {
                            fetchWeather(ipData.latitude, ipData.longitude);
                        } else {
                            fetchWeather(28.6139, 77.2090); // Fallback to New Delhi
                        }
                    } catch (e) {
                        fetchWeather(28.6139, 77.2090); // Fallback to New Delhi
                    }
                }
            );
        } else {
            fetchWeather(28.6139, 77.2090);
        }
    }, []);

    useEffect(() => {
        if (activeFeatureModal === null) {
            fetchAndSetUserBookings();
        }
    }, [activeFeatureModal, fetchAndSetUserBookings]);

    // Auto-generate missing agriId for existing logins
    useEffect(() => {
        if (user && Object.keys(user).length > 0) {
            let currentId = user.user?.agriId || user.agriId;
            if (!currentId || currentId === 'Not Generated') {
                const newAgriId = 'AGRI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                const userId = user.user?._id || user._id;
                
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, agriId: newAgriId })
                })
                .then(res => res.json())
                .then(data => {
                    const updatedPayload = user.user ? { ...user, user: data } : data;
                    localStorage.setItem('userInfo', JSON.stringify(updatedPayload));
                    setUser(updatedPayload);
                })
                .catch(err => console.error("Could not auto-generate Agri-ID:", err));
            }
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/');
    };

    const handleProfilePictureUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePictureInput(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };



    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const userId = user.user?._id || user._id;
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    profilePicture: profilePictureInput,
                    ...editForm,
                    farmArea: Number(editForm.farmArea)
                })
            });
            const data = await res.json();
            if (res.ok) {
                // Determine structure based on how it was originally saved
                const updatedPayload = user.user ? { ...user, user: data } : data;
                localStorage.setItem('userInfo', JSON.stringify(updatedPayload));
                setUser(updatedPayload);
                setProfileMode('view'); // Switch back to view mode on save
            } else {
                alert(data.message || 'Error updating profile');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingProfile(false);
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center">
            <div className="relative flex justify-center items-center">
                <div className="absolute animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-green-500"></div>
                <i className="fas fa-seedling text-4xl text-green-600 animate-pulse"></i>
            </div>
        </div>
    );

    const userName = user.user?.name || user.name || 'Farmer';
    const init = userName[0].toUpperCase();
    const uFarmArea = user.user?.farmArea || user.farmArea || 0;
    const uAgriId = user.user?.agriId || user.agriId || 'Not Generated';
    const uProfilePic = user.user?.profilePicture || user.profilePicture || '';
    const rawContact = user.user?.mobileOrEmail || user.mobileOrEmail || '';
    const isEmailContact = rawContact.includes('@');
    
    const uEmail = user.user?.email || user.email || (isEmailContact ? rawContact : '');
    const uMobileOrEmail = isEmailContact ? 'Not Provided' : rawContact;

    return (
        <div className="min-h-screen font-sans bg-slate-50 relative overflow-hidden">
            {/* Internal CSS logic removed since marquee is replaced by React transition */}
            {/* Soft, Modern Background Gradients */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-green-200/50 via-emerald-100/30 to-transparent rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-lime-200/40 via-green-100/20 to-transparent rounded-full blur-[80px] pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>

            {/* Sidebar Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar Menu */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-green-50 to-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-6 border-b border-green-100/50 bg-transparent">
                    <span className="font-bold text-2xl tracking-tight text-slate-800">
                        All <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Features</span>
                    </span>
                    <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {allFeatures.map(feature => (
                        <div 
                            key={feature.id}
                            onClick={() => {
                                if (feature.id === 9) {
                                    setIsChatbotOpen(true);
                                } else {
                                    setActiveFeatureModal(feature.id);
                                }
                                setIsMenuOpen(false);
                            }}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-green-50 text-slate-600 hover:text-green-700 cursor-pointer transition-all duration-300 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-green-200 group-hover:shadow-sm flex items-center justify-center transition-all duration-300">
                                {feature.icon.startsWith('fas ') ? (
                                    <i className={`${feature.icon} text-lg`}></i>
                                ) : (
                                    <span className="text-lg">{feature.icon}</span>
                                )}
                            </div>
                            <span className="font-semibold text-sm group-hover:font-bold">{feature.title}</span>
                        </div>
                    ))}
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-slate-50">
                    <div className="text-xs font-medium text-slate-400 text-center uppercase tracking-widest">
                        AgriSahayak v1.0
                    </div>
                </div>
            </div>

            {/* Premium Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-4">
                            {/* Hamburger Menu Icon */}
                            <button 
                                onClick={() => setIsMenuOpen(true)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors focus:outline-none"
                            >
                                <i className="fas fa-bars text-2xl"></i>
                            </button>
                            
                            <div className="flex items-center gap-3 group text-decoration-none">
                                <img src="/image/logo.png" alt="AgriSahayak Logo" className="h-12 md:h-16 drop-shadow-lg transition-transform duration-300 transform group-hover:scale-[1.02]" />
                                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-emerald-600 tracking-tight hidden sm:block">
                                    AgriSahayak
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            {/* Notification Bell */}
                            {(user?.user?.notificationsEnabled ?? user?.notificationsEnabled ?? true) && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowNotifications(!showNotifications);
                                            if (!hasSeenNotifications) setHasSeenNotifications(true);
                                        }}
                                        className="text-slate-500 hover:text-emerald-600 transition-colors relative mt-1 focus:outline-none"
                                        aria-label="Notifications"
                                    >
                                        <i className="far fa-bell text-2xl"></i>
                                        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasSeenNotifications ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${hasSeenNotifications ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        </span>
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50 origin-top-right transition-all">
                                            <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center">
                                                <h3 className="font-bold text-slate-800">Notifications</h3>
                                                <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">{notifications.filter(n => !n.isRead).length} New</span>
                                            </div>
                                            <div className="max-h-[320px] overflow-y-auto">
                                                {notifications.map((note, idx) => (
                                                    <div key={note.id} className={`px-5 py-4 hover:bg-emerald-50/50 border-b border-slate-50 transition-colors cursor-pointer ${!note.isRead ? 'bg-emerald-50/40' : ''}`}>
                                                        <div className="flex gap-3">
                                                            <div className="text-2xl mt-1 shrink-0">{note.icon}</div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-slate-800">{note.title}</p>
                                                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{note.text}</p>
                                                                <div className="flex justify-between items-center mt-2">
                                                                    <span className="text-[10px] text-slate-400 font-bold tracking-wide">{note.time}</span>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${note.isRead ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                        {note.isRead ? 'Read' : 'Unread'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="hidden md:block text-right ml-2 border-l border-slate-200 pl-5">
                                <div className="text-sm font-bold text-slate-800">{userName}</div>
                                <div className="text-xs font-medium text-emerald-600 tracking-wide mt-0.5">Verified Partner</div>
                            </div>
                            <div className="h-11 w-11 relative cursor-pointer group" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                                <div className="absolute inset-0 bg-green-500 blur opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                                {uProfilePic ? (
                                    <img src={uProfilePic} alt="Profile" className="relative h-full w-full rounded-full object-cover border border-white shadow-md z-10" />
                                ) : (
                                    <div className="relative h-full w-full bg-gradient-to-tr from-green-600 to-emerald-400 border border-white rounded-full flex items-center justify-center text-white font-bold shadow-md z-10">
                                        {init}
                                    </div>
                                )}

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50 origin-top-right transition-all">
                                        <button onClick={(e) => { e.stopPropagation(); setIsProfileOpen(true); setProfileMode('view'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2">
                                            <i className="fas fa-user text-slate-400 w-4"></i> View Profile
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setIsProfileOpen(true); setProfileMode('edit'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2">
                                            <i className="fas fa-edit text-slate-400 w-4"></i> Edit Profile
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setIsProfileOpen(true); setProfileMode('edit'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2">
                                            <i className="fas fa-cog text-slate-400 w-4"></i> Settings
                                        </button>
                                        <div className="border-t border-slate-100 my-1"></div>
                                        <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                                            <i className="fas fa-sign-out-alt text-red-400 w-4"></i> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 pt-28 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Row 1: Header Row */}
                <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white/80 backdrop-blur-lg p-4 rounded-xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">{userName}</span> 🌾
                        </h1>
                        <p className="text-slate-500 font-medium mt-0.5 text-sm">Here is your farm overview for today.</p>
                    </div>
                    {/* Time clock */}
                    <div className="bg-slate-50 px-4 py-2 rounded-lg shadow-inner border border-slate-100 flex flex-col items-center md:items-end">
                        <div className="text-xl font-extrabold text-slate-800 tracking-wide">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* New Grid Layout based on User Design */}
                <div className="mt-6 flex flex-col gap-6">
                    {/* Row 1: Top Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Weather */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-blue-400 text-4xl">
                                    <i className={weatherData ? getWeatherDetails(weatherData.current.weather_code).icon : "fas fa-cloud-sun"}></i>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-800">Weather</p>
                                    <p className="text-2xl font-black text-slate-800">{weatherData ? Math.round(weatherData.current.temperature_2m) : '--'}°C</p>
                                    <p className="text-xs font-semibold text-slate-500">{weatherData ? getWeatherDetails(weatherData.current.weather_code).label : 'Loading...'}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveFeatureModal(4)} className="text-left text-xs font-bold text-green-600 hover:text-green-700 mt-2 flex justify-between items-center w-full">
                                View Details <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        
                        {/* Mandi Price */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-green-500 bg-green-50 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                                    <i className="fas fa-rupee-sign"></i>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-800">Mandi Price ({mandiPrices[0]?.commodity || 'N/A'})</p>
                                    <p className="text-2xl font-black text-slate-800">₹{mandiPrices[0]?.modalPrice || '--'} <span className="text-xs text-slate-500">/qtl</span></p>
                                    <p className="text-xs font-semibold text-green-600">{mandiPrices[0]?.market || 'N/A'}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveFeatureModal(6)} className="text-left text-xs font-bold text-green-600 hover:text-green-700 mt-2 flex justify-between items-center w-full">
                                View Prices <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        
                        {/* Schemes Available */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-purple-500 bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                                    <i className="fas fa-landmark"></i>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-800">Schemes Available</p>
                                    <p className="text-3xl font-black text-slate-800 mt-1">{schemes.length < 10 ? '0' + schemes.length : schemes.length}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveFeatureModal(5)} className="text-left text-xs font-bold text-green-600 hover:text-green-700 mt-2 flex justify-between items-center w-full">
                                View Schemes <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        
                        {/* Drone Bookings */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-green-600 bg-green-50 w-12 h-12 rounded-full flex items-center justify-center text-xl pb-1">
                                    <span className="text-2xl">🚁</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-800">Drone Bookings</p>
                                    <p className="text-3xl font-black text-slate-800 mt-1">{myBookings.length < 10 ? '0' + myBookings.length : myBookings.length}</p>
                                    <p className="text-xs font-semibold text-slate-500">Active</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveFeatureModal(7)} className="text-left text-xs font-bold text-green-600 hover:text-green-700 mt-2 flex justify-between items-center w-full">
                                View Bookings <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Alerts & Mandi Prices */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Weather Overview (Alert + 3-Day) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-6 lg:col-span-1 h-full">
                            {/* Weather Alert */}
                            <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Weather Alert</h3>
                                    <button onClick={() => setActiveFeatureModal(4)} className="text-xs font-bold text-green-600 flex items-center gap-1">View All <i className="fas fa-arrow-right"></i></button>
                                </div>
                                <div className="relative rounded-xl overflow-hidden mb-4 bg-gradient-to-r from-red-50 to-orange-50 p-4 flex items-center gap-4 border border-red-100 flex-1">
                                    <div className="text-5xl text-slate-700"><i className="fas fa-cloud-showers-heavy"></i></div>
                                    <div>
                                        <p className="text-red-600 font-black text-lg">Heavy Rain Expected</p>
                                        <p className="text-sm text-slate-700 font-bold mb-1">In next 24 hours</p>
                                        <p className="text-xs text-slate-600">Avoid fertilizer and pesticide spraying.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 flex flex-col justify-center">
                                        <i className="fas fa-tint text-blue-400 text-lg mb-1"></i>
                                        <p className="font-bold text-slate-800 text-sm">85%</p>
                                        <p className="text-[10px] text-slate-500 uppercase">Humidity</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 flex flex-col justify-center">
                                        <i className="fas fa-wind text-slate-400 text-lg mb-1"></i>
                                        <p className="font-bold text-slate-800 text-sm">14 km/h</p>
                                        <p className="text-[10px] text-slate-500 uppercase">Wind</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 flex flex-col justify-center">
                                        <i className="fas fa-temperature-high text-red-400 text-lg mb-1"></i>
                                        <p className="font-bold text-slate-800 text-sm">{weatherData ? Math.round(weatherData.current.temperature_2m) : '--'}°C</p>
                                        <p className="text-[10px] text-slate-500 uppercase">Feels like</p>
                                    </div>
                                </div>
                            </div>
                            
                            <hr className="border-slate-100 border-t-2 border-dashed" />

                            {/* 3-Day Forecast */}
                            <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">3-Day Forecast</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                    {weatherData ? [1, 2, 3].map(i => {
                                        const codeData = getWeatherDetails(weatherData.daily.weather_code[i]);
                                        return (
                                            <div key={i} className="flex flex-col items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-xs font-bold text-slate-600 text-center">{i === 1 ? 'Tomorrow' : `Day ${i}`}</p>
                                                <i className={`${codeData.icon} text-4xl my-3`}></i>
                                                <div className="text-center">
                                                    <p className="font-black text-slate-800 text-lg">{Math.round(weatherData.daily.temperature_2m_max[i])}°C</p>
                                                    <p className="text-[10px] text-slate-500 font-semibold">{codeData.label}</p>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="col-span-3 flex items-center justify-center text-slate-400">Loading forecast...</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mandi Prices */}
                        <div className="lg:col-span-2 flex flex-col">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden h-full flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Mandi Prices (Today)</h3>
                                    <button onClick={() => setActiveFeatureModal(6)} className="text-xs font-bold text-green-600 flex items-center gap-1">View All <i className="fas fa-arrow-right"></i></button>
                                </div>
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left text-sm h-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs text-slate-500">
                                                <th className="pb-2 font-bold whitespace-nowrap">Commodity</th>
                                                <th className="pb-2 font-bold whitespace-nowrap">Min Price</th>
                                                <th className="pb-2 font-bold whitespace-nowrap">Max Price</th>
                                                <th className="pb-2 font-bold whitespace-nowrap">Modal Price</th>
                                                <th className="pb-2 font-bold text-right whitespace-nowrap">Market</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-700 font-medium">
                                            {mandiPrices.slice(0, 5).map((p, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                    <td className="py-4 flex items-center gap-2 whitespace-nowrap"><span className="text-lg">🌾</span> {p.commodity}</td>
                                                    <td className="py-4 whitespace-nowrap">₹{p.minPrice}</td>
                                                    <td className="py-4 whitespace-nowrap">₹{p.maxPrice}</td>
                                                    <td className="py-4 text-green-600 font-bold whitespace-nowrap">₹{p.modalPrice}</td>
                                                    <td className="py-4 text-right text-xs whitespace-nowrap">{p.market}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Bookings & Maps */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* My Bookings */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">My Bookings</h3>
                                <button onClick={() => setActiveFeatureModal(7)} className="text-xs font-bold text-green-600 flex items-center gap-1">View All <i className="fas fa-arrow-right"></i></button>
                            </div>
                            <div className="space-y-4 flex-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {myBookings.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center h-[200px]">
                                        <i className="fas fa-plane-slash text-4xl text-slate-200 mb-3 block"></i>
                                        <p className="text-sm font-bold text-slate-500">No Active Bookings</p>
                                        <button onClick={() => setActiveFeatureModal(7)} className="mt-2 text-xs font-bold text-green-600 hover:text-green-700">Book a Drone <i className="fas fa-arrow-right ml-1"></i></button>
                                    </div>
                                ) : (
                                    myBookings.map((b, idx) => (
                                        <div key={idx} className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                            <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 text-xl shrink-0 pb-1">
                                                <span className="text-2xl">🚁</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-slate-800 text-sm">Drone Spraying</p>
                                                    <p className="text-xs font-bold text-slate-500">{b.date}</p>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-slate-600 font-medium">{b.crop} • {b.area} Acres</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">{b.slot}</p>
                                                </div>
                                                <div className={`mt-2 inline-block px-2 py-0.5 text-[10px] font-bold rounded ${b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {b.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Satellite View */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">Satellite View</h3>
                                <button onClick={() => setActiveFeatureModal(8)} className="text-xs font-bold text-green-600 flex items-center gap-1">View Details <i className="fas fa-arrow-right"></i></button>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1 rounded-xl overflow-hidden relative border border-slate-200 min-h-[200px]">
                                    <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=600" alt="Satellite" className="w-full h-full object-cover absolute inset-0" />
                                    {/* Overlay polygon mock */}
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <polygon points="10,80 30,10 80,20 90,70 50,90" fill="rgba(132, 204, 22, 0.4)" stroke="white" strokeWidth="1" />
                                    </svg>
                                </div>
                                <div className="w-full md:w-32 flex flex-col justify-center border-l border-slate-100 pl-4">
                                    <p className="text-xs font-bold text-slate-600 mb-1">Crop Health (NDVI)</p>
                                    <p className="text-green-600 font-black text-xl mb-1">Good</p>
                                    <p className="text-2xl font-black text-slate-800 mb-3">0.72</p>
                                    
                                    <div className="w-full h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 mb-1"></div>
                                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-4">
                                        <span>-1</span><span>0</span><span>1</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy (70%)</div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Moderate (20%)</div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600"><span className="w-2 h-2 rounded-full bg-red-500"></span> Poor (10%)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Profile Modal */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100 relative">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 flex-shrink-0 relative pointer-events-auto">
                            <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 relative cursor-pointer group shrink-0">
                                    {profilePictureInput ? (
                                        <img src={profilePictureInput} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg bg-white" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-white text-3xl border-4 border-white shadow-lg backdrop-blur-md">
                                            👨‍🌾
                                        </div>
                                    )}
                                    {profileMode === 'edit' && (
                                        <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer z-20">
                                            <i className="fas fa-camera text-lg"></i>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} />
                                        </label>
                                    )}
                                </div>
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">{editForm.name || userName}</h2>
                                    <p className="text-green-100 text-sm font-semibold uppercase tracking-widest mt-1 opacity-90">{uAgriId}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Body - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                            {/* Basic Details */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider flex justify-between items-center">
                                    <span><i className="fas fa-user-circle text-emerald-500 mr-2"></i>Basic Details</span>
                                    {profileMode === 'view' && (
                                        <button onClick={() => setProfileMode('edit')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"><i className="fas fa-edit mr-1"></i>Edit</button>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Full Name</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.name || 'Not Provided'}</div>
                                        ) : (
                                            <input type="text" className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Mobile Number</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.mobileOrEmail || 'Not Provided'}</div>
                                        ) : (
                                            <input type="text" className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.mobileOrEmail} onChange={e => setEditForm({...editForm, mobileOrEmail: e.target.value})} />
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Location Details */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">
                                    <i className="fas fa-map-marker-alt text-emerald-500 mr-2"></i>Location Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">State</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.state || 'Not Provided'}</div>
                                        ) : (
                                            <select className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value, district: ''})}>
                                                <option value="">Select State</option>
                                                {Object.keys(LOCATION_DATA).map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">District</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.district || 'Not Provided'}</div>
                                        ) : (
                                            <select className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} disabled={!editForm.state || !LOCATION_DATA[editForm.state]}>
                                                <option value="">Select District</option>
                                                {editForm.state && LOCATION_DATA[editForm.state]?.map(dist => (
                                                    <option key={dist} value={dist}>{dist}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Village</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.village || 'Not Provided'}</div>
                                        ) : (
                                            <input type="text" className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.village} onChange={e => setEditForm({...editForm, village: e.target.value})} placeholder="e.g. Shirur" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium mt-2"><i className="fas fa-info-circle text-emerald-400 mr-1"></i>Used for localized Weather alerts, Mandi prices, and Govt schemes.</p>
                            </section>

                            {/* Farming Details */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">
                                    <i className="fas fa-seedling text-emerald-500 mr-2"></i>Farming Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Primary Crop</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.primaryCrop || 'Not Provided'}</div>
                                        ) : (
                                            <input type="text" className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.primaryCrop} onChange={e => setEditForm({...editForm, primaryCrop: e.target.value})} placeholder="Rice, Wheat, etc." />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Land Area (Acres)</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.farmArea || 0} acres</div>
                                        ) : (
                                            <input type="number" min="0" step="0.1" className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.farmArea} onChange={e => setEditForm({...editForm, farmArea: Math.max(0, Number(e.target.value))})} />
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* App Preferences */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">
                                    <i className="fas fa-sliders-h text-emerald-500 mr-2"></i>App Preferences
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Language</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.language || 'English'}</div>
                                        ) : (
                                            <select className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.language} onChange={e => setEditForm({...editForm, language: e.target.value})}>
                                                <option value="English">English</option>
                                                <option value="Hindi">Hindi</option>
                                                <option value="Marathi">Marathi</option>
                                                <option value="Tamil">Tamil</option>
                                                <option value="Telugu">Telugu</option>
                                                <option value="Kannada">Kannada</option>
                                                <option value="Bengali">Bengali</option>
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Notifications</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.notificationsEnabled ? 'On' : 'Off'}</div>
                                        ) : (
                                            <select className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.notificationsEnabled ? 'true' : 'false'} onChange={e => setEditForm({...editForm, notificationsEnabled: e.target.value === 'true'})}>
                                                <option value="true">On</option>
                                                <option value="false">Off</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Account Details */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">
                                    <i className="fas fa-shield-alt text-emerald-500 mr-2"></i>Account Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                                        {profileMode === 'view' ? (
                                            <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5">{editForm.email || 'Not Provided'}</div>
                                        ) : (
                                            <input type="email" className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2.5 outline-none text-slate-700 font-semibold shadow-sm transition-colors" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="your@email.com" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Password</label>
                                        <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 tracking-widest">********</div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        
                        {/* Footer - Actions */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 justify-end rounded-b-3xl">
                            {profileMode === 'view' ? (
                                <button
                                    onClick={() => setIsProfileOpen(false)}
                                    className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            // reset edit form based on user state
                                            const u = user.user || user;
                                            setEditForm({
                                                name: u.name || '',
                                                mobileOrEmail: u.mobileOrEmail || '',
                                                email: u.email || '',
                                                state: u.state || '',
                                                district: u.district || '',
                                                village: u.village || '',
                                                primaryCrop: u.primaryCrop || '',
                                                farmArea: u.farmArea || 0,
                                                language: u.language || 'English',
                                                notificationsEnabled: u.notificationsEnabled !== undefined ? u.notificationsEnabled : true
                                            });
                                            setProfilePictureInput(u.profilePicture || '');
                                            setProfileMode('view');
                                        }}
                                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2"
                                    >
                                        {isSavingProfile ? (
                                            <><i className="fas fa-circle-notch fa-spin"></i> Saving...</>
                                        ) : (
                                            <><i className="fas fa-check"></i> Update Details</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Feature Modal overlay */}
            {activeFeatureModal && (
                <FeatureModal 
                    featureId={activeFeatureModal} 
                    onClose={() => setActiveFeatureModal(null)} 
                    weatherData={weatherData} 
                />
            )}

            {/* AI Assistant Chatbot Integration */}
            <Chatbot externalIsOpen={isChatbotOpen} setExternalIsOpen={setIsChatbotOpen} />
        </div>
    );
};

export default Dashboard;
