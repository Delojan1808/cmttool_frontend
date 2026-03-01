import { useEffect, useState, useCallback } from 'react';
import { getAllPapers, getReviewers, assignReviewer, unassignReviewer, updatePaperStatus, getReviewsForPaper, type Paper, type ReviewerUser, type Review } from '../../api';

// Map status to visual styles
const STATUS_CLASSES: Record<string, string> = {
    draft: 'badge-warning',
    submitted: 'badge-primary',
    under_review: 'badge-warning',
    reviewed: 'badge-primary',
    accepted: 'badge-success',
    rejected: 'badge-error',
    revision_required: 'badge-error',
};

const EVALUATION_QUESTIONS: Record<string, string> = {
    q1_topicRelevant: "Relevant for the submitted track",
    q2_titleRelevant: "Title captures the essence",
    q3_objectivesClear: "Objectives clearly stated",
    q4_methodologyAppropriate: "Methodology is appropriate",
    q5_resultsInterpreted: "Results correctly interpreted",
    q6_conclusionTies: "Conclusions tie with results",
    q7_grammarSpelling: "Free from grammatical errors",
    q8_formattingAdheres: "Adheres to guidelines",
    q9_noPlagiarism: "No plagiarism/duplication"
};

const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const StatusBadge = ({ status }: { status: string }) => {
    const cls = STATUS_CLASSES[status] || 'badge-primary';
    return (
        <span className={`badge ${cls}`}>
            {formatStatus(status)}
        </span>
    );
};

