/**
 * Frontend Address and Form Validation Utilities
 * Unifies validation rules for Checkout and Customer Profile.
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
 * Validates a single field value.
 * @param {string} fieldName 
 * @param {string} value 
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (fieldName, value) => {
  const val = (value || '').trim();

  switch (fieldName) {
    case 'firstName':
      if (!val) return 'First name is required.';
      if (val.length < 2) return 'First name must be at least 2 characters.';
      if (!NAME_REGEX.test(val)) return 'First name can only contain letters, spaces, and hyphens.';
      return null;

    case 'lastName':
      if (!val) return 'Last name is required.';
      if (!NAME_REGEX.test(val)) return 'Last name can only contain letters, spaces, and hyphens.';
      return null;

    case 'name':
      if (!val) return 'Full name is required.';
      if (val.length < 2) return 'Name must be at least 2 characters.';
      if (!NAME_REGEX.test(val)) return 'Name can only contain letters, spaces, and hyphens.';
      return null;

    case 'email':
      if (!val) return 'Email address is required.';
      if (!EMAIL_REGEX.test(val) || val.length > 100) return 'Please enter a valid email address (e.g. name@example.com).';
      return null;

    case 'phone': {
      if (!val) return 'Mobile number is required.';
      const cleaned = normalizePhone(val);
      if (!PHONE_REGEX.test(cleaned)) {
        return 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
      }
      return null;
    }

    case 'street':
      if (!val) return 'Street address is required.';
      if (val.length < 5) return 'Street address must be at least 5 characters (e.g. Flat/Door no., building, road).';
      return null;

    case 'city':
      if (!val) return 'City is required.';
      if (!CITY_STATE_REGEX.test(val)) return 'Please enter a valid city name (letters only, min 2 characters).';
      return null;

    case 'state':
      if (!val) return 'State is required.';
      if (!CITY_STATE_REGEX.test(val)) return 'Please enter a valid state name (letters only, min 2 characters).';
      return null;

    case 'zipCode':
    case 'zip_code':
    case 'pincode':
      if (!val) return 'PIN code is required.';
      if (!PINCODE_REGEX.test(val)) return 'Please enter a valid 6-digit Indian PIN code (e.g. 221001).';
      return null;

    default:
      return null;
  }
};

/**
 * Validates the complete delivery address form.
 * @param {Object} data 
 * @returns {{ isValid: boolean, errors: Object.<string, string> }}
 */
