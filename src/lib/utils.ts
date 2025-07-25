import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// export const getRedirectUrl = () => {
//   const isProd = import.meta.env.PROD;
//   // Make sure we're redirecting to the right domain in production
//   const prodUrl = 'https://datapulsify.com';
//   // Use the correct port for local development
//   const devUrl = window.location.port ? 
//     `${window.location.protocol}//${window.location.hostname}:${window.location.port}` : 
//     `${window.location.protocol}//${window.location.hostname}`;
  
//   console.log('Redirect URL:', isProd ? prodUrl : devUrl);
//   return isProd ? prodUrl : devUrl;
// };

export const getGoogleRedirectUrl = () => {
  // Always use the environment variable for Google OAuth redirect
  const googleRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  if (googleRedirectUri) {
    // If we have a configured redirect URI, use it
    return new URL(googleRedirectUri).origin;
  }

  // Fallback to dynamic URL based on environment
  const isDev = import.meta.env.VITE_APP_ENV === 'development';
  return isDev ? 'http://localhost:8081' : 'https://datapulsify.com';
};

export const getSupabaseRedirectUrl = () => {
  // For Supabase auth, we want to use the current origin
  const isDev = import.meta.env.VITE_APP_ENV === 'development';
  return isDev ? 'http://localhost:8081' : 'https://datapulsify.com';
};

export function formatGSCPropertyUrl(gscProperty: string): string {
  if (!gscProperty) return '';
  
  // Remove any trailing slashes
  const cleanProperty = gscProperty.replace(/\/+$/, '');
  
  // If it already starts with http:// or https://, return as is
  if (/^https?:\/\//i.test(cleanProperty)) {
    return cleanProperty;
  }
  
  // Add https:// prefix
  return `https://${cleanProperty}`;
}

