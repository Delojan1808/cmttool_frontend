import React, { useState } from 'react';
import { type Paper } from '../../api';
import { conferenceService, type ConferenceData } from '../../services/conferenceService';

interface SessionManagementProps {
    conference: ConferenceData;
    papers: Paper[]; // Pass all papers to filter the accepted ones
    onClose: () => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ conference, papers, onClose }) => {
    const [localConference, setLocalConference] = useState<ConferenceData>(conference);
    const [sessionName, setSessionName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter papers to only those that are 'accepted' 
    const acceptedPapers = papers.filter(p =>
        p.status === 'accepted' &&
        (typeof p.conference === 'string' ? p.conference === conference._id : p.conference._id === conference._id)
    );

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!sessionName.trim() || !startTime || !endTime) {
            setError('Please fill in all session fields.');
            return;
        }

        const confDate = new Date(conference.conferenceDate).toDateString();
        const start = new Date(`${confDate} ${startTime}`);
        const end = new Date(`${confDate} ${endTime}`);

        if (start >= end) {
            setError('End time must be after start time.');
            return;
        }

        setLoading(true);
        try {
            const updated = await conferenceService.addSession(conference._id!, {
                name: sessionName,
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });
            setLocalConference(updated);
            setSessionName('');
            setStartTime('');
            setEndTime('');
        } catch (err: unknown) {
            alert((err as Error).message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPaper = async (sessionId: string, paperId: string) => {
        setLoading(true);
        try {
            const updated = await conferenceService.assignPaperToSession(conference._id!, sessionId, paperId);
            setLocalConference(updated);
        } catch (err: unknown) {
            alert((err as Error).message || 'Failed to assign paper');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: '1.5rem', cursor: 'pointer'
                }}>&times;</button>

                <h2 style={{ margin: 0 }}>Manage Sessions: {conference.title}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Conference Date: <strong>{new Date(conference.conferenceDate).toLocaleDateString()}</strong>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)' }}>
                        {error}
                    </div>
                )}

                {/* Create Session Form */}
                <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 200px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Session Name</label>
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="e.g., Morning Track A"
                            value={sessionName}
                            onChange={e => setSessionName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 120px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Start Time</label>
                        <input
                            type="time"
                            className="input-glass"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 120px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>End Time</label>
                        <input
                            type="time"
                            className="input-glass"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                        <button type="submit" className="btn-primary" disabled={loading || !sessionName.trim() || !startTime || !endTime} style={{ height: '42px', marginTop: '20px' }}>
                            Add Session
                        </button>
                    </div>
                </form>

                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />

                <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* Unassigned Accepted Papers */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3>Unassigned Accepted Papers</h3>
                        {acceptedPapers.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No accepted papers waiting for assignment.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {acceptedPapers.map(paper => {
                                    // Make sure it's not already in ANY session
                                    const isAssigned = localConference.sessions?.some(s => s.papers?.includes(paper._id));
                                    if (isAssigned) return null;

                                    return (
                                        <div key={paper._id} className="glass-card" style={{ padding: '1rem' }}>
                                            <strong>{paper.title}</strong>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {typeof paper.author === 'object' ? paper.author.name : 'Unknown Author'} | {typeof paper.category === 'object' ? paper.category.name : paper.category}
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <select
                                                    className="input-glass"
                                                    style={{ width: '100%', padding: '0.4rem' }}
                                                    onChange={e => {
                                                        if (e.target.value) handleAssignPaper(e.target.value, paper._id);
                                                    }}
                                                    value=""
                                                >
                                                    <option value="" disabled>Assign to Session...</option>
                                                    {localConference.sessions?.map(s => (
                                                        <option key={s._id} value={s._id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Conference Sessions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3>Current Sessions</h3>
                        {(!localConference.sessions || localConference.sessions.length === 0) ? (
                            <p style={{ color: 'var(--text-muted)' }}>No sessions created yet.</p>
                        ) : (
                            localConference.sessions.map(s => (
                                <div key={s._id} className="glass-card" style={{ padding: '1rem', borderLeft: '3px solid var(--primary)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{s.name}</h4>
                                    {(!s.papers || s.papers.length === 0) ? (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Empty session</div>
                                    ) : (
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                                            {s.papers.map(paperId => {
                                                const paperDetails = acceptedPapers.find(p => p._id === paperId);
                                                return <li key={paperId}>{paperDetails ? paperDetails.title : 'Unknown Paper'}</li>;
                                            })}
                                        </ul>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SessionManagement;
