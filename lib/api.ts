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

// Rider Management (public - no auth required)
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

// Roadie Management (public - no auth required)
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

// Service Management (public - no auth required)
export interface Service {
  id: number
  name: string
  code: string
  is_active: boolean
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

// Rodie Service Assignment (public - no auth required)
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

// Service Request Management (public - no auth required)
export interface ServiceRequest {
  id: number
  rider: number
  rider_username: string
  rodie: number | null
  rodie_username: string | null
  service_type: number
  status: string
  rider_lat: number
  rider_lng: number
  created_at: string
  updated_at: string
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  return apiRequest<ServiceRequest[]>("/api/auth/admin/requests/")
}

export async function getServiceRequestById(id: number): Promise<ServiceRequest> {
  return apiRequest<ServiceRequest>(`/api/auth/admin/requests/${id}/`)
}

export async function createServiceRequest(data: {
  service_type: number
  rider_lat: number
  rider_lng: number
  rider?: number
  rider_username?: string
  rodie?: number
  rodie_username?: string
}): Promise<ServiceRequest> {
  return apiRequest<ServiceRequest>("/api/auth/admin/requests/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateServiceRequest(id: number, data: Partial<ServiceRequest>): Promise<ServiceRequest> {
  return apiRequest<ServiceRequest>(`/api/auth/admin/requests/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteServiceRequest(id: number): Promise<void> {
  await apiRequest(`/api/auth/admin/requests/${id}/`, {
    method: "DELETE",
  })
}

// Realtime Data (public - no auth required)
export interface ActiveRiderLocation {
  request_id: number
  rider_id: number
  rider_username: string
  rider_first_name: string
  rider_last_name: string
  lat: number
  lng: number
  status: string
  service_type: number
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
    rider_first_name: string
    rider_last_name: string
    status: string
    service_type: number
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

// Combined Realtime Locations (public - no auth required)
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
