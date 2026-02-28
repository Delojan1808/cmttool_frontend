export interface ConferenceData {
    _id?: string;
    title: string;
    professionalFields: Array<{ _id: string; name: string } | string>;
    submissionDeadline: string;
    conferenceDate: string;
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    sessions?: {
        _id?: string;
        name: string;
        startTime?: string;
        endTime?: string;
        papers?: string[];
    }[];
    createdAt?: string;
}

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(): HeadersInit {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        // If token expired or invalid, auto-logout and redirect to login
        if (res.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data as T;
}

export const conferenceService = {
    createConference: async (data: ConferenceData) => {
        const res = await fetch(`${BASE_URL}/conferences`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify(data),
        });
        const body = await handleResponse<{ data: ConferenceData }>(res);
        return body.data;
    },

    getAllConferences: async () => {
        const res = await fetch(`${BASE_URL}/conferences`, {
            headers: getHeaders(),
            credentials: 'include'
        });
        const body = await handleResponse<{ success: boolean; data: ConferenceData[] }>(res);
        return body;
    },

    updateConference: async (id: string, data: Partial<ConferenceData>) => {
        const res = await fetch(`${BASE_URL}/conferences/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify(data),
        });
        const body = await handleResponse<{ data: ConferenceData }>(res);
        return body.data;
    },

    deleteConference: async (id: string) => {
        const res = await fetch(`${BASE_URL}/conferences/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include'
        });
        const body = await handleResponse<{ success: boolean; data: unknown }>(res);
        return body;
    },

    addSession: async (conferenceId: string, sessionData: { name: string, startTime?: string, endTime?: string }) => {
        const res = await fetch(`${BASE_URL}/conferences/${conferenceId}/sessions`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify(sessionData)
        });
        const body = await handleResponse<{ data: ConferenceData }>(res);
        return body.data;
    },

    assignPaperToSession: async (conferenceId: string, sessionId: string, paperId: string) => {
        const res = await fetch(`${BASE_URL}/conferences/${conferenceId}/sessions/${sessionId}/papers`, {
            method: 'PUT',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ paperId })
        });
        const body = await handleResponse<{ data: ConferenceData }>(res);
        return body.data;
    }
};
