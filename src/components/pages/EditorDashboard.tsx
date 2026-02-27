import { useEffect, useState, useCallback } from 'react';
import MainLayout from '../templates/MainLayout';
import { getFields, getSubEditors, assignSubEditor } from '../../api';
import type { ProfessionalField } from '../../api';
import PaperAssignmentTable from '../organisms/PaperAssignmentTable';

export default function EditorDashboard() {
    const [fields, setFields] = useState<ProfessionalField[]>([]);
    const [subEditors, setSubEditors] = useState<{ _id: string; name: string; email: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'fields' | 'papers'>('fields');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [fieldsData, subEditorsData] = await Promise.all([
                getFields(),
                getSubEditors()
            ]);
            setFields(fieldsData);
            setSubEditors(subEditorsData);
        } catch (err: any) {
            setError(err.message || 'Failed to load data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAssign = async (fieldId: string, subEditorId: string) => {
        setAssigningId(fieldId);
        try {
            const updatedField = await assignSubEditor(fieldId, subEditorId);
            setFields(prev => prev.map(f => (f._id === fieldId ? updatedField : f)));
            showToast(subEditorId ? 'Sub-Editor assigned successfully' : 'Sub-Editor unassigned', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to assign sub-editor', 'error');
        } finally {
            setAssigningId(null);
        }
    };

    return (
        <MainLayout>
            <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div className="glass-card" style={{
                    marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Editor Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Manage assignments and track progress.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('fields')}
                        style={{
                            padding: '10px 16px', background: 'none',
                            border: 'none', borderBottom: activeTab === 'fields' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'fields' ? 'var(--primary-hover)' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                    >
                        Professional Fields
                    </button>
                    <button
                        onClick={() => setActiveTab('papers')}
                        style={{
                            padding: '10px 16px', background: 'none',
                            border: 'none', borderBottom: activeTab === 'papers' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'papers' ? 'var(--primary-hover)' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                    >
                        Manage Papers
                    </button>
                </div>

                {activeTab === 'fields' ? (
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        {isLoading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading data...</div>
                        ) : error ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>
                        ) : fields.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No professional fields found.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Professional Field</th>
                                        <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Assigned Sub-Editor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field) => {
                                        const isAssigning = assigningId === field._id;
                                        return (
                                            <tr key={field._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                                <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-primary)', fontWeight: 500, width: '40%' }}>
                                                    {field.name}
                                                </td>
                                                <td style={{ padding: '1.2rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <select
                                                            className="input-glass"
                                                            value={field.subEditor?._id || ''}
                                                            onChange={(e) => handleAssign(field._id, e.target.value)}
                                                            disabled={isAssigning}
                                                            style={{
                                                                padding: '8px 12px',
                                                                width: '100%',
                                                                maxWidth: 350,
                                                                opacity: isAssigning ? 0.6 : 1,
                                                                cursor: isAssigning ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            <option value="" style={{ color: '#000' }}>— Unassigned —</option>
                                                            {subEditors.map(sub => (
                                                                <option key={sub._id} value={sub._id} style={{ color: '#000' }}>
                                                                    {sub.name} ({sub.email})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isAssigning && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>saving...</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <PaperAssignmentTable userRole="editor" />
                )}
            </main>

            {toast && (
                <div className="glass-card" style={{
                    position: 'fixed', bottom: 24, right: 24,
                    borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                    color: 'var(--text-primary)', padding: '12px 24px',
                    fontWeight: 500, animation: 'fadeIn 0.3s ease-out forwards',
                    zIndex: 9999
                }}>
                    <span style={{ color: toast.type === 'success' ? 'var(--success)' : 'var(--error)', marginRight: '8px' }}>
                        {toast.type === 'success' ? '✔️' : '⚠️'}
                    </span>
                    {toast.message}
                </div>
            )}
        </MainLayout>
    );
}
