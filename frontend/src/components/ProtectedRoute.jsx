import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check if user is authenticated (userInfo is saved in localStorage)
    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
        // Redirect to login if there is no userInfo
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
