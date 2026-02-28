import React, { useState, useEffect } from 'react';
import { createAdminUser, getFields, type ProfessionalField } from '../../api';

interface CreateAdminUserProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const CreateAdminUser: React.FC<CreateAdminUserProps> = ({ onSuccess, onCancel }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Editor' | 'Sub Editor' | 'Reviewer'>('Reviewer');
    const [professionalField, setProfessionalField] = useState('');
    const [availableFields, setAvailableFields] = useState<ProfessionalField[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const data = await getFields();
                setAvailableFields(data);
            } catch (err) {
                console.error('Failed to fetch professional fields', err);
            }
        };
        fetchFields();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !email || !password || !role) {
            setError('Please fill in all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if ((role === 'Sub Editor' || role === 'Reviewer') && !professionalField) {
            setError('Professional field is required for Sub Editors and Reviewers.');
            return;
        }

        try {
            setLoading(true);
            const payload: Record<string, string> = { name, email, password, role };
            if (role === 'Sub Editor' || role === 'Reviewer') {
                payload.professionalField = professionalField;
            }

            await createAdminUser(payload);
            onSuccess();
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>➕ Create Admin User</h2>
                <button onClick={onCancel} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>✕ Cancel</button>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            style={inputStyle}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            style={inputStyle}
                            required
                            minLength={6}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Role *</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'Editor' | 'Sub Editor' | 'Reviewer')}
                            style={inputStyle}
                            required
                        >
                            <option value="Editor">Editor</option>
                            <option value="Sub Editor">Sub Editor</option>
                            <option value="Reviewer">Reviewer</option>
                        </select>
                    </div>
                </div>

                {(role === 'Sub Editor' || role === 'Reviewer') && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--primary)' }}>Professional Field *</label>
                        <select
                            value={professionalField}
                            onChange={(e) => setProfessionalField(e.target.value)}
                            style={inputStyle}
                            required
                        >
                            <option value="">— Select Area of Expertise —</option>
                            {availableFields.map(f => (
                                <option key={f._id} value={f.name}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.2)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease'
};

export default CreateAdminUser;
