import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../templates/MainLayout';
import { getFields, createField, updateField, deleteField } from '../../api';
import type { ProfessionalField } from '../../api';

export default function FieldManagement() {
    const [fields, setFields] = useState<ProfessionalField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form states
    const [newFieldName, setNewFieldName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getFields();
            setFields(data);
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to load professional fields.');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFieldName.trim()) return;

        try {
            const newField = await createField(newFieldName.trim());
            setFields([...fields, newField]);
            setNewFieldName('');
            showToast('Field added successfully', 'success');
        } catch (err: unknown) {
            showToast((err as Error).message || 'Failed to add field', 'error');
        }
    };

    const handleStartEdit = (field: ProfessionalField) => {
        setEditingId(field._id);
        setEditName(field.name);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editName.trim()) return;
        try {
            const updated = await updateField(id, editName.trim());
            setFields(fields.map(f => (f._id === id ? updated : f)));
            setEditingId(null);
            showToast('Field updated successfully', 'success');
        } catch (err: unknown) {
            showToast((err as Error).message || 'Failed to update field', 'error');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This might affect users currently assigned to it.`)) return;

        try {
            await deleteField(id);
            setFields(fields.filter(f => f._id !== id));
            showToast('Field deleted successfully', 'success');
        } catch (err: unknown) {
            showToast((err as Error).message || 'Failed to delete field', 'error');
        }
    };

    return (
        <MainLayout>
            <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Manage Professional Fields</h1>
                    <Link to="/secretary" style={{ color: 'var(--primary-hover)', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</Link>
                </div>

                {/* Create Field Form */}
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Add New Field</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="e.g. Data Science"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            style={{ flex: 1 }}
                            required
                        />
                        <button type="submit" className="btn-primary">
                            Add Field
                        </button>
                    </form>
                </div>

                {/* Fields List */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading fields...</div>
                    ) : error ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>
                    ) : fields.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No professional fields found. Add one above!</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field Name</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: 150 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field) => (
                                    <tr key={field._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.05)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {editingId === field._id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    autoFocus
                                                    className="input-glass"
                                                    style={{ padding: '6px 10px', width: '100%' }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleSaveEdit(field._id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{field.name}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {editingId === field._id ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleSaveEdit(field._id)} style={actionBtnStyles('var(--success)')}>Save</button>
                                                    <button onClick={() => setEditingId(null)} style={actionBtnStyles('var(--text-muted)')}>Cancel</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleStartEdit(field)} style={actionBtnStyles('var(--primary-hover)')}>Edit</button>
                                                    <button onClick={() => handleDelete(field._id, field.name)} style={actionBtnStyles('var(--error)')}>Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${toast.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                    color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius-md)',
                    fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    animation: 'slideUp 0.3s ease-out forwards'
                }}>
                    {toast.message}
                </div>
            )}
        </MainLayout>
    );
}

const actionBtnStyles = (color: string) => ({
    background: 'transparent',
    color: color,
    border: `1px solid ${color}`,
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
});
