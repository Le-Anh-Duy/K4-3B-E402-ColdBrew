const key = 'coldbrew-demo-user'
export const authService = {
  current() {
    try { return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || 'null') } catch { return null }
  },
  async login({ name, email, remember }) {
    // Demo identity only. Never store a password; replace this adapter with real auth.
    const user = { name: name?.trim() || email.split('@')[0], email }
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      ;(remember ? localStorage : sessionStorage).setItem(key, JSON.stringify(user))
    } catch { /* In-memory login remains available when browser storage is blocked. */ }
    return user
  },
  async register(values) { return this.login(values) },
  logout() { try { localStorage.removeItem(key); sessionStorage.removeItem(key) } catch { /* optional storage */ } },
}
