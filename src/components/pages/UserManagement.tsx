import React from 'react';
import MainLayout from '../templates/MainLayout';
import UserManagementTable from '../organisms/UserManagementTable';
import { Link } from 'react-router-dom';

const UserManagement: React.FC = () => {
    return (
        <MainLayout>
            <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
                <header className="glass-card" style={{
                    margin: '0 0 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))'
                }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>User Management</h1>
                    <Link to="/secretary" className="btn-secondary" style={{ padding: '0.6rem 1.2rem', textDecoration: 'none' }}>
                        ⬅️ Back to Dashboard
                    </Link>
                </header>

                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Manage users that are associated with the conferences you oversee. You can edit their roles, professional fields, or deactivate their accounts.
                    </p>
                </div>

                <UserManagementTable />
            </div>
        </MainLayout>
    );
};

export default UserManagement;
