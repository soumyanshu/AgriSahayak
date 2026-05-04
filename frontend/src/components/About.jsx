import React from 'react';

const About = () => {
    return (
        <section id="about" className="py-24 px-6 md:px-12 lg:px-24 bg-gradient-to-br from-green-50 via-white to-green-100">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 max-w-7xl mx-auto">
                {/* Left Side: Image */}
                <div className="w-full lg:w-1/2">
                    <img
                        src="/image/agriabout.jpg"
                        alt="About AgriSahayak"
                        className="w-full rounded-[2rem] shadow-xl object-cover h-[400px]"
                    />
                </div>

                {/* Right Side: Content */}
                <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
                    <span className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4">
                        About AgriSahayak
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold text-dark leading-tight mb-8">
                        Bridging Tradition with Technology
                    </h2>

                    <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                        <p>
                            Farming is the backbone of our nation, but it faces modern challenges. AgriSahayak is designed to empower farmers by combining traditional agricultural wisdom with cutting-edge Artificial Intelligence and satellite data.
                        </p>
                        <p>
                            Whether you need to know the right fertilizer dosage, check tomorrow's rainfall probability, or find the best price at the local Mandi, AgriSahayak is your 24/7 companion. Our goal is to increase yields, reduce costs, and improve the livelihood of every farmer.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
