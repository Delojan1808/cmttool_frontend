import React, { useState, useEffect, useRef } from 'react';
import { conferenceService, type ConferenceData } from '../../services/conferenceService';
import { getFields, type ProfessionalField } from '../../api';

interface CreateConferenceProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: ConferenceData;
}

const CreateConference: React.FC<CreateConferenceProps> = ({ onSuccess, onCancel, initialData }) => {
    const isEditing = !!initialData;
    const isCompleted = isEditing && initialData?.conferenceDate ? new Date(initialData.conferenceDate) < new Date() : false;

    const [title, setTitle] = useState(initialData?.title || '');
    const [availableFields, setAvailableFields] = useState<ProfessionalField[]>([]);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getFields().then(setAvailableFields).catch(console.error);
        if (initialData?.professionalFields) {
            setSelectedFields(initialData.professionalFields.map(f => typeof f === 'object' ? f._id : f));
        }
    }, [initialData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFieldToggle = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
        );
    };

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
        if (!title.trim() || selectedFields.length === 0 || !submissionDeadline || !conferenceDate) {
            setError('All fields are required and at least one professional field must be selected.');
            return;
        }

        const now = new Date();
        const deadlineDate = new Date(submissionDeadline);
        const confDate = new Date(conferenceDate);

        if (!isEditing) {
            if (deadlineDate <= now) {
                setError('Submission deadline must be a future date and time.');
                return;
            }
            if (confDate <= now) {
                setError('Conference date must be a future date and time.');
                return;
            }
        }

        if (confDate <= deadlineDate) {
            setError('Conference date must be after the submission deadline.');
            return;
        }

        try {
            setLoading(true);
            const data: ConferenceData = {
                title,
                professionalFields: selectedFields,
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
                {isCompleted && (
                    <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        This conference has already passed. You cannot edit completed conferences.
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Conference Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. International Conference on Information Technology 2026"
                        style={inputStyle}
                        disabled={isCompleted}
                        required
                    />
                </div>

                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Professional Fields</label>
                    <div
                        onClick={() => !isCompleted && setIsDropdownOpen(!isDropdownOpen)}
                        style={{ ...inputStyle, cursor: isCompleted ? 'not-allowed' : 'pointer', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '45px', alignItems: 'center', opacity: isCompleted ? 0.6 : 1 }}
                    >
                        {selectedFields.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>Select professional fields...</span>
                        ) : (
                            selectedFields.map(id => {
                                const field = availableFields.find(f => f._id === id);
                                return (
                                    <span key={id} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                        {field ? field.name : id}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); !isCompleted && handleFieldToggle(id); }}
                                            style={{ background: 'none', border: 'none', color: 'currentColor', cursor: isCompleted ? 'not-allowed' : 'pointer', padding: 0, fontSize: '0.8rem', opacity: 0.7 }}
                                            disabled={isCompleted}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                );
                            })
                        )}
                    </div>
                    {isDropdownOpen && (
                        <div className="glass-card" style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            zIndex: 50, marginTop: '0.5rem', maxHeight: '250px',
                            overflowY: 'auto', padding: '0.5rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                            backgroundColor: 'var(--bg-dark)',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {availableFields.length === 0 ? (
                                <div style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>No fields available</div>
                            ) : (
                                availableFields.map(field => (
                                    <label key={field._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', margin: 0 }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedFields.includes(field._id)}
                                            onChange={() => handleFieldToggle(field._id)}
                                            style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: 'var(--text-primary)' }}>{field.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Submission Deadline</label>
                        <input
                            type="datetime-local"
                            value={submissionDeadline}
                            onChange={(e) => setSubmissionDeadline(e.target.value)}
                            style={inputStyle}
                            disabled={isCompleted}
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
                            disabled={isCompleted}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || isCompleted}
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
