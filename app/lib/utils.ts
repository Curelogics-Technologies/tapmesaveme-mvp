// Use dynamic import for bcrypt to handle potential issues
let bcrypt: typeof import("bcryptjs") | null = null

async function getBcrypt() {
  if (!bcrypt) {
    try {
      bcrypt = await import("bcryptjs")
    } catch (error) {
      console.error("Failed to load bcrypt:", error)
      throw new Error("Password hashing not available")
    }
  }
  return bcrypt
}

export async function hashPin(pin: string): Promise<string> {
  const bcryptLib = await getBcrypt()
  const saltRounds = 12
  return bcryptLib.hash(pin, saltRounds)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const bcryptLib = await getBcrypt()
  return bcryptLib.compare(pin, hash)
}

export function formatPhoneNumber(phone: string): string {
  // Basic phone number formatting
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}
