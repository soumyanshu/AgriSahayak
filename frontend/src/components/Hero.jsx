import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section
            id="home"
            className="h-[90vh] flex items-center justify-center text-center text-white"
            style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("/image/agrihome.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="px-4 z-10 text-center flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl mx-auto leading-tight">Smart Farming For A<br />Better Future</h1>
                <p className="max-w-3xl mx-auto mb-10 text-base sm:text-lg md:text-xl font-light">
                    Your digital agriculture assistant. Get AI-driven crop advice, disease detection, real-time market insights, and government scheme recommendations in one place.
                </p>
                <Link to="/login" className="px-10 py-4 bg-accent text-dark font-bold text-lg rounded-full hover:bg-yellow-500 transition-transform hover:scale-105 shadow-lg inline-block">
                    Get Started Now
                </Link>
            </div>
        </section>
    );
};

export default Hero;
