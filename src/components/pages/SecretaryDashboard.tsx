import React, { useEffect, useState, useCallback } from 'react';
import {
    getAllPapers,
    type Paper,
} from '../../api';
import CreateConference from './CreateConference';
import CreateAdminUser from './CreateAdminUser';
import PaperAssignmentTable from '../organisms/PaperAssignmentTable';
import SessionManagement from '../organisms/SessionManagement';
import { conferenceService, type ConferenceData } from '../../services/conferenceService';
import MainLayout from '../templates/MainLayout';

const SecretaryDashboard: React.FC = () => {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateConference, setShowCreateConference] = useState(false);
    const [showCreateAdminUser, setShowCreateAdminUser] = useState(false);
    const [editingConference, setEditingConference] = useState<ConferenceData | undefined>(undefined);
    const [managingSessionsFor, setManagingSessionsFor] = useState<ConferenceData | undefined>(undefined);

    // Conferences state
    const [conferences, setConferences] = useState<ConferenceData[]>([]);
    const [loadingConferences, setLoadingConferences] = useState(true);
    const [conferencesError, setConferencesError] = useState<string | null>(null);


    // ── Data loading ─────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const papersResult = await getAllPapers({});
            setPapers(papersResult.papers);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load papers';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadConferences = useCallback(async () => {
        setLoadingConferences(true);
        setConferencesError(null);
        try {
            const res = await conferenceService.getAllConferences();
            if (res.success && res.data) {
                setConferences(res.data);
            }
        } catch (err: any) {
            setConferencesError(err.message || 'Failed to load conferences');
        } finally {
            setLoadingConferences(false);
        }
    }, []);

    const handleDeleteConference = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this conference?')) {
            return;
        }
        try {
            await conferenceService.deleteConference(id);
            alert('Conference deleted successfully.');
            loadConferences();
        } catch (err: any) {
            alert(err.message || 'Failed to delete conference.');
        }
    };



    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadConferences();
    }, [loadConferences]);


    // Reviewer assignment moved to Editor/Sub-Editor Dashboard

    // ── Derived stats ────────────────────────────────────────────────────────
    const stats = {
        total: papers.length,
        submitted: papers.filter(p => p.status === 'submitted').length,
        underReview: papers.filter(p => p.status === 'under_review').length,
        unassigned: papers.filter(p => !p.assignedReviewers || p.assignedReviewers.length === 0).length,
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
                {/* Header */}
                <header className="glass-card" style={{
                    margin: '0 0 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))'
                }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Secretary Dashboard</h1>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary"
                            onClick={() => { setShowCreateConference(true); setShowCreateAdminUser(false); }}
                            style={{ padding: '0.6rem 1.2rem' }}
                        >
                            ➕ Create Conference
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => { setShowCreateAdminUser(true); setShowCreateConference(false); }}
                            style={{ padding: '0.6rem 1.2rem', background: 'var(--secondary)' }}
                        >
                            ➕ Create Admin User
                        </button>
                        <a href="/secretary/fields" className="btn-secondary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center' }}>
                            ⚙️ Manage Fields
                        </a>
                    </div>
                </header>

                <div style={{ width: '100%' }}>
                    {(showCreateConference || editingConference) && (
                        <CreateConference
                            initialData={editingConference}
                            onSuccess={() => {
                                setShowCreateConference(false);
                                setEditingConference(undefined);
                                loadConferences();
                            }}
                            onCancel={() => {
                                setShowCreateConference(false);
                                setEditingConference(undefined);
                            }}
                        />
                    )}

                    {showCreateAdminUser && (
                        <CreateAdminUser
                            onSuccess={() => {
                                setShowCreateAdminUser(false);
                                alert("Admin user created successfully!");
                            }}
                            onCancel={() => {
                                setShowCreateAdminUser(false);
                            }}
                        />
                    )}

                    {managingSessionsFor && (
                        <SessionManagement
                            conference={managingSessionsFor}
                            papers={papers}
                            onClose={() => {
                                setManagingSessionsFor(undefined);
                                loadConferences();
                            }}
                        />
                    )}

                    {/* Conferences Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            📅 Managed Conferences
                        </h2>

                        {loadingConferences ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading conferences...</div>
                        ) : conferencesError ? (
                            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)' }}>
                                {conferencesError}
                            </div>
                        ) : conferences.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No conferences created yet. Click "Create Conference" to start.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {conferences.map(conf => (
                                    <div key={conf._id} className="glass-card" style={{ padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)' }} />
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{conf.title}</h3>

                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>📅</span> Conf Date: {new Date(conf.conferenceDate).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>⏱️</span> Deadline: {new Date(conf.submissionDeadline).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                                            {conf.professionalFields.map((field, i) => (
                                                <span key={i} className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                                                    {field}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                            <button
                                                className="btn-secondary"
                                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                                                onClick={() => setEditingConference(conf)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                                                onClick={() => setManagingSessionsFor(conf)}
                                                title="Manage Conference Sessions"
                                            >
                                                📅 Sessions
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}
                                                onClick={() => conf._id && handleDeleteConference(conf._id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        📄 Paper Submissions Overview
                    </h2>

                    {/* Stats strip */}
                    {!loading && !error && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem',
                        }}>
                            {[
                                { label: 'Total Papers', value: stats.total, color: 'var(--primary)' },
                                { label: 'Submitted', value: stats.submitted, color: 'var(--secondary)' },
                                { label: 'Under Review', value: stats.underReview, color: 'var(--warning)' },
                                { label: 'Unassigned', value: stats.unassigned, color: 'var(--error)' },
                            ].map(s => (
                                <div key={s.label} className="glass-card" style={{ borderTop: `2px solid ${s.color}`, padding: '1.5rem' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <PaperAssignmentTable userRole="secretary" />

                </div>
            </div>
        </MainLayout>
    );
};

export default SecretaryDashboard;
