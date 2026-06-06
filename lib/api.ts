const API_BASE_URL = ""

let authToken: string | null = null

export function setAccessToken(token: string) {
  authToken = token
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_access_token", token)
  }
}

export function clearAccessToken() {
  authToken = null
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_access_token")
    localStorage.removeItem("admin_refresh_token")
  }
}

import { getAuthToken } from "./auth"

export const APITelemetry = {
  metrics: [] as Array<{
    endpoint: string;
    method: string;
    status: number;
    duration: number;
    timestamp: string;
  }>,
  log: (metric: any) => {
    APITelemetry.metrics.unshift(metric);
    if (APITelemetry.metrics.length > 50) APITelemetry.metrics.pop();
  }
}

export function getAccessToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_access_token")
  }
  return null
}

function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_refresh_token")
  }
  return null
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const isFormData = options?.body instanceof FormData
    const headers: any = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    }

    const token = getAccessToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const startTime = performance.now()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
    const duration = performance.now() - startTime

    // Log telemetry
    APITelemetry.log({
      endpoint,
      method: options?.method || "GET",
      status: response.status,
      duration,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      const errorText = await response.text()

      // Handle the specific "Another device logged in" error
      if (errorText.includes("This session is no longer valid. Another device has logged in.")) {
        console.warn("Session invalidated: Another device logged in.")
        if (typeof window !== "undefined") {
          // We'll use logoutAdmin from auth.ts if possible, but api.ts is a low-level lib
          // For now, clear tokens and redirect manually to avoid circular dependencies
          localStorage.removeItem("admin_access_token")
          localStorage.removeItem("admin_refresh_token")
          localStorage.removeItem("admin_user_data")
          window.location.href = "/login?message=session_invalid"
        }
      }

      throw new Error(`API Error (${response.status}): ${errorText}`)
    }

    // Handle responses without a body. Some API endpoints return 200 with an
    // empty body after successful mutations such as DELETE.
    const responseText = await response.text()
    if (response.status === 204 || responseText.trim() === "") {
      return undefined as T
    }

    return JSON.parse(responseText)
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
    throw error
  }
}

export async function apiMultipartRequest<T>(endpoint: string, formData: FormData, method: string = 'POST'): Promise<T> {
  try {
    const headers: HeadersInit = {}

    const token = getAccessToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }

    // Handle responses without a body (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    return response.json()
  } catch (error) {
    console.error(`API multipart request failed: ${endpoint}`, error)
    throw error
  }
}

// Axios-like API client for compatibility with api-extended.ts
export const api = {
  async get<T>(endpoint: string): Promise<{ data: T }> {
    const data = await apiRequest<T>(endpoint)
    return { data }
  },
  async post<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    const data = await apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    return { data }
  },
  async patch<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    const data = await apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
    return { data }
  },
  async put<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    const data = await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
    return { data }
  },
  async delete<T>(endpoint: string): Promise<{ data: T }> {
    const data = await apiRequest<T>(endpoint, {
      method: 'DELETE',
    })
    return { data }
  },
}

export interface AdminLoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    is_approved: boolean
    permissions?: string[]
  }
}

