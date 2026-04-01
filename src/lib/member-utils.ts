/**
 * Member Utilities
 * Helper functions for member management and point calculations
 */

export interface MemberTier {
  name: string
  minPoints: number
  color: string
  benefits: string[]
}

export const MEMBER_TIERS: Record<string, MemberTier> = {
  BRONZE: {
    name: 'BRONZE',
    minPoints: 0,
    color: '#cd7f32',
    benefits: [
      'Basic membership',
      'Points earning on purchases',
      'Standard customer support'
    ]
  },
  SILVER: {
    name: 'SILVER',
    minPoints: 100,
    color: '#c0c0c0',
    benefits: [
      'All Bronze benefits',
      '5% bonus points on purchases',
      'Priority customer support',
      'Birthday rewards'
    ]
  },
  GOLD: {
    name: 'GOLD',
    minPoints: 500,
    color: '#ffd700',
    benefits: [
      'All Silver benefits',
      '10% bonus points on purchases',
      'Exclusive promotions',
      'Free delivery on orders above Rp50,000',
      'Early access to new menu items'
    ]
  },
  PLATINUM: {
    name: 'PLATINUM',
    minPoints: 1000,
    color: '#e5e4e2',
    benefits: [
      'All Gold benefits',
      '15% bonus points on purchases',
      'VIP customer support',
      'Free delivery on all orders',
      'Exclusive member-only events',
      'Personalized recommendations'
    ]
  }
}

/**
 * Determine member tier based on points
 * @param points - Current points balance
 * @returns Member tier name
 */
export function getMemberTier(points: number): string {
  if (points >= 1000) return 'PLATINUM'
  if (points >= 500) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

/**
 * Get tier details
 * @param tier - Tier name
 * @returns Tier details or null if tier not found
 */
export function getTierDetails(tier: string): MemberTier | null {
  const upperTier = tier.toUpperCase()
  return MEMBER_TIERS[upperTier] || null
}

/**
 * Calculate points earned from purchase amount
 * Rp10,000 = 1 point
 * @param amount - Purchase amount in Rupiah
 * @returns Points earned
 */
export function calculatePointsEarned(amount: number): number {
  return Math.floor(amount / 10000)
}

/**
 * Calculate monetary value of points
 * 1 point = Rp10,000
 * @param points - Points to convert
 * @returns Monetary value in Rupiah
 */
export function calculateMonetaryValue(points: number): number {
  return points * 10000
}

/**
 * Calculate points to next tier
 * @param currentPoints - Current points balance
 * @returns Points needed to reach next tier, or null if already at highest tier
 */
export function calculatePointsToNextTier(currentPoints: number): number | null {
  const currentTier = getMemberTier(currentPoints)

  if (currentTier === 'BRONZE') {
    return 100 - currentPoints // Need 100 points for Silver
  } else if (currentTier === 'SILVER') {
    return 500 - currentPoints // Need 500 points for Gold
  } else if (currentTier === 'GOLD') {
    return 1000 - currentPoints // Need 1000 points for Platinum
  } else {
    return null // Already at highest tier (Platinum)
  }
}

/**
 * Get progress percentage to next tier
 * @param currentPoints - Current points balance
 * @returns Progress percentage (0-100), or null if already at highest tier
 */
export function getProgressToNextTier(currentPoints: number): number | null {
  const currentTier = getMemberTier(currentPoints)

  if (currentTier === 'BRONZE') {
    return Math.min((currentPoints / 100) * 100, 100)
  } else if (currentTier === 'SILVER') {
    return Math.min(((currentPoints - 100) / (500 - 100)) * 100, 100)
  } else if (currentTier === 'GOLD') {
    return Math.min(((currentPoints - 500) / (1000 - 500)) * 100, 100)
  } else {
    return null // Already at highest tier (Platinum)
  }
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 12) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')
  }
  return phone
}
