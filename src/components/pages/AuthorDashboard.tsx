import React, { useEffect, useState, useCallback } from 'react';
import { getMyPapers, uploadPaper, updatePaper, type Paper } from '../../api';
import { conferenceService, type ConferenceData } from '../../services/conferenceService';
import MainLayout from '../templates/MainLayout';

const AuthorDashboard: React.FC = () => {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [conferences, setConferences] = useState<ConferenceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
    const [submissionType, setSubmissionType] = useState<'new' | 'revision' | 'camera-ready' | 'edit-submission'>('new');
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');
    const [keywords, setKeywords] = useState('');
    const [field, setField] = useState('');
    const [conferenceId, setConferenceId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Filter fields based on the selected conference (populated objects)
    const availableFields = React.useMemo(() => {
        if (!conferenceId) return [];
        const selectedConf = conferences.find(c => c._id === conferenceId);
        // professionalFields is now "fields" in the new schema, but the component fetches Conf.fields!
        // Wait, did conferenceService return "professionalFields"? Yes, the backend returns "fields"
        return (selectedConf?.fields || []).map(f =>
            typeof f === 'string' ? { _id: f, fieldName: f } : f
        ) as { _id: string; fieldName: string }[];
    }, [conferenceId, conferences]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const papersResult = await getMyPapers();
            setPapers(papersResult.papers);

            const confResult = await conferenceService.getAllConferences();
            if (confResult.success && confResult.data) {
                // Only show active conferences where deadline hasn't passed
                const active = confResult.data.filter(c => new Date(c.submissionDeadline) > new Date());
                setConferences(active);
            }
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openModalForNew = () => {
        setSubmissionType('new');
        setEditingPaper(null);
        setFile(null);
        setTitle('');
        setAbstract('');
        setKeywords('');
        setField('');
        setConferenceId('');
        setSubmitError(null);
        setShowSubmitModal(true);
    };

    const openModalForRevision = (paper: Paper, type: 'revision' | 'camera-ready' | 'edit-submission') => {
        setSubmissionType(type);
        setEditingPaper(paper);
        setFile(null);
        setTitle(paper.title);
        setAbstract(paper.abstract);
        setKeywords((paper.keywords || []).join(', '));

        // Handle whether conference is populated object or just an ID string
        const confId = typeof paper.conference === 'string'
            ? paper.conference
            : (paper.conference as { _id: string })?._id || '';

        setConferenceId(confId);

        // Extract field name string (field may now be a populated object)
        setField(typeof paper.field === 'object' ? paper.field._id : String(paper.field));

        setSubmitError(null);
        setShowSubmitModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!title || !abstract || !field || (!file && submissionType === 'new')) {
            setSubmitError('Please fill in all required fields and upload a file');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            if (file) formData.append('pdf', file);
            formData.append('title', title);
            formData.append('abstract', abstract);
            formData.append('keywords', keywords);
            formData.append('field', field); // field state holds the field _id
            if (submissionType === 'new') {
                formData.append('conferenceId', conferenceId);
            }

            if (submissionType === 'new') {
                await uploadPaper(formData);
            } else if (editingPaper) {
                await updatePaper(editingPaper._id, formData);
            }

            // Re-fetch and close
            setShowSubmitModal(false);
            setEditingPaper(null);
            setFile(null);
            setTitle('');
            setAbstract('');
            setKeywords('');
            setField('');
            setConferenceId('');
            loadData();
        } catch (err: unknown) {
            setSubmitError((err as Error).message || 'Failed to submit paper');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <header className="glass-card" style={{
                    margin: '0 0 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))'
                }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Author Dashboard</h1>
                    <button
                        className="btn-primary"
                        onClick={openModalForNew}
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        ➕ Submit New Paper
                    </button>
                </header>

                {showSubmitModal && (
                    <div className="glass-card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => { setShowSubmitModal(false); setEditingPaper(null); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', transition: 'color 0.2s', padding: 0 }}
                                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-hover)'}
                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                >
                                    ← Back
                                </button>
                                <h2 style={{ margin: 0 }}>
                                    {submissionType === 'new' ? '📝 Submit Paper' : submissionType === 'revision' ? '🔄 Submit Revision' : submissionType === 'edit-submission' ? '✏️ Edit Submission' : '📄 Submit Camera-Ready'}
                                </h2>
                            </div>
                            <button onClick={() => { setShowSubmitModal(false); setEditingPaper(null); }} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>✕ Cancel</button>
                        </div>

                        {submitError && (
                            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                                {submitError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {submissionType === 'new' && (
                                <div>
                                    <label style={labelStyle}>Select Conference</label>
                                    <select
                                        value={conferenceId}
                                        onChange={e => setConferenceId(e.target.value)}
                                        style={inputStyle}
                                        required={submissionType === 'new'}
                                    >
                                        <option value="">Select a Conference...</option>
                                        {conferences.map(c => (
                                            <option key={c._id} value={c._id}>{c.title}</option>
                                        ))}
                                    </select>
                                    {conferences.length === 0 && (
                                        <small style={{ color: 'var(--warning)', marginTop: 4, display: 'block' }}>No active conferences available for submission.</small>
                                    )}
                                </div>
                            )}

                            <div>
                                <label style={labelStyle}>Paper Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Abstract</label>
                                <textarea
                                    value={abstract}
                                    onChange={e => setAbstract(e.target.value)}
                                    style={{ ...inputStyle, minHeight: '100px' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Professional Field</label>
                                    <select
                                        value={field}
                                        onChange={e => setField(e.target.value)}
                                        style={inputStyle}
                                        required
                                    >
                                        <option value="">Select Professional Field...</option>
                                        {availableFields.map(f => (
                                            <option key={f._id} value={f._id}>{f.fieldName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Keywords (comma separated)</label>
                                    <input
                                        type="text"
                                        value={keywords}
                                        onChange={e => setKeywords(e.target.value)}
                                        style={inputStyle}
                                        placeholder="e.g. AI, Machine Learning"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>
                                    PDF File Upload {submissionType !== 'new' && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Optional, browse to replace current file)</span>}
                                </label>
                                {editingPaper && (
                                    <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                        Current file: <strong>{editingPaper.fileName || 'document.pdf'}</strong>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    style={{ ...inputStyle, padding: '0.5rem' }}
                                    required={submissionType === 'new'}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className="btn-primary" disabled={submitting || (submissionType === 'new' && conferences.length === 0)}>
                                    {submitting ? 'Submitting...' : 'Upload & Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {!showSubmitModal && (
                    <>
                        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            📄 My Papers
                        </h2>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading papers...</div>
                        ) : error ? (
                            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)' }}>
                                {error}
                            </div>
                        ) : papers.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                You haven't submitted any papers yet.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {papers.map(paper => (
                                    <div key={paper._id} className="glass-card" style={{ padding: '1.2rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{paper.title}</h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                                                {typeof paper.field === 'object' ? paper.field.fieldName : String(paper.field)}
                                            </span>
                                            <span className={`badge ${paper.status === 'accepted' ? 'badge-success' : paper.status === 'rejected' ? 'badge-error' : paper.status === 'submitted' ? 'badge-primary' : 'badge-warning'}`}>
                                                {paper.status.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <div style={{ marginBottom: '0.2rem' }}><strong>Keywords:</strong> {paper.keywords.join(', ')}</div>
                                            <div><strong>Submitted:</strong> {new Date(paper.createdAt).toLocaleDateString()}</div>
                                        </div>

                                        {(paper.status === 'submitted' || paper.status === 'revision_required' || paper.status === 'accepted') && paper._id !== editingPaper?._id && (
                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                                {paper.status === 'submitted' && (
                                                    typeof paper.conference === 'object' && paper.conference.submissionDeadline && new Date(paper.conference.submissionDeadline) < new Date() ? (
                                                        <div style={{ color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                                            Submission deadline has passed. Editing is locked.
                                                        </div>
                                                    ) : (
                                                        <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', marginBottom: '0.5rem' }} onClick={() => openModalForRevision(paper, 'edit-submission')}>
                                                            ✏️ Edit Submission
                                                        </button>
                                                    )
                                                )}
                                                {paper.status === 'revision_required' && (
                                                    <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--warning)', color: 'var(--warning)' }} onClick={() => openModalForRevision(paper, 'revision')}>
                                                        🔄 Submit Revised Version
                                                    </button>
                                                )}
                                                {paper.status === 'accepted' && (
                                                    <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => openModalForRevision(paper, 'camera-ready')}>
                                                        📄 Submit Camera-Ready Version
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </MainLayout>
    );
};

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', fontWeight: 500 };
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.2)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.95rem'
};

export default AuthorDashboard;
