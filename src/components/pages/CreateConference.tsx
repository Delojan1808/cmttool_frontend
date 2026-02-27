import React, { useState } from 'react';
import { conferenceService, type ConferenceData } from '../../services/conferenceService';

interface CreateConferenceProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: ConferenceData;
}

const CreateConference: React.FC<CreateConferenceProps> = ({ onSuccess, onCancel, initialData }) => {
    const isEditing = !!initialData;
    const [title, setTitle] = useState(initialData?.title || '');
    const [fieldsInput, setFieldsInput] = useState(initialData?.professionalFields?.join(', ') || '');

    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const [submissionDeadline, setSubmissionDeadline] = useState(formatDateForInput(initialData?.submissionDeadline));
    const [conferenceDate, setConferenceDate] = useState(formatDateForInput(initialData?.conferenceDate));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!title.trim() || !fieldsInput.trim() || !submissionDeadline || !conferenceDate) {
            setError('All fields are required.');
            return;
        }

        const professionalFields = fieldsInput.split(',').map(f => f.trim()).filter(f => f !== '');

        if (professionalFields.length === 0) {
            setError('Please provide at least one professional field.');
            return;
        }

        try {
            setLoading(true);
            const data: ConferenceData = {
                title,
                professionalFields,
                submissionDeadline,
                conferenceDate
            };

            if (isEditing && initialData._id) {
                await conferenceService.updateConference(initialData._id, data);
            } else {
                await conferenceService.createConference(data);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} conference`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{isEditing ? '✏️ Edit Conference' : '➕ Create New Conference'}</h2>
                <button onClick={onCancel} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>✕ Cancel</button>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Conference Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. International Conference on Information Technology 2026"
                        style={inputStyle}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Professional Fields (comma separated)</label>
                    <input
                        type="text"
                        value={fieldsInput}
                        onChange={(e) => setFieldsInput(e.target.value)}
                        placeholder="e.g. Computer Science, Mathematics, Physics"
                        style={inputStyle}
                        required
                    />
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                        Enter the areas of study relevant to this conference, separated by commas.
                    </small>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Submission Deadline</label>
                        <input
                            type="datetime-local"
                            value={submissionDeadline}
                            onChange={(e) => setSubmissionDeadline(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Conference Date</label>
                        <input
                            type="datetime-local"
                            value={conferenceDate}
                            onChange={(e) => setConferenceDate(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Conference' : 'Create Conference')}
                    </button>
                </div>
            </form>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.2)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease'
};

export default CreateConference;
