import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { getSecretaryUsers, updateUser, deleteUser, createAdminUser, getFields, type User, type ProfessionalField } from '../../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const ADMIN_ROLES = ['Editor', 'SubEditor', 'Reviewer'];
const ALL_ROLES = ['Editor', 'SubEditor', 'Reviewer', 'Author'];

// Display label for roles
const ROLE_LABELS: Record<string, string> = {
    SubEditor: 'SubEditor',
    Editor: 'Editor',
    Reviewer: 'Reviewer',
    Author: 'Author',
    Secretary: 'Secretary',
};

type TabKey = 'admin' | 'authors';

const UserManagementTable: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [fields, setFields] = useState<ProfessionalField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('admin');

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [password, setPassword] = useState('');

    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        roles: [] as string[],
        professionalFields: [] as string[],
        isActive: true
    });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // userId to delete


    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, fieldsData] = await Promise.all([getSecretaryUsers(), getFields()]);
            setUsers(usersData.users);
            setFields(fieldsData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Split users into two groups ─────────────────────────────────────────
    const adminUsers = users.filter(u => u.roles.some(r => ADMIN_ROLES.includes(r)));
    const authorUsers = users.filter(u => u.roles.every(r => r === 'Author'));
    const displayed = activeTab === 'admin' ? adminUsers : authorUsers;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setIsCreating(false);
        setEditFormData({
            name: user.name,
            email: user.email,
            roles: user.roles,
            professionalFields: user.professionalFields?.map(f => typeof f === 'object' ? f._id : f) || [],
            isActive: user.isActive
        });
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setIsCreating(true);
        setPassword('');
        setEditFormData({
            name: '', email: '',
            roles: activeTab === 'admin' ? ['Reviewer'] : ['Author'],
            professionalFields: [],
            isActive: true
        });
    };

    const handleCancelEdit = () => { setEditingUser(null); setIsCreating(false); };

    const handleSaveEdit = async () => {
        if (!isCreating && !editingUser) return;
        if (!editFormData.name || !editFormData.email || editFormData.roles.length === 0) {
            showToast('Please fill in Name, Email, and select at least one Role.', 'error');
            return;
        }
        if (isCreating && !password) {
            showToast('Password is required for new users.', 'error');
            return;
        }
        setSaving(true);
        try {
            if (isCreating) {
                const primaryRole = editFormData.roles[0];
                const payload: any = { name: editFormData.name, email: editFormData.email, password, role: primaryRole };
                if (['Reviewer', 'SubEditor'].includes(primaryRole) && editFormData.professionalFields.length > 0) {
                    payload.professionalField = editFormData.professionalFields[0];
                }
                await createAdminUser(payload);
                showToast('User created successfully. They have been emailed their credentials.', 'success');
                setIsCreating(false);
                loadData();
            } else if (editingUser) {
                const updated = await updateUser(editingUser._id, editFormData);
                setUsers(prev => prev.map(u => u._id === editingUser._id ? updated.user : u));
                showToast('User updated successfully', 'success');
                setEditingUser(null);
            }
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : `Failed to ${isCreating ? 'create' : 'update'} user`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: string) => {
        setConfirmDelete(userId);
    };

    const confirmDeletion = async () => {
        if (!confirmDelete) return;
        const userId = confirmDelete;
        setConfirmDelete(null);
        try {
            await deleteUser(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            showToast('User deleted successfully', 'success');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
        }
    };

    const toggleRole = (role: string) => setEditFormData(prev => ({ ...prev, roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role] }));
    const toggleField = (fieldId: string) => setEditFormData(prev => ({ ...prev, professionalFields: prev.professionalFields.includes(fieldId) ? prev.professionalFields.filter(f => f !== fieldId) : [...prev.professionalFields, fieldId] }));

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>;

    // ── Role badge colour helper ──────────────────────────────────────────────
    const roleBadgeStyle = (role: string): React.CSSProperties => {
        const colours: Record<string, { bg: string; color: string }> = {
            Editor: { bg: 'rgba(6,182,212,0.15)', color: '#22d3ee' },
            SubEditor: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
            Reviewer: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
            Author: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
        };
        const c = colours[role] ?? { bg: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' };
        return { background: c.bg, color: c.color };
    };

    // ── Shared table renderer ─────────────────────────────────────────────────
    const renderTable = () => (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={thStyle}>Name & Email</th>
                        {activeTab === 'admin' && <th style={thStyle}>Roles</th>}
                        <th style={thStyle}>Professional Fields</th>
                        <th style={thStyle}>Status</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {displayed.length === 0 ? (
                        <tr>
                            <td colSpan={activeTab === 'admin' ? 5 : 4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                No {activeTab === 'admin' ? 'admin' : 'author'} users found.
                            </td>
                        </tr>
                    ) : displayed.map(user => (
                        <tr key={user._id}
                            style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.05)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                            <td style={tdStyle}>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                {(user as any).affiliation && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(user as any).affiliation}</div>}
                            </td>
                            {activeTab === 'admin' && (
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {user.roles.map(r => (
                                            <span key={r} className="badge" style={roleBadgeStyle(r)}>{ROLE_LABELS[r] ?? r}</span>
                                        ))}
                                    </div>
                                </td>
                            )}
                            <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {user.professionalFields && user.professionalFields.length > 0 ? (
                                        user.professionalFields.map((f: any, i: number) => (
                                            <span key={i} className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                                                {typeof f === 'object' ? f.fieldName : f}
                                            </span>
                                        ))
                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </div>
                            </td>
                            <td style={tdStyle}>
                                {user.isActive
                                    ? <span style={{ color: 'var(--success)', fontWeight: 500 }}>Active</span>
                                    : <span style={{ color: 'var(--error)', fontWeight: 500 }}>Inactive</span>}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleEditClick(user)} title="Edit">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--error)' }}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }}
                                        title="Delete"
                                        disabled={user.roles.includes('Secretary')}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* ── Tab bar ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                {(['admin', 'authors'] as TabKey[]).map(tab => {
                    const label = tab === 'admin' ? `👔 Admin Users (${adminUsers.length})` : `✍️ Authors (${authorUsers.length})`;
                    const active = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '1rem 1.5rem',
                                background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: active ? 600 : 400,
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {label}
                        </button>
                    );
                })}
                {/* Create button */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                    <button className="btn-primary" onClick={handleCreateClick} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <FontAwesomeIcon icon={faPlus} /> {activeTab === 'admin' ? 'Add Admin User' : 'Add Author'}
                    </button>
                </div>
            </div>

            {/* ── Tab description strip ── */}
            <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {activeTab === 'admin'
                    ? '👔 Editors, SubEditors, and Reviewers associated with your conferences.'
                    : '✍️ Authors who have submitted papers to your conferences.'}
            </div>

            {/* ── Table ── */}
            {renderTable()}

            {/* ── Edit / Create Modal (portal) ── */}
            {(editingUser || isCreating) && ReactDOM.createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            {isCreating ? (activeTab === 'admin' ? 'Create Admin User' : 'Create Author') : 'Edit User'}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Name */}
                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input type="text" className="input-glass" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                            </div>
                            {/* Email */}
                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input type="email" className="input-glass" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
                            </div>
                            {/* Password (create only) */}
                            {isCreating && (
                                <div>
                                    <label style={labelStyle}>Temporary Password *</label>
                                    <input type="password" className="input-glass" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
                                    <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)' }}>User will receive this password via email.</small>
                                </div>
                            )}
                            {/* Roles */}
                            <div>
                                <label style={labelStyle}>
                                    Roles * {isCreating && <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>(Select Primary Role First)</span>}
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {ALL_ROLES
                                        .filter(r => activeTab === 'admin' ? r !== 'Author' : r === 'Author')
                                        .map(role => (
                                            <button key={role} type="button" onClick={() => toggleRole(role)}
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', border: `1px solid ${editFormData.roles.includes(role) ? 'var(--primary)' : 'var(--glass-border)'}`, background: editFormData.roles.includes(role) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: editFormData.roles.includes(role) ? '#818cf8' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                {ROLE_LABELS[role] ?? role} {editFormData.roles.includes(role) && '✓'}
                                            </button>
                                        ))}
                                </div>
                            </div>
                            {/* Professional Fields — only for admin tab with relevant roles */}
                            {activeTab === 'admin' && editFormData.roles.some(r => ['Reviewer', 'SubEditor'].includes(r)) && (
                                <div>
                                    <label style={labelStyle}>Professional Fields</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                        {fields.length === 0
                                            ? <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No fields available.</span>
                                            : fields.map(field => (
                                                <button key={field._id} type="button" onClick={() => toggleField(field._id)}
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: `1px solid ${editFormData.professionalFields.includes(field._id) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`, background: editFormData.professionalFields.includes(field._id) ? 'rgba(6,182,212,0.2)' : 'transparent', color: editFormData.professionalFields.includes(field._id) ? '#22d3ee' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    {field.fieldName}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                            {/* Active toggle */}
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={editFormData.isActive} onChange={e => setEditFormData({ ...editFormData, isActive: e.target.checked })} style={{ accentColor: 'var(--primary)' }} />
                                    <span style={{ color: 'var(--text-primary)' }}>Account is Active</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <button className="btn-secondary" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Custom Deletion Confirmation Modal —- */}
            {confirmDelete && ReactDOM.createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3>Confirm Deletion</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={confirmDeletion}>Delete User</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Toast ── */}
            {toast && ReactDOM.createPortal(
                <div className="glass-card" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)', padding: '12px 24px', fontWeight: 500, animation: 'fadeIn 0.3s ease-out forwards' }}>
                    <span style={{ color: toast.type === 'success' ? 'var(--success)' : 'var(--error)', marginRight: '8px' }}>
                        {toast.type === 'success' ? '✔️' : '⚠️'}
                    </span>
                    {toast.message}
                </div>,
                document.body
            )}
        </div>
    );
};

// ── Shared style objects ─────────────────────────────────────────────────────
const thStyle: React.CSSProperties = { padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' };
const tdStyle: React.CSSProperties = { padding: '1.2rem 1.5rem' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' };

export default UserManagementTable;
