export class SingleLoginManager {
  private channel: BroadcastChannel | null = null
  private userId: string | null = null
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeChannel()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('single_login_channel')

      this.channel.onmessage = (event) => {
        const { type, userId, sessionId } = event.data

        if (type === 'LOGIN' && userId && sessionId !== this.sessionId && userId === this.userId) {
          // Another tab logged in with the same user
          console.log('[SingleLogin] Another tab logged in with same user, logging out this tab')
          this.handleLogout()
        }
      }
    }
  }

  setUser(userId: string) {
    this.userId = userId
    // Store session info in localStorage
    localStorage.setItem('single_login_session', JSON.stringify({
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now()
    }))
  }

  broadcastLogin(userId: string) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'LOGIN',
        userId,
        sessionId: this.sessionId
      })
    }
  }

  private handleLogout() {
    // Clear all auth data
    localStorage.removeItem('admin_user_data')
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('sidebar_open')
    localStorage.removeItem('admin_login_timestamp')
    localStorage.removeItem('single_login_session')
    sessionStorage.removeItem('2fa_warning_shown')

    // Redirect to login
    window.location.href = '/login'
  }

  checkExistingSession(userId: string): boolean {
    const stored = localStorage.getItem('single_login_session')
    if (!stored) return false

    try {
      const session = JSON.parse(stored)
      // If same user but different session, this is a new login
      return session.userId === userId && session.sessionId !== this.sessionId
    } catch {
      return false
    }
  }

  cleanup() {
    if (this.channel) {
      this.channel.close()
    }
  }
}

// Singleton instance
export const singleLoginManager = new SingleLoginManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    singleLoginManager.cleanup()
  })
}
