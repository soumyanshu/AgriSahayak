import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showNotificationsMobile, setShowNotificationsMobile] = useState(false);
    const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 3, title: 'Heavy Rain Alert', time: '10m ago', text: 'Expected tomorrow evening in your region. Protect cut crops if possible.', icon: 'fas fa-cloud-showers-heavy text-blue-500' },
        { id: 2, title: 'Market Price Update', time: '2h ago', text: 'Soybean prices have surged by 5% at your favorite local Mandi today.', icon: 'fas fa-chart-line text-green-600' },
        { id: 1, title: 'Pest Warning', time: '1d ago', text: 'High risk of aphids reported in neighboring districts. Weekly check advised.', icon: 'fas fa-bug text-red-500' }
    ]);
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी (Hindi)' },
        { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
        { code: 'te', label: 'తెలుగు (Telugu)' },
        { code: 'ta', label: 'தமிழ் (Tamil)' },
        { code: 'bn', label: 'বাংলা (Bengali)' },
        { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
        { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml', label: 'മലയാളം (Malayalam)' },
        { code: 'mr', label: 'मराठी (Marathi)' },
        { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
        { code: 'ur', label: 'اردو (Urdu)' }
    ];

    const [currentLang, setCurrentLang] = useState(() => {
        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split('; ');
            const googtrans = cookies.find(row => row.startsWith('googtrans='));
            if (googtrans) {
                const parts = googtrans.split('=')[1].split('/');
                return parts[parts.length - 1]; // Extract language code from e.g., '/auto/hi'
            }
        }
        return 'en';
    });

    useEffect(() => {
        // Safe Google Translate Initialization
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,or,te,ta,bn,gu,kn,ml,mr,pa,ur',
                    autoDisplay: false
                },
                'google_translate_element_hidden' // We hide their actual widget
            );
        };

        if (!document.getElementById('google-translate-script')) {
            const addScript = document.createElement('script');
            addScript.id = 'google-translate-script';
            addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            addScript.async = true;
            document.body.appendChild(addScript);
        } else if (window.google && window.google.translate) {
            window.googleTranslateElementInit();
        }

        // Check if user is logged in
        if (localStorage.getItem('userInfo')) {
            setIsLoggedIn(true);
        }

        // Real-time Mock Notifications Generator
        const mockEvents = [
            { title: "Market Update", icon: "fas fa-chart-line text-green-600", text: "Soybean +5% today at local mandi." },
            { title: "Weather Alert", icon: "fas fa-cloud-showers-heavy text-blue-500", text: "Rain expected in 2 hours. Cover crops." },
            { title: "Pest Risk", icon: "fas fa-bug text-red-500", text: "Locust warnings normal for your region." },
            { title: "System Update", icon: "fas fa-robot text-teal-500", text: "AI Diagnostics active and analyzing soil." },
            { title: "Market Update", icon: "fas fa-rupee-sign text-green-600", text: "Wheat mandi rates updated recently." },
            { title: "Sensor Alert", icon: "fas fa-tint text-blue-400", text: "Soil moisture dropping rapidly." }
        ];

        const notificationTimer = setInterval(() => {
            if (Math.random() > 0.4) {
                const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
                const newNote = {
                    id: Date.now(),
                    title: randomEvent.title,
                    time: 'Just now',
                    text: randomEvent.text,
                    icon: randomEvent.icon
                };
                setNotifications(prev => [newNote, ...prev].slice(0, 5)); // display latest 5
                setHasSeenNotifications(false);
            }
        }, 15000);

        return () => clearInterval(notificationTimer);
    }, []);

    const handleLanguageChange = (e) => {
        const selectedLang = e.target.value;
        setCurrentLang(selectedLang);

        // Setting the language cookie that Google Translate looks for
        // Format is /auto/TARGET_LANG
        document.cookie = `googtrans=/auto/${selectedLang}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=/auto/${selectedLang}; path=/`;

        // Reload the page so Google Translate reads the new cookie and applies it instantly
        window.location.reload();
    };

    return (
        <nav className="bg-gradient-to-r from-white to-green-50 px-6 md:px-12 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm border-b border-gray-100">
            {/* Hidden div for Google Translate to attach to without showing */}
            <div id="google_translate_element_hidden" style={{ display: 'none' }}></div>

            <Link to="/" className="flex items-center gap-3 text-decoration-none group relative">
                <div className="relative">
                    {/* mix-blend-multiply naturally removes white background when placed on a light/white background */}
                    <img src="/image/logo.png" alt="AgriSahayak Logo" className="h-12 md:h-14 drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                </div>
                <span className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-primary tracking-tight font-sans drop-shadow-sm">
                    AgriSahayak
                </span>
            </Link>
            <ul className="list-none flex items-center gap-7 hidden md:flex">
                <li><a href="#home" className="text-gray-800 font-medium hover:text-primary transition-colors">Home</a></li>
                <li><a href="#about" className="text-gray-800 font-medium hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#services" className="text-gray-800 font-medium hover:text-primary transition-colors">Services</a></li>

                {/* Native Language Selector */}
                <li className="notranslate">
                    <select
                        className="text-gray-800 font-medium text-sm py-1.5 px-3 rounded-md border border-gray-200 outline-none focus:border-primary cursor-pointer bg-white notranslate"
                        value={currentLang}
                        onChange={handleLanguageChange}
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>
                </li>

                {/* Notification Bell */}
                <li className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!hasSeenNotifications) setHasSeenNotifications(true);
                        }}
                        className="text-gray-600 hover:text-primary transition-colors relative mt-1"
                        aria-label="Notifications"
                    >
                        <i className="far fa-bell text-xl"></i>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasSeenNotifications ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 border border-white ${hasSeenNotifications ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 origin-top-right transition-all">
                            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Notifications</h3>
                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">New</span>
                            </div>
                            <div className="max-h-[320px] overflow-y-auto">
                                {notifications.map((note, idx) => (
                                    <div key={note.id} className={`px-4 py-3 hover:bg-green-50/50 border-b border-gray-50 transition-colors cursor-pointer ${idx === 0 && note.time === 'Just now' ? 'bg-green-50/40 animate-pulse' : ''}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-semibold text-gray-800"><i className={`${note.icon} mr-2`}></i>{note.title}</h4>
                                            <span className="text-[10px] text-gray-400 font-medium">{note.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 pl-6 leading-relaxed">{note.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </li>

                <li>
                    <Link to="/login" className="bg-primary hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm ml-2">Login / Sign In</Link>
                </li>
            </ul>
            {/* Mobile Menu Icon */}
            <div className="md:hidden text-2xl cursor-pointer text-gray-800 flex items-center gap-4">
                <button
                    onClick={() => {
                        setShowNotificationsMobile(!showNotificationsMobile);
                        if (!hasSeenNotifications) setHasSeenNotifications(true);
                    }}
                    className="text-gray-600 relative"
                    aria-label="Notifications"
                >
                    <i className="far fa-bell text-xl"></i>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasSeenNotifications ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 border border-white ${hasSeenNotifications ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>

                    {/* Mobile Notifications Dropdown */}
                    {showNotificationsMobile && (
                        <div className="absolute right-0 mt-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 text-left">
                            <div className="px-4 py-2 border-b border-gray-50">
                                <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                            </div>
                            {notifications.slice(0, 3).map(note => (
                                <div key={note.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-1"><i className={`${note.icon} mr-2`}></i>{note.title}</h4>
                                    <p className="text-xs text-gray-600">{note.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </button>
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-primary`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}></i>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col items-start px-6 py-4 md:hidden z-40">
                    <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-gray-800 font-medium py-3 border-b border-gray-50 hover:text-primary transition-colors">Home</a>
                    <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-gray-800 font-medium py-3 border-b border-gray-50 hover:text-primary transition-colors">About Us</a>
                    <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-gray-800 font-medium py-3 border-b border-gray-50 hover:text-primary transition-colors">Services</a>
                    
                    <div className="w-full py-3 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-gray-800 font-medium">Language</span>
                        <select
                            className="text-gray-800 font-medium text-sm py-1.5 px-2 rounded-md border border-gray-200 outline-none focus:border-primary notranslate bg-white"
                            value={currentLang}
                            onChange={(e) => { handleLanguageChange(e); setIsMobileMenuOpen(false); }}
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full pt-4 pb-2">
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full block text-center bg-primary hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm">
                            Login / Sign In
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