export const validateAddressForm = (data) => {
  const errors = {};
  const fields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'zipCode'];

  fields.forEach(field => {
    const error = validateField(field, data[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Offline Indian PIN code prefix cache for fast fallback lookup.
 */
const PIN_PREFIX_CACHE = {
  '11': { city: 'New Delhi', state: 'Delhi' },
  '12': { city: 'Faridabad / Gurgaon', state: 'Haryana' },
  '13': { city: 'Ambala / Panipat', state: 'Haryana' },
  '14': { city: 'Ludhiana / Jalandhar', state: 'Punjab' },
  '15': { city: 'Bathinda', state: 'Punjab' },
  '16': { city: 'Chandigarh', state: 'Chandigarh' },
  '17': { city: 'Shimla', state: 'Himachal Pradesh' },
  '18': { city: 'Jammu', state: 'Jammu & Kashmir' },
  '19': { city: 'Srinagar', state: 'Jammu & Kashmir' },
  '20': { city: 'Aligarh / Ghaziabad', state: 'Uttar Pradesh' },
  '21': { city: 'Prayagraj / Fatehpur', state: 'Uttar Pradesh' },
  '22': { city: 'Varanasi / Lucknow', state: 'Uttar Pradesh' },
  '23': { city: 'Mirzapur', state: 'Uttar Pradesh' },
  '24': { city: 'Dehradun / Bareilly', state: 'Uttarakhand' },
  '25': { city: 'Meerut', state: 'Uttar Pradesh' },
  '26': { city: 'Bareilly / Haldwani', state: 'Uttarakhand' },
  '27': { city: 'Gorakhpur', state: 'Uttar Pradesh' },
  '28': { city: 'Jhansi / Agra', state: 'Uttar Pradesh' },
  '30': { city: 'Jaipur', state: 'Rajasthan' },
  '31': { city: 'Udaipur', state: 'Rajasthan' },
  '32': { city: 'Kota', state: 'Rajasthan' },
  '33': { city: 'Bikaner', state: 'Rajasthan' },
  '34': { city: 'Jodhpur', state: 'Rajasthan' },
  '36': { city: 'Rajkot', state: 'Gujarat' },
  '37': { city: 'Jamnagar', state: 'Gujarat' },
  '38': { city: 'Ahmedabad', state: 'Gujarat' },
  '39': { city: 'Surat / Vadodara', state: 'Gujarat' },
  '40': { city: 'Mumbai', state: 'Maharashtra' },
  '41': { city: 'Pune', state: 'Maharashtra' },
  '42': { city: 'Nashik', state: 'Maharashtra' },
  '43': { city: 'Aurangabad', state: 'Maharashtra' },
  '44': { city: 'Nagpur', state: 'Maharashtra' },
  '45': { city: 'Indore', state: 'Madhya Pradesh' },
  '46': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '47': { city: 'Gwalior', state: 'Madhya Pradesh' },
  '48': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  '49': { city: 'Raipur', state: 'Chhattisgarh' },
  '50': { city: 'Hyderabad', state: 'Telangana' },
  '51': { city: 'Tirupati / Kadapa', state: 'Andhra Pradesh' },
  '52': { city: 'Vijayawada / Guntur', state: 'Andhra Pradesh' },
  '53': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '56': { city: 'Bengaluru', state: 'Karnataka' },
  '57': { city: 'Mangalore / Mysuru', state: 'Karnataka' },
  '58': { city: 'Hubballi / Belagavi', state: 'Karnataka' },
  '59': { city: 'Belagavi', state: 'Karnataka' },
  '60': { city: 'Chennai', state: 'Tamil Nadu' },
  '61': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '62': { city: 'Madurai', state: 'Tamil Nadu' },
  '63': { city: 'Vellore / Salem', state: 'Tamil Nadu' },
  '64': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '67': { city: 'Kozhikode', state: 'Kerala' },
  '68': { city: 'Kochi / Ernakulam', state: 'Kerala' },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '70': { city: 'Kolkata', state: 'West Bengal' },
  '71': { city: 'Howrah', state: 'West Bengal' },
  '72': { city: 'Midnapore', state: 'West Bengal' },
  '73': { city: 'Siliguri', state: 'West Bengal' },
  '74': { city: 'North 24 Parganas', state: 'West Bengal' },
  '75': { city: 'Bhubaneswar / Cuttack', state: 'Odisha' },
  '76': { city: 'Rourkela', state: 'Odisha' },
  '78': { city: 'Guwahati', state: 'Assam' },
  '79': { city: 'Shillong / Agartala', state: 'Meghalaya' },
  '80': { city: 'Patna', state: 'Bihar' },
  '81': { city: 'Bhagalpur', state: 'Bihar' },
  '82': { city: 'Gaya / Muzaffarpur', state: 'Bihar' },
  '83': { city: 'Ranchi', state: 'Jharkhand' },
  '84': { city: 'Muzaffarpur', state: 'Bihar' },
  '85': { city: 'Purnia', state: 'Bihar' }
};

/**
 * Fetches City (District) and State for a given 6-digit Indian PIN code.
 * Uses the free public Indian Postal PIN Code API with offline prefix fallback.
 * @param {string} pincode 
 * @returns {Promise<{ success: boolean, city?: string, state?: string, error?: string }>}
 */
export const fetchPincodeDetails = async (pincode) => {
  const pin = (pincode || '').trim();
  if (!PINCODE_REGEX.test(pin)) {
    return { success: false, error: 'Please enter a valid 6-digit PIN code.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Block || po.Circle || '';
        const state = po.State || '';

        if (city || state) {
          return { success: true, city, state };
        }
      }
    }
  } catch (err) {
    // Network or timeout failure; proceed to fallback
  }

  // Offline Fallback
  const prefix = pin.substring(0, 2);
  const fallback = PIN_PREFIX_CACHE[prefix];
  if (fallback) {
    return { success: true, city: fallback.city, state: fallback.state, isFallback: true };
  }

  return { success: false, error: 'Could not auto-detect city/state for this PIN code.' };
};
