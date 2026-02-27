import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../templates/MainLayout';
import { getAssignedPapers, declineReviewAssignment, type Paper } from '../../api';

const STATUS_CLASSES: Record<string, string> = {
    draft: 'badge-warning',
    submitted: 'badge-primary',
    under_review: 'badge-warning',
    reviewed: 'badge-primary',
    accepted: 'badge-success',
    rejected: 'badge-error',
    revision_required: 'badge-error',
};

const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function ReviewerDashboard() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [decliningId, setDecliningId] = useState<string | null>(null);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getAssignedPapers();
            setPapers(result.papers);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load assigned papers';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDecline = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to decline reviewing "${title}"?`)) return;
        setDecliningId(id);
        try {
            await declineReviewAssignment(id);
            // Refresh papers
            loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to decline review assignment');
            setDecliningId(null);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <MainLayout>
            <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div className="glass-card" style={{
                    marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Reviewer Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Manage and review your assigned abstract papers.</p>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading assigned papers...</div>
                    ) : error ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>
                    ) : papers.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>You have no papers assigned for review.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Paper Summary</th>
                                        <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Professional Field</th>
                                        <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                                        <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {papers.map(paper => {
                                        const cls = STATUS_CLASSES[paper.status] || 'badge-primary';
                                        const isReviewed = paper.status === 'reviewed' || paper.status === 'accepted' || paper.status === 'rejected';

                                        return (
                                            <tr key={paper._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                                <td style={{ padding: '1.2rem 1.5rem', maxWidth: 300 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{paper.title}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {paper.abstract?.substring(0, 80) || "No abstract available"}...
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)' }}>
                                                    {paper.category}
                                                </td>
                                                <td style={{ padding: '1.2rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <span className={`badge ${cls}`} style={{ width: 'fit-content' }}>
                                                            {formatStatus(paper.status)}
                                                        </span>
                                                        {paper.reviewDeadline && !isReviewed && (
                                                            <div style={{
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                color: new Date(paper.reviewDeadline) < new Date() ? 'var(--error)' : 'var(--warning)'
                                                            }}>
                                                                ⏳ Due: {new Date(paper.reviewDeadline).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                                                    {isReviewed ? (
                                                        <button
                                                            disabled
                                                            style={{
                                                                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                                                                background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)',
                                                                border: '1px solid var(--glass-border)', fontWeight: 600, cursor: 'not-allowed'
                                                            }}
                                                        >
                                                            Reviewed
                                                        </button>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button
                                                                onClick={() => handleDecline(paper._id, paper.title)}
                                                                className="btn-secondary"
                                                                disabled={decliningId === paper._id}
                                                                style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                            >
                                                                {decliningId === paper._id ? 'Declining...' : 'Decline'}
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/reviewer/form/${paper._id}`)}
                                                                className="btn-primary"
                                                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                                            >
                                                                Review
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </MainLayout>
    );
}
