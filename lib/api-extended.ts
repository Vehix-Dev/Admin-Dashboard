// API Integration for new backend features
// Add this to your lib/api.ts or create a new file api-extended.ts

import { api } from './api'

// ============ SUPPORT TICKETS ============

export interface SupportTicket {
    id: number
    support_id: string
    user: number
    user_name: string
    user_email: string
    user_phone: string
    user_type: 'RIDER' | 'RODIE'
    subject: string
    message: string
    status: 'PENDING' | 'ONGOING' | 'RESOLVED'
    internal_comments: string | null
    created_at: string
    updated_at: string
    resolved_at: string | null
}

export const supportTicketsAPI = {
    // List tickets with filters
    async list(params?: {
        status?: string
        user_type?: string
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.status && params.status !== 'ALL') {
            query.append('status', params.status)
        }
        if (params?.user_type && params.user_type !== 'ALL') {
            query.append('user_type', params.user_type)
        }
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/auth/admin/support-tickets/?${query}`)
        return response.data
    },

    // Get single ticket
    async get(id: number) {
        const response = await api.get(`/auth/admin/support-tickets/${id}/`)
        return response.data
    },

    // Create ticket
    async create(data: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>) {
        const response = await api.post('/auth/admin/support-tickets/', data)
        return response.data
    },

    // Update ticket
    async update(id: number, data: Partial<SupportTicket>) {
        const response = await api.patch(`/auth/admin/support-tickets/${id}/`, data)
        return response.data
    },

    // Delete ticket
    async delete(id: number) {
        return await api.delete(`/auth/admin/support-tickets/${id}/`)
    },

    // Update status
    async updateStatus(id: number, status: string) {
        const response = await api.post(`/auth/admin/support-tickets/${id}/update_status/`, { status })
        return response.data
    },

    // Add comment
    async addComment(id: number, comment: string) {
        const response = await api.post(`/auth/admin/support-tickets/${id}/add_comment/`, { comment })
        return response.data
    },

    // Resolve ticket
    async resolve(id: number) {
        const response = await api.post(`/auth/admin/support-tickets/${id}/resolve/`)
        return response.data
    },
}

// ============ AUDIT LOGS ============

export interface AdminAuditLog {
    id: number
    admin_user: number | null
    admin_username: string
    action_type: string
    action_description: string
    target_user: number | null
    target_username: string | null
    target_entity_type: string
    target_entity_id: string
    changes: Record<string, any>
    created_at: string
    ip_address: string | null
}

export const auditLogsAPI = {
    async list(params?: {
        action_type?: string
        admin_user?: number
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.action_type) query.append('action_type', params.action_type)
        if (params?.admin_user) query.append('admin_user', params.admin_user.toString())
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/auth/admin/audit-logs/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/auth/admin/audit-logs/${id}/`)
        return response.data
    },
}

// ============ NOTIFICATIONS & HISTORY ============

export interface NotificationHistory {
    id: number
    notification: number
    notification_title: string
    notification_message: string
    recipient: number | null
    recipient_username: string | null
    delivery_status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED'
    delivery_error: string | null
    was_opened: boolean
    opened_at: string | null
    sent_at: string
    updated_at: string
}

export const notificationHistoryAPI = {
    async list(params?: {
        delivery_status?: string
        was_opened?: boolean
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.delivery_status) query.append('delivery_status', params.delivery_status)
        if (params?.was_opened) query.append('was_opened', params.was_opened.toString())
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/auth/admin/notification-history/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/auth/admin/notification-history/${id}/`)
        return response.data
    },

    async markOpened(id: number) {
        const response = await api.post(`/auth/admin/notification-history/${id}/mark_opened/`)
        return response.data
    },
}

// ============ REFERRALS ============

export interface Referral {
    id: number
    referrer: number
    referrer_username: string
    referrer_id: string
    referrer_type: string
    referred: number
    referred_username: string
    referred_id: string
    referred_type: string
    amount: number
    is_credited: boolean
    created_at: string
}

export interface ReferralSummary {
    id: number
    user: number
    user_username: string
    total_referrals: number
    successful_referrals: number
    pending_referrals: number
    total_rewards_paid: number
    pending_rewards: number
    updated_at: string
}

export const referralsAPI = {
    async list(params?: {
        is_credited?: boolean
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.is_credited !== undefined) query.append('is_credited', params.is_credited.toString())
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/auth/admin/referrals/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/auth/admin/referrals/${id}/`)
        return response.data
    },

    async create(data: {
        referrer_id: number
        referred_id: number
        amount?: number
    }) {
        const response = await api.post('/auth/admin/referrals/', data)
        return response.data
    },

    async getMySummary() {
        const response = await api.get('/auth/admin/referrals/my_summary/')
        return response.data as ReferralSummary
    },

    async updateSummaries() {
        const response = await api.post('/auth/admin/referrals/update_summaries/')
        return response.data
    },
}

