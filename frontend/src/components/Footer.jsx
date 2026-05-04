import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-green-900 to-black text-[#aaa] py-8 border-t-[4px] border-primary">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Brand & About */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white rounded-xl p-1 inline-block shadow-sm">
                            <img src="/image/logo.png" alt="AgriSahayak Logo" className="h-10 md:h-12" />
                        </div>
                        <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-200 tracking-tight font-sans drop-shadow-sm">
                            AgriSahayak
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4">
                        Your 24/7 digital agriculture companion combining traditional wisdom with AI.
                    </p>
                    <div className="flex gap-3">
                        <a href="#" className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-sm"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-sm"><i className="fab fa-twitter"></i></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-sm"><i className="fab fa-instagram"></i></a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-white text-lg font-semibold mb-3">Quick Links</h3>
                    <ul className="space-y-1.5 text-sm">
                        <li><a href="#home" className="hover:text-primary transition-colors"><i className="fas fa-chevron-right text-xs mr-2 border-primary"></i>Home</a></li>
                        <li><a href="#about" className="hover:text-primary transition-colors"><i className="fas fa-chevron-right text-xs mr-2 border-primary"></i>About Us</a></li>
                        <li><a href="#features" className="hover:text-primary transition-colors"><i className="fas fa-chevron-right text-xs mr-2 border-primary"></i>Services</a></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-white text-lg font-semibold mb-3">Contact Us</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-3">
                            <i className="fas fa-map-marker-alt text-primary mt-1"></i>
                            <p>123 Agriculture Hub, New Delhi, India</p>
                        </li>
                        <li className="flex items-center gap-3">
                            <i className="fas fa-envelope text-primary"></i>
                            <a href="mailto:agrisahayak2@gmail.com" className="hover:text-white transition-colors">agrisahayak2@gmail.com</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <i className="fas fa-phone-alt text-primary"></i>
                            <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-6 pt-4 border-t border-[#333] text-center text-xs">
                <p>© 2026 AgriSahayak Solutions. Empowering Indian Farmers. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
