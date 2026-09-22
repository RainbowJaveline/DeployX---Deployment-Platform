const STORAGE_KEY = 'deployx_user_name'

// There's no real backend yet, so the "session" is just the name the
// person typed on the signup form, kept in localStorage. Swap this out
// for your real auth/user state once there's an API to back it.

export function getStoredName() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setStoredName(name) {
  try {
    if (name) localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Ignore write failures (e.g. storage disabled) — greeting just falls back.
  }
}

export function clearStoredName() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore — nothing to clean up if storage isn't available.
  }
}
export function firstNameOf(fullName) {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0]
}

// Fallback for people who sign in without ever having "signed up" in this
// demo (no name was ever collected) — turn "sahil.lakade@company.com"
// into "Sahil" so the greeting still feels personal.
export function nameFromEmail(email) {
  if (!email) return ''
  const local = email.split('@')[0]
  const cleaned = local.replace(/[._-]+/g, ' ').trim().split(' ')[0]
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : ''
}
