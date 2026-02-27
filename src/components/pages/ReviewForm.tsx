import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../templates/MainLayout';
import { submitReview, getAssignedPapers, type Paper, type Evaluation } from '../../api';

// Reusable component for the Yes/No + Comment block
function EvaluationRow({
    number,
    text,
    evaluation,
    onChange
}: {
    number: number;
    text: string;
    evaluation: Evaluation;
    onChange: (val: Evaluation) => void;
}) {
    return (
        <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem' }}>
                <div style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>
                    <span style={{ marginRight: '0.5rem', fontWeight: 600 }}>{number}.</span>
                    {text}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            name={`eval_${number}`}
                            checked={evaluation.answer === true}
                            onChange={() => onChange({ ...evaluation, answer: true })}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                        Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            name={`eval_${number}`}
                            checked={evaluation.answer === false}
                            onChange={() => onChange({ ...evaluation, answer: false })}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                        No
                    </label>
                </div>
            </div>
            {evaluation.answer === false && (
                <div style={{ marginTop: '1rem', paddingLeft: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        If the answer is no, kindly comment:
                    </label>
                    <textarea
                        className="input-glass"
                        required
                        value={evaluation.comment || ''}
                        onChange={e => onChange({ ...evaluation, comment: e.target.value })}
                        style={{
                            width: '100%', resize: 'vertical', minHeight: 80
                        }}
                        placeholder="Provide your comment here..."
                    />
                </div>
            )}
        </div>
    );
}

export default function ReviewForm() {
    const { paperId } = useParams();
    const navigate = useNavigate();

    const [paper, setPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // --- Form State --- //
    const [evaluations, setEvaluations] = useState({
        q1_topicRelevant: { answer: true, comment: '' } as Evaluation,
        q2_titleRelevant: { answer: true, comment: '' } as Evaluation,
        q3_objectivesClear: { answer: true, comment: '' } as Evaluation,
        q4_methodologyAppropriate: { answer: true, comment: '' } as Evaluation,
        q5_resultsInterpreted: { answer: true, comment: '' } as Evaluation,
        q6_conclusionTies: { answer: true, comment: '' } as Evaluation,
        q7_grammarSpelling: { answer: true, comment: '' } as Evaluation,
        q8_formattingAdheres: { answer: true, comment: '' } as Evaluation,
        q9_noPlagiarism: { answer: true, comment: '' } as Evaluation,
    });

    const [recommendation, setRecommendation] = useState<'Accept' | 'Accept with minor revisions' | 'Reconsider after major revisions' | 'Reject'>('Accept');
    const [suggestions, setSuggestions] = useState('');
    const [otherComments, setOtherComments] = useState('');

    const [reviewerInfo, setReviewerInfo] = useState({
        nameWithInitials: '',
        designation: '',
        institution: '',
        email: '',
        contactNumber: ''
    });

    // Populate data
    useEffect(() => {
        const fetchPaper = async () => {
            try {
                // To fetch the paper, get all assigned and find it
                const result = await getAssignedPapers();
                const found = result.papers.find(p => p._id === paperId);
                if (!found) {
                    setError('Paper not found or you are not authorized to review it.');
                } else {
                    setPaper(found);

                    // Pre-fill reviewer email if available
                    const authUser = sessionStorage.getItem('user');
                    if (authUser) {
                        const userObj = JSON.parse(authUser);
                        setReviewerInfo(prev => ({ ...prev, email: userObj.email || '', nameWithInitials: userObj.name || '' }));
                    }
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error fetching paper';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        if (paperId) fetchPaper();
    }, [paperId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paperId) return;

        setSubmitting(true);
        setError('');

        try {
            await submitReview(paperId, {
                evaluations,
                recommendation,
                suggestions,
                otherComments,
                reviewerInfo: {
                    ...reviewerInfo,
                    date: new Date().toISOString()
                }
            });

            // Navigate back to Dashboard
            navigate('/reviewer');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to submit review';
            setError(msg);
            setSubmitting(false);
        }
    };

    if (loading) return <MainLayout><div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading form...</div></MainLayout>;
    if (error || !paper) return <MainLayout><div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div></MainLayout>;

    return (
        <MainLayout>
            <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem', animation: 'fadeIn 0.5s ease-out' }}>
                <button
                    onClick={() => navigate('/reviewer')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-hover)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--primary)'}
                >
                    ← Back to Dashboard
                </button>

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

                    {/* Header */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Abstract Review Form</h1>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontWeight: 600 }}>Paper ID:</div>
                            <div style={{ color: 'var(--text-muted)' }}>{paper._id}</div>

                            <div style={{ fontWeight: 600 }}>Title:</div>
                            <div style={{ fontWeight: 500, color: 'var(--primary)' }}>{paper.title}</div>

                            <div style={{ fontWeight: 600 }}>Professional Field:</div>
                            <div style={{ color: 'var(--text-muted)' }}>{paper.category}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>

                        {/* 1. Evaluation Aspects */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                                Evaluation aspects
                            </h2>

                            <EvaluationRow number={1} text="The topic of this abstract is relevant for the submitted track of the conference." evaluation={evaluations.q1_topicRelevant} onChange={v => setEvaluations(prev => ({ ...prev, q1_topicRelevant: v }))} />
                            <EvaluationRow number={2} text="The title of the research topic is relevant and clearly captures the essence of the work." evaluation={evaluations.q2_titleRelevant} onChange={v => setEvaluations(prev => ({ ...prev, q2_titleRelevant: v }))} />
                            <EvaluationRow number={3} text="Objective/s of the research is/are clearly stated and achieved." evaluation={evaluations.q3_objectivesClear} onChange={v => setEvaluations(prev => ({ ...prev, q3_objectivesClear: v }))} />
                            <EvaluationRow number={4} text="The research methodology for the study is appropriate." evaluation={evaluations.q4_methodologyAppropriate} onChange={v => setEvaluations(prev => ({ ...prev, q4_methodologyAppropriate: v }))} />
                            <EvaluationRow number={5} text="The results are correctly interpreted." evaluation={evaluations.q5_resultsInterpreted} onChange={v => setEvaluations(prev => ({ ...prev, q5_resultsInterpreted: v }))} />
                            <EvaluationRow number={6} text="The conclusion/s is/are adequately tie together with results." evaluation={evaluations.q6_conclusionTies} onChange={v => setEvaluations(prev => ({ ...prev, q6_conclusionTies: v }))} />
                            <EvaluationRow number={7} text="The abstract is free from grammatical and spelling errors." evaluation={evaluations.q7_grammarSpelling} onChange={v => setEvaluations(prev => ({ ...prev, q7_grammarSpelling: v }))} />
                            <EvaluationRow number={8} text="Formatting: adhere to the provided guidelines." evaluation={evaluations.q8_formattingAdheres} onChange={v => setEvaluations(prev => ({ ...prev, q8_formattingAdheres: v }))} />
                            <EvaluationRow number={9} text="No plagiarism and duplication of previous publications to the best of my knowledge." evaluation={evaluations.q9_noPlagiarism} onChange={v => setEvaluations(prev => ({ ...prev, q9_noPlagiarism: v }))} />
                        </div>

                        {/* 2. Recommendation */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                                Recommendation
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Reviewer's recommendation (Select one):</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    'Accept',
                                    'Accept with minor revisions',
                                    'Reconsider after major revisions',
                                    'Reject'
                                ].map((rec) => (
                                    <label key={rec} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: recommendation === rec ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.1)', borderColor: recommendation === rec ? 'var(--primary)' : 'var(--glass-border)', transition: 'all 0.2s' }}>
                                        <input
                                            type="radio"
                                            name="recommendation"
                                            value={rec}
                                            checked={recommendation === rec}
                                            onChange={(e) => setRecommendation(e.target.value as any)}
                                            style={{ accentColor: 'var(--primary)', width: 18, height: 18, cursor: 'pointer' }}
                                        />
                                        <span style={{ color: recommendation === rec ? 'var(--primary-hover)' : 'var(--text-primary)', fontWeight: recommendation === rec ? 600 : 500 }}>
                                            {rec}
                                            {rec === 'Accept with minor revisions' && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(state in "Suggestions for improvement")</span>}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 3. Suggestions and Comments */}
                        <div style={{ marginBottom: '3rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    Suggestions for improvement <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <textarea
                                    className="input-glass"
                                    required
                                    value={suggestions}
                                    onChange={e => setSuggestions(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', minHeight: 120 }}
                                    placeholder="Enter your suggestions here..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    Any other Comments
                                </label>
                                <textarea
                                    className="input-glass"
                                    value={otherComments}
                                    onChange={e => setOtherComments(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', minHeight: 100 }}
                                    placeholder="Enter any other comments here..."
                                />
                            </div>
                        </div>

                        {/* 4. Reviewer Information */}
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                                Reviewer Information (Confidential)
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Name with initials *</label>
                                    <input className="input-glass" required type="text" value={reviewerInfo.nameWithInitials} onChange={e => setReviewerInfo(p => ({ ...p, nameWithInitials: e.target.value }))} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Designation *</label>
                                    <input className="input-glass" required type="text" value={reviewerInfo.designation} onChange={e => setReviewerInfo(p => ({ ...p, designation: e.target.value }))} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Institution *</label>
                                    <input className="input-glass" required type="text" value={reviewerInfo.institution} onChange={e => setReviewerInfo(p => ({ ...p, institution: e.target.value }))} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email *</label>
                                    <input className="input-glass" required type="email" value={reviewerInfo.email} onChange={e => setReviewerInfo(p => ({ ...p, email: e.target.value }))} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Contact number *</label>
                                    <input className="input-glass" required type="tel" value={reviewerInfo.contactNumber} onChange={e => setReviewerInfo(p => ({ ...p, contactNumber: e.target.value }))} style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-primary"
                                style={{
                                    padding: '12px 32px',
                                    fontSize: '1rem',
                                    opacity: submitting ? 0.7 : 1,
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? 'Submitting Review...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </MainLayout>
    );
}
