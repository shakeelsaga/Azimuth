export interface CurrencyInfo {
  code: string;
  symbol: string;
  rateAgainstUSD: number;
  name: string;
}

export const USD_TO_INR = 94.90;

// Country / Destination mapping to local currency and conversion rate per 1 USD
const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  japan: { code: 'JPY', symbol: '¥', rateAgainstUSD: 155, name: 'Japanese Yen' },
  kyoto: { code: 'JPY', symbol: '¥', rateAgainstUSD: 155, name: 'Japanese Yen' },
  tokyo: { code: 'JPY', symbol: '¥', rateAgainstUSD: 155, name: 'Japanese Yen' },
  osaka: { code: 'JPY', symbol: '¥', rateAgainstUSD: 155, name: 'Japanese Yen' },
  indonesia: { code: 'IDR', symbol: 'Rp', rateAgainstUSD: 16_250, name: 'Indonesian Rupiah' },
  bali: { code: 'IDR', symbol: 'Rp', rateAgainstUSD: 16_250, name: 'Indonesian Rupiah' },
  thailand: { code: 'THB', symbol: '฿', rateAgainstUSD: 36.8, name: 'Thai Baht' },
  bangkok: { code: 'THB', symbol: '฿', rateAgainstUSD: 36.8, name: 'Thai Baht' },
  france: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  paris: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  italy: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  rome: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  spain: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  germany: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  netherlands: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  greece: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  portugal: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  austria: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.93, name: 'Euro' },
  'united kingdom': { code: 'GBP', symbol: '£', rateAgainstUSD: 0.79, name: 'British Pound' },
  uk: { code: 'GBP', symbol: '£', rateAgainstUSD: 0.79, name: 'British Pound' },
  london: { code: 'GBP', symbol: '£', rateAgainstUSD: 0.79, name: 'British Pound' },
  scotland: { code: 'GBP', symbol: '£', rateAgainstUSD: 0.79, name: 'British Pound' },
  'united arab emirates': { code: 'AED', symbol: 'AED', rateAgainstUSD: 3.67, name: 'UAE Dirham' },
  uae: { code: 'AED', symbol: 'AED', rateAgainstUSD: 3.67, name: 'UAE Dirham' },
  dubai: { code: 'AED', symbol: 'AED', rateAgainstUSD: 3.67, name: 'UAE Dirham' },
  singapore: { code: 'SGD', symbol: 'S$', rateAgainstUSD: 1.35, name: 'Singapore Dollar' },
  australia: { code: 'AUD', symbol: 'A$', rateAgainstUSD: 1.55, name: 'Australian Dollar' },
  canada: { code: 'CAD', symbol: 'C$', rateAgainstUSD: 1.39, name: 'Canadian Dollar' },
  'south korea': { code: 'KRW', symbol: '₩', rateAgainstUSD: 1_390, name: 'South Korean Won' },
  korea: { code: 'KRW', symbol: '₩', rateAgainstUSD: 1_390, name: 'South Korean Won' },
  seoul: { code: 'KRW', symbol: '₩', rateAgainstUSD: 1_390, name: 'South Korean Won' },
  vietnam: { code: 'VND', symbol: '₫', rateAgainstUSD: 25_450, name: 'Vietnamese Dong' },
  turkey: { code: 'TRY', symbol: '₺', rateAgainstUSD: 34.5, name: 'Turkish Lira' },
  switzerland: { code: 'CHF', symbol: 'CHF', rateAgainstUSD: 0.90, name: 'Swiss Franc' },
  india: { code: 'INR', symbol: '₹', rateAgainstUSD: 94.90, name: 'Indian Rupee' },
  'united states': { code: 'USD', symbol: '$', rateAgainstUSD: 1.0, name: 'US Dollar' },
  usa: { code: 'USD', symbol: '$', rateAgainstUSD: 1.0, name: 'US Dollar' },
};

export function getDestinationCurrency(countryOrDestination?: string): CurrencyInfo {
  if (!countryOrDestination) {
    return { code: 'USD', symbol: '$', rateAgainstUSD: 1.0, name: 'US Dollar' };
  }

  const normalized = countryOrDestination.toLowerCase().trim();

  for (const [key, info] of Object.entries(CURRENCY_MAP)) {
    if (normalized.includes(key)) {
      return info;
    }
  }

  return { code: 'USD', symbol: '$', rateAgainstUSD: 1.0, name: 'US Dollar' };
}

export function formatInrAmount(usd: number): string {
  const inr = Math.round(usd * USD_TO_INR);
  return `₹${inr.toLocaleString('en-IN')}`;
}

export function formatLocalAmount(usd: number, currency: CurrencyInfo): string {
  const localVal = Math.round(usd * currency.rateAgainstUSD);
  if (currency.code === 'IDR' || currency.code === 'VND' || currency.code === 'KRW') {
    return `${currency.symbol} ${localVal.toLocaleString('en-US')}`;
  }
  return `${currency.symbol}${localVal.toLocaleString('en-US')}`;
}

export function formatDualPrice(
  usd: number,
  countryOrDestination?: string,
): { inr: string; local: string; dual: string; localCode: string; localSymbol: string } {
  const currency = getDestinationCurrency(countryOrDestination);
  const inr = formatInrAmount(usd);
  const local = formatLocalAmount(usd, currency);

  if (currency.code === 'INR') {
    return { inr, local: inr, dual: inr, localCode: 'INR', localSymbol: '₹' };
  }

  return {
    inr,
    local: `${local} ${currency.code}`,
    dual: `${inr} (${local} ${currency.code})`,
    localCode: currency.code,
    localSymbol: currency.symbol,
  };
}

/**
 * Converts price strings like "$120-150/night" or "$40/day" or "$250–400/night" into INR and local currency
 */
export function convertPriceRangeString(
  priceRangeStr: string | undefined,
  countryOrDestination?: string,
): { inr: string; local: string; dual: string } {
  if (!priceRangeStr) {
    return { inr: '₹0', local: '', dual: '₹0' };
  }

  const currency = getDestinationCurrency(countryOrDestination);

  // Extract all numbers from range string
  const numbers = priceRangeStr.match(/\d+(?:,\d+)?/g);
  if (!numbers || numbers.length === 0) {
    return { inr: priceRangeStr, local: priceRangeStr, dual: priceRangeStr };
  }

  const suffixMatch = priceRangeStr.match(/(\/[a-zA-Z]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : '';

  const rawInrNumbers = numbers.map((n) => Math.round(parseFloat(n.replace(/,/g, '')) * USD_TO_INR));
  const rawLocalNumbers = numbers.map((n) => Math.round(parseFloat(n.replace(/,/g, '')) * currency.rateAgainstUSD));

  const inrRange = `₹${rawInrNumbers.map((v) => v.toLocaleString('en-IN')).join('–')}${suffix}`;
  const localRange = `${currency.symbol}${rawLocalNumbers.map((v) => v.toLocaleString('en-US')).join('–')}${
    currency.code !== 'USD' ? ` ${currency.code}` : ''
  }${suffix}`;

  if (currency.code === 'INR') {
    return { inr: inrRange, local: inrRange, dual: inrRange };
  }

  return {
    inr: inrRange,
    local: localRange,
    dual: `${inrRange} (${localRange})`,
  };
}