export async function adminLogin(
  username: string,
  password: string
): Promise<AdminLoginResponse> {
  const response = await apiRequest<AdminLoginResponse>(
    "/api/auth/admin/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  )

  setAccessToken(response.access)

  if (typeof window !== "undefined") {
    localStorage.setItem("admin_refresh_token", response.refresh)
    localStorage.setItem("admin_user", JSON.stringify(response.user))
  }

  return response
}

export interface AdminRegisterResponse {
  id: number
  external_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  role: string
  referral_code: string | null
  is_approved: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function adminRegister(data: {
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  password: string
}): Promise<AdminRegisterResponse> {
  return apiRequest<AdminRegisterResponse>("/api/auth/admin/register/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export interface AdminUser {
  id: number
  external_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  role: string
  referral_code: string | null
  is_approved: boolean
  is_active: boolean
  permissions?: string[]
  two_factor_enabled?: boolean
  deletion_status?: string | null
  deletion_requested_at?: string | null
  deletion_reason?: string | null
  created_at: string
  updated_at: string
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/api/auth/admin/users/")
}

export async function getAdminUserById(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/auth/admin/users/${id}/`)
}

export async function createAdminUser(data: {
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  password: string
  is_active?: boolean
  is_approved?: boolean
  permissions?: string[]
}): Promise<AdminUser> {
  return apiRequest<AdminUser>("/api/auth/admin/users/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateAdminUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/auth/admin/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteAdminUser(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/users/${id}/`, {
    method: "DELETE",
  })
}

export async function resetAdminUserPassword(id: number, password: string): Promise<any> {
  return apiRequest(`/api/auth/admin/users/${id}/password/`, {
    method: "POST",
    body: JSON.stringify({ password }),
  })
}

export interface DeletedAdminUser extends AdminUser {
  nin?: string
  wallet?: {
    id: number
    balance: string
    [key: string]: any
  }
}

export async function getDeletedAdminUsers(): Promise<DeletedAdminUser[]> {
  return apiRequest<DeletedAdminUser[]>("/api/auth/admin/users/deleted/")
}

export async function restoreAdminUser(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/auth/admin/users/${id}/restore/`, {
    method: "POST",
  })
}

export async function getPendingDeletionUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/api/auth/admin/users/pending-deletions/")
}

export async function permanentlyDeleteUser(id: number, role: string): Promise<void> {
  const normalizedRole = role === 'ROADIE' ? 'RODIE' : role
  await apiRequest(`/api/auth/admin/users/${id}/permanent-delete/${normalizedRole}/`, {
    method: "DELETE",
  })
}

export interface UserImage {
  id: number
  user: number
  external_id: string
  image_type: string
  original_image: string
  thumbnail: string
  status: 'APPROVED' | 'REJECTED' | 'PENDING'
  description: string
  created_at: string
  updated_at: string
  file_size: number
  width: number
  height: number
  original_url?: string
  thumbnail_url?: string
  user_details?: {
    username: string
    phone: string
    role: string
    email: string
  }
}

export interface AdminImage extends UserImage {
  user_info: {
    username: string
    phone: string
    role: string
    email: string
    is_approved: boolean
    created_at: string
  }
}

export interface ImageUploadResponse {
  id: number
  external_id: string
  image_type: string
  original_url: string
  thumbnail_url: string
  status: string
  message?: string
}

export interface BulkImageUploadResponse {
  message: string
  external_id: string
  image_type: string
  created_ids: number[]
  count: number
}

export interface ThumbnailInfo {
  id: number
  external_id: string
  image_type: string
  thumbnail_url: string
  original_url?: string
  user_role: string
  status: string
  created_at: string
  description?: string
}

export interface ThumbnailListResponse {
  count: number
  thumbnails: ThumbnailInfo[]
}

export interface UserImagesResponse {
  user: {
    username: string
    phone: string
    role: string
    email: string
    is_approved: boolean
    created_at: string
  } | null
  images: AdminImage[]
  count: number
}

export interface FileStructureResponse {
  structure: {
    [key: string]: {
      type: 'directory' | 'file'
      path: string
      size?: number
      modified?: number
      contents?: {
        [key: string]: any
      }
    }
  }
  statistics: {
    total_files: number
    total_size: number
    total_size_mb: number
    base_path: string
  }
}

export async function getUserImages(): Promise<UserImage[]> {
  return apiRequest<UserImage[]>("/api/images/user-images/")
}

export async function getUserImageById(id: number): Promise<UserImage> {
  return apiRequest<UserImage>(`/api/images/user-images/${id}/`)
}

export async function uploadUserImage(imageFile: File, imageType: string, description?: string): Promise<UserImage> {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('image_type', imageType)
  if (description) {
    formData.append('description', description)
  }

  return apiMultipartRequest<UserImage>("/api/images/user-images/", formData)
}

export async function updateUserImageStatus(id: number, status: 'APPROVED' | 'REJECTED'): Promise<UserImage> {
  return apiRequest<UserImage>(`/api/images/user-images/${id}/update-status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

export async function deleteUserImage(id: number): Promise<void> {
  await apiRequest(`/api/images/user-images/${id}/`, {
    method: "DELETE",
  })
}

export async function getUserImagesByType(imageType: string): Promise<UserImage[]> {
  return apiRequest<UserImage[]>(`/api/images/user-images/by-type/?type=${imageType}`)
}

export async function getUserThumbnails(): Promise<Array<{
  id: number
  image_type: string
  thumbnail_url: string
  status: string
  created_at: string
}>> {
  return apiRequest(`/api/images/user-images/thumbnails/`)
}

export async function getAllImages(params?: {
  external_id?: string
  image_type?: string
  status?: string
  prefix?: string
  role?: string
  search?: string
  ordering?: string
}): Promise<AdminImage[]> {
  const queryParams = new URLSearchParams()
  if (params?.external_id) queryParams.append('external_id', params.external_id)
  if (params?.image_type) queryParams.append('image_type', params.image_type)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.prefix) queryParams.append('prefix', params.prefix)
  if (params?.role) queryParams.append('role', params.role)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.ordering) queryParams.append('ordering', params.ordering)

  const url = `/api/images/admin-images/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiRequest<AdminImage[]>(url)
}

export async function getAdminImageById(id: number): Promise<AdminImage> {
  return apiRequest<AdminImage>(`/api/images/admin-images/${id}/`)
}

export async function adminUploadForUser(
  imageFile: File,
  externalId: string,
  imageType: string,
  description?: string,
  autoApprove: boolean = false
): Promise<AdminImage> {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('external_id', externalId)
  formData.append('image_type', imageType)
  if (description) {
    formData.append('description', description)
  }
  formData.append('auto_approve', autoApprove.toString())

  return apiMultipartRequest<AdminImage>("/api/images/admin-upload/", formData)
}

export async function adminBulkUploadForUser(
  imageFiles: File[],
  externalId: string,
  imageType: string,
  description?: string,
  autoApprove: boolean = false
): Promise<BulkImageUploadResponse> {
  const formData = new FormData()

  imageFiles.forEach((file, index) => {
    formData.append('images', file)
  })

  formData.append('external_id', externalId)
  formData.append('image_type', imageType)
  if (description) {
    formData.append('description', description)
  }
  formData.append('auto_approve', autoApprove.toString())

  return apiMultipartRequest<BulkImageUploadResponse>("/api/images/bulk-upload/", formData)
}

export async function getAllThumbnails(params?: {
  external_id?: string
  prefix?: string
  image_type?: string
}): Promise<ThumbnailListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.external_id) queryParams.append('external_id', params.external_id)
  if (params?.prefix) queryParams.append('prefix', params.prefix)
  if (params?.image_type) queryParams.append('image_type', params.image_type)

  const url = `/api/images/thumbnails/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  try {
    const response = await fetch(`${API_BASE_URL}${url}`)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error(`API request failed: ${url}`, error)
    throw error
  }
}

export async function getImagesByUser(
  externalId: string,
  params?: {
    image_type?: string
    status?: string
  }
): Promise<UserImagesResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('external_id', externalId)
  if (params?.image_type) queryParams.append('image_type', params.image_type)
  if (params?.status) queryParams.append('status', params.status)

  const url = `/api/images/user-images-by-id/?${queryParams.toString()}`

  try {
    const response = await fetch(`${API_BASE_URL}${url}`)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error(`API request failed: ${url}`, error)
    throw error
  }
}

