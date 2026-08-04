/**
 * Advanced validation utilities for authentication
 * Implements enterprise-grade security requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

/**
 * Validates password according to enterprise security standards
 * Requirements:
 * - Minimum 8 characters (stronger than the 6 character minimum)
 * - Cannot contain user's email or name
 * - Must contain characters from at least 2 of 4 categories:
 *   - Uppercase letters (A-Z)
 *   - Lowercase letters (a-z)
 *   - Numbers (0-9)
 *   - Special characters (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function validatePassword(
  password: string,
  email?: string,
  fullName?: string
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score += 1;
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  if (password.length >= 16) {
    score += 1;
  }
  
  // Check if password contains email or name
  if (email) {
    const emailUsername = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailUsername) && emailUsername.length > 2) {
      errors.push('Password cannot contain your email address');
    }
  }
  
  if (fullName) {
    const nameParts = fullName.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 2 && password.toLowerCase().includes(part)) {
        errors.push('Password cannot contain parts of your name');
      }
    }
  }
  
  // Check character categories
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  
  const categoriesCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars]
    .filter(Boolean).length;
  
  if (categoriesCount < 2) {
    errors.push('Password must contain characters from at least 2 of the following: uppercase letters, lowercase letters, numbers, special characters');
  } else {
    score += categoriesCount;
  }
  
  // Check for common patterns
  if (/^[a-zA-Z]+$/.test(password)) {
    errors.push('Password cannot contain only letters');
  }
  
  if (/^[0-9]+$/.test(password)) {
    errors.push('Password cannot contain only numbers');
  }
  
  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    errors.push('Password cannot contain sequential letters');
    score -= 1;
  }
  
  // Common weak passwords check
  const commonWeakPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'shadow', 'superman', 'qazwsx', 'michael'
  ];
  
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more unique password');
    score = 0;
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  
  if (score >= 7) {
    strength = 'very-strong';
  } else if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(10, score))
  };
}

/**
 * Advanced email validation
 * Checks for:
 * - Valid format
 * - Common typos
 * - Disposable email domains
 * - Valid TLD
 */
export function validateEmail(email: string): EmailValidationResult {
  const suggestions: string[] = [];
  
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email) {
    return {
      isValid: false,
      error: 'Email address is required'
    };
  }
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }
  
  const [localPart, domain] = email.split('@');
  
  // Check local part
  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'Email username is too long'
    };
  }
  
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email cannot start or end with a period'
    };
  }
  
  if (/\.{2,}/.test(localPart)) {
    return {
      isValid: false,
      error: 'Email cannot contain consecutive periods'
    };
  }
  
  // Check domain
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1].toLowerCase();
  
  // Common TLDs
  const validTLDs = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'co', 'uk', 'de', 'jp', 'fr', 'au', 'us', 'ru', 'ch', 'it', 'nl',
    'se', 'no', 'es', 'mil', 'info', 'biz', 'name', 'io', 'app', 'dev',
    'ai', 'cloud', 'online', 'store', 'tech', 'site', 'space', 'live',
    'pro', 'tv', 'me', 'in', 'ca', 'mx', 'br', 'cn', 'za', 'sg', 'hk'
  ];
  
  if (!validTLDs.includes(tld)) {
    suggestions.push(`Did you mean .com instead of .${tld}?`);
  }
  
  // Check for common typos in popular domains
  const commonDomains = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmali.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'yahou.com': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmil.com': 'hotmail.com',
    'iclod.com': 'icloud.com',
    'icloud.co': 'icloud.com'
  };
  
  if (commonDomains[domain]) {
    suggestions.push(`Did you mean ${localPart}@${commonDomains[domain]}?`);
  }
  
  // Check for disposable email domains (partial list)
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com',
    'guerrillamail.com', 'mailinator.com', 'maildrop.cc',
    'temp-mail.org', 'trashmail.com', 'yopmail.com'
  ];
  
  if (disposableDomains.includes(domain)) {
    return {
      isValid: false,
      error: 'Please use a permanent email address. Temporary email addresses are not allowed'
    };
  }
  
  // Check for invalid characters
  if (/[^a-zA-Z0-9._%+-@]/.test(email)) {
    return {
      isValid: false,
      error: 'Email contains invalid characters'
    };
  }
  
  return {
    isValid: true,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'very-strong':
      return 'text-green-600 bg-green-100';
    case 'strong':
      return 'text-blue-600 bg-blue-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'weak':
    default:
      return 'text-red-600 bg-red-100';
  }
}

/**
 * Get password strength message
 */
export function getPasswordStrengthMessage(strength: string): string {
  switch (strength) {
    case 'very-strong':
      return 'Excellent password!';
    case 'strong':
      return 'Strong password';
    case 'medium':
      return 'Good, but could be stronger';
    case 'weak':
    default:
      return 'Weak password';
  }
}

/**
 * Generate password suggestions
 */
export function generatePasswordSuggestions(currentPassword: string): string[] {
  const suggestions: string[] = [];
  
  if (currentPassword.length < 8) {
    suggestions.push('Add more characters (minimum 8)');
  }
  
  if (!/[A-Z]/.test(currentPassword)) {
    suggestions.push('Add uppercase letters');
  }
  
  if (!/[a-z]/.test(currentPassword)) {
    suggestions.push('Add lowercase letters');
  }
  
  if (!/[0-9]/.test(currentPassword)) {
    suggestions.push('Add numbers');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(currentPassword)) {
    suggestions.push('Add special characters (!@#$%^&*)');
  }
  
  if (currentPassword.length < 12) {
    suggestions.push('Consider using 12+ characters for better security');
  }
  
  return suggestions;
}
