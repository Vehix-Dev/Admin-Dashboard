const API_BASE_URL = "http://127.0.0.1:8000"

// Import auth functions
let authToken: string | null = null

// Simple token management to work with your existing auth system
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

export function getAccessToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_access_token")
  }
  return null
}

// Helper function to get refresh token
function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_refresh_token")
  }
  return null
}

// Main API request function
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options?.headers,
    }

    // Add Authorization header if token exists
    const token = getAccessToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
    throw error
  }
}

// Helper function for multipart/form-data requests (for file uploads)
export async function apiMultipartRequest<T>(endpoint: string, formData: FormData, method: string = 'POST'): Promise<T> {
  try {
    const headers: HeadersInit = {}

    // Add Authorization header if token exists
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

    return response.json()
  } catch (error) {
    console.error(`API multipart request failed: ${endpoint}`, error)
    throw error
  }
}

// Admin Authentication
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

// Admin Registration (Public - no auth required)
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

// Admin User Management (requires auth)
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

// ============================================
// IMAGE MANAGEMENT APIS
// ============================================

export interface UserImage {
  id: number
  user: number
  external_id: string
  image_type: string
  original_image: string
  thumbnail: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
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

// User Image Management (requires user auth)
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

export async function updateUserImageStatus(id: number, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<UserImage> {
  return apiRequest<UserImage>(`/api/images/user-images/${id}/update_status/`, {
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
  return apiRequest<UserImage[]>(`/api/images/user-images/by_type/?type=${imageType}`)
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

// Admin Image Management (REQUIRES AUTH - updated per documentation)
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

// Admin upload image for user (requires admin auth)
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

// Admin bulk upload images for user (requires admin auth)
export async function adminBulkUploadForUser(
  imageFiles: File[],
  externalId: string,
  imageType: string,
  description?: string,
  autoApprove: boolean = false
): Promise<BulkImageUploadResponse> {
  const formData = new FormData()

  // Append each image file
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

// Get all thumbnails (NO AUTH REQUIRED - public endpoint)
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

  // This is a public endpoint, so we call fetch directly without auth
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

// Get images for specific user by external_id (NO AUTH REQUIRED - public endpoint)
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

  // This is a public endpoint, so we call fetch directly without auth
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

// Update image status (requires admin auth)
export async function updateImageStatus(id: number, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<{
  status: string
  new_status: string
  image_id: number
  external_id: string
  updated_by: string
  updated_at: string
}> {
  return apiRequest(`/api/images/admin-images/${id}/update_status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

// Bulk update image status (requires admin auth)
export async function bulkUpdateImageStatus(imageIds: number[], status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<{
  message: string
  status: string
  updated_count: number
}> {
  return apiRequest("/api/images/admin-images/bulk_update_status/", {
    method: "POST",
    body: JSON.stringify({ image_ids: imageIds, status }),
  })
}

// Replace existing image (requires admin auth)
export async function replaceImage(imageId: number, newImageFile: File): Promise<AdminImage> {
  const formData = new FormData()
  formData.append('image', newImageFile)

  return apiMultipartRequest<AdminImage>(`/api/images/admin-images/${imageId}/replace/`, formData, 'POST')
}

// Download all images for a user as zip (requires admin auth)
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

// Get file structure (NO AUTH REQUIRED - public endpoint)
export async function getFileStructure(): Promise<FileStructureResponse> {
  // This is a public endpoint, so we call fetch directly without auth
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

// Image type helpers
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

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper to get image dimensions string
export function getImageDimensions(image: UserImage | AdminImage): string {
  if (image.width && image.height) {
    return `${image.width} × ${image.height}`
  }
  return 'Unknown'
}

// ============================================
// WALLET MANAGEMENT (Public - no auth required per documentation)
// ============================================

export interface WalletTransaction {
  id: number
  amount: string
  reason: string
  created_at: string
}

export interface Wallet {
  id: number
  user: number
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

// ============================================
// REFERRAL MANAGEMENT (Public - no auth required per documentation)
// ============================================

export interface Referral {
  id: number
  referrer: number
  referrer_username: string
  referee: number
  referee_username: string
  reward_amount: string
  status: string
  created_at: string
  updated_at: string
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

// User referrals (authenticated)
export async function getUserReferrals(): Promise<Referral[]> {
  return apiRequest<Referral[]>("/api/auth/referrals/")
}

// ============================================
// PLATFORM CONFIG (Public - no auth required per documentation)
// ============================================

export interface PlatformConfig {
  id: number
  max_negative_balance: string
  service_fee: string
  updated_at: string
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  return apiRequest<PlatformConfig>("/api/auth/platform/config/")
}

export async function updatePlatformConfig(data: {
  max_negative_balance?: string
  service_fee?: string
}): Promise<PlatformConfig> {
  return apiRequest<PlatformConfig>("/api/auth/platform/config/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================
// ROADIE STATUS (User API - requires roadie auth)
// ============================================

export interface RoadieStatusResponse {
  is_online: boolean
}

export async function updateRoadieStatus(isOnline: boolean): Promise<RoadieStatusResponse> {
  return apiRequest<RoadieStatusResponse>("/api/auth/roadie/status/", {
    method: "POST",
    body: JSON.stringify({ is_online: isOnline }),
  })
}

// ============================================
// RIDER AND ROADIE INTERFACES WITH WALLET DATA
// ============================================

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
}

// Roadie Summary Interfaces
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
}

// Rider Management (public - no auth required per documentation)
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
  // Additional fields from documentation
  services?: Array<{
    service_id: number
    service_name: string
  }>
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

export async function getActiveRiders(search?: string): Promise<Rider[]> {
  const params = new URLSearchParams()
  if (search) params.append("q", search)
  return apiRequest<Rider[]>(`/api/auth/admin/riders/realtime/?${params.toString()}`)
}

// Roadie Management (public - no auth required per documentation)
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
  // Additional fields from documentation
  services?: Array<{
    service_id: number
    service_name: string
  }>
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

// Service Management (public - no auth required per documentation)
export interface Service {
  id: number
  name: string
  code: string
  is_active: boolean
  rodie_count?: number // Added per documentation
  created_at: string
  updated_at: string
}

export async function getServices(): Promise<Service[]> {
  return apiRequest<Service[]>("/api/auth/admin/services/")
}

export async function getServiceById(id: number): Promise<Service> {
  return apiRequest<Service>(`/api/auth/admin/services/${id}/`)
}

export async function createService(data: {
  name: string
  code?: string
  is_active?: boolean
}): Promise<Service> {
  return apiRequest<Service>("/api/auth/admin/services/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateService(id: number, data: Partial<Service>): Promise<Service> {
  return apiRequest<Service>(`/api/auth/admin/services/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteService(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/services/${id}/`, {
    method: "DELETE",
  })
}

// Rodie Service Assignment (public - no auth required per documentation)
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

// Roadie Manage Services (User API - requires roadie auth)
export async function getRoadieServices(): Promise<Service[]> {
  return apiRequest<Service[]>("/api/auth/rodie/services/")
}

export async function updateRoadieServices(serviceIds: number[]): Promise<Service[]> {
  return apiRequest<Service[]>("/api/auth/rodie/services/", {
    method: "POST",
    body: JSON.stringify({ service_ids: serviceIds }),
  })
}

// Service Type Interface (for service_type_details)
export interface ServiceType {
  id: number
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Service Request Management (public - no auth required per documentation)
export interface ServiceRequest {
  id: number
  rider: number
  rider_username: string
  rider_external_id?: string
  rodie: number | null
  rodie_username: string | null
  rodie_external_id?: string
  service_type: number
  service_type_name: string
  service_type_details: ServiceType
  status: string
  rider_lat: string
  rider_lng: string
  created_at: string
  updated_at: string
  // New fields from documentation
  is_paid?: boolean
  fee_charged?: boolean
  // Optional write fields
  rider_username_input?: string
  rodie_username_input?: string
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

  // Convert lat/lng to strings if provided
  if (data.rider_lat !== undefined) requestData.rider_lat = String(data.rider_lat)
  if (data.rider_lng !== undefined) requestData.rider_lng = String(data.rider_lng)

  return apiRequest<ServiceRequest>("/api/auth/admin/requests/", {
    method: "POST",
    body: JSON.stringify(requestData),
  })
}

export async function updateServiceRequest(id: number, data: UpdateServiceRequestData): Promise<ServiceRequest> {
  const requestData: any = { ...data }

  // Convert lat/lng to strings if provided
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

// Charge fees for completed requests
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

// Realtime Data (public - no auth required per documentation)
export interface ActiveRiderLocation {
  request_id: number
  rider_id: number
  rider_username: string
  rider_first_name: string
  rider_last_name: string
  rider_external_id: string
  lat: number
  lng: number
  status: string
  service_type: string // Now a string (service name) instead of number
  updated_at: string
}

export async function getActiveRiderLocations(): Promise<ActiveRiderLocation[]> {
  return apiRequest<ActiveRiderLocation[]>("/api/auth/admin/requests/realtime/")
}

export interface GeoJSONFeature {
  type: "Feature"
  properties: {
    request_id: number
    rider_id: number
    rider_username: string
    rider_external_id: string
    status: string
    service_type: string // Now a string (service name) instead of number
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

// Combined Realtime Locations (public - no auth required per documentation)
export interface RodieLocation {
  rodie_id: number
  rodie_external_id: string
  rodie_username: string
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

// ============================================
// ADMIN NOTIFICATIONS
// ============================================

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

// ============================================
// REQUEST ROUTE INFO (Admin)
// ============================================

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

// Token refresh (optional - if needed)
export async function refreshToken(): Promise<{ access: string }> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error("No refresh token available")
  }

  return apiRequest<{ access: string }>("/api/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  })
}

// Connection check
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

    // OPTIONS should return 200 for CORS preflight; 405 means endpoint exists but OPTIONS not allowed
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
  CANCELLED: 'CANCELLED'
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

// Helper to check if user is approved
export function isUserApproved(user: Rider | Roadie): boolean {
  return user.is_approved === true
}

// Helper to get user type label
export function getUserTypeLabel(user: Rider | Roadie): string {
  return user.role === 'RIDER' ? 'Rider' : 'Roadie'
}

// Helper to get user external ID
export function getUserExternalId(user: Rider | Roadie): string {
  return user.external_id || `USER${user.id}`
}

// Helper to get user referral code
export function getUserReferralCode(user: Rider | Roadie): string {
  return user.referral_code || ''
}

// NIN validation helper
export function isValidNIN(nin: string): boolean {
  return /^[A-Za-z0-9]{14}$/.test(nin)
}