const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json'
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        if (res.status === 401 && window.location.pathname !== '/login') {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data as T;
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<{ success: boolean; message?: string; data: { token: string; user: { roles: string[]; name?: string; email?: string } } }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
}

export async function registerUser(payload: unknown): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleResponse(res);
}

export async function createAdminUser(payload: unknown): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/auth/admin/create-user`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleResponse(res);
}

export async function logoutUser(): Promise<void> {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
}

export interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
    professionalFields?: ProfessionalField[] | string[];
    affiliation?: string;
    country?: string;
    isActive: boolean;
    createdAt: string;
}

export async function getProfile(): Promise<{ success: boolean; data: { user: User } }> {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    return handleResponse(res);
}

export async function getSecretaryUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${BASE_URL}/auth/secretary-users`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { users: User[] } }>(res);
    return body.data;
}

export async function updateUser(userId: string, payload: Partial<User>): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/auth/admin/users/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    const body = await handleResponse<{ data: { user: User } }>(res);
    return body.data;
}

export async function deleteUser(userId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
    });
    await handleResponse(res);
}

// ─── Paper endpoints ──────────────────────────────────────────────────────────

export interface ReviewerUser {
    _id: string;
    name: string;
    email: string;
    professionalFields?: (string | { _id: string; fieldName: string })[];
}

export interface Paper {
    _id: string;
    title: string;
    abstract: string;
    keywords: string[];
    field: { _id: string; fieldName: string } | string;
    conference: string | { _id: string; title: string; startDate?: string; endDate?: string; submissionDeadline?: string; reviewDeadline?: string; };
    status: 'submitted' | 'under_review' | 'reviewed' | 'revision_required' | 'accepted' | 'rejected';
    authors: { _id: string; name: string; email: string }[] | string[];
    assignedReviewers?: { _id: string; name: string; email: string; professionalFields?: string[]; }[];
    finalDecision?: string;
    decisionBy?: string;
    decisionDate?: string;
    fileName?: string;
    fileUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProfessionalField {
    _id: string;
    fieldName: string;
    description?: string;
    subEditors?: { _id: string; name: string; email: string; }[];
    createdAt: string;
    updatedAt: string;
}

export interface Conference {
    _id: string;
    title: string;
    acronym?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    submissionDeadline: string;
    reviewDeadline?: string;
    fields: Array<{ _id: string; fieldName: string } | string>;
    status?: string;
    sessions?: {
        _id?: string;
        title: string;
        scheduledTime?: string;
        papers?: string[];
    }[];
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

/** GET /api/papers/my-papers — Author */
export async function getMyPapers(): Promise<{ papers: Paper[]; count: number }> {
    const res = await fetch(`${BASE_URL}/papers/my-papers`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { papers: Paper[] }; count: number }>(res);
    return { papers: body.data.papers, count: body.count };
}

/** POST /api/papers/upload — Author */
export async function uploadPaper(formData: FormData): Promise<Paper> {
    const res = await fetch(`${BASE_URL}/papers/upload`, {
        method: 'POST',
        headers: {},
        credentials: 'include',
        body: formData,
    });
    const body = await handleResponse<{ data: { paper: Paper } }>(res);
    return body.data.paper;
}

/** PUT /api/papers/:id/status — Editor / SubEditor */
export async function getAllPapers(filters?: {
    status?: string;
    field?: string;
}): Promise<{ papers: Paper[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.field) params.set('field', filters.field);

    const url = `${BASE_URL}/papers${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
    const body = await handleResponse<{ data: { papers: Paper[] }; count: number }>(res);
    return { papers: body.data.papers, count: body.count };
}

/** GET /api/papers/reviewers — Secretary */
export async function getReviewers(field?: string): Promise<ReviewerUser[]> {
    let url = `${BASE_URL}/papers/reviewers`;
    if (field) {
        url += `?field=${encodeURIComponent(field)}`;
    }
    const res = await fetch(url, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { reviewers: ReviewerUser[] } }>(res);
    return body.data.reviewers;
}

/** PUT /api/papers/:id — Author */
export async function updatePaper(paperId: string, formData: FormData): Promise<Paper> {
    const res = await fetch(`${BASE_URL}/papers/${paperId}`, {
        method: 'PUT',
        headers: {},
        credentials: 'include',
        body: formData,
    });
    const body = await handleResponse<{ data: { paper: Paper } }>(res);
    return body.data.paper;
}

/** PUT /api/papers/:id/status — Editor / SubEditor */
export async function updatePaperStatus(paperId: string, status: string): Promise<Paper> {
    const res = await fetch(`${BASE_URL}/papers/${paperId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    const body = await handleResponse<{ data: { paper: Paper } }>(res);
    return body.data.paper;
}

/** GET /api/papers/:id/download — All authenticated users */
export async function downloadPaper(paperId: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/papers/${paperId}/download`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    if (!res.ok) {
        if (res.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `HTTP error ${res.status}`);
    }
    return res.blob();
}

/** PUT /api/papers/:id/decline-review — Reviewer */
export async function declineReviewAssignment(paperId: string): Promise<Paper> {
    const res = await fetch(`${BASE_URL}/papers/${paperId}/decline-review`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { paper: Paper } }>(res);
    return body.data.paper;
}

/** PUT /api/papers/:id/assign-reviewer — Secretary */
export async function assignReviewer(paperId: string, reviewerId: string, reviewDeadline?: string): Promise<Paper> {
    const res = await fetch(`${BASE_URL}/papers/${paperId}/assign-reviewer`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reviewerId, reviewDeadline }),
    });
    const body = await handleResponse<{ data: { paper: Paper } }>(res);
    return body.data.paper;
}

/** DELETE /api/papers/:id/assign-reviewer — Secretary */
export async function unassignReviewer(paperId: string, reviewerId: string): Promise<Paper> {
    const res = await fetch(`${BASE_URL}/papers/${paperId}/assign-reviewer`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reviewerId })
    });
    const body = await handleResponse<{ data: { paper: Paper } }>(res);
    return body.data.paper;
}

// --- Professional Fields CRUD --- //

export async function getFields(): Promise<ProfessionalField[]> {
    const res = await fetch(`${BASE_URL}/fields`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { fields: ProfessionalField[] } }>(res);
    return body.data.fields;
}

export async function createField(name: string): Promise<ProfessionalField> {
    const res = await fetch(`${BASE_URL}/fields`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ name }),
    });
    const body = await handleResponse<{ data: { field: ProfessionalField } }>(res);
    return body.data.field;
}

export async function updateField(id: string, name: string): Promise<ProfessionalField> {
    const res = await fetch(`${BASE_URL}/fields/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ name }),
    });
    const body = await handleResponse<{ data: { field: ProfessionalField } }>(res);
    return body.data.field;
}

