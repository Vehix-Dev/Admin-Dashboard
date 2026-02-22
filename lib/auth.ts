const API_BASE_URL = "https://backend.vehix.ug"

export interface AdminUser {
  id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  role: string
  username?: string
  is_superuser?: boolean
  is_staff?: boolean
  two_factor_enabled?: boolean
}

// Token management
export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_access_token", token)
  }
}

export function setRefreshToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_refresh_token", token)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_access_token")
  }
  return null
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_refresh_token")
  }
  return null
}

export function removeAuthTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_access_token")
    localStorage.removeItem("admin_refresh_token")
  }
}

export interface AuthResponse {
  access: string
  refresh: string
  user?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
}

// Check backend connection
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
      error: `Server responded with status: ${response.status}`
    }
  } catch (error: any) {
    let errorMessage = "Unknown connection error"

    if (error.name === 'AbortError') {
      errorMessage = "Connection timeout - server is not responding"
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = "Cannot connect to server. Please ensure the Django backend is running."
    } else {
      errorMessage = error.message || "Connection failed"
    }

    return { connected: false, error: errorMessage }
  }
}

export async function loginAdmin(username: string, password: string): Promise<AuthResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = `Login failed: ${response.status} ${response.statusText}`

      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } catch {
        // If response is not JSON, use default error message
      }

      throw new Error(errorMessage)
    }

    const data: AuthResponse = await response.json()

    if (!data.access || !data.refresh) {
      throw new Error("Invalid token response from server")
    }

    setAuthToken(data.access)
    setRefreshToken(data.refresh)

    return data
  } catch (error: any) {
    clearTimeout(timeoutId)
    controller.abort()

    if (error.name === 'AbortError') {
      throw new Error("Login timeout - server is not responding")
    }

    throw error
  }
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error("No refresh token available")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      removeAuthTokens()
      throw new Error("Failed to refresh token")
    }

    const data: { access: string } = await response.json()

    if (!data.access) {
      throw new Error("Invalid token refresh response")
    }

    setAuthToken(data.access)
    return data.access
  } catch (error: any) {
    clearTimeout(timeoutId)
    controller.abort()

    if (error.name === 'AbortError') {
      removeAuthTokens()
      throw new Error("Token refresh timeout")
    }

    throw error
  }
}

export async function getAdminProfile(): Promise<AdminUser | null> {
  const token = getAuthToken()

  if (!token) {
    return null
  }

  try {
    const payload = decodeJWT(token)

    if (payload) {
      const profile: AdminUser = {
        id: (payload.user_id || payload.id || "unknown").toString(),
        email: payload.email || "",
        name: payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || payload.username || "Admin User",
        role: payload.role || "admin",
        is_superuser: !!payload.is_superuser,
        is_staff: !!payload.is_staff,
        two_factor_enabled: !!payload.two_factor_enabled,
      };

      if (payload.username) profile.username = payload.username;
      if (payload.first_name) profile.first_name = payload.first_name;
      if (payload.last_name) profile.last_name = payload.last_name;

      return profile;
    }

    return {
      id: "admin-1",
      email: "admin@example.com",
      name: "Administrator",
      role: "ADMIN",
      username: "admin_user",
      two_factor_enabled: false,
    }

  } catch (error) {
    console.error("Failed to get admin profile:", error)
    try {
      const newToken = await refreshAccessToken()
      return getAdminProfile()
    } catch (refreshError) {
      removeAuthTokens()
      return null
    }
  }
}

// Helper function to decode JWT token
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Failed to decode JWT:", error)
    return null
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getAuthToken()
  if (!token) return false

  try {
    const payload = decodeJWT(token)
    if (!payload) return false

    const currentTime = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < currentTime) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Logout function
export function logoutAdmin(message?: string): void {
  removeAuthTokens()
  if (typeof window !== "undefined") {
    const redirectUrl = message ? `/login?message=${message}` : "/login"
    window.location.href = redirectUrl
  }
}

// API request wrapper with auth
export async function authApiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    let token = getAuthToken()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers[key] = String(value)
        })
      }
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headers as HeadersInit,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 401 && token) {
      try {
        const newToken = await refreshAccessToken()
        headers.Authorization = `Bearer ${newToken}`

        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: headers as HeadersInit,
          signal: controller.signal,
        })

        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.status} ${retryResponse.statusText}`)
        }

        return retryResponse.json()
      } catch (refreshError) {
        logoutAdmin()
        throw new Error("Session expired. Please login again.")
      }
    }

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.message) {
          errorMessage = errorData.message
        }

        // Handle specific session invalidation error
        if (errorMessage.includes("This session is no longer valid. Another device has logged in.")) {
          logoutAdmin("session_invalid")
          throw new Error("This session is no longer valid. Another device has logged in. Please login again and change your password.")
        }
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText

            if (errorText.includes("This session is no longer valid. Another device has logged in.")) {
              logoutAdmin("session_invalid")
              throw new Error("This session is no longer valid. Another device has logged in. Please login again and change your password.")
            }
          }
        } catch {
          // Ignore text parsing errors
        }
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    controller.abort()

    console.error(`API request failed: ${endpoint}`, error)

    if (error.name === 'AbortError') {
      throw new Error("Request timeout - server is not responding")
    }

    throw error
  }
}

// Helper function to check if API endpoint exists
export async function testEndpoint(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json',
      },
    })

    return response.status === 200 || response.status === 405
  } catch {
    return false
  }
}

// Get API base URL for debugging
export function getApiBaseUrl(): string {
  return API_BASE_URL
}
