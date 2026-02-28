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
    const [loading, setLoading] = useState(false);

    // Filter papers to only those that are 'accepted' 
    const acceptedPapers = papers.filter(p =>
        p.status === 'accepted' &&
        (typeof p.conference === 'string' ? p.conference === conference._id : p.conference._id === conference._id)
    );

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionName.trim()) return;
        setLoading(true);
        try {
            const updated = await conferenceService.addSession(conference._id!, { name: sessionName });
            setLocalConference(updated);
            setSessionName('');
        } catch (err: any) {
            alert(err.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPaper = async (sessionId: string, paperId: string) => {
        setLoading(true);
        try {
            const updated = await conferenceService.assignPaperToSession(conference._id!, sessionId, paperId);
            setLocalConference(updated);
        } catch (err: any) {
            alert(err.message || 'Failed to assign paper');
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

                {/* Create Session Form */}
                <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        className="input-glass"
                        placeholder="Session Name (e.g., Morning Track A)"
                        value={sessionName}
                        onChange={e => setSessionName(e.target.value)}
                        style={{ flex: 1 }}
                        disabled={loading}
                    />
                    <button type="submit" className="btn-primary" disabled={loading || !sessionName.trim()}>
                        Add Session
                    </button>
                </form>

                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />

                <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* Unassigned Accepted Papers */}


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