export async function deleteField(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/fields/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
    });
    await handleResponse(res);
}

// --- Editor & Sub-Editor Assignment --- //

export async function getSubEditors(): Promise<{ _id: string; name: string; email: string }[]> {
    const res = await fetch(`${BASE_URL}/auth/sub-editors`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { subEditors: { _id: string; name: string; email: string }[] } }>(res);
    return body.data.subEditors;
}

export async function assignSubEditor(fieldId: string, subEditorId: string): Promise<ProfessionalField> {
    const res = await fetch(`${BASE_URL}/fields/${fieldId}/subeditor`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ subEditorId }),
    });
    const body = await handleResponse<{ data: { field: ProfessionalField } }>(res);
    return body.data.field;
}

// --- Abstract Review Form --- //

export interface Review {
    _id: string;
    paper: string | Paper;
    reviewer: string | ReviewerUser;
    evaluations: Record<string, { answer: boolean; comment?: string }>;
    recommendation: string;
    suggestions?: string;
    otherComments?: string;
    reviewerInfo?: {
        nameWithInitials: string;
        designation: string;
        institution: string;
        email: string;
        contactNumber: string;
        date: string;
    };
    createdAt: string;
    updatedAt: string;
}

export async function submitReview(paperId: string, payload: Partial<Review>): Promise<Review> {
    const res = await fetch(`${BASE_URL}/reviews/${paperId}`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    const body = await handleResponse<{ data: { review: Review } }>(res);
    return body.data.review;
}

export async function getReviewsForPaper(paperId: string): Promise<Review[]> {
    const res = await fetch(`${BASE_URL}/reviews/paper/${paperId}`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { reviews: Review[] } }>(res);
    return body.data.reviews;
}

export async function getReviewById(reviewId: string): Promise<Review> {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { review: Review } }>(res);
    return body.data.review;
}

export async function getAssignedPapers(): Promise<{ papers: Paper[]; count: number }> {
    const res = await fetch(`${BASE_URL}/papers/assigned`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { papers: Paper[] }; count: number }>(res);
    return { papers: body.data.papers, count: body.count };
}

// -----------------------------------------------------
// NOTIFICATIONS API
// -----------------------------------------------------
export interface Notification {
    _id: string;
    user: string;
    message: string;
    title?: string;
    type: string;
    relatedPaper?: string;
    read: boolean;
    isDeleted?: boolean;
    createdAt: string;
}

/** GET /api/notifications */
export async function getMyNotifications(): Promise<{ notifications: Notification[], unreadCount: number }> {
    const res = await fetch(`${BASE_URL}/notifications`, {
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { notifications: Notification[] }, unreadCount: number }>(res);
    return { notifications: body.data.notifications, unreadCount: body.unreadCount };
}

/** PUT /api/notifications/:id/read */
export async function markAsRead(id: string): Promise<Notification> {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include'
    });
    const body = await handleResponse<{ data: { notification: Notification } }>(res);
    return body.data.notification;
}

/** PUT /api/notifications/read-all */
export async function markAllAsRead(): Promise<void> {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include'
    });
    await handleResponse(res);
}

/** GET /api/conferences */
export async function getAllConferences(): Promise<{ conferences: Conference[]; count: number }> {
    const res = await fetch(`${BASE_URL}/conferences`, { headers: getHeaders(), credentials: 'include' });
    const body = await handleResponse<{ data: Conference[]; count: number }>(res);
    return { conferences: body.data, count: body.count };
}

// -----------------------------------------------------
// SESSIONS API
// -----------------------------------------------------

/** POST /api/conferences/:id/sessions */
export async function addConferenceSession(conferenceId: string, sessionData: { title: string, scheduledTime?: string }): Promise<Conference> {
    const res = await fetch(`${BASE_URL}/conferences/${conferenceId}/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(sessionData)
    });
    const body = await handleResponse<{ data: Conference }>(res);
    return body.data;
}

/** PUT /api/conferences/:id/sessions/:sessionId/papers */
export async function assignPaperToSession(conferenceId: string, sessionId: string, paperId: string): Promise<Conference> {
    const res = await fetch(`${BASE_URL}/conferences/${conferenceId}/sessions/${sessionId}/papers`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ paperId })
    });
    const body = await handleResponse<{ data: Conference }>(res);
    return body.data;
}
