import React, { useState, useEffect, useRef } from 'react';

const features = [
    { id: 1, title: 'Crop Recommendation', desc: 'AI suggestions based on soil & climate data.', bg: '/image/Crop_Recommendation.webp' },
    { id: 2, title: 'Fertilizer Calculator', desc: 'Precise NPK calculation.', bg: '/image/Fertilizer_calculator.webp' },
    { id: 3, title: 'Pest & Disease Detection', desc: 'Upload leaf photo for AI diagnosis.', bg: '/image/Disease_Detection.png' },
    { id: 4, title: 'Weather Alerts', desc: 'Real-time weather forecasts.', bg: '/image/Weather_Alert.jpg' },
    { id: 5, title: 'Government Schemes', desc: 'Check PM-Kisan eligibility.', bg: '/image/Govt_Schemes.jpg' },
    { id: 6, title: 'Mandi Prices', desc: 'Live market rates nearby.', bg: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=60&w=800' },
    { id: 7, title: 'Drone Spraying', desc: 'Advanced spraying solutions.', bg: '/image/Drone_spraying.jpg' },
    { id: 8, title: 'Satellite Mapping', desc: 'Monitor crop health via satellite.', bg: '/image/satellite_mapping.jpg' },
    { id: 9, title: 'AI Assistant', desc: 'Chat anytime for instant help.', bg: '/image/Ai_assistant.jpeg' },
];

const Services = () => {
    const [showAll, setShowAll] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll logic for slider
    useEffect(() => {
        let interval;
        if (!showAll && scrollRef.current) {
            interval = setInterval(() => {
                if (scrollRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                    // landscape card width is approx 680px + gap.
                    const scrollAmount = 680 + 16; 
                    if (scrollLeft + clientWidth >= scrollWidth - 10) {
                        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                }
            }, 4500);
        }
        return () => clearInterval(interval);
    }, [showAll]);

    // Cards are rendered identically in grid or slider
    const renderCard = (feature) => (
        <div
            key={feature.id}
            className={`group relative rounded-3xl overflow-hidden flex flex-col justify-end p-6 md:p-8 bg-cover bg-center transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-gray-200/50 hover:border-green-500 cursor-pointer ${showAll ? 'h-[250px] md:h-[300px] w-full' : 'h-[250px] md:h-[320px] w-[85vw] sm:w-[350px] md:w-[680px] shrink-0 snap-center'}`}
            style={{ backgroundImage: `url('${feature.bg}')` }}
        >
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0 transition-opacity duration-500"></div>
            <div className="relative z-10 text-left transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-2xl md:text-3xl font-extrabold mb-1 text-white group-hover:text-green-300 transition-colors duration-300 drop-shadow-lg tracking-wide">{feature.title}</h3>
                <p className="text-gray-200 text-sm md:text-base font-medium leading-relaxed opacity-95 group-hover:opacity-100 drop-shadow-md">{feature.desc}</p>
            </div>
        </div>
    );

    return (
        <section id="services" className="relative w-full bg-gradient-to-b from-green-50 to-white py-16 md:py-24 overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-200/40 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/40 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                
                {/* Header Section */}
                <div className="text-center mb-10 md:mb-14">
                    <h2 className="text-sm font-bold tracking-widest text-green-600 uppercase mb-3">What We Offer</h2>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 drop-shadow-sm mb-6 pb-2">
                        Our Services
                    </h1>
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                        Empowering farmers with cutting-edge technology and comprehensive tools to maximize yield, sustainability, and profitability.
                    </p>
                </div>

                {/* Content Section */}
                <div className="w-full transition-all duration-700 ease-in-out">
                    {showAll ? (
                        // GRID VIEW
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 opacity-100 animate-[fadeIn_0.5s_ease-out]">
                            {features.map(renderCard)}
                        </div>
                    ) : (
                        // SLIDER VIEW
                        <div className="relative w-full">
                            {/* Left/Right fading edges indicating scroll */}
                            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none hidden md:block"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none hidden md:block"></div>

                            <div
                                ref={scrollRef}
                                className="flex w-full gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-4 px-2 md:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            >
                                {features.map(renderCard)}
                            </div>
                        </div>
                    )}
                </div>

                {/* VIEW MORE / VIEW LESS BUTTON */}
                <div className="mt-8 md:mt-12 flex justify-center w-full">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white border border-green-500 hover:border-green-600 hover:bg-green-600 text-green-700 hover:text-white font-semibold transition-all duration-300 shadow-sm focus:outline-none overflow-hidden"
                    >
                        <span className="relative z-10 tracking-wider text-sm uppercase flex items-center gap-2">
                            {showAll ? "View Less Services" : "View More Services"}
                            
                            {/* Arrow icon that flips based on state */}
                            <svg 
                                className={`w-5 h-5 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </button>
                </div>

            </div>
        </section>
    );
};

export default Services;
