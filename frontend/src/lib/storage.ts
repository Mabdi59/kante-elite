/**
 * Safe localStorage wrapper that handles tracking prevention and errors gracefully
 */

class SafeStorage {
  private isAvailable: boolean | null = null

  private checkAvailability(): boolean {
    if (this.isAvailable !== null) {
      return this.isAvailable
    }

    if (typeof window === 'undefined') {
      this.isAvailable = false
      return false
    }

    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.isAvailable = true
      return true
    } catch {
      this.isAvailable = false
      return false
    }
  }

  getItem(key: string): string | null {
    if (!this.checkAvailability()) {
      return null
    }

    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  setItem(key: string, value: string): boolean {
    if (!this.checkAvailability()) {
      return false
    }

    try {
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  }

  removeItem(key: string): boolean {
    if (!this.checkAvailability()) {
      return false
    }

    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

export const safeStorage = new SafeStorage()
