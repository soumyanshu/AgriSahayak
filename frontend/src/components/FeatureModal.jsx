import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { schemes, mandiPrices as prices } from '../data/featuresData';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LeafletSatelliteMap = ({ satelliteState, setSatelliteState }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const featureGroup = useRef(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (!map.current) {
            // Initialize map
            const [lat, lng] = satelliteState.gpsLocation.split(',').map(Number);
            map.current = L.map(mapContainer.current).setView([lat || 21.1458, lng || 79.0882], 16);
            
            // Satellite Tile Layer - Use Google Satellite for better reliability and clarity
            L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', {
                attribution: 'Map data &copy; Google',
                maxZoom: 20
            }).addTo(map.current);

            // Feature Group for drawing
            featureGroup.current = new L.FeatureGroup();
            map.current.addLayer(featureGroup.current);

            // Add Draw Control
            const drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: featureGroup.current
                },
                draw: {
                    polygon: true,
                    polyline: false,
                    rectangle: true,
                    circle: false,
                    marker: false,
                    circlemarker: false
                }
            });
            map.current.addControl(drawControl);
            
            // Fix Leaflet rendering in flex containers
            setTimeout(() => {
                if (map.current) map.current.invalidateSize();
            }, 200);

            map.current.on(L.Draw.Event.CREATED, (e) => {
                featureGroup.current.clearLayers(); // Only allow one shape
                const layer = e.layer;
                featureGroup.current.addLayer(layer);
                
                let coords = [];
                let centerPoint = null;
                if (layer instanceof L.Polygon) {
                    coords = layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
                    centerPoint = layer.getBounds().getCenter();
                } else if (layer instanceof L.Rectangle) {
                    const bounds = layer.getBounds();
                    centerPoint = bounds.getCenter();
                    coords = [
                        [bounds.getNorthWest().lat, bounds.getNorthWest().lng],
                        [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
                        [bounds.getSouthEast().lat, bounds.getSouthEast().lng],
                        [bounds.getSouthWest().lat, bounds.getSouthWest().lng]
                    ];
                }
                
                setSatelliteState(prev => ({
                    ...prev, 
                    boundaryDrawn: true, 
                    polygonCoords: coords,
                    ...(centerPoint && { gpsLocation: `${centerPoint.lat.toFixed(4)}, ${centerPoint.lng.toFixed(4)}` })
                }));
            });
        }
    }, []);

    // Update map view when gpsLocation changes
    useEffect(() => {
        if (map.current && satelliteState.gpsLocation) {
            try {
                const [lat, lng] = satelliteState.gpsLocation.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.current.setView([lat, lng], 16);
                }
            } catch (e) {}
        }
    }, [satelliteState.gpsLocation]);

    // Handle Search
    const handleSearch = async () => {
        if (!satelliteState.locationInput) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(satelliteState.locationInput)}`);
            const locData = await response.json();
            if (locData && locData.length > 0) {
                const lat = parseFloat(locData[0].lat);
                const lon = parseFloat(locData[0].lon);
                setSatelliteState(prev => ({
                    ...prev, 
                    gpsLocation: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
                }));
            } else {
                alert("Location not found");
            }
        } catch (e) {
            alert("Search failed");
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-100 rounded-b-2xl overflow-hidden">
            <div className="bg-white border-b border-slate-200 p-2 flex flex-col gap-2 z-[1000] shadow-sm">
                {/* Stacked Search Location */}
                <div className="flex items-center gap-2 w-full">
                    <label className="text-[10px] uppercase font-bold text-slate-500 w-12 whitespace-nowrap">Search:</label>
                    <input type="text" value={satelliteState.locationInput || ''} onChange={(e) => setSatelliteState(prev => ({...prev, locationInput: e.target.value}))} placeholder="Location e.g. Nagpur" className="flex-1 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs focus:border-blue-500 outline-none min-w-0" />
                    <button onClick={handleSearch} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"><i className="fas fa-search"></i></button>
                </div>
                
                {/* Stacked GPS Coordinates */}
                <div className="flex items-center gap-2 w-full">
                    <label className="text-[10px] uppercase font-bold text-slate-500 w-12 whitespace-nowrap">GPS:</label>
                    <input type="text" value={satelliteState.gpsLocation} onChange={(e) => setSatelliteState(prev => ({...prev, gpsLocation: e.target.value}))} placeholder="Lat, Long" className="flex-1 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs focus:border-blue-500 outline-none min-w-0" />
                    <button onClick={() => {
                        if("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                setSatelliteState(prev => ({...prev, gpsLocation: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`}));
                            });
                        }
                    }} className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1 whitespace-nowrap shadow-sm">
                        <i className="fas fa-location-arrow"></i> Locate
                    </button>
                </div>
            </div>
            <div className="relative w-full h-[280px]">
                <div ref={mapContainer} className="w-full h-full" style={{ zIndex: 1 }}></div>
                {satelliteState.boundaryDrawn && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow-xl text-[10px] font-bold text-emerald-600 pointer-events-auto flex items-center gap-1.5 z-[1000] border border-emerald-100 whitespace-nowrap">
                        <i className="fas fa-check-circle"></i> Area Selected
                        <button onClick={() => {
                            setSatelliteState(prev => ({...prev, boundaryDrawn: false, polygonCoords: []}));
                            if (featureGroup.current) featureGroup.current.clearLayers();
                        }} className="text-slate-400 hover:text-red-500 ml-1 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center"><i className="fas fa-times"></i></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const DroneLocationMap = ({ droneBooking, setDroneBooking }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (!map.current) {
            let lat = 21.1458;
            let lng = 79.0882;
            if (droneBooking.exactLocation && droneBooking.exactLocation.includes(',')) {
                const parts = droneBooking.exactLocation.match(/[-+]?[0-9]*\.?[0-9]+/g);
                if (parts && parts.length >= 2) {
                    lat = parseFloat(parts[0]);
                    lng = parseFloat(parts[1]);
                }
            }

            map.current = L.map(mapContainer.current).setView([lat, lng], 16);
            
            L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', {
                attribution: 'Map data &copy; Google',
                maxZoom: 20
            }).addTo(map.current);

            if (droneBooking.exactLocation) {
                marker.current = L.marker([lat, lng]).addTo(map.current);
            }

            map.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                if (marker.current) {
                    marker.current.setLatLng([lat, lng]);
                } else {
                    marker.current = L.marker([lat, lng]).addTo(map.current);
                }
                setDroneBooking(prev => ({
                    ...prev,
                    exactLocation: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                }));
            });

            setTimeout(() => {
                if (map.current) map.current.invalidateSize();
            }, 200);
        }
    }, [droneBooking.exactLocation, setDroneBooking]);

    if (!droneBooking.showMap) return null;

    return (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center rounded-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white w-[90%] h-[90%] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800"><i className="fas fa-map-marker-alt text-emerald-500 mr-2"></i>Select Field Location</h3>
                    <button onClick={() => setDroneBooking({...droneBooking, showMap: false})} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"><i className="fas fa-times text-slate-500"></i></button>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <div ref={mapContainer} className="w-full h-full"></div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-4 py-2 rounded-full font-bold text-sm pointer-events-none shadow-lg z-[1000]">
                        Click on the map to pin your field location
                    </div>
                    {droneBooking.exactLocation && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-xl text-xs font-bold text-emerald-600 pointer-events-auto flex items-center gap-2 z-[1000] border border-emerald-100">
                            <i className="fas fa-check-circle"></i> {droneBooking.exactLocation}
                        </div>
                    )}
                    <button onClick={(e) => {
                        e.stopPropagation();
                        if ("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition((position) => {
                                const { latitude, longitude } = position.coords;
                                setDroneBooking({...droneBooking, exactLocation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`});
                                if (map.current) map.current.setView([latitude, longitude], 16);
                                if (marker.current) marker.current.setLatLng([latitude, longitude]);
                                else marker.current = L.marker([latitude, longitude]).addTo(map.current);
                            }, () => {
                                alert("Location access denied.");
                            });
                        } else {
                            alert("Geolocation is not supported by your browser.");
                        }
                    }} className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2 z-[1000] transition-transform hover:scale-105 border-2 border-white">
                        <i className="fas fa-location-arrow"></i> Current Location
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActivitySummaryView = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({ bookings: 0, payments: 0, alerts: 2, queries: 5 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummaryData = async () => {
            try {
                const userInfo = localStorage.getItem('userInfo');
                if (!userInfo) return;
                const parsed = JSON.parse(userInfo);
                const userId = parsed.user?._id || parsed._id;

                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/user/${userId}`);
                const data = await res.json();
                
                let loadedActivities = [];
                let bookingsCount = 0;
                let paymentsCount = 0;

                if (data.success && data.bookings) {
                    bookingsCount = data.bookings.length;
                    
                    data.bookings.forEach((b) => {
                        loadedActivities.push({
                            id: `book_${b._id}`,
                            type: 'booking',
                            date: new Date(b.createdAt),
                            title: `Drone spraying booked for ${b.cropName} (${b.landArea} acres)`,
                            status: 'Completed',
                            icon: 'fas fa-helicopter',
                            color: 'text-emerald-500',
                            bg: 'bg-emerald-50'
                        });

                        if (b.paymentStatus === 'Paid') {
                            paymentsCount++;
                            loadedActivities.push({
                                id: `pay_${b._id}`,
                                type: 'payment',
                                date: new Date(new Date(b.createdAt).getTime() + 10000),
                                title: `Payment ₹${b.totalCost || 500} completed`,
                                status: 'Completed',
                                icon: 'fas fa-rupee-sign',
                                color: 'text-blue-500',
                                bg: 'bg-blue-50'
                            });
                        }
                    });
                }

                loadedActivities.push({
                    id: 'mock_alert_1',
                    type: 'alert',
                    date: new Date(Date.now() - 3600000),
                    title: 'Heavy rain alert received',
                    status: 'Pending',
                    icon: 'fas fa-cloud-showers-heavy',
                    color: 'text-amber-500',
                    bg: 'bg-amber-50'
                });

                loadedActivities.push({
                    id: 'mock_query_1',
                    type: 'query',
                    date: new Date(Date.now() - 86400000),
                    title: 'Asked AI about Leaf Blight disease',
                    status: 'Completed',
                    icon: 'fas fa-robot',
                    color: 'text-purple-500',
                    bg: 'bg-purple-50'
                });

                loadedActivities.sort((a, b) => b.date - a.date);

                setActivities(loadedActivities);
                setStats(prev => ({ ...prev, bookings: bookingsCount, payments: paymentsCount }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummaryData();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Top Section: Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Bookings</p>
                        <p className="text-2xl font-black text-slate-800">{stats.bookings}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl shadow-inner">🚁</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Payments</p>
                        <p className="text-2xl font-black text-slate-800">{stats.payments}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg shadow-inner"><i className="fas fa-credit-card"></i></div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Active Alerts</p>
                        <p className="text-2xl font-black text-slate-800">{stats.alerts}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg shadow-inner"><i className="fas fa-cloud-sun-rain"></i></div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">AI Queries</p>
                        <p className="text-2xl font-black text-slate-800">{stats.queries}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg shadow-inner"><i className="fas fa-robot"></i></div>
                </div>
            </div>

            {/* Middle & Bottom Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Middle Section: Recent Activity List */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">Recent Activities</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {activities.map((act) => (
                            <div key={act.id} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                <div className={`w-10 h-10 shrink-0 rounded-full ${act.bg} ${act.color} flex items-center justify-center text-lg mt-1`}>
                                    <i className={act.icon}></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700 text-sm leading-tight mb-1">{act.title}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <p className="text-[10px] font-bold text-slate-400"><i className="far fa-clock mr-1"></i>{act.date.toLocaleString()}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${act.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{act.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Charts / Insights */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col h-[400px] overflow-y-auto">
                    <h3 className="font-bold text-slate-800 text-lg mb-6">Insights</h3>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">Bookings per month</p>
                        <div className="flex items-end justify-between h-32 gap-2 mt-4 px-2">
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-full bg-emerald-100 rounded-t-sm h-[30%] relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">3</div></div>
                                <span className="text-[10px] font-bold text-slate-400">Jan</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-full bg-emerald-200 rounded-t-sm h-[50%] relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">5</div></div>
                                <span className="text-[10px] font-bold text-slate-400">Feb</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-full bg-emerald-300 rounded-t-sm h-[80%] relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">8</div></div>
                                <span className="text-[10px] font-bold text-slate-400">Mar</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-full bg-emerald-500 rounded-t-sm h-[100%] shadow-md relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">12</div></div>
                                <span className="text-[10px] font-bold text-slate-800">Apr</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-4">Spending Summary</p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-600">Drone Spraying</span>
                                    <span className="text-slate-800">₹{stats.payments * 500}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full w-[70%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-600">Fertilizers</span>
                                    <span className="text-slate-800">₹4500</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-amber-400 h-2 rounded-full w-[45%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-600">Seeds</span>
                                    <span className="text-slate-800">₹2100</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-purple-400 h-2 rounded-full w-[25%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureModal = ({ featureId, onClose, weatherData }) => {
    useEffect(() => {
        // Ping the AI service to wake it up in case it's asleep
        fetch(`${import.meta.env.VITE_AI_URL || 'https://agrisahayak-ai-service.onrender.com'}/predict`, {
            method: 'OPTIONS'
        }).catch(() => {});
    }, []);

    // Local state for some forms
    const [cropLoading, setCropLoading] = useState(false);
    const [cropResult, setCropResult] = useState(null);
    const [cropFormData, setCropFormData] = useState({
        N: '', P: '', K: '', ph: '', temperature: '', humidity: '', rainfall: '',
        soilType: 'Loamy', landArea: '', location: '', irrigationType: 'Rainfed', season: 'Kharif'
    });

    const [fertLoading, setFertLoading] = useState(false);
    const [fertResult, setFertResult] = useState(null);
    const [fertFormData, setFertFormData] = useState({
        cropName: '', N: '', P: '', K: '', ph: '', landArea: '', targetYield: ''
    });

    const handleFertChange = (e) => {
        let value = e.target.value;
        if (e.target.type === 'number') {
            if (e.target.name === 'ph') {
                if (Number(value) < 0) value = 0;
                if (Number(value) > 14) value = 14;
            } else {
                if (Number(value) < 0) value = 0;
            }
        }
        setFertFormData({...fertFormData, [e.target.name]: value});
    };

    const [pestLoading, setPestLoading] = useState(false);
    const [pestResult, setPestResult] = useState(null);
    const [pestImage, setPestImage] = useState(null);
    const [pestFile, setPestFile] = useState(null);

    // Schemes Feature State
    const [schemeFilters, setSchemeFilters] = useState({
        search: '',
        state: 'All',
        farmerType: 'All',
        category: 'All'
    });

    const [schemeLang, setSchemeLang] = useState('en');

    const handleSchemeFilterChange = (e) => {
        setSchemeFilters({...schemeFilters, [e.target.name]: e.target.value});
    };

    // Mandi Prices Feature State
    const [mandiFilters, setMandiFilters] = useState({
        state: 'All',
        crop: ''
    });

    const handleMandiFilterChange = (e) => {
        setMandiFilters({...mandiFilters, [e.target.name]: e.target.value});
    };

    const [droneBooking, setDroneBooking] = useState({
        farmerName: '', mobile: '', address: '', state: '', district: '', exactLocation: '',
        cropName: '', cropStage: 'Growing', sprayType: 'Pesticide', chemicalName: '',
        landArea: '', preferredDate: '', preferredTime: 'Morning (6 AM - 10 AM)', paymentMode: 'Online',
        isConfirmed: false,
        ticketId: '',
        transactionId: '',
        paymentStatus: 'Pending',
        showMap: false,
        razorpayStatus: 'idle'
    });

    const handleDroneBookingChange = (e) => {
        const { name, value } = e.target;
        if (name === 'farmerName' && !/^[a-zA-Z\s]*$/.test(value)) return;
        if (name === 'mobile' && !/^\d*$/.test(value)) return;
        if (name === 'mobile' && value.length > 10) return;
        if (name === 'landArea' && Number(value) < 0) return;
        
        let newBooking = { ...droneBooking, [name]: value };
        if (name === 'state') newBooking.district = '';
        setDroneBooking(newBooking);
    };

    // Weather Feature State
    const [weatherState, setWeatherState] = useState({
        locationInput: '',
        locationName: '',
        loading: false,
        error: null,
        data: null
    });

    // Satellite Mapping Feature State
    const [satelliteState, setSatelliteState] = useState({
        locationType: 'gps',
        gpsLocation: '21.1458, 79.0882', // Default coords
        locationInput: '',
        boundaryDrawn: false,
        cropName: '',
        sowingDate: '',
        dateRange: '',
        analysisStatus: 'idle',
        comparisonView: false,
        dynamicInsights: null,
        polygonCoords: []
    });

    const generateInsights = (crop, latlng) => {
        const healthScore = (Math.random() * (0.85 - 0.45) + 0.45).toFixed(2);
        const moisture = Math.floor(Math.random() * (85 - 40) + 40);
        const temp = Math.floor(Math.random() * (35 - 20) + 20);
        
        let healthText = "Moderate";
        let healthColor = "yellow";
        if (healthScore > 0.65) { healthText = "Good"; healthColor = "emerald"; }
        else if (healthScore < 0.55) { healthText = "Poor"; healthColor = "red"; }

        let insights = [];
        if (healthScore > 0.65) {
            insights.push({ type: 'success', text: `${crop || 'Crop'} health is optimal. NDVI levels are high.` });
        } else {
            insights.push({ type: 'warning', text: `Attention needed for ${crop || 'the field'}. NDVI is below optimal levels.` });
        }

        if (moisture < 50) {
            insights.push({ type: 'warning', text: `Low soil moisture detected. Consider irrigating soon.` });
        } else {
            insights.push({ type: 'success', text: `Soil moisture is adequate at ${moisture}%.` });
        }

        if (temp > 30) {
            insights.push({ type: 'danger', text: `High surface temperature (${temp}°C) may cause heat stress.` });
        }

        return { healthScore, moisture, temp, healthText, healthColor, insights };
    };

    const fetchWeather = async (lat, lon, locName) => {
        setWeatherState(prev => ({...prev, loading: true, error: null}));
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
            const data = await res.json();
            setWeatherState(prev => ({...prev, loading: false, data, locationName: locName}));
        } catch (e) {
            setWeatherState(prev => ({...prev, loading: false, error: 'Failed to fetch weather data.'}));
        }
    };

    const handleWeatherLocate = () => {
        if ("geolocation" in navigator) {
            setWeatherState(prev => ({...prev, loading: true}));
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const locData = await response.json();
                    const state = locData.address.state || '';
                    const district = locData.address.state_district || locData.address.city || locData.address.county || '';
                    const locName = `${district}, ${state}`.replace(/^, |, $/g, '');
                    fetchWeather(latitude, longitude, locName || "Your Location");
                } catch (e) {
                    fetchWeather(latitude, longitude, "Your Location");
                }
            }, () => {
                setWeatherState(prev => ({...prev, loading: false, error: 'Location access denied.'}));
            });
        }
    };

    const handleWeatherSearch = async () => {
        if (!weatherState.locationInput) return;
        setWeatherState(prev => ({...prev, loading: true, error: null}));
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(weatherState.locationInput)}`);
            const locData = await response.json();
            if (locData && locData.length > 0) {
                fetchWeather(locData[0].lat, locData[0].lon, locData[0].display_name.split(',')[0]);
            } else {
                setWeatherState(prev => ({...prev, loading: false, error: 'Location not found.'}));
            }
        } catch (e) {
            setWeatherState(prev => ({...prev, loading: false, error: 'Search failed.'}));
        }
    };

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const state = data.address.state || '';
                    const district = data.address.state_district || data.address.city || data.address.county || '';
                    const locationString = `${state}, ${district}`.replace(/^, |, $/g, '');
                    setCropFormData(prev => ({...prev, location: locationString || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`}));
                } catch (error) {
                    alert("Could not fetch location details.");
                }
            }, () => {
                alert("Location access denied.");
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handleCropChange = (e) => {
        let value = e.target.value;
        if (e.target.type === 'number' && Number(value) < 0) {
            value = 0;
        }
        setCropFormData({...cropFormData, [e.target.name]: value});
    };

    const handleCropSubmit = async () => {
        setCropLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_AI_URL || 'https://agrisahayak-ai-service.onrender.com'}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    N: cropFormData.N || 0,
                    P: cropFormData.P || 0,
                    K: cropFormData.K || 0,
                    temperature: cropFormData.temperature || 0,
                    humidity: cropFormData.humidity || 0,
                    ph: cropFormData.ph || 0,
                    rainfall: cropFormData.rainfall || 0
                })
            });
            if (!response.ok) {
                if (response.status === 502 || response.status === 504) {
                    throw new Error("AI service is currently waking up. Please try again in a few seconds.");
                }
                throw new Error(`Server returned ${response.status}`);
            }
            const data = await response.json();
            if(data.success) {
                setCropResult(data.recommendation);
            } else {
                setCropResult("Error: " + data.error);
            }
        } catch(e) {
            let msg = e.message;
            if (msg && (msg.includes("Failed to fetch") || msg.includes("NetworkError"))) {
                msg = "The AI service is waking up from sleep. Please wait a minute and try again.";
            }
            setCropResult(msg || "Connection Error");
        }
        setCropLoading(false);
    };

    const renderCropRecommendation = () => {
        return (
            <div className="space-y-4">
                <p className="text-slate-500 text-sm">Enter your farm details to get the best crop recommendation from our AI.</p>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Basic Farm Details */}
                    <div>
                        <h4 className="text-xs font-bold text-emerald-600 mb-2 border-b pb-1">Basic Farm Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Soil Type</label>
                                <select name="soilType" value={cropFormData.soilType} onChange={handleCropChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none">
                                    <option>Loamy</option>
                                    <option>Clay</option>
                                    <option>Sandy</option>
                                    <option>Silt</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Land Area (Acres)</label>
                                <input name="landArea" value={cropFormData.landArea} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex justify-between items-center">
                                    <span>Location (State/District)</span>
                                    <button onClick={handleGetLocation} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 transition-colors">
                                        <i className="fas fa-location-arrow"></i> Locate Me
                                    </button>
                                </label>
                                <input name="location" value={cropFormData.location} onChange={handleCropChange} type="text" placeholder="e.g. Punjab, Ludhiana" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Environmental Factors */}
                    <div>
                        <h4 className="text-xs font-bold text-emerald-600 mb-2 border-b pb-1">Environmental Factors</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Temp (°C)</label>
                                <input name="temperature" value={cropFormData.temperature} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 25" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Humidity (%)</label>
                                <input name="humidity" value={cropFormData.humidity} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 60" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rainfall (mm)</label>
                                <input name="rainfall" value={cropFormData.rainfall} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 100" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Soil Nutrients */}
                    <div>
                        <h4 className="text-xs font-bold text-emerald-600 mb-2 border-b pb-1">Soil Nutrients</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nitrogen (N)</label>
                                <input name="N" value={cropFormData.N} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 90" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phosphorous (P)</label>
                                <input name="P" value={cropFormData.P} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 42" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Potassium (K)</label>
                                <input name="K" value={cropFormData.K} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 43" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">pH Level</label>
                                <input name="ph" value={cropFormData.ph} onChange={handleCropChange} min="0" type="number" placeholder="e.g. 6.5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Water & Season */}
                    <div>
                        <h4 className="text-xs font-bold text-emerald-600 mb-2 border-b pb-1">Water & Season</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Irrigation</label>
                                <select name="irrigationType" value={cropFormData.irrigationType} onChange={handleCropChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none">
                                    <option>Rainfed</option>
                                    <option>Borewell</option>
                                    <option>Canal</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Season</label>
                                <select name="season" value={cropFormData.season} onChange={handleCropChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-green-500 outline-none">
                                    <option>Kharif</option>
                                    <option>Rabi</option>
                                    <option>Zaid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {cropResult ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center mt-4 shadow-inner animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Recommended Crop</p>
                        <h3 className="text-4xl font-black text-emerald-800 mb-6 drop-shadow-sm">🌾 {cropResult}</h3>
                        <button onClick={() => setCropResult(null)} className="w-full py-3 bg-white border-2 border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-md flex justify-center items-center gap-2">
                            <i className="fas fa-redo"></i> Reset & Try Again
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleCropSubmit}
                        disabled={cropLoading}
                        className="w-full py-3 mt-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2"
                    >
                        {cropLoading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fas fa-microchip"></i> Get AI Recommendation</>}
                    </button>
                )}
            </div>
        );
    };

    const renderFertilizerCalculator = () => {
        const isFormValid = fertFormData.cropName.trim() !== '' && Number(fertFormData.landArea) > 0;

        const handleFertSubmit = () => {
            if (!isFormValid) return;
            setFertLoading(true);
            setTimeout(() => { 
                setFertLoading(false); 
                setFertResult(true); 
            }, 1000);
        };

        return (
            <div className="space-y-4">
                <p className="text-slate-500 text-sm">Calculate the exact amount of fertilizer needed for your specific crop and farm size.</p>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Basic Info */}
                    <div>
                        <h4 className="text-xs font-bold text-blue-600 mb-2 border-b pb-1">Basic Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Crop Name <span className="text-red-500">*</span></label>
                                <select name="cropName" value={fertFormData.cropName} onChange={handleFertChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" required>
                                    <option value="">Select Crop</option>
                                    <option value="apple">Apple</option>
                                    <option value="banana">Banana</option>
                                    <option value="blackgram">Blackgram</option>
                                    <option value="chickpea">Chickpea</option>
                                    <option value="coconut">Coconut</option>
                                    <option value="coffee">Coffee</option>
                                    <option value="cotton">Cotton</option>
                                    <option value="grapes">Grapes</option>
                                    <option value="jute">Jute</option>
                                    <option value="kidneybeans">Kidneybeans</option>
                                    <option value="lentil">Lentil</option>
                                    <option value="maize">Maize</option>
                                    <option value="mango">Mango</option>
                                    <option value="mothbeans">Mothbeans</option>
                                    <option value="mungbean">Mungbean</option>
                                    <option value="muskmelon">Muskmelon</option>
                                    <option value="orange">Orange</option>
                                    <option value="papaya">Papaya</option>
                                    <option value="pigeonpeas">Pigeonpeas</option>
                                    <option value="pomegranate">Pomegranate</option>
                                    <option value="rice">Rice</option>
                                    <option value="watermelon">Watermelon</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Land Area (Acres) <span className="text-red-500">*</span></label>
                                <input name="landArea" value={fertFormData.landArea} onChange={handleFertChange} type="number" min="0.1" step="0.1" placeholder="e.g. 5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Target Yield</label>
                                <input name="targetYield" value={fertFormData.targetYield} onChange={handleFertChange} type="number" min="0" placeholder="e.g. 2000" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Soil Info */}
                    <div>
                        <h4 className="text-xs font-bold text-blue-600 mb-2 border-b pb-1">Soil Properties</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nitrogen (N) kg</label>
                                <input name="N" value={fertFormData.N} onChange={handleFertChange} type="number" min="0" placeholder="e.g. 45" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phosphorus (P) kg</label>
                                <input name="P" value={fertFormData.P} onChange={handleFertChange} type="number" min="0" placeholder="e.g. 20" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Potassium (K) kg</label>
                                <input name="K" value={fertFormData.K} onChange={handleFertChange} type="number" min="0" placeholder="e.g. 30" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Soil pH (0-14)</label>
                                <input name="ph" value={fertFormData.ph} onChange={handleFertChange} type="number" min="0" max="14" step="0.1" placeholder="e.g. 6.5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                        </div>
                    </div>
                </div>
                
                {fertResult ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-4 shadow-inner animate-[fadeIn_0.3s_ease-out]">
                        <h4 className="font-bold text-blue-800 mb-4 text-center">Required Quantities:</h4>
                        <ul className="space-y-3 text-sm text-blue-700 font-medium">
                            <li className="flex justify-between items-center border-b border-blue-100 pb-2">
                                <span className="flex items-center gap-2"><i className="fas fa-flask text-blue-500"></i> Urea (N)</span> 
                                <span className="bg-white px-3 py-1 rounded-full shadow-sm font-bold border border-blue-100">120 kg</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-blue-100 pb-2">
                                <span className="flex items-center gap-2"><i className="fas fa-vial text-purple-500"></i> Root Fertilizer Dap(p)</span> 
                                <span className="bg-white px-3 py-1 rounded-full shadow-sm font-bold border border-blue-100">50 kg</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><i className="fas fa-cubes text-emerald-500"></i> Potash/MOP(k)</span> 
                                <span className="bg-white px-3 py-1 rounded-full shadow-sm font-bold border border-blue-100">30 kg</span>
                            </li>
                        </ul>
                        <button onClick={() => setFertResult(null)} className="w-full mt-6 py-3 bg-white hover:bg-blue-600 border-2 border-blue-600 text-blue-600 hover:text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                            <i className="fas fa-redo"></i> Recalculate
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleFertSubmit}
                        disabled={fertLoading || !isFormValid}
                        className={`w-full py-3 mt-4 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${isFormValid ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        {fertLoading ? <><i className="fas fa-spinner fa-spin"></i> Calculating...</> : <><i className="fas fa-calculator"></i> Calculate</>}
                    </button>
                )}
            </div>
        );
    };

    const renderPestDetection = () => {
        const handleFile = (e) => {
            if(e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setPestFile(file);
                setPestImage(URL.createObjectURL(file));
                setPestResult(null);
            }
        };

        return (
            <div className="space-y-4">
                <p className="text-slate-500 text-sm">Upload a clear photo of the affected crop leaf for instant AI disease detection.</p>
                {!pestImage ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-2xl p-6 text-center relative hover:bg-emerald-100 transition-colors cursor-pointer group flex flex-col items-center justify-center h-40">
                            <i className="fas fa-cloud-upload-alt text-3xl text-emerald-400 mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-emerald-800 font-bold text-sm">Upload Image</p>
                            <p className="text-[10px] text-emerald-600 mt-1">From Gallery</p>
                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} />
                        </div>
                        <div className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-2xl p-6 text-center relative hover:bg-emerald-100 transition-colors cursor-pointer group flex flex-col items-center justify-center h-40">
                            <i className="fas fa-camera text-3xl text-emerald-400 mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-emerald-800 font-bold text-sm">Capture Image</p>
                            <p className="text-[10px] text-emerald-600 mt-1">Use Camera</p>
                            <input type="file" accept="image/*" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative">
                        <button onClick={() => {setPestImage(null); setPestFile(null); setPestResult(null);}} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-red-50 z-10"><i className="fas fa-times"></i></button>
                        <img src={pestImage} alt="Crop" className="w-full max-h-[50vh] object-contain bg-black/5 rounded-xl mb-3" />
                        
                        {pestResult ? (
                            <div className={`border rounded-xl p-4 text-center animate-[fadeIn_0.3s_ease-out] ${pestResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200 shadow-sm'}`}>
                                {pestResult.error ? (
                                    <>
                                        <h4 className="font-bold text-red-700 text-lg"><i className="fas fa-exclamation-circle mr-2"></i>Analysis Failed</h4>
                                        <p className="text-xs text-red-600 mt-1 font-medium">{pestResult.error}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[10px] uppercase font-bold text-green-600 mb-1">AI Scan Complete</p>
                                        <h4 className="font-black text-green-800 text-xl leading-tight mb-1"><i className="fas fa-microscope mr-2 opacity-70"></i>{pestResult.disease}</h4>
                                        <p className="text-xs text-green-600 font-bold mb-3">Confidence: {pestResult.confidence}%</p>
                                        
                                        <div className="text-sm text-green-800 font-medium bg-white rounded-lg p-3 border border-green-100 shadow-inner">
                                            <span className="block text-[10px] uppercase font-bold text-emerald-600 mb-1"><i className="fas fa-clipboard-check mr-1"></i>Recommendation</span>
                                            {pestResult.recommendation}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={async () => {
                                    setPestLoading(true);
                                    try {
                                        const formData = new FormData();
                                        formData.append('image', pestFile);
                                        const response = await fetch(`${import.meta.env.VITE_AI_URL || 'https://agrisahayak-ai-service.onrender.com'}/predict_disease`, {
                                            method: 'POST',
                                            body: formData
                                        });
                                        if (!response.ok) {
                                            if (response.status === 502 || response.status === 504) {
                                                throw new Error("The AI service is waking up from sleep. Please try again in about 50 seconds.");
                                            }
                                            throw new Error(`Server returned ${response.status}`);
                                        }
                                        const data = await response.json();
                                        if(data.success) {
                                            setPestResult(data);
                                        } else {
                                            setPestResult({ error: data.error || "Failed to analyze image." });
                                        }
                                    } catch(e) {
                                        let msg = e.message;
                                        if (msg && (msg.includes("Failed to fetch") || msg.includes("NetworkError"))) {
                                            msg = "The AI service is waking up from sleep. Please wait a minute and try again.";
                                        }
                                        setPestResult({ error: msg || "Connection error. Make sure the AI service is running." });
                                    }
                                    setPestLoading(false);
                                }}
                                disabled={pestLoading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {pestLoading ? <><i className="fas fa-search fa-spin"></i> Analyzing Image...</> : <><i className="fas fa-search"></i> Run AI Scan</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderGovSchemes = () => {
        const t = {
            en: {
                findSchemes: "Find Schemes",
                langToggle: "Hindi / Local",
                searchPlaceholder: "Search by scheme name or keyword...",
                allStates: "All States",
                allFarmSizes: "All Farm Sizes",
                allCategories: "All Categories",
                noSchemes: "No schemes found matching your criteria.",
                clearFilters: "Clear all filters",
                open: "Open",
                closed: "Closed",
                benefits: "Benefit/Subsidy",
                eligibility: "Eligibility",
                start: "Start",
                end: "End",
                viewDetails: "View Details",
                applyNow: "Apply Now"
            },
            hi: {
                findSchemes: "योजनाएं खोजें",
                langToggle: "English",
                searchPlaceholder: "योजना का नाम या कीवर्ड खोजें...",
                allStates: "सभी राज्य",
                allFarmSizes: "सभी खेत के आकार",
                allCategories: "सभी श्रेणियाँ",
                noSchemes: "आपके मानदंडों से मेल खाने वाली कोई योजना नहीं मिली।",
                clearFilters: "सभी फ़िल्टर साफ़ करें",
                open: "खुला है",
                closed: "बंद है",
                benefits: "लाभ / सब्सिडी",
                eligibility: "पात्रता",
                start: "शुरू",
                end: "अंत",
                viewDetails: "विवरण देखें",
                applyNow: "अभी आवेदन करें"
            }
        }[schemeLang];



        const statesList = ["All", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

        const filteredSchemes = schemes.filter(s => {
            const search = schemeFilters.search.toLowerCase();
            const matchSearch = s.name[schemeLang].toLowerCase().includes(search) || s.desc[schemeLang].toLowerCase().includes(search);
            const matchState = schemeFilters.state === 'All' || s.state === 'All' || s.state === schemeFilters.state;
            const matchFarmer = schemeFilters.farmerType === 'All' || s.farmerType === 'All' || s.farmerType.includes(schemeFilters.farmerType);
            const matchCat = schemeFilters.category === 'All' || s.category === 'All' || s.category === schemeFilters.category;
            return matchSearch && matchState && matchFarmer && matchCat;
        });

        const toggleLang = () => setSchemeLang(schemeLang === 'en' ? 'hi' : 'en');
        const openWebsite = (url) => window.open(url, '_blank');

        return (
            <div className="flex flex-col h-[75vh]">
                {/* Top Section: Filters */}
                <div className="bg-amber-50 p-4 rounded-2xl mb-4 border border-amber-200 shrink-0 shadow-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-amber-800"><i className="fas fa-filter mr-2 text-amber-600"></i>{t.findSchemes}</h3>
                        <button onClick={toggleLang} className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors border border-amber-200 flex items-center gap-1">
                            <i className="fas fa-language"></i> {t.langToggle}
                        </button>
                    </div>
                    
                    <div className="relative mb-3">
                        <i className="fas fa-search absolute left-3 top-2.5 text-slate-400"></i>
                        <input name="search" value={schemeFilters.search} onChange={handleSchemeFilterChange} type="text" placeholder={t.searchPlaceholder} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-amber-500 outline-none shadow-sm transition-colors" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <select name="state" value={schemeFilters.state} onChange={handleSchemeFilterChange} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-colors shadow-sm cursor-pointer">
                            {statesList.map(st => <option key={st} value={st}>{st === "All" ? t.allStates : st}</option>)}
                        </select>
                        <select name="farmerType" value={schemeFilters.farmerType} onChange={handleSchemeFilterChange} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-colors shadow-sm cursor-pointer">
                            <option value="All">{t.allFarmSizes}</option>
                            <option value="Small">Small</option>
                            <option value="Marginal">Marginal</option>
                            <option value="Large">Large</option>
                        </select>
                        <select name="category" value={schemeFilters.category} onChange={handleSchemeFilterChange} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-colors shadow-sm cursor-pointer">
                            <option value="All">{t.allCategories}</option>
                            <option value="General">General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                        </select>
                    </div>
                </div>

                {/* Middle Section: Cards (Landscape Layout, Vertical Scroll) */}
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar pb-4 animate-[fadeIn_0.3s_ease-out]">
                    {filteredSchemes.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 w-full shrink-0 flex flex-col justify-center items-center">
                            <i className="fas fa-search text-5xl mb-4 text-slate-300"></i>
                            <p className="text-base font-bold text-slate-500">{t.noSchemes}</p>
                            <button onClick={() => setSchemeFilters({search:'', state:'All', farmerType:'All', category:'All'})} className="mt-4 text-sm text-amber-600 font-bold hover:underline">{t.clearFilters}</button>
                        </div>
                    ) : (
                        filteredSchemes.map((s) => (
                            <div key={s.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow shrink-0 w-full flex flex-col md:flex-row">
                                <div className="p-5 border-b md:border-b-0 md:border-r border-slate-100 bg-gradient-to-br from-slate-50 to-white relative flex-1 md:max-w-xs flex flex-col justify-center">
                                    {s.status === 'Open' ? (
                                        <span className="absolute top-4 right-4 md:left-4 md:right-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm w-max"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> {t.open}</span>
                                    ) : (
                                        <span className="absolute top-4 right-4 md:left-4 md:right-auto text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm w-max"><i className="fas fa-lock text-[8px]"></i> {t.closed}</span>
                                    )}
                                    <h4 className="font-bold text-slate-800 text-xl leading-tight mt-6">{s.name[schemeLang]}</h4>
                                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">{s.desc[schemeLang]}</p>
                                </div>
                                <div className="p-5 flex-[2] space-y-4 flex flex-col justify-center">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0 text-lg">
                                                <i className="fas fa-gift"></i>
                                            </div>
                                            <div>
                                                <span className="uppercase tracking-wide text-xs font-bold text-amber-600 block mb-1">{t.benefits}</span>
                                                <p className="text-sm font-bold text-amber-900 leading-snug">{s.benefits[schemeLang]}</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0 text-lg">
                                                <i className="fas fa-clipboard-check"></i>
                                            </div>
                                            <div>
                                                <span className="uppercase tracking-wide text-xs font-bold text-blue-600 block mb-1">{t.eligibility}</span>
                                                <p className="text-sm font-bold text-blue-900 leading-snug">{s.eligibility[schemeLang]}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold px-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="flex items-center gap-2"><i className="far fa-calendar-alt text-slate-400"></i> {t.start}: {s.startDate}</span>
                                        <span className="flex items-center gap-2"><i className="far fa-calendar-times text-slate-400"></i> {t.end}: {s.lastDate[schemeLang]}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-5 flex flex-row md:flex-col justify-between md:justify-center items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 min-w-[150px]">
                                    <div className="flex md:flex-col gap-2 w-full">
                                        <button onClick={() => openWebsite(s.website)} className="w-full flex justify-center items-center gap-2 py-2 rounded-xl bg-white text-emerald-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors shadow-sm font-bold text-xs" title="Contact Helpline">
                                            <i className="fas fa-phone-alt"></i> Contact
                                        </button>
                                        <button onClick={() => openWebsite(s.website)} className="w-full py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
                                            <i className="fas fa-globe mr-1"></i> {t.viewDetails}
                                        </button>
                                        <button onClick={() => openWebsite(s.website)} className={`w-full py-2.5 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex justify-center items-center gap-1 ${s.status === 'Open' ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-md' : 'bg-slate-300 cursor-not-allowed'}`} disabled={s.status !== 'Open'}>
                                            {t.applyNow} <i className="fas fa-arrow-right text-[10px] opacity-70 ml-1"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderMandiPrices = () => {


        const explicitStates = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
            "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        
        const explicitCrops = [
            "Apple", "Banana", "Blackgram", "Chickpea", "Coconut", "Coffee", "Cotton", "Grapes", "Jute", "Kidneybeans", 
            "Lentil", "Maize", "Mango", "Mothbeans", "Mungbean", "Muskmelon", "Orange", "Papaya", "Pigeonpeas", "Pomegranate", 
            "Rice", "Watermelon"
        ];

        const statesList = ["All", ...new Set([...explicitStates, ...prices.map(p => p.state)])].sort();
        const cropList = ["All", ...new Set([...explicitCrops, ...prices.map(p => p.commodity)])].sort();

        const filteredPrices = prices.filter(p => {
            const matchState = mandiFilters.state === 'All' || p.state === mandiFilters.state;
            const matchCrop = mandiFilters.crop.trim() === '' || p.commodity.toLowerCase().includes(mandiFilters.crop.toLowerCase().trim());
            return matchState && matchCrop;
        });

        return (
            <div className="flex flex-col h-[75vh]">
                {/* Top Section: Filters */}
                <div className="bg-green-50 p-4 rounded-2xl mb-4 border border-green-200 shrink-0 shadow-sm animate-[fadeIn_0.2s_ease-out]">
                    <h3 className="font-bold text-green-800 mb-3 flex items-center"><i className="fas fa-search-dollar mr-2 text-green-600"></i>Search Live Mandi Prices</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-green-700 uppercase mb-1">Select State</label>
                            <select name="state" value={mandiFilters.state} onChange={handleMandiFilterChange} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-green-500 transition-colors shadow-sm cursor-pointer">
                                {statesList.map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-green-700 uppercase mb-1">Search Crop Name</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-3 text-slate-400"></i>
                                <input name="crop" value={mandiFilters.crop} onChange={handleMandiFilterChange} type="text" placeholder="e.g. Apple, Rice..." className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-green-500 transition-colors shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Cards */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4 animate-[fadeIn_0.3s_ease-out]">
                    {filteredPrices.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <i className="fas fa-box-open text-4xl mb-3 text-slate-300"></i>
                            <p className="text-sm font-bold text-slate-500">No prices found for selected filters.</p>
                            <button onClick={() => setMandiFilters({state:'All', crop:''})} className="mt-3 text-xs text-green-600 font-bold hover:underline">Clear all filters</button>
                        </div>
                    ) : (
                        filteredPrices.map((p) => (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-green-50 text-green-700 px-3 py-1 rounded-bl-xl font-bold text-[10px] flex items-center gap-1 border-b border-l border-green-100">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live
                                </div>
                                
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    {/* Left: Mandi & Crop Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                <i className="fas fa-map-marker-alt text-lg"></i>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-lg leading-tight">{p.market}</h4>
                                                <p className="text-xs font-bold text-slate-500 mt-0.5">{p.district}, {p.state}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 inline-block min-w-[200px]">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Commodity</p>
                                            <p className="font-bold text-slate-700 text-base">{p.commodity} <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 ml-1">{p.variety}</span></p>
                                        </div>
                                    </div>

                                    {/* Right: Price Details */}
                                    <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 flex flex-col justify-center">
                                        <div className="text-center mb-3">
                                            <p className="text-[10px] uppercase font-bold text-green-700 mb-1">Modal Price (Average)</p>
                                            <p className="text-4xl font-black text-green-600">₹{p.modalPrice}<span className="text-sm font-bold text-green-600/60">/qtl</span></p>
                                        </div>
                                        <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-green-100">
                                            <div className="text-center w-full border-r border-slate-100">
                                                <p className="text-[9px] uppercase font-bold text-slate-400">Min Price</p>
                                                <p className="font-bold text-slate-700">₹{p.minPrice}</p>
                                            </div>
                                            <div className="text-center w-full">
                                                <p className="text-[9px] uppercase font-bold text-slate-400">Max Price</p>
                                                <p className="font-bold text-slate-700">₹{p.maxPrice}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                    <span><i className="fas fa-info-circle mr-1 text-slate-300"></i> Prices in ₹/Quintal</span>
                                    <span><i className="far fa-clock mr-1 text-slate-300"></i> Updated: {p.date}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderSatelliteMapping = () => {
        const handleAnalysis = () => {
            if (!satelliteState.gpsLocation && !satelliteState.boundaryDrawn) {
                alert("Please provide GPS coordinates or draw a boundary on the map first.");
                return;
            }
            if (!satelliteState.cropName) {
                alert("Please select a Crop Name before analyzing.");
                return;
            }
            if (!satelliteState.sowingDate && !satelliteState.dateRange) {
                alert("Please provide a Sowing Date or Time Range before analyzing.");
                return;
            }
            setSatelliteState(prev => ({ ...prev, analysisStatus: 'analyzing' }));
            setTimeout(() => {
                const insights = generateInsights(satelliteState.cropName, satelliteState.gpsLocation);
                setSatelliteState(prev => ({ ...prev, analysisStatus: 'complete', dynamicInsights: insights }));
            }, 2500);
        };

        const handleReset = () => {
            setSatelliteState({
                locationType: 'gps', gpsLocation: '', boundaryDrawn: false, locationInput: '',
                cropName: '', sowingDate: '', dateRange: '', 
                analysisStatus: 'idle', comparisonView: false, dynamicInsights: null, polygonCoords: []
            });
        };

        return (
            <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
                {/* Top Section: Map & Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Map View */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800 text-sm"><i className="fas fa-map-marked-alt text-blue-500 mr-2"></i>Field Location</h4>
                            </div>
                            
                            <div className="relative group rounded-b-2xl overflow-hidden w-full h-full">
                                <LeafletSatelliteMap satelliteState={satelliteState} setSatelliteState={setSatelliteState} />
                            </div>
                        </div>

                        {/* Details Input */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2"><i className="fas fa-leaf text-emerald-500 mr-2"></i>Crop Details & Timeline</h4>
                            
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Crop Name</label>
                                <select value={satelliteState.cropName} onChange={(e) => setSatelliteState(prev => ({...prev, cropName: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none">
                                    <option value="">Select Crop</option>
                                    <option value="Wheat">Wheat</option>
                                    <option value="Rice">Rice</option>
                                    <option value="Cotton">Cotton</option>
                                    <option value="Maize">Maize</option>
                                    <option value="Sugarcane">Sugarcane</option>
                                    <option value="Soybean">Soybean</option>
                                    <option value="Groundnut">Groundnut</option>
                                    <option value="Mustard">Mustard</option>
                                    <option value="Potato">Potato</option>
                                    <option value="Tomato">Tomato</option>
                                    <option value="Onion">Onion</option>
                                    <option value="Apple">Apple</option>
                                    <option value="Banana">Banana</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Sowing Date</label>
                                    <input type="date" value={satelliteState.sowingDate} onChange={(e) => setSatelliteState(prev => ({...prev, sowingDate: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none text-slate-600" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Time Range</label>
                                    <select value={satelliteState.dateRange} onChange={(e) => setSatelliteState(prev => ({...prev, dateRange: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none text-slate-600">
                                        <option value="">Current Status</option>
                                        <option value="last_week">Last 7 Days</option>
                                        <option value="last_month">Last 30 Days</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                {satelliteState.analysisStatus === 'idle' ? (
                                    <button onClick={handleAnalysis} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <i className="fas fa-satellite"></i> Analyze Farm Area
                                    </button>
                                ) : satelliteState.analysisStatus === 'analyzing' ? (
                                    <button disabled className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                                        <i className="fas fa-satellite fa-spin text-blue-500"></i> Processing Imagery...
                                    </button>
                                ) : (
                                    <button onClick={handleReset} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <i className="fas fa-redo"></i> Reset & Start Over
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Output Sections - Only show when analysis is complete */}
                    {satelliteState.analysisStatus === 'complete' && satelliteState.dynamicInsights && (
                        <div className="space-y-6 animate-[slideUp_0.4s_ease-out]">
                            
                            {/* Middle Section: Health Indicators */}
                            <div>
                                <h3 className="font-black text-slate-800 text-lg mb-3 flex items-center gap-2"><i className="fas fa-chart-pie text-blue-500"></i> Farm Health Indicators</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* NDVI */}
                                    <div className={`bg-white p-5 rounded-2xl border-t-4 border-${satelliteState.dynamicInsights.healthColor}-500 shadow-sm border-x border-b border-slate-200 relative overflow-hidden`}>
                                        <i className={`fas fa-leaf absolute -right-4 -bottom-4 text-7xl text-${satelliteState.dynamicInsights.healthColor}-50 opacity-50`}></i>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Crop Health (NDVI)</p>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className={`text-4xl font-black text-${satelliteState.dynamicInsights.healthColor}-600`}>{satelliteState.dynamicInsights.healthScore}</span>
                                            <span className={`text-xs font-bold text-${satelliteState.dynamicInsights.healthColor}-500 bg-${satelliteState.dynamicInsights.healthColor}-50 px-2 py-0.5 rounded-md mb-1 border border-${satelliteState.dynamicInsights.healthColor}-100`}>
                                                <i className={`fas fa-arrow-${satelliteState.dynamicInsights.healthScore > 0.6 ? 'up' : 'down'}`}></i> {satelliteState.dynamicInsights.healthText}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden flex">
                                            <div className="h-full bg-red-400" style={{width: '33%'}}></div>
                                            <div className="h-full bg-yellow-400" style={{width: '33%'}}></div>
                                            <div className="h-full bg-emerald-500 relative" style={{width: '34%'}}></div>
                                            <div className="absolute h-4 w-1 bg-slate-800 rounded-full top-1/2 -translate-y-1/2" style={{left: `${satelliteState.dynamicInsights.healthScore * 100}%`}}></div>
                                        </div>
                                    </div>
                                    
                                    {/* Moisture */}
                                    <div className="bg-white p-5 rounded-2xl border-t-4 border-blue-500 shadow-sm border-x border-b border-slate-200 relative overflow-hidden">
                                        <i className="fas fa-tint absolute -right-4 -bottom-4 text-7xl text-blue-50 opacity-50"></i>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Soil Moisture</p>
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-4xl font-black text-blue-600">{satelliteState.dynamicInsights.moisture}%</span>
                                        </div>
                                        <p className={`text-sm font-bold mt-1 ${satelliteState.dynamicInsights.moisture < 50 ? 'text-amber-500' : 'text-blue-500'}`}>{satelliteState.dynamicInsights.moisture < 50 ? 'Dry - Needs Water' : 'Optimal Wet Condition'}</p>
                                    </div>

                                    {/* Temperature */}
                                    <div className="bg-white p-5 rounded-2xl border-t-4 border-amber-500 shadow-sm border-x border-b border-slate-200 relative overflow-hidden">
                                        <i className="fas fa-temperature-high absolute -right-4 -bottom-4 text-7xl text-amber-50 opacity-50"></i>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Surface Temp</p>
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-4xl font-black text-amber-600">{satelliteState.dynamicInsights.temp}°C</span>
                                        </div>
                                        <p className={`text-sm font-bold mt-1 ${satelliteState.dynamicInsights.temp > 30 ? 'text-red-500' : 'text-amber-500'}`}>{satelliteState.dynamicInsights.temp > 30 ? 'High Heat Stress' : 'Normal Range'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Alerts & Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Insights/Alerts */}
                                <div className="md:col-span-1 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-bell text-amber-500"></i> AI Insights</h4>
                                    <div className="space-y-3">
                                        {satelliteState.dynamicInsights.insights.map((insight, idx) => (
                                            <div key={idx} className={`bg-${insight.type === 'success' ? 'emerald' : insight.type === 'warning' ? 'amber' : 'red'}-50 border border-${insight.type === 'success' ? 'emerald' : insight.type === 'warning' ? 'amber' : 'red'}-100 p-3 rounded-xl flex gap-3 items-start`}>
                                                <i className={`fas fa-${insight.type === 'success' ? 'check-circle' : 'exclamation-triangle'} text-${insight.type === 'success' ? 'emerald' : insight.type === 'warning' ? 'amber' : 'red'}-500 mt-0.5`}></i>
                                                <div>
                                                    <p className={`text-xs font-bold text-${insight.type === 'success' ? 'emerald' : insight.type === 'warning' ? 'amber' : 'red'}-800`}>{insight.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Comparison View */}
                                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800 text-sm"><i className="fas fa-images text-purple-500 mr-2"></i>Comparison View</h4>
                                        <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                                            <button onClick={() => setSatelliteState(prev => ({...prev, comparisonView: false}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${!satelliteState.comparisonView ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>Current</button>
                                            <button onClick={() => setSatelliteState(prev => ({...prev, comparisonView: true}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${satelliteState.comparisonView ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>Weekly Change</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-slate-100 relative min-h-[250px] overflow-hidden">
                                        {!satelliteState.comparisonView ? (
                                            <div className="w-full h-full relative bg-slate-800">
                                                <img src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/28000/47000" className="w-full h-full object-cover opacity-70" alt="Map Base" style={{ transform: 'scale(1.5)' }} />
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                                                    <polygon points="35%,40% 65%,35% 70%,75% 40%,80%" fill={satelliteState.dynamicInsights?.healthScore > 0.65 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'} stroke="white" strokeWidth="2" />
                                                </svg>
                                                <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg"><i className="fas fa-clock mr-1"></i>Current</span>
                                            </div>
                                        ) : (
                                            <div className="flex w-full h-full">
                                                <div className="flex-1 relative border-r-2 border-white bg-slate-800 overflow-hidden">
                                                    <img src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/28000/47000" className="w-full h-full object-cover opacity-60 grayscale" alt="Before" style={{ transform: 'scale(1.5)' }} />
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                                                        <polygon points="35%,40% 65%,35% 70%,75% 40%,80%" fill={satelliteState.dynamicInsights?.healthScore > 0.65 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.4)'} stroke="white" strokeWidth="2" />
                                                    </svg>
                                                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm"><i className="fas fa-calendar-alt mr-1"></i>Last Week</span>
                                                </div>
                                                <div className="flex-1 relative bg-slate-800 overflow-hidden">
                                                    <img src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/28000/47000" className="w-full h-full object-cover opacity-70" alt="After" style={{ transform: 'scale(1.5)' }} />
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                                                        <polygon points="35%,40% 65%,35% 70%,75% 40%,80%" fill={satelliteState.dynamicInsights?.healthScore > 0.65 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'} stroke="white" strokeWidth="2" />
                                                    </svg>
                                                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg"><i className="fas fa-clock mr-1"></i>Current</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        );
    };

    const renderWeatherAlerts = () => {
        const getWeatherCondition = (code) => {
            if (code === 0) return {text: 'Sunny', icon: 'fa-sun text-yellow-400'};
            if (code >= 1 && code <= 3) return {text: 'Cloudy', icon: 'fa-cloud text-slate-300'};
            if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return {text: 'Rainy', icon: 'fa-cloud-showers-heavy text-blue-400'};
            return {text: 'Clear', icon: 'fa-sun text-yellow-400'};
        };

        const getFarmerAdvice = (data) => {
            if (!data) return null;
            const rainChance = data.daily.precipitation_probability_max[0] || 0;
            const isRainy = data.current.precipitation > 0 || rainChance > 50;
            if (isRainy) {
                return {
                    title: "Delay harvesting due to rain",
                    msg: "Do not spray pesticide today.",
                    type: "danger",
                    icon: "fa-exclamation-triangle",
                    bg: "bg-red-50 border-red-400 text-red-800"
                };
            } else {
                return {
                    title: "Irrigate your crops",
                    msg: "Weather is clear. Good time to apply fertilizers.",
                    type: "success",
                    icon: "fa-check-circle",
                    bg: "bg-emerald-50 border-emerald-400 text-emerald-800"
                };
            }
        };

        const { data, loading, error, locationName, locationInput } = weatherState;
        const advice = getFarmerAdvice(data);

        return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* Search Bar */}
                <div className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        placeholder="State / District" 
                        value={locationInput}
                        onChange={(e) => setWeatherState(prev => ({...prev, locationInput: e.target.value}))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
                    />
                    <button onClick={handleWeatherSearch} className="px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors">
                        <i className="fas fa-search"></i>
                    </button>
                    <button onClick={handleWeatherLocate} className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200" title="Auto-detect GPS">
                        <i className="fas fa-location-arrow"></i> Auto-detect
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-8">
                        <i className="fas fa-spinner fa-spin text-3xl text-sky-500"></i>
                        <p className="text-slate-500 mt-2 text-sm">Fetching live weather data...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                {!loading && data && (
                    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                        {/* Top Section */}
                        <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                            <i className={`fas ${getWeatherCondition(data.current.weather_code).icon.split(' ')[0]} absolute -right-4 -top-4 text-8xl opacity-20`}></i>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-sm font-medium text-blue-100 mb-1"><i className="fas fa-map-marker-alt mr-1"></i> {locationName || 'Current Location'}</p>
                                    <h3 className="text-5xl font-black">{Math.round(data.current.temperature_2m)}°C</h3>
                                    <p className="text-lg font-bold mt-1 flex items-center gap-2">
                                        <i className={`fas ${getWeatherCondition(data.current.weather_code).icon.split(' ')[0]}`}></i> 
                                        {getWeatherCondition(data.current.weather_code).text}
                                    </p>
                                </div>
                                <div className="text-right space-y-2 bg-black/10 p-3 rounded-xl backdrop-blur-sm">
                                    <div className="text-xs font-medium"><i className="fas fa-tint text-blue-200 w-4"></i> {data.current.relative_humidity_2m}% Humidity</div>
                                    <div className="text-xs font-medium"><i className="fas fa-wind text-gray-200 w-4"></i> {data.current.wind_speed_10m} km/h</div>
                                    <div className="text-xs font-medium"><i className="fas fa-cloud-showers-heavy text-sky-200 w-4"></i> {data.current.precipitation} mm Rain</div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Forecast */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">3-Day Forecast</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map(i => {
                                    const date = new Date(data.daily.time[i]);
                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                    const cond = getWeatherCondition(data.daily.weather_code[i]);
                                    const rainProb = data.daily.precipitation_probability_max[i] || 0;
                                    return (
                                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center flex flex-col items-center justify-between">
                                            <p className="text-xs font-bold text-slate-600 mb-1">{dayName}</p>
                                            <i className={`fas ${cond.icon} text-2xl my-2`}></i>
                                            <div className="text-xs font-bold text-slate-800">
                                                {Math.round(data.daily.temperature_2m_max[i])}° <span className="text-slate-400 font-normal">{Math.round(data.daily.temperature_2m_min[i])}°</span>
                                            </div>
                                            <p className="text-[10px] text-blue-500 font-bold mt-1"><i className="fas fa-tint"></i> {rainProb}% Rain</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom Section: Alerts */}
                        {advice && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">💡 Farmer Advice</h4>
                                <div className={`${advice.bg} border-l-4 p-4 rounded-r-xl shadow-sm`}>
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <i className={`fas ${advice.icon}`}></i> {advice.title}
                                    </h4>
                                    <p className="text-xs mt-1 font-medium leading-relaxed opacity-90">{advice.msg}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {!loading && !data && !error && (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <i className="fas fa-cloud-sun text-4xl text-slate-300 mb-3"></i>
                        <p className="text-sm text-slate-500 font-medium">Enter a location or use Auto-detect to fetch live weather.</p>
                    </div>
                )}
            </div>
        );
    };


    const renderDroneSpraying = () => {
        // Mock data for dropdowns
        const stateDistrictMap = {
            "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
            "Arunachal Pradesh": ["Itanagar", "Tawang"],
            "Assam": ["Guwahati", "Silchar", "Dibrugarh"],
            "Bihar": ["Patna", "Gaya", "Bhagalpur"],
            "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
            "Goa": ["Panaji", "Margao"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
            "Haryana": ["Faridabad", "Gurgaon", "Panipat"],
            "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
            "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
            "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
            "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode"],
            "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
            "Maharashtra": ["Pune", "Nagpur", "Nashik", "Aurangabad", "Mumbai"],
            "Manipur": ["Imphal"],
            "Meghalaya": ["Shillong"],
            "Mizoram": ["Aizawl"],
            "Nagaland": ["Kohima", "Dimapur"],
            "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
            "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
            "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
            "Sikkim": ["Gangtok"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
            "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
            "Tripura": ["Agartala"],
            "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi"],
            "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee"],
            "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri"]
        };
        const allStates = Object.keys(stateDistrictMap).sort();
        const availableDistricts = droneBooking.state ? (stateDistrictMap[droneBooking.state] || []) : [];

        const allCrops = [
            "Apple", "Banana", "Blackgram", "Chickpea", "Coconut", "Coffee", "Cotton", "Grapes", "Jute", "Kidneybeans", 
            "Lentil", "Maize", "Mango", "Mothbeans", "Mungbean", "Muskmelon", "Orange", "Papaya", "Pigeonpeas", "Pomegranate", 
            "Rice", "Watermelon"
        ].sort();

        // Handle Razorpay Flow
        const loadRazorpay = () => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        };

        const handleConfirmBooking = async () => {
            if (droneBooking.paymentMode !== 'Cash') {
                setDroneBooking(prev => ({...prev, razorpayStatus: 'processing'}));
            }
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const userId = userInfo?.user?._id || userInfo?._id;

                const payload = {
                    ...droneBooking,
                    userId,
                    totalCost
                };

                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    if (droneBooking.paymentMode === 'Cash') {
                        setDroneBooking(prev => ({...prev, isConfirmed: true, ticketId: data.booking.ticketId, paymentStatus: data.booking.paymentStatus}));
                        return;
                    }

                    // Online payment flow
                    const isLoaded = await loadRazorpay();
                    if (!isLoaded) {
                        alert("Failed to load Razorpay. Please check your connection.");
                        setDroneBooking(prev => ({...prev, razorpayStatus: 'failed'}));
                        return;
                    }

                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Sk0wFGFowBuZhu", // Use env variable or fallback to test key
                        amount: data.amount,
                        currency: "INR",
                        name: "AgriSahayak",
                        description: "Drone Spraying Booking",
                        handler: async function (response) {
                            try {
                                const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/verify`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        bookingId: data.booking._id,
                                        isMock: data.isMock
                                    })
                                });
                                const verifyData = await verifyRes.json();
                                if (verifyData.success) {
                                    setDroneBooking(prev => ({...prev, razorpayStatus: 'success', isConfirmed: true, ticketId: data.booking.ticketId, transactionId: response.razorpay_payment_id || 'MockTxn123', paymentStatus: 'Paid'}));
                                } else {
                                    setDroneBooking(prev => ({...prev, razorpayStatus: 'failed'}));
                                }
                            } catch (e) {
                                setDroneBooking(prev => ({...prev, razorpayStatus: 'failed'}));
                            }
                        },
                        prefill: {
                            name: droneBooking.farmerName,
                            contact: droneBooking.mobile
                        },
                        theme: { color: "#10b981" }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        setDroneBooking(prev => ({...prev, razorpayStatus: 'failed'}));
                    });
                    
                    if (!data.isMock) {
                        options.order_id = data.orderId;
                    }
                    rzp.open();
                    
                    if (data.isMock) {
                        // Auto-simulate success if Razorpay popup fails to open due to mock data
                        setTimeout(() => {
                           options.handler({
                               razorpay_order_id: data.orderId,
                               razorpay_payment_id: 'pay_mock_' + Date.now(),
                               razorpay_signature: 'mock_signature'
                           });
                        }, 3000);
                    }
                } else {
                    setDroneBooking(prev => ({...prev, razorpayStatus: 'failed'}));
                }
            } catch(e) {
                console.error(e);
                setDroneBooking(prev => ({...prev, razorpayStatus: 'failed'}));
            }
        };

        const handleMockGatewayPay = () => {
            // Deprecated, logic moved to handleConfirmBooking
        };

        const handleDownloadPdf = () => {
            if (!window.html2pdf) {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                script.onload = () => generatePdf();
                document.head.appendChild(script);
            } else {
                generatePdf();
            }
        };

        const generatePdf = () => {
            const element = document.getElementById('booking-receipt');
            if(element) {
                const opt = {
                    margin: 10,
                    filename: `AgriSahayak_Booking_${droneBooking.ticketId}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                window.html2pdf().set(opt).from(element).save();
            }
        };

        const costPerAcre = 500;
        const area = parseFloat(droneBooking.landArea) || 0;
        const totalCost = costPerAcre * area;

        // --- SUCCESS SCREEN ---
        if (droneBooking.isConfirmed) {
            return (
                <div className="flex flex-col items-center justify-center py-4 animate-[fadeIn_0.3s_ease-out]">
                    <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-xl relative" id="booking-receipt">
                        {droneBooking.ticketId && (
                            <div className="absolute top-4 right-4 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 font-mono">
                                Ticket ID: <span className="text-slate-800">{droneBooking.ticketId}</span>
                            </div>
                        )}
                        <div className="text-center mb-6 mt-4">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                                <i className="fas fa-check-circle text-4xl text-emerald-500"></i>
                            </div>
                            <h2 className="text-2xl font-black text-emerald-800 mb-1">Booking Confirmed!</h2>
                            <p className="text-sm font-bold text-slate-500">Ticket ID: {droneBooking.ticketId}</p>
                            
                            {droneBooking.paymentMode !== 'Cash' && (
                                <div className="mt-4 inline-flex flex-col items-center bg-blue-50 px-6 py-2 rounded-xl border border-blue-100">
                                    <p className="text-sm font-black text-blue-700"><i className="fas fa-check-circle mr-1"></i> Payment Successful</p>
                                    <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-wide">Transaction ID: {droneBooking.transactionId}</p>
                                </div>
                            )}
                        </div>

                        {/* Status Tracking (Moved below Booking Confirmed) */}
                        <div className="px-4 mb-8">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider text-center">📍 Status Tracking</h4>
                            <div className="flex justify-between items-center relative max-w-md mx-auto">
                                <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -z-10 -translate-y-1/2"></div>
                                <div className="absolute left-0 w-1/4 top-1/2 h-1 bg-emerald-500 -z-10 -translate-y-1/2"></div>
                                
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-4 border-white">
                                        <i className="fas fa-check text-xs"></i>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 mt-2 text-center leading-tight">Booking<br/>Confirmed</span>
                                </div>
                                <div className="flex flex-col items-center opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center border-4 border-white">
                                        <i className="fas fa-user-astronaut text-xs"></i>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">Drone<br/>Assigned</span>
                                </div>
                                <div className="flex flex-col items-center opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center border-4 border-white pb-0.5">
                                        <span className="text-sm">🚁</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">In<br/>Progress</span>
                                </div>
                                <div className="flex flex-col items-center opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center border-4 border-white">
                                        <i className="fas fa-flag-checkered text-xs"></i>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">Completed</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">📋 Booking Summary</p>
                                <p className="font-bold text-slate-800">{droneBooking.farmerName || 'N/A'}</p>
                                <p className="text-xs text-slate-500">{droneBooking.cropName || 'N/A'} - {area} Acres</p>
                                <p className="text-xs text-slate-500">{droneBooking.sprayType}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">📅 Schedule Info</p>
                                <p className="font-bold text-emerald-900">{droneBooking.preferredDate || 'N/A'}</p>
                                <p className="text-xs font-bold text-emerald-700">{droneBooking.preferredTime}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">🚁 Drone Service Info</p>
                                <p className="font-bold text-blue-900">AeroCrop Solutions</p>
                                <p className="text-xs font-bold text-blue-700">+91 9876543210</p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                <p className="text-[10px] uppercase font-bold text-amber-600 mb-1">💰 Cost Details</p>
                                <p className="font-bold text-amber-900">₹{costPerAcre} / acre</p>
                                <p className="text-xs font-bold text-amber-700">Total: ₹{totalCost}</p>
                                <p className="text-[10px] font-bold mt-2 pt-2 border-t border-amber-200">
                                    Status: <span className={droneBooking.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{droneBooking.paymentStatus}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center mt-6 mb-2">
                            <button onClick={handleDownloadPdf} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                                <i className="fas fa-file-pdf text-red-400"></i> Download Receipt (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-[75vh] animate-[fadeIn_0.3s_ease-out] relative">
                
                {/* Mock Razorpay Gateway Overlay */}
                {droneBooking.razorpayStatus !== 'idle' && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                        <div className="bg-white w-[400px] h-[550px] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-[slideUp_0.3s_ease-out]">
                            {/* Gateway Header */}
                            <div className="bg-[#02042b] p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-inner">
                                        <i className="fas fa-leaf text-emerald-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold tracking-wide">AgriSahayak</h3>
                                        <p className="text-slate-400 text-xs font-medium">Test Merchant</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Amount</p>
                                    <p className="text-white font-black text-xl">₹{totalCost}</p>
                                </div>
                            </div>

                            {droneBooking.razorpayStatus === 'gateway' && (
                                <>
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <p className="text-sm font-bold text-slate-700">Select Payment Method</p>
                                        <button onClick={() => setDroneBooking({...droneBooking, razorpayStatus: 'idle'})} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                        {/* Mock Options */}
                                        <div className="border border-blue-500 bg-blue-50/50 rounded-lg p-4 cursor-pointer flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                                                    <i className="fas fa-qrcode"></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">UPI</p>
                                                    <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm</p>
                                                </div>
                                            </div>
                                            <i className="fas fa-check-circle text-blue-600"></i>
                                        </div>
                                        
                                        <div className="border border-slate-200 hover:border-blue-300 rounded-lg p-4 cursor-pointer flex items-center justify-between transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                                    <i className="fas fa-credit-card"></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">Card</p>
                                                    <p className="text-[10px] text-slate-500">Visa, MasterCard, RuPay</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 hover:border-blue-300 rounded-lg p-4 cursor-pointer flex items-center justify-between transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                                    <i className="fas fa-university"></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">Netbanking</p>
                                                    <p className="text-[10px] text-slate-500">All Indian Banks</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                                        <button onClick={handleMockGatewayPay} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2">
                                            Pay ₹{totalCost}
                                        </button>
                                        <div className="text-center mt-3 flex items-center justify-center gap-1 opacity-50">
                                            <i className="fas fa-lock text-[10px] text-slate-600"></i>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Secured by Razorpay</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {droneBooking.razorpayStatus === 'processing' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                                    <p className="font-bold text-slate-800 text-lg">Processing Payment</p>
                                    <p className="text-sm text-slate-500 mt-2">Please do not close this window</p>
                                    <p className="text-xs font-bold text-slate-400 mt-8 uppercase tracking-widest"><i className="fas fa-shield-alt mr-1"></i> Bank Secure Environment</p>
                                </div>
                            )}

                            {droneBooking.razorpayStatus === 'failed' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-4xl mb-4 border-4 border-red-100">
                                        <i className="fas fa-times"></i>
                                    </div>
                                    <p className="font-black text-slate-800 text-xl">Payment Failed</p>
                                    <p className="text-sm text-slate-500 mt-2 text-center">Your transaction could not be completed at this time.</p>
                                    <button onClick={() => setDroneBooking({...droneBooking, razorpayStatus: 'idle'})} className="mt-8 bg-slate-800 hover:bg-slate-900 text-white w-full py-3 rounded-lg font-bold shadow-md transition-colors">Return to Merchant</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Drone Location Map Overlay */}
                <DroneLocationMap droneBooking={droneBooking} setDroneBooking={setDroneBooking} />

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4 flex flex-col gap-6">
                    {/* Top Section: Booking Form */}
                    <div className="flex-1">
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/image/Drone_spraying.jpg" className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white" alt="Drone Logo" />
                                <div>
                                    <h3 className="font-black text-emerald-800 text-xl tracking-tight">Drone Spray Booking Form</h3>
                                    <p className="text-xs font-bold text-emerald-600">Top Section</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Farmer Details */}
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">Farmer Details</h4>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Farmer Name <span className="text-red-500">*</span></label>
                                    <input name="farmerName" value={droneBooking.farmerName} onChange={handleDroneBookingChange} type="text" placeholder="e.g. Ram Kumar" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Number <span className="text-red-500">*</span></label>
                                    <input name="mobile" value={droneBooking.mobile} onChange={handleDroneBookingChange} type="text" placeholder="e.g. 9876543210" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Address / Village <span className="text-red-500">*</span></label>
                                    <input name="address" value={droneBooking.address} onChange={handleDroneBookingChange} type="text" placeholder="Village Name" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">📍 Location Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State <span className="text-red-500">*</span></label>
                                        <select name="state" value={droneBooking.state} onChange={handleDroneBookingChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors">
                                            <option value="">Select State</option>
                                            {allStates.map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">District <span className="text-red-500">*</span></label>
                                        <select name="district" value={droneBooking.district} onChange={handleDroneBookingChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" disabled={!droneBooking.state}>
                                            <option value="">Select District</option>
                                            {availableDistricts.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exact Field Location <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input name="exactLocation" value={droneBooking.exactLocation} onChange={handleDroneBookingChange} type="text" placeholder="GPS / Map Pin (best)" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" readOnly />
                                        <button onClick={() => setDroneBooking({...droneBooking, showMap: true})} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-600 px-3 rounded-lg border border-emerald-200 transition-colors font-bold flex items-center gap-2" title="Select on Map"><i className="fas fa-map-marked-alt"></i></button>
                                    </div>
                                </div>
                            </div>

                            {/* Crop Details */}
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">🌾 Crop Details</h4>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crop Name (Rice, Wheat, etc.) <span className="text-red-500">*</span></label>
                                    <select name="cropName" value={droneBooking.cropName} onChange={handleDroneBookingChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors">
                                        <option value="">Select Crop</option>
                                        {allCrops.map(cr => <option key={cr} value={cr}>{cr}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Crop Stage <span className="text-red-500">*</span></label>
                                    <select name="cropStage" value={droneBooking.cropStage} onChange={handleDroneBookingChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors">
                                        <option value="Early">Early</option>
                                        <option value="Growing">Growing</option>
                                        <option value="Flowering">Flowering</option>
                                    </select>
                                </div>
                            </div>

                            {/* Spray & Land Details */}
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">🧪 Spray Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Spray Type <span className="text-red-500">*</span></label>
                                        <select name="sprayType" value={droneBooking.sprayType} onChange={handleDroneBookingChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors">
                                            <option value="Pesticide">Pesticide</option>
                                            <option value="Fertilizer">Fertilizer</option>
                                            <option value="Herbicide">Herbicide</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Land Area (in acres/hectares) <span className="text-red-500">*</span></label>
                                        <input name="landArea" min="0" step="0.1" value={droneBooking.landArea} onChange={handleDroneBookingChange} type="number" placeholder="e.g. 5" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chemical Name (optional)</label>
                                    <input name="chemicalName" value={droneBooking.chemicalName} onChange={handleDroneBookingChange} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Middle Section: Scheduling & Payment */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner relative">
                            <div className="absolute -top-3 left-6 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600">Middle Section: 📅 Booking Details</div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preferred Date <span className="text-red-500">*</span></label>
                                <input name="preferredDate" value={droneBooking.preferredDate} onChange={handleDroneBookingChange} type="date" className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preferred Time Slot <span className="text-red-500">*</span></label>
                                <select name="preferredTime" value={droneBooking.preferredTime} onChange={handleDroneBookingChange} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors">
                                    <option value="Morning (6 AM - 10 AM)">Morning (6 AM - 10 AM)</option>
                                    <option value="Mid-day (10 AM - 2 PM)">Mid-day (10 AM - 2 PM)</option>
                                    <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">💳 Payment Method</label>
                                <select name="paymentMode" value={droneBooking.paymentMode} onChange={handleDroneBookingChange} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-colors">
                                    <option value="Online">Online Payment</option>
                                    <option value="Cash">Cash (Pay later)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Summary & Confirm */}
                <div className="shrink-0 bg-white border-t border-slate-100 p-4 pt-5 mt-auto flex items-center justify-between z-10 relative">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Bottom Section: 📋 Booking Summary</p>
                        <p className="text-2xl font-black text-emerald-600">Total: ₹{totalCost} <span className="text-xs font-bold text-slate-400">(@ ₹500/Acre)</span></p>
                    </div>
                    <div className="flex gap-4">
                        {/* Simulation trigger for payment failure */}
                        {droneBooking.paymentMode !== 'Cash' && (
                            <button onClick={() => setDroneBooking({...droneBooking, razorpayStatus: 'failed'})} className="text-xs font-bold text-slate-400 hover:text-red-500 underline" title="Test Failure UI">Simulate Failed Payment</button>
                        )}
                        
                        <button 
                            onClick={handleConfirmBooking} 
                            className={`px-8 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 ${(!droneBooking.farmerName || !droneBooking.mobile || !droneBooking.state || !droneBooking.district || !droneBooking.cropName || !droneBooking.exactLocation || !droneBooking.landArea || !droneBooking.preferredDate) ? 'bg-slate-300 text-white cursor-not-allowed' : droneBooking.paymentMode !== 'Cash' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 transform hover:scale-105' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 transform hover:scale-105'}`}
                            disabled={!droneBooking.farmerName || !droneBooking.mobile || !droneBooking.state || !droneBooking.district || !droneBooking.cropName || !droneBooking.exactLocation || !droneBooking.landArea || !droneBooking.preferredDate}
                        >
                            {droneBooking.paymentMode !== 'Cash' ? (
                                <><i className="fas fa-lock"></i> Proceed to Pay ₹{totalCost}</>
                            ) : (
                                <><i className="fas fa-check-circle"></i> Confirm Booking</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderActivitySummary = () => {
        return <ActivitySummaryView />;
    };

    const featureConfigs = {
        1: { title: 'Crop Recommendation', icon: 'fas fa-seedling text-emerald-500', render: renderCropRecommendation },
        2: { title: 'Fertilizer Calculator', icon: 'fas fa-vial text-blue-500', render: renderFertilizerCalculator },
        3: { title: 'Pest & Disease Detection', icon: 'fas fa-bug text-red-500', render: renderPestDetection },
        4: { title: 'Weather Alerts', icon: 'fas fa-cloud-sun-rain text-sky-500', render: renderWeatherAlerts },
        5: { title: 'Government Schemes', icon: 'fas fa-landmark text-amber-500', render: renderGovSchemes },
        6: { title: 'Mandi Prices', icon: 'fas fa-rupee-sign text-green-500', render: renderMandiPrices },
        7: { title: 'Drone Spraying', icon: '🚁', render: renderDroneSpraying },
        8: { title: 'Satellite Mapping', icon: 'fas fa-satellite text-blue-500', render: renderSatelliteMapping },
        9: { title: 'AI Assistant', icon: 'fas fa-robot text-purple-500', render: () => <div className="text-center p-8"><i className="fas fa-robot text-5xl text-purple-200 mb-4 animate-bounce"></i><p className="text-slate-600 font-medium">Use the floating Chatbot icon at the bottom right of your screen to access the AI Assistant!</p></div>},
        10: { title: 'Activity Summary', icon: 'fas fa-clipboard-list text-indigo-500', render: renderActivitySummary }
    };

    const config = featureConfigs[featureId];
    if (!config) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl transform transition-all border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            {config.icon.startsWith('fas ') ? (
                                <i className={config.icon + " text-lg"}></i>
                            ) : (
                                <span className="text-lg">{config.icon}</span>
                            )}
                        </div>
                        <h2 className="font-bold text-lg text-slate-800 tracking-tight">{config.title}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {config.render()}
                </div>
            </div>
        </div>
    );
};

export default FeatureModal;