export async function updateImageStatus(id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<{
  status: string
  new_status: string
  image_id: number
  external_id: string
  updated_by: string
  updated_at: string
}> {
  return apiRequest(`/api/images/admin-images/${id}/update-status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

export async function bulkUpdateImageStatus(imageIds: number[], status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<{
  message: string
  status: string
  updated_count: number
}> {
  return apiRequest("/api/images/admin-images/bulk-update-status/", {
    method: "POST",
    body: JSON.stringify({ image_ids: imageIds, status }),
  })
}

export async function replaceImage(imageId: number, newImageFile: File): Promise<AdminImage> {
  const formData = new FormData()
  formData.append('image', newImageFile)

  return apiMultipartRequest<AdminImage>(`/api/images/admin-images/${imageId}/replace/`, formData, 'POST')
}

export async function downloadUserImages(externalId: string): Promise<Blob> {
  const token = getAccessToken()
  const headers: HeadersInit = {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/images/download-images/?external_id=${externalId}`, {
    headers
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }

  return response.blob()
}

export async function getFileStructure(): Promise<FileStructureResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images/file-structure/`)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error(`API request failed: /api/images/file-structure/`, error)
    throw error
  }
}

export const IMAGE_TYPES = {
  PROFILE: 'PROFILE',
  NIN_FRONT: 'NIN_FRONT',
  NIN_BACK: 'NIN_BACK',
  LICENSE: 'LICENSE',
  VEHICLE: 'VEHICLE',
  OTHER: 'OTHER'
} as const

export type ImageType = typeof IMAGE_TYPES[keyof typeof IMAGE_TYPES]

export function getImageTypeLabel(imageType: ImageType): string {
  switch (imageType) {
    case IMAGE_TYPES.PROFILE: return 'Profile Picture'
    case IMAGE_TYPES.NIN_FRONT: return 'NIN Front'
    case IMAGE_TYPES.NIN_BACK: return 'NIN Back'
    case IMAGE_TYPES.LICENSE: return 'License'
    case IMAGE_TYPES.VEHICLE: return 'Vehicle'
    case IMAGE_TYPES.OTHER: return 'Other'
    default: return imageType
  }
}

export function getStatusColorForImage(status: string): string {
  switch (status) {
    case 'APPROVED': return 'green'
    case 'PENDING': return 'orange'
    case 'REJECTED': return 'red'
    default: return 'gray'
  }
}

export function getStatusLabelForImage(status: string): string {
  switch (status) {
    case 'APPROVED': return 'Approved'
    case 'PENDING': return 'Pending'
    case 'REJECTED': return 'Rejected'
    default: return status
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getImageDimensions(image: UserImage | AdminImage): string {
  if (image.width && image.height) {
    return `${image.width} × ${image.height}`
  }
  return 'Unknown'
}

export interface WalletTransaction {
  id: number
  amount: string
  reason: string
  created_at: string
}

export interface Wallet {
  id: number
  user: number
  user_id?: number
  user_external_id?: string
  user_username?: string
  balance: string
  transactions: WalletTransaction[]
  created_at: string
  updated_at: string
}

export async function getWallets(): Promise<Wallet[]> {
  return apiRequest<Wallet[]>("/api/auth/admin/wallets/")
}

export async function getWalletById(id: number): Promise<Wallet> {
  return apiRequest<Wallet>(`/api/auth/admin/wallets/${id}/`)
}

export async function createWallet(data: {
  user: number
  balance?: string
}): Promise<Wallet> {
  return apiRequest<Wallet>("/api/auth/admin/wallets/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet> {
  return apiRequest<Wallet>(`/api/auth/admin/wallets/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteWallet(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/wallets/${id}/`, {
    method: "DELETE",
  })
}

export interface ReferralTransaction {
  id: number
  amount: string
  reason: string
  created_at: string
}

export interface ReferralWallet {
  id: number
  user_id: number
  user_external_id: string
  user_username: string
  balance: string
  transactions: ReferralTransaction[]
}

export interface ReferralService {
  service_id: number
  service_name: string
}

export interface ReferralUser {
  id: number
  external_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  role: string
  referral_code: string
  nin: string
  is_approved: boolean
  created_at: string
  updated_at: string
  wallet?: ReferralWallet
  services?: ReferralService[]
}

export interface Referral {
  id: number
  referrer: ReferralUser
  referrer_username?: string
  referrer_type?: string
  referred?: ReferralUser
  referred_user: ReferralUser
  referred_type?: string
  referee_username?: string
  amount: string
  reward_amount?: string
  status: string
  is_credited: boolean
  created_at: string
  updated_at?: string
}

export interface AdminAuditLog {
  id: number
  admin_user?: number | null
  admin_username: string
  action_type: string
  action_description: string
  target_user?: number | null
  target_username?: string | null
  target_entity_type?: string | null
  target_entity_id?: string | null
  changes?: Record<string, unknown> | null
  created_at: string
  ip_address?: string | null
}

export interface AuditLogsPaginated {
  count: number
  next: string | null
  previous: string | null
  results: AdminAuditLog[]
}

export async function getAuditLogs(params?: {
  page?: number
  page_size?: number
  search?: string
}): Promise<AuditLogsPaginated> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set("page", String(params.page))
  qs.set("page_size", String(params?.page_size ?? 50))
  if (params?.search) qs.set("search", params.search)
  return apiRequest<AuditLogsPaginated>(`/api/auth/admin/audit-logs/?${qs.toString()}`)
}

export async function clearAuditLogs(): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>("/api/auth/admin/audit-logs/clear/", {
    method: "POST",
  })
}

export interface RoadieFleetOnlineTime {
  days: number
  total_online_seconds: number
  total_online_formatted: string
  average_per_roadie_seconds: number
  average_per_roadie_formatted: string
  roadies_with_sessions: number
  session_count: number
}

export interface RoadieOnlineSession {
  id: number
  went_online_at: string
  went_offline_at: string | null
  duration_seconds: number
  duration_formatted: string
  still_online: boolean
  device_type?: string | null
}

export interface RoadieOnlineCalendarDay {
  date: string
  total_seconds: number
  total_formatted: string
  sessions: RoadieOnlineSession[]
}

export interface RoadieOnlineTimeDetail {
  roadie_id: number
  roadie_external_id: string
  roadie_name: string
  total_online_seconds: number
  total_online_formatted: string
  average_session_seconds: number
  average_session_formatted: string
  session_count: number
  sessions: RoadieOnlineSession[]
  calendar: Record<string, RoadieOnlineCalendarDay>
}

export async function getRoadieFleetOnlineTime(days = 30): Promise<RoadieFleetOnlineTime> {
  return apiRequest<RoadieFleetOnlineTime>(
    `/api/auth/admin/roadies/online-time/summary/?days=${days}`
  )
}

export async function getRoadieOnlineTime(
  roadieId: number,
  params?: { date_from?: string; date_to?: string }
): Promise<RoadieOnlineTimeDetail> {
  const qs = new URLSearchParams()
  if (params?.date_from) qs.set("date_from", params.date_from)
  if (params?.date_to) qs.set("date_to", params.date_to)
  const query = qs.toString()
  return apiRequest<RoadieOnlineTimeDetail>(
    `/api/auth/admin/roadies/${roadieId}/online-time/${query ? `?${query}` : ""}`
  )
}

export async function getReferrals(): Promise<Referral[]> {
  return apiRequest<Referral[]>("/api/auth/admin/referrals/")
}

export async function getReferralById(id: number): Promise<Referral> {
  return apiRequest<Referral>(`/api/auth/admin/referrals/${id}/`)
}

export async function createReferral(data: {
  referrer?: number
  referrer_username?: string
  referee?: number
  referee_username?: string
  reward_amount?: string
  status?: string
}): Promise<Referral> {
  return apiRequest<Referral>("/api/auth/admin/referrals/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateReferral(id: number, data: Partial<Referral>): Promise<Referral> {
  return apiRequest<Referral>(`/api/auth/admin/referrals/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteReferral(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/referrals/${id}/`, {
    method: "DELETE",
  })
}

export async function getUserReferrals(): Promise<Referral[]> {
  return apiRequest<Referral[]>("/api/referrals/")
}

export interface PlatformConfig {
  id: number
  max_negative_balance: string
  service_fee: string
  trial_days: number
  ip_whitelist_enabled: boolean
  ip_whitelist: string
  updated_at: string
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  return apiRequest<PlatformConfig>("/api/auth/admin/platform/config/")
}

export async function updatePlatformConfig(data: {
  max_negative_balance?: string
  service_fee?: string
  trial_days?: number
  ip_whitelist_enabled?: boolean
  ip_whitelist?: string
}): Promise<PlatformConfig> {
  return apiRequest<PlatformConfig>("/api/auth/admin/platform/config/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function register(data: any): Promise<any> {
  return apiRequest("/api/register/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function login(data: any): Promise<any> {
  const response = await apiRequest<any>("/api/login/", {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (response.access) setAccessToken(response.access)
  return response
}

export async function getMe(): Promise<any> {
  return apiRequest("/api/me/")
}

export async function getMyWallet(): Promise<Wallet> {
  return apiRequest<Wallet>("/api/wallet/")
}

export async function depositFunds(amount: number, phoneNumber?: string): Promise<any> {
  return apiRequest("/api/wallet/deposit/", {
    method: "POST",
    body: JSON.stringify({ amount, phone_number: phoneNumber }),
  })
}

export async function withdrawFunds(amount: number, phoneNumber?: string): Promise<any> {
  return apiRequest("/api/wallet/withdraw/", {
    method: "POST",
    body: JSON.stringify({ amount, phone_number: phoneNumber }),
  })
}

// User Notifications
export async function getUserNotifications(): Promise<AdminNotification[]> {
  return apiRequest<AdminNotification[]>("/api/notifications/")
}

export async function updateUserNotification(id: number, data: Partial<AdminNotification>): Promise<AdminNotification> {
  return apiRequest<AdminNotification>(`/api/notifications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}


export interface RoadieStatusResponse {
  is_online: boolean
}

export async function updateRoadieStatus(isOnline: boolean): Promise<RoadieStatusResponse> {
  return apiRequest<RoadieStatusResponse>("/api/roadie/status/", {
    method: "POST",
    body: JSON.stringify({ is_online: isOnline }),
  })
}


export interface RiderStatusBreakdown {
  [status: string]: number
}

export interface RiderServiceBreakdown {
  service_type__name: string
  service_type__code: string
  count: number
}

export interface RiderRecentRequest {
  id: number
  service_type__name: string
  status: string
  created_at: string
  rodie__username: string | null
}

export interface RiderSummary {
  stats: {
    total_requests: number
    completed_requests: number
    active_requests: number
    cancelled_requests: number
    completion_rate: number
    status_breakdown: RiderStatusBreakdown
  }
  service_breakdown: RiderServiceBreakdown[]
  recent_requests: RiderRecentRequest[]
  created_date: string
  last_active: string
  rating?: number
  reviews?: Rating[]
}

export interface RoadieStatusBreakdown {
  [status: string]: number
}

export interface RoadieServiceBreakdown {
  service_type__name: string
  service_type__code: string
  count: number
}

export interface RoadieRecentAssignment {
  id: number
  service_type__name: string
  status: string
  created_at: string
  rider__username: string | null
  rider_lat: string
  rider_lng: string
}

export interface RoadieSummary {
  stats: {
    total_assignments: number
    completed_assignments: number
    active_assignments: number
    cancelled_assignments: number
    completion_rate: number
    unique_riders_served: number
    status_breakdown: RoadieStatusBreakdown
  }
  service_breakdown: RoadieServiceBreakdown[]
  recent_assignments: RoadieRecentAssignment[]
  created_date: string
  last_active: string
  is_approved: boolean
  rating: number
  reviews?: Rating[]
}

export interface Rider {
  id: number
  external_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  role: string
  referral_code: string | null
  nin: string
  is_approved: boolean
  created_at: string
  updated_at: string
  wallet?: Wallet
  summary?: RiderSummary
  services?: Array<{
    service_id: number
    service_name: string
  }>
  device_type: string | null
  is_online: boolean
  lat: number | null
  lng: number | null
  is_active: boolean
  is_deleted: boolean
}

export async function getRiders(): Promise<Rider[]> {
  return apiRequest<Rider[]>("/api/auth/admin/riders/")
}

export async function getRiderById(id: number): Promise<Rider> {
  return apiRequest<Rider>(`/api/auth/admin/riders/${id}/`)
}

export async function createRider(data: {
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  password?: string
  nin: string
}): Promise<Rider> {
  return apiRequest<Rider>("/api/auth/admin/riders/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateRider(id: number, data: Partial<Rider>): Promise<Rider> {
  return apiRequest<Rider>(`/api/auth/admin/riders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteRider(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/riders/${id}/`, {
    method: "DELETE",
  })
}

export async function getDeletedRiders(): Promise<Rider[]> {
  const allDeleted = await getDeletedAdminUsers()
  return allDeleted.filter(u => u.role === 'RIDER') as unknown as Rider[]
}

export async function restoreRider(id: number): Promise<Rider> {
  return restoreAdminUser(id) as unknown as Promise<Rider>
}

export async function getActiveRiders(search?: string): Promise<Rider[]> {
  const params = new URLSearchParams()
  if (search) params.append("q", search)
  return apiRequest<Rider[]>(`/api/auth/admin/riders/realtime/?${params.toString()}`)
}

export interface Roadie {
  id: number
  external_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  role: string
  referral_code: string | null
  nin: string
  is_approved: boolean
  created_at: string
  updated_at: string
  wallet?: Wallet
  summary?: RoadieSummary
  services?: Array<{
    service_id: number
    service_name: string
  }>
  device_type: string | null
  is_online: boolean
  lat: number | null
  lng: number | null
  is_active: boolean
  is_deleted: boolean
}

export async function getRoadies(): Promise<Roadie[]> {
  return apiRequest<Roadie[]>("/api/auth/admin/roadies/")
}

export async function getRoadieById(id: number): Promise<Roadie> {
  return apiRequest<Roadie>(`/api/auth/admin/roadies/${id}/`)
}

export async function createRoadie(data: {
  first_name: string
  last_name: string
  email: string
  phone: string
  username: string
  password?: string
  nin: string
}): Promise<Roadie> {
  return apiRequest<Roadie>("/api/auth/admin/roadies/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateRoadie(id: number, data: Partial<Roadie>): Promise<Roadie> {
  return apiRequest<Roadie>(`/api/auth/admin/roadies/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteRoadie(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/roadies/${id}/`, {
    method: "DELETE",
  })
}

export async function getDeletedRoadies(): Promise<Roadie[]> {
  const allDeleted = await getDeletedAdminUsers()
  return allDeleted.filter(u => u.role === 'ROADIE' || u.role === 'RODIE') as unknown as Roadie[]
}

export async function restoreRoadie(id: number): Promise<Roadie> {
  return restoreAdminUser(id) as unknown as Promise<Roadie>
}

export interface Service {
  id: number
  name: string
  code: string
  fixed_price?: string
  image?: string
  is_active: boolean
  rodie_count?: number
  created_at: string
  updated_at: string
}

export async function getServices(): Promise<Service[]> {
  return apiRequest<Service[]>("/api/auth/admin/services/")
}

export async function getServiceById(id: number): Promise<Service> {
  return apiRequest<Service>(`/api/auth/admin/services/${id}/`)
}

export async function createService(data: Omit<Service, "id" | "created_at" | "updated_at" | "image"> & { image: File | string | null }): Promise<Service> {
  let body: BodyInit
  if (data.image && typeof data.image !== "string") {
    const formData = new FormData()
    formData.append("name", data.name)
    if (data.code) formData.append("code", data.code)
    if (data.is_active !== undefined) formData.append("is_active", String(data.is_active))
    if (data.fixed_price) formData.append("fixed_price", data.fixed_price)
    formData.append("image", data.image)
    body = formData
  } else {
    body = JSON.stringify(data)
  }

  return apiRequest<Service>("/api/auth/admin/services/", {
    method: "POST",
    body,
  })
}

export async function updateService(id: number, data: Omit<Partial<Service>, "image"> & { image?: File | string | null }): Promise<Service> {
  let body: BodyInit
  if (data.image && typeof data.image !== "string") {
    const formData = new FormData()
    if (data.name) formData.append("name", data.name)
    if (data.code) formData.append("code", data.code)
    if (data.is_active !== undefined) formData.append("is_active", String(data.is_active))
    if (data.fixed_price) formData.append("fixed_price", data.fixed_price)
    formData.append("image", data.image)
    body = formData
  } else {
    body = JSON.stringify(data)
  }

  return apiRequest<Service>(`/api/auth/admin/services/${id}/`, {
    method: "PATCH",
    body,
  })
}

export async function deleteService(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/services/${id}/`, {
    method: "DELETE",
  })
}


export interface RodieService {
  id: number
  rodie: number
  rodie_username: string
  service: number
  service_display: string
}

export async function getRodieServices(): Promise<RodieService[]> {
  return apiRequest<RodieService[]>("/api/auth/admin/rodie-services/")
}

export async function getRodieServiceById(id: number): Promise<RodieService> {
  return apiRequest<RodieService>(`/api/auth/admin/rodie-services/${id}/`)
}

export async function createRodieService(data: {
  rodie?: number
  rodie_username?: string
  service: number
}): Promise<RodieService> {
  return apiRequest<RodieService>("/api/auth/admin/rodie-services/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateRodieService(id: number, data: Partial<RodieService>): Promise<RodieService> {
  return apiRequest<RodieService>(`/api/auth/admin/rodie-services/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteRodieService(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/rodie-services/${id}/`, {
    method: "DELETE",
  })
}

export async function getRoadieServices(): Promise<Service[]> {
  return apiRequest<Service[]>("/api/auth/rodie/services/")
}

export async function updateRoadieServices(serviceIds: number[]): Promise<Service[]> {
  return apiRequest<Service[]>("/api/auth/rodie/services/", {
    method: "POST",
    body: JSON.stringify({ service_ids: serviceIds }),
  })
}

export interface ServiceType {
  id: number
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Rating {
  id: number
  service_request: number
  rater: number
  rated_user: number
  rating: number
  comment: string
  rater_name?: string
  rated_user_name?: string
  rater_username?: string
  rated_user_username?: string
  created_at: string
  updated_at: string
}

export interface ServiceRequest {
  id: number
  service_type: number
  service_type_name?: string
  service_type_details?: ServiceType
  rider_lat?: number | string | null
  rider_lng?: number | string | null
  rider?: number
  rodie?: number | null
  rider_username?: string
  rodie_username?: string
  status?: string
  created_at: string
  updated_at: string
  cancellation_reason?: string | null
  cancelled_by?: string | null
  is_paid?: boolean
  fee_charged?: boolean
  ratings?: Rating[]
  [key: string]: any
}

export interface CreateServiceRequestData {
  service_type: number
  rider_lat: string | number
  rider_lng: string | number
  rider?: number
  rider_username?: string
  rider_username_input?: string
  rodie?: number
  rodie_username?: string
  rodie_username_input?: string
  is_paid?: boolean
  fee_charged?: boolean
}

export interface UpdateServiceRequestData {
  service_type?: number
  rider_lat?: string | number
  rider_lng?: string | number
  rider?: number
  rider_username?: string
  rider_username_input?: string
  rodie?: number | null
  rodie_username?: string
  rodie_username_input?: string
  status?: string
  is_paid?: boolean
  fee_charged?: boolean
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  return apiRequest<ServiceRequest[]>("/api/auth/admin/requests/")
}

export async function getServiceRequestById(id: number): Promise<ServiceRequest> {
  return apiRequest<ServiceRequest>(`/api/auth/admin/requests/${id}/`)
}

export async function createServiceRequest(data: CreateServiceRequestData): Promise<ServiceRequest> {
  const requestData: any = { ...data }

  if (data.rider_lat !== undefined) requestData.rider_lat = String(data.rider_lat)
  if (data.rider_lng !== undefined) requestData.rider_lng = String(data.rider_lng)

  return apiRequest<ServiceRequest>("/api/auth/admin/requests/", {
    method: "POST",
    body: JSON.stringify(requestData),
  })
}

export async function updateServiceRequest(id: number, data: UpdateServiceRequestData): Promise<ServiceRequest> {
  const requestData: any = { ...data }

  if (data.rider_lat !== undefined) requestData.rider_lat = String(data.rider_lat)
  if (data.rider_lng !== undefined) requestData.rider_lng = String(data.rider_lng)

  return apiRequest<ServiceRequest>(`/api/auth/admin/requests/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(requestData),
  })
}

export async function deleteServiceRequest(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/requests/${id}/`, {
    method: "DELETE",
  })
}

export async function assignRoadieByAdmin(id: number, rodieId: number): Promise<any> {
  return apiRequest(`/api/auth/admin/requests/${id}/assign/`, {
    method: "POST",
    body: JSON.stringify({ rodie_id: rodieId }),
  })
}

export async function chargeCompletedRequestFees(requestIds: number[]): Promise<{
  message: string
  charged_count: number
  failed_count: number
  errors: string[]
}> {
  return apiRequest<{
    message: string
    charged_count: number
    failed_count: number
    errors: string[]
  }>("/api/auth/admin/requests/charge-fees/", {
    method: "POST",
    body: JSON.stringify({ request_ids: requestIds }),
  })
}

export interface MapAssignedParty {
  rider_id?: number
  rider_external_id?: string | null
  rider_username?: string
  rider_first_name?: string
  rider_last_name?: string
  request_id?: number
  rodie_id?: number
  rodie_external_id?: string | null
  rodie_username?: string
  rodie_first_name?: string
  rodie_last_name?: string
}

export interface ActiveRiderLocation {
  request_id: number
  rider_id: number
  rider_username: string
  rider_first_name: string
  rider_last_name: string
  rider_external_id: string
  rider_phone?: string
  wallet_balance: number
  total_requests_count: number
  current_service_status: string
  status?: string
  service_type: string
  roadie_assigned?: MapAssignedParty | null
  rodie_lat?: number | null
  rodie_lng?: number | null
  time_elapsed?: string | null
  time_elapsed_seconds?: number | null
  request_created_at?: string
  lat: number
  lng: number
  updated_at: string
}

export async function getActiveRiderLocations(): Promise<ActiveRiderLocation[]> {
  return apiRequest<ActiveRiderLocation[]>("/api/auth/admin/requests/realtime/")
}

export interface GeoJSONFeature {
  type: "Feature"
  properties: {
    type: "rodie" | "rider"
    // Rodie properties
    rodie_id?: number
    rodie_external_id?: string
    rodie_username?: string
    rodie_first_name?: string
    rodie_last_name?: string
    average_rating?: number
    wallet_balance?: number
    completed_services_count?: number
    last_service_at?: string | null
    // Rider properties
    request_id?: number
    rider_id?: number
    rider_username?: string
    rider_first_name?: string
    rider_last_name?: string
    rider_external_id?: string
    total_requests_count?: number
    current_service_status?: string
    service_type?: string
    status?: string
    updated_at: string
  }
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

export async function getMapData(): Promise<GeoJSONFeatureCollection> {
  return apiRequest<GeoJSONFeatureCollection>("/api/auth/admin/requests/realtime/map/")
}

export interface RodieLocation {
  rodie_id: number
  rodie_external_id: string
  rodie_username: string
  rodie_first_name: string
  rodie_last_name: string
  rodie_phone?: string
  activity_status?: 'ON_JOB' | 'AVAILABLE'
  service_types?: string[]
  service_type?: string | null
  assigned_rider?: MapAssignedParty | null
  active_request_id?: number | null
  average_rating: number
  wallet_balance: number
  completed_services_count: number
  last_service_at: string | null
  lat: number
  lng: number
  updated_at: string
}

export interface CombinedRealtimeResponse {
  rodies: RodieLocation[]
  riders: ActiveRiderLocation[]
}

export async function getCombinedRealtimeLocations(): Promise<CombinedRealtimeResponse> {
  return apiRequest<CombinedRealtimeResponse>("/api/auth/admin/locations/realtime/")
}

export async function getCombinedMapData(): Promise<GeoJSONFeatureCollection> {
  return apiRequest<GeoJSONFeatureCollection>("/api/auth/admin/locations/realtime/map/")
}

export interface SupportTicket {
  id: number
  support_id: string
  user: number
  user_name: string
  user_email: string
  user_phone: string
  user_type: "RIDER" | "RODIE"
  subject: string
  message: string
  status: "PENDING" | "ONGOING" | "RESOLVED"
  internal_comments: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const data = await apiRequest<SupportTicket[] | { results: SupportTicket[] }>(
    "/api/auth/admin/support-tickets/"
  )
  return Array.isArray(data) ? data : data.results || []
}

export async function updateSupportTicketStatus(
  id: number,
  status: string
): Promise<SupportTicket> {
  return apiRequest<SupportTicket>(`/api/auth/admin/support-tickets/${id}/update_status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

export async function addSupportTicketComment(
  id: number,
  comment: string
): Promise<SupportTicket> {
  return apiRequest<SupportTicket>(`/api/auth/admin/support-tickets/${id}/add_comment/`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  })
}

export async function deleteSupportTicket(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/support-tickets/${id}/`, { method: "DELETE" })
}

export interface Dispute {
  id: number
  request: number
  request_details?: ServiceRequest
  raised_by: number
  raised_by_username?: string
  reason: string
  status: 'PENDING' | 'RESOLVED'
  created_at: string
  updated_at: string
}

export async function getDisputes(): Promise<Dispute[]> {
  return apiRequest<Dispute[]>("/api/auth/admin/disputes/")
}

export async function updateDispute(id: number, data: Partial<Dispute>): Promise<Dispute> {
  return apiRequest<Dispute>(`/api/auth/admin/disputes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export interface AdminNotification {
  id: number
  user?: number
  target_role?: string
  broadcast?: boolean
  title: string
  body?: string
  data?: any
  read: boolean
  created_at: string
}

export async function getNotifications(): Promise<AdminNotification[]> {
  return apiRequest<AdminNotification[]>("/api/auth/admin/notifications/")
}

export async function createNotification(data: {
  user?: number
  target_role?: string
  broadcast?: boolean
  title: string
  body?: string
  data?: any
}): Promise<AdminNotification> {
  return apiRequest<AdminNotification>("/api/auth/admin/notifications/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteNotification(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/notifications/${id}/`, {
    method: "DELETE",
  })
}

export interface RequestRouteInfo {
  request_id: number
  status: string
  rider: {
    id: number
    username: string
    lat: number
    lng: number
  }
  rodie: {
    id: number
    lat: number
    lng: number
  } | null
  timestamps: {
    created_at: string
    accepted_at: string | null
    en_route_at: string | null
    started_at: string | null
    completed_at: string | null
  }
  route: {
    distance_meters: number
    eta_seconds: number
  } | null
}

export async function getRequestRoute(id: number): Promise<RequestRouteInfo> {
  return apiRequest<RequestRouteInfo>(`/api/auth/admin/requests/${id}/route/`)
}

export async function refreshToken(): Promise<{ access: string }> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error("No refresh token available")
  }

  return apiRequest<{ access: string }>("/api/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  })
}

export async function checkBackendConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${API_BASE_URL}/api/auth/admin/login/`, {
      method: 'OPTIONS',
      signal: controller.signal,
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (response.status === 200 || response.status === 405) {
      return { connected: true }
    }

    return {
      connected: false,
      error: `Server responded with unexpected status: ${response.status}`
    }
  } catch (error: any) {
    let errorMessage = "Unknown connection error"

    if (error?.name === 'AbortError') {
      errorMessage = "Connection timeout - server is not responding"
    } else if (error?.message?.includes('Failed to fetch')) {
      errorMessage = "Cannot connect to server. Please ensure the Django backend is running."
    } else {
      errorMessage = error?.message || "Connection failed"
    }

    return { connected: false, error: errorMessage }
  }
}

// Local Permission Management (SQLite)
// Local Permission Management (SQLite)
export async function fetchLocalPermissions(userId: string | number): Promise<string[] | null> {
  try {
    const response = await fetch(`/api/permissions?userId=${userId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.permissions;
  } catch (error) {
    console.error("Failed to fetch local permissions:", error);
    return null;
  }
}

export async function saveLocalPermissions(userId: string | number, permissions: string[]): Promise<void> {
  await fetch('/api/permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: String(userId), permissions }),
  });
}

export function getCurrentAdminUser():
  | {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    is_approved: boolean
  }
  | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("admin_user")
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// Helper functions for service requests
export function getServiceName(serviceRequest: ServiceRequest): string {
  return serviceRequest.service_type_name ||
    serviceRequest.service_type_details?.name ||
    `Service ${serviceRequest.service_type}`
}

export function getServiceCode(serviceRequest: ServiceRequest): string {
  return serviceRequest.service_type_details?.code ||
    serviceRequest.service_type_name ||
    `SVC${serviceRequest.service_type}`
}

export function isServiceActive(serviceRequest: ServiceRequest): boolean {
  return serviceRequest.service_type_details?.is_active ?? true
}

// Status helpers
export const SERVICE_STATUSES = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  EN_ROUTE: 'EN_ROUTE',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
} as const

