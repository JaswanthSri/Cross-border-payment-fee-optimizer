// A map to correct inconsistent currency codes from the data source
const currencyCodeMap: { [key: string]: string } = {
  // Common Mappings from World Bank Data
  USA: "USD",
  IND: "INR",
  GBR: "GBP",
  AUS: "AUD",
  CAN: "CAD",
  DEU: "EUR", // Germany
  FRA: "EUR", // France
  ITA: "EUR", // Italy
  ESP: "EUR", // Spain
  JPN: "JPY",
  MEX: "MXN",
  NGA: "NGN",
  PHL: "PHP",
  PAK: "PKR",
  BGD: "BDT",
  BRA: "BRL",
  CHN: "CNY",
  ZAF: "ZAR", // South Africa
  KOR: "KRW", // South Korea
  RUS: "RUB",
  SAU: "SAR", // Saudi Arabia
  ARE: "AED", // UAE
  CHE: "CHF", // Switzerland
  SGP: "SGD", // Singapore
  HKG: "HKD", // Hong Kong
  NZL: "NZD", // New Zealand
  KEN: "KES",

  // Add any other mappings you find are needed
};

/**
 * Standardizes a currency code.
 * @param code The currency code from the API (e.g., "USA" or "USD")
 * @returns The standardized 3-letter currency code (e.g., "USD")
 */
export const getStandardCurrencyCode = (code: string): string => {
  return currencyCodeMap[code] || code;
};
