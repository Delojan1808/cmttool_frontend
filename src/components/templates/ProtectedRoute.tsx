import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // Not logged in
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Logged in but not authorized
            // Redirect based on their role
            if (user.role === 'Secretary') return <Navigate to="/secretary" replace />;
            if (user.role === 'Editor') return <Navigate to="/editor" replace />;
            if (user.role === 'Sub Editor') return <Navigate to="/subeditor" replace />;
            if (user.role === 'Reviewer') return <Navigate to="/reviewer" replace />;
            if (user.role === 'Author') return <Navigate to="/author" replace />;
            return <Navigate to="/login" replace />;
        }
    } catch {
        // Invalid user data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // Authorized
    return <Outlet />;
};

export default ProtectedRoute;