export type ServiceStatus = typeof SERVICE_STATUSES[keyof typeof SERVICE_STATUSES]

export function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case SERVICE_STATUSES.REQUESTED: return 'blue'
    case SERVICE_STATUSES.ACCEPTED: return 'orange'
    case SERVICE_STATUSES.EN_ROUTE: return 'purple'
    case SERVICE_STATUSES.STARTED: return 'green'
    case SERVICE_STATUSES.COMPLETED: return 'teal'
    case SERVICE_STATUSES.CANCELLED: return 'red'
    case SERVICE_STATUSES.EXPIRED: return 'gray'
    default: return 'gray'
  }
}

export function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case SERVICE_STATUSES.REQUESTED: return 'Requested'
    case SERVICE_STATUSES.ACCEPTED: return 'Accepted'
    case SERVICE_STATUSES.EN_ROUTE: return 'En Route'
    case SERVICE_STATUSES.STARTED: return 'Started'
    case SERVICE_STATUSES.COMPLETED: return 'Completed'
    case SERVICE_STATUSES.CANCELLED: return 'Cancelled'
    case SERVICE_STATUSES.EXPIRED: return 'Expired'
    default: return status
  }
}

// Helper functions for rider and roadie summaries
export function getRiderCompletionRate(rider: Rider): number {
  return rider.summary?.stats.completion_rate || 0
}

