import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// The Main Landing Page Layout
const LandingPage = () => (
  <>
    <Navbar />
    <Hero />
    <About />
    <Services />
    <Footer />
    <Chatbot />
  </>
);

function App() {
  return (
    <Router>
      <div className="font-sans min-h-screen bg-light">
        <Routes>
          {/* Main Website Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