export const referralSummariesAPI = {
    async list(params?: {
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/auth/admin/referral-summaries/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/auth/admin/referral-summaries/${id}/`)
        return response.data
    },
}

// ============ CANCELLATION REASONS & TRACKING ============

export interface CancellationReason {
    id: number
    role: 'RIDER' | 'RODIE'
    reason: string
    requires_custom_text: boolean
    is_active: boolean
    order: number
}

export interface RequestCancellation {
    id: number
    request_id: number
    cancelled_by: number
    cancelled_by_username: string
    cancelled_by_role: string
    reason: number | null
    reason_text: string
    custom_reason_text: string | null
    display_reason: string
    cancelled_at: string
    distance_at_cancellation: number | null
    time_to_arrival_at_cancellation: number | null
}

export const cancellationReasonsAPI = {
    async list(params?: {
        role?: string
        is_active?: boolean
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.role) query.append('role', params.role)
        if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString())
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/requests/cancellation-reasons/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/requests/cancellation-reasons/${id}/`)
        return response.data
    },

    async create(data: Omit<CancellationReason, 'id'>) {
        const response = await api.post('/requests/cancellation-reasons/', data)
        return response.data
    },

    async update(id: number, data: Partial<CancellationReason>) {
        const response = await api.patch(`/requests/cancellation-reasons/${id}/`, data)
        return response.data
    },

    async delete(id: number) {
        return await api.delete(`/requests/cancellation-reasons/${id}/`)
    },
}

export const cancellationsAPI = {
    async list(params?: {
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/requests/cancellations/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/requests/cancellations/${id}/`)
        return response.data
    },
}

// ============ RATINGS ============

export interface Rating {
    id: number
    service_request: number
    service_request_id: number
    rater: number
    rater_username: string
    rated_user: number
    rated_user_username: string
    rating: number
    comment: string | null
    created_at: string
    updated_at: string
}

export const ratingsAPI = {
    async list(params?: {
        service_request__status?: string
        page?: number
        limit?: number
    }) {
        const query = new URLSearchParams()
        if (params?.service_request__status) query.append('service_request__status', params.service_request__status)
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        
        const response = await api.get(`/requests/ratings/?${query}`)
        return response.data
    },

    async get(id: number) {
        const response = await api.get(`/requests/ratings/${id}/`)
        return response.data
    },

    async create(data: {
        service_request: number
        rating: number
        comment?: string
    }) {
        const response = await api.post('/requests/ratings/', data)
        return response.data
    },

    async update(id: number, data: Partial<Rating>) {
        const response = await api.patch(`/requests/ratings/${id}/`, data)
        return response.data
    },

    async delete(id: number) {
        return await api.delete(`/requests/ratings/${id}/`)
    },

    async getMyRatings() {
        const response = await api.get('/requests/ratings/my_ratings/')
        return response.data
    },

    async getRatingsAboutMe() {
        const response = await api.get('/requests/ratings/ratings_about_me/')
        return response.data
    },

    async getRequestRatings(requestId: number) {
        const response = await api.get(`/requests/ratings/request_ratings/?request_id=${requestId}`)
        return response.data
    },
}

// ============ REPORTS ============

export const reportsAPI = {
    async getJobsPerformance(params?: {
        start_date?: string
        end_date?: string
    }) {
        const query = new URLSearchParams()
        if (params?.start_date) query.append('start_date', params.start_date)
        if (params?.end_date) query.append('end_date', params.end_date)
        
        const response = await api.get(`/auth/admin/reports/jobs-performance/?${query}`)
        return response.data
    },

    async getUserAnalytics(params?: {
        start_date?: string
        end_date?: string
    }) {
        const query = new URLSearchParams()
        if (params?.start_date) query.append('start_date', params.start_date)
        if (params?.end_date) query.append('end_date', params.end_date)
        
        const response = await api.get(`/auth/admin/reports/user-analytics/?${query}`)
        return response.data
    },

    async getFinancial(params?: {
        start_date?: string
        end_date?: string
    }) {
        const query = new URLSearchParams()
        if (params?.start_date) query.append('start_date', params.start_date)
        if (params?.end_date) query.append('end_date', params.end_date)
        
        const response = await api.get(`/auth/admin/reports/financial/?${query}`)
        return response.data
    },
}