export function getRiderTotalRequests(rider: Rider): number {
  return rider.summary?.stats.total_requests || 0
}

export function getRiderActiveRequests(rider: Rider): number {
  return rider.summary?.stats.active_requests || 0
}

export function getRoadieCompletionRate(roadie: Roadie): number {
  return roadie.summary?.stats.completion_rate || 0
}

export function getRoadieTotalAssignments(roadie: Roadie): number {
  return roadie.summary?.stats.total_assignments || 0
}

export function getRoadieActiveAssignments(roadie: Roadie): number {
  return roadie.summary?.stats.active_assignments || 0
}

export function getRoadieUniqueRidersServed(roadie: Roadie): number {
  return roadie.summary?.stats.unique_riders_served || 0
}

export function getRiderStatusBreakdown(rider: Rider): RiderStatusBreakdown {
  return rider.summary?.stats.status_breakdown || {}
}

export function getRoadieStatusBreakdown(roadie: Roadie): RoadieStatusBreakdown {
  return roadie.summary?.stats.status_breakdown || {}
}

// Helper to get wallet balance
export function getWalletBalance(user: Rider | Roadie): string {
  return user.wallet?.balance || "0.00"
}

// Helper to check if user can receive services (based on max negative balance)
export function canReceiveServices(user: Rider | Roadie, platformConfig: PlatformConfig | null): boolean {
  if (!platformConfig) return true // default to true if no config
  const balance = parseFloat(getWalletBalance(user))
  const maxNegative = parseFloat(platformConfig.max_negative_balance)
  return balance >= -maxNegative
}

// Helper to check if request can be charged
export function canChargeRequest(request: ServiceRequest): boolean {
  return request.status === SERVICE_STATUSES.COMPLETED && !request.fee_charged
}

// Helper to check if payment is complete
export function isPaymentComplete(request: ServiceRequest): boolean {
  return request.is_paid === true
}

// Helper to get user services
export function getUserServices(user: Rider | Roadie): Array<{ service_id: number, service_name: string }> {
  return user.services || []
}

export function isUserApproved(user: Rider | Roadie): boolean {
  return user.is_approved === true
}

export function getUserTypeLabel(user: Rider | Roadie): string {
  return user.role === 'RIDER' ? 'Rider' : 'Roadie'
}

export function getUserExternalId(user: Rider | Roadie): string {
  return user.external_id || `USER${user.id}`
}

export function getUserReferralCode(user: Rider | Roadie): string {
  return user.referral_code || ''
}

export function isValidNIN(nin: string): boolean {
  return /^[A-Za-z0-9]{14}$/.test(nin)
}
