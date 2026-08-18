/**
 * Backend Address and Profile Validation Utilities
 * Validates delivery address payloads and profile update data.
 */

// Email regex requiring valid domain and TLD (at least 2 chars)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Indian mobile phone regex (10 digits, starts with 6, 7, 8, or 9)
export const PHONE_REGEX = /^[6-9]\d{9}$/;

// Indian 6-digit postal PIN code regex (does not start with 0)
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// City and State regex (letters, spaces, hyphens, dots, apostrophes; min 2 chars)
export const CITY_STATE_REGEX = /^[a-zA-Z\s.'-]{2,50}$/;

// Name regex (letters, spaces, dots, hyphens, min 2 chars)
export const NAME_REGEX = /^[a-zA-Z\s.'-]{2,50}$/;

/**
 * Normalizes a phone number by stripping spaces, hyphens, and +91/0 prefix.
 * @param {string} phone 
 * @returns {string} 10-digit phone string
 */
export const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Validates a delivery address payload for order placement.
 * @param {Object} address 
 * @returns {{ isValid: boolean, errors: Object.<string, string>, message?: string }}
 */
export const validateAddressPayload = (address) => {
  const errors = {};

  if (!address || typeof address !== 'object') {
    return {
      isValid: false,
      errors: { form: 'Delivery address details are required.' },
      message: 'Delivery address details are required.'
    };
  }

  // 1. First Name
  const firstName = (address.firstName || '').trim();
  if (!firstName) {
    errors.firstName = 'First name is required.';
  } else if (firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters.';
  } else if (!NAME_REGEX.test(firstName)) {
    errors.firstName = 'First name can only contain letters, spaces, and hyphens.';
  }

  // 2. Last Name
  const lastName = (address.lastName || '').trim();
  if (!lastName) {
    errors.lastName = 'Last name is required.';
  } else if (lastName.length < 1) {
    errors.lastName = 'Last name is required.';
  } else if (!NAME_REGEX.test(lastName)) {
    errors.lastName = 'Last name can only contain letters, spaces, and hyphens.';
  }

  // 3. Email
  const email = (address.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email) || email.length > 100) {
    errors.email = 'Please enter a valid email address (e.g. name@example.com).';
  }

  // 4. Phone
  const rawPhone = (address.phone || '').trim();
  const cleanedPhone = normalizePhone(rawPhone);
  if (!rawPhone) {
    errors.phone = 'Mobile number is required.';
  } else if (!PHONE_REGEX.test(cleanedPhone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
  }

  // 5. Street Address
  const street = (address.street || '').trim();
  if (!street) {
    errors.street = 'Street address is required.';
  } else if (street.length < 5) {
    errors.street = 'Street address must be at least 5 characters (e.g. flat, building, road).';
  }

  // 6. City
  const city = (address.city || '').trim();
  if (!city) {
    errors.city = 'City is required.';
  } else if (!CITY_STATE_REGEX.test(city)) {
    errors.city = 'Please enter a valid city name (letters only, min 2 characters).';
  }

  // 7. State
  const state = (address.state || '').trim();
  if (!state) {
    errors.state = 'State is required.';
  } else if (!CITY_STATE_REGEX.test(state)) {
    errors.state = 'Please enter a valid state name (letters only, min 2 characters).';
  }

  // 8. ZIP / PIN Code
  const zipCode = (address.zipCode || address.zip_code || '').trim();
  if (!zipCode) {
    errors.zipCode = 'PIN code is required.';
  } else if (!PINCODE_REGEX.test(zipCode)) {
    errors.zipCode = 'Please enter a valid 6-digit Indian PIN code (e.g. 221001).';
  }

  const isValid = Object.keys(errors).length === 0;
  const firstErrorMsg = Object.values(errors)[0];

  return {
    isValid,
    errors,
    message: firstErrorMsg
  };
};

/**
 * Validates user profile update payload.
 * @param {Object} data 
 * @returns {{ isValid: boolean, errors: Object.<string, string>, message?: string }}
 */
export const validateProfilePayload = (data) => {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { form: 'Profile data is required.' },
      message: 'Profile data is required.'
    };
  }

  // Name / First Name validation
  const firstName = (data.firstName || data.first_name || '').trim();
  const lastName = (data.lastName || data.last_name || '').trim();
  const name = (data.name || '').trim();

  if (firstName) {
    if (firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    } else if (!NAME_REGEX.test(firstName)) {
      errors.firstName = 'First name can only contain letters, spaces, and hyphens.';
    }
  }

  if (lastName) {
    if (!NAME_REGEX.test(lastName)) {
      errors.lastName = 'Last name can only contain letters, spaces, and hyphens.';
    }
  }

  if (!firstName && !name) {
    errors.name = 'Full name is required.';
  }

  // Phone validation (if provided)
  if (data.phone && data.phone.trim()) {
    const cleanedPhone = normalizePhone(data.phone.trim());
    if (!PHONE_REGEX.test(cleanedPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }
  }

  // PIN Code validation (if provided)
  const zipCode = (data.zipCode || data.zip_code || '').trim();
  if (zipCode && !PINCODE_REGEX.test(zipCode)) {
    errors.zipCode = 'Please enter a valid 6-digit Indian PIN code (e.g. 221001).';
  }

  // City validation (if provided)
  const city = (data.city || '').trim();
  if (city && !CITY_STATE_REGEX.test(city)) {
    errors.city = 'Please enter a valid city name (letters only, min 2 characters).';
  }

  // State validation (if provided)
  const state = (data.state || '').trim();
  if (state && !CITY_STATE_REGEX.test(state)) {
    errors.state = 'Please enter a valid state name (letters only, min 2 characters).';
  }

  // Street validation (if provided)
  const street = (data.street || '').trim();
  if (street && street.length < 5) {
    errors.street = 'Street address must be at least 5 characters.';
  }

  const isValid = Object.keys(errors).length === 0;
  const firstErrorMsg = Object.values(errors)[0];

  return {
    isValid,
    errors,
    message: firstErrorMsg
  };
};
