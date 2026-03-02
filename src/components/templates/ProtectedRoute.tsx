import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
        // Not logged in
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        const roles = user.roles || [];
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.some((r: string) => roles.includes(r))) {
            // Logged in but not authorized
            // Redirect based on their role
            if (roles.includes('Secretary')) return <Navigate to="/secretary" replace />;
            if (roles.includes('Editor')) return <Navigate to="/editor" replace />;
            if (roles.includes('SubEditor')) return <Navigate to="/subeditor" replace />;
            if (roles.includes('Reviewer')) return <Navigate to="/reviewer" replace />;
            if (roles.includes('Author')) return <Navigate to="/author" replace />;
            return <Navigate to="/login" replace />;
        }
    } catch {
        // Invalid user data
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // Authorized
    return <Outlet />;
};

export default ProtectedRoute;