export const countryCodeToName: { [key: string]: string } = {
  'AFG': 'Afghanistan',
  'AGO': 'Angola',
  'AIA': 'Anguilla',
  'ALB': 'Albania',
  'AND': 'Andorra',
  'ARE': 'United Arab Emirates',
  'ARG': 'Argentina',
  'ARM': 'Armenia',
  'AUS': 'Australia',
  'AUT': 'Austria',
  'AZE': 'Azerbaijan',
  'BDI': 'Burundi',
  'BEL': 'Belgium',
  'BEN': 'Benin',
  'BFA': 'Burkina Faso',
  'BGD': 'Bangladesh',
  'BGR': 'Bulgaria',
  'BHR': 'Bahrain',
  'BHS': 'Bahamas',
  'BIH': 'Bosnia & Herzegovina',
  'BLR': 'Belarus',
  'BLZ': 'Belize',
  'BOL': 'Bolivia',
  'BRA': 'Brazil',
  'BRB': 'Barbados',
  'BRN': 'Brunei',
  'BWA': 'Botswana',
  'CAF': 'Central African Republic',
  'CAN': 'Canada',
  'CHE': 'Switzerland',
  'CHL': 'Chile',
  'CHN': 'China',
  'CIV': 'Côte d\'Ivoire',
  'CMR': 'Cameroon',
  'COD': 'Congo - Kinshasa',
  'COG': 'Congo - Brazzaville',
  'COL': 'Colombia',
  'CRI': 'Costa Rica',
  'CUB': 'Cuba',
  'CUW': 'Curaçao',
  'CYM': 'Cayman Islands',
  'CYP': 'Cyprus',
  'CZE': 'Czechia',
  'DEU': 'Germany',
  'DJI': 'Djibouti',
  'DMA': 'Dominica',
  'DNK': 'Denmark',
  'DOM': 'Dominican Republic',
  'DZA': 'Algeria',
  'ECU': 'Ecuador',
  'EGY': 'Egypt',
  'ERI': 'Eritrea',
  'ESP': 'Spain',
  'EST': 'Estonia',
  'ETH': 'Ethiopia',
  'FIN': 'Finland',
  'FJI': 'Fiji',
  'FRA': 'France',
  'GAB': 'Gabon',
  'GBR': 'United Kingdom',
  'GEO': 'Georgia',
  'GHA': 'Ghana',
  'GIB': 'Gibraltar',
  'GIN': 'Guinea',
  'GMB': 'Gambia',
  'GRC': 'Greece',
  'GRD': 'Grenada',
  'GTM': 'Guatemala',
  'GUM': 'Guam',
  'GUY': 'Guyana',
  'HKG': 'Hong Kong',
  'HND': 'Honduras',
  'HRV': 'Croatia',
  'HTI': 'Haiti',
  'HUN': 'Hungary',
  'IDN': 'Indonesia',
  'IND': 'India',
  'IRL': 'Ireland',
  'IRN': 'Iran',
  'IRQ': 'Iraq',
  'ISL': 'Iceland',
  'ISR': 'Israel',
  'ITA': 'Italy',
  'JAM': 'Jamaica',
  'JOR': 'Jordan',
  'JPN': 'Japan',
  'KAZ': 'Kazakhstan',
  'KEN': 'Kenya',
  'KGZ': 'Kyrgyzstan',
  'KHM': 'Cambodia',
  'KOR': 'South Korea',
  'KWT': 'Kuwait',
  'LAO': 'Laos',
  'LBN': 'Lebanon',
  'LBR': 'Liberia',
  'LBY': 'Libya',
  'LKA': 'Sri Lanka',
  'LSO': 'Lesotho',
  'LTU': 'Lithuania',
  'LUX': 'Luxembourg',
  'LVA': 'Latvia',
  'MAC': 'Macao',
  'MAR': 'Morocco',
  'MCO': 'Monaco',
  'MDA': 'Moldova',
  'MDG': 'Madagascar',
  'MDV': 'Maldives',
  'MEX': 'Mexico',
  'MKD': 'North Macedonia',
  'MLI': 'Mali',
  'MLT': 'Malta',
  'MMR': 'Myanmar (Burma)',
  'MNG': 'Mongolia',
  'MOZ': 'Mozambique',
  'MRT': 'Mauritania',
  'MUS': 'Mauritius',
  'MWI': 'Malawi',
  'MYS': 'Malaysia',
  'NAM': 'Namibia',
  'NER': 'Niger',
  'NGA': 'Nigeria',
  'NIC': 'Nicaragua',
  'NLD': 'Netherlands',
  'NOR': 'Norway',
  'NPL': 'Nepal',
  'NZL': 'New Zealand',
  'OMN': 'Oman',
  'PAK': 'Pakistan',
  'PAN': 'Panama',
  'PER': 'Peru',
  'PHL': 'Philippines',
  'PNG': 'Papua New Guinea',
  'POL': 'Poland',
  'PRI': 'Puerto Rico',
  'PRT': 'Portugal',
  'PRY': 'Paraguay',
  'PSE': 'Palestine',
  'QAT': 'Qatar',
  'ROU': 'Romania',
  'RUS': 'Russia',
  'RWA': 'Rwanda',
  'SAU': 'Saudi Arabia',
  'SDN': 'Sudan',
  'SEN': 'Senegal',
  'SGP': 'Singapore',
  'SLB': 'Solomon Islands',
  'SLE': 'Sierra Leone',
  'SLV': 'El Salvador',
  'SOM': 'Somalia',
  'SRB': 'Serbia',
  'SSD': 'South Sudan',
  'SVK': 'Slovakia',
  'SVN': 'Slovenia',
  'SWE': 'Sweden',
  'SWZ': 'Eswatini',
  'SYC': 'Seychelles',
  'SYR': 'Syria',
  'TCD': 'Chad',
  'TGO': 'Togo',
  'THA': 'Thailand',
  'TJK': 'Tajikistan',
  'TKM': 'Turkmenistan',
  'TLS': 'Timor-Leste',
  'TON': 'Tonga',
  'TTO': 'Trinidad & Tobago',
  'TUN': 'Tunisia',
  'TUR': 'Turkey',
  'TWN': 'Taiwan',
  'TZA': 'Tanzania',
  'UGA': 'Uganda',
  'UKR': 'Ukraine',
  'URY': 'Uruguay',
  'USA': 'United States',
  'UZB': 'Uzbekistan',
  'VEN': 'Venezuela',
  'VNM': 'Vietnam',
  'VUT': 'Vanuatu',
  'WSM': 'Samoa',
  'YEM': 'Yemen',
  'ZAF': 'South Africa',
  'ZMB': 'Zambia',
  'ZWE': 'Zimbabwe'
};

/**
 * Converts a country code to its full name
 * @param code The 3-letter ISO country code
 * @returns The full country name or the original code if not found
 */
export function getCountryName(code: string): string {
  if (!code) return code;
  const upperCode = code.toUpperCase();
  return countryCodeToName[upperCode] || upperCode;
}