export default function PaperAssignmentTable({ userRole }: { userRole: string }) {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [reviewers, setReviewers] = useState<ReviewerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null); // paper ID being mutated

    // Decision Modal State
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [paperReviews, setPaperReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [papersResult, reviewersList] = await Promise.all([
                getAllPapers(),
                getReviewers() // We fetch all reviewers. Filtering happens per dropdown.
            ]);
            setPapers(papersResult.papers);
            setReviewers(reviewersList);
        } catch (err: unknown) {
            const msg = err instanceof Error ? (err as Error).message : 'Failed to load data';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReviewerChange = async (paper: Paper, reviewerId: string, deadline?: string) => {
        if (reviewerId !== '') {
            const now = new Date();
            // Match backend default of +14 days if not explicitly provided
            const selectedDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

            if (selectedDeadline <= now) {
                showToast('Review deadline must be a future date', 'error');
                // Reset the select dropdown visually by clearing assigning ID
                setAssigningId(null);
                return;
            }

            if (typeof paper.conference === 'object' && paper.conference.startDate) {
                const confDate = new Date(paper.conference.startDate);
                if (selectedDeadline >= confDate) {
                    showToast('Review deadline must be before the conference start date', 'error');
                    setAssigningId(null);
                    return;
                }
            }
        }

        setAssigningId(paper._id);
        try {
            let updated: Paper;
            if (reviewerId === '') {
                updated = await unassignReviewer(paper._id, paper.assignedReviewers && paper.assignedReviewers.length > 0 ? paper.assignedReviewers[0]._id : '');
                showToast('Reviewer removed successfully', 'success');
            } else {
                updated = await assignReviewer(paper._id, reviewerId);
                showToast('Reviewer assigned successfully', 'success');
            }
            setPapers(prev => prev.map(p => (p._id === paper._id ? updated : p)));
        } catch (err: unknown) {
            const msg = err instanceof Error ? (err as Error).message : 'Operation failed';
            showToast(msg, 'error');
        } finally {
            setAssigningId(null);
        }
    };

    const handleOpenDecisionModal = async (paper: Paper) => {
        setSelectedPaper(paper);
        setReviewsLoading(true);
        try {
            const result = await getReviewsForPaper(paper._id);
            setPaperReviews(result);
        } catch (err: unknown) {
            const msg = err instanceof Error ? (err as Error).message : 'Failed to load reviews';
            showToast(msg, 'error');
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleMakeDecision = async (status: 'accepted' | 'rejected' | 'revision_required') => {
        if (!selectedPaper) return;
        if (!window.confirm(`Are you sure you want to mark this paper as ${status.replace('_', ' ').toUpperCase()}?`)) return;

        setDecisionLoading(true);
        try {
            await updatePaperStatus(selectedPaper._id, status);
            showToast(`Paper status updated to ${status}`, 'success');
            setSelectedPaper(null);
            loadData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? (err as Error).message : 'Failed to update paper status';
            showToast(msg, 'error');
        } finally {
            setDecisionLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading papers...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>;

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Paper Info</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Author</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Professional Field</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {papers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                    No papers available.
                                </td>
                            </tr>
                        ) : (
                            papers.map(paper => {
                                const isAssigning = assigningId === paper._id;
                                // Get the field name string for comparison (field is now a populated object)
                                const categoryName = typeof paper.field === 'object' ? paper.field.fieldName : String(paper.field);
                                // Filter reviewers whose professional field matches this paper's professional field
                                const availableReviewers = reviewers.filter(r => r.professionalFields && r.professionalFields.some(f => {
                                    return f === categoryName;
                                }));

                                return (
                                    <tr key={paper._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                        <td style={{ padding: '1.2rem 1.5rem', maxWidth: 280 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{paper.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {paper.keywords?.slice(0, 3).join(' · ')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem' }}>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{paper.authors?.length > 0 && typeof paper.authors[0] === 'object' ? (paper.authors[0] as unknown as { name: string }).name : 'Unknown Author'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{paper.authors?.length > 0 && typeof paper.authors[0] === 'object' ? (paper.authors[0] as unknown as { email: string }).email : ''}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {typeof paper.field === 'object' ? paper.field.fieldName : String(paper.field)}
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem' }}>
                                            <StatusBadge status={paper.status} />
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {userRole === 'editor' && paper.status === 'reviewed' ? (
                                                    <button
                                                        onClick={() => handleOpenDecisionModal(paper)}
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                    >
                                                        View Reviews & Decide
                                                    </button>
                                                ) : userRole !== 'editor' ? (
                                                    <>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            <select
                                                                className="input-glass"
                                                                disabled={isAssigning}
                                                                value={paper.assignedReviewers && paper.assignedReviewers.length > 0 ? paper.assignedReviewers[0]._id : ''}
                                                                onChange={e => handleReviewerChange(paper, e.target.value)}
                                                                style={{
                                                                    padding: '8px 12px', minWidth: 200,
                                                                    opacity: isAssigning ? 0.6 : 1,
                                                                    cursor: isAssigning ? 'not-allowed' : 'pointer'
                                                                }}
                                                            >
                                                                <option value="" style={{ color: '#000' }}>— Unassigned —</option>
                                                                {availableReviewers.map(r => (
                                                                    <option key={r._id} value={r._id} style={{ color: '#000' }}>
                                                                        {r.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {availableReviewers.length === 0 && (
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>
                                                                No reviewers found for this professional field
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {
                toast && (
                    <div className="glass-card" style={{
                        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                        borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                        color: 'var(--text-primary)', padding: '12px 24px',
                        fontWeight: 500, animation: 'fadeIn 0.3s ease-out forwards'
                    }}>
                        <span style={{ color: toast.type === 'success' ? 'var(--success)' : 'var(--error)', marginRight: '8px' }}>
                            {toast.type === 'success' ? '✔️' : '⚠️'}
                        </span>
                        {toast.message}
                    </div>
                )
            }

            {/* Decision Modal */}
            {
                selectedPaper && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="glass-card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Decision: {selectedPaper.title}</h2>
                                <button onClick={() => setSelectedPaper(null)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>✕ Close</button>
                            </div>

                            {reviewsLoading ? (
                                <p>Loading reviews...</p>
                            ) : paperReviews.length === 0 ? (
                                <p>No reviews found for this paper.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {paperReviews.map((review, idx) => (
                                        <div key={review._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                                                Review #{idx + 1}
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                                {Object.entries(review.evaluations).map(([key, ev]) => (
                                                    <div key={key} style={{ fontSize: '0.9rem' }}>
                                                        <strong>{EVALUATION_QUESTIONS[key] || key}:</strong> <span style={{ color: ev.answer ? 'var(--success)' : 'var(--error)' }}>{ev.answer ? 'Yes' : 'No'}</span>
                                                        {ev.comment && <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontStyle: 'italic' }}>"{ev.comment}"</div>}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontSize: '0.95rem' }}>
                                                <p><strong>Recommendation:</strong> <span className={`badge ${review.recommendation.includes('Accept') ? 'badge-success' : review.recommendation.includes('Reject') ? 'badge-error' : 'badge-warning'}`}>{review.recommendation}</span></p>
                                                {(review.suggestions || review.otherComments) && (
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                                                        {review.suggestions && <p style={{ margin: '0 0 0.5rem 0' }}><strong>Suggestions:</strong> {review.suggestions}</p>}
                                                        {review.otherComments && <p style={{ margin: 0 }}><strong>Other Comments:</strong> {review.otherComments}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleMakeDecision('revision_required')}
                                    disabled={decisionLoading}
                                    style={{ borderColor: 'var(--warning)', color: 'var(--warning)', padding: '0.8rem 1.5rem' }}
                                >
                                    🔄 Require Revision
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleMakeDecision('rejected')}
                                    disabled={decisionLoading}
                                    style={{ borderColor: 'var(--error)', color: 'var(--error)', padding: '0.8rem 1.5rem' }}
                                >
                                    ❌ Reject
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleMakeDecision('accepted')}
                                    disabled={decisionLoading}
                                    style={{ padding: '0.8rem 1.5rem' }}
                                >
                                    ✅ Accept Paper
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
