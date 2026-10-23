import { describe, expect, it } from 'vitest';
import {
  convertPriceRangeString,
  formatDualPrice,
  formatInrAmount,
  getDestinationCurrency,
} from './currency';

describe('currency utilities', () => {
  it('identifies destination currencies correctly', () => {
    expect(getDestinationCurrency('Kyoto, Japan').code).toBe('JPY');
    expect(getDestinationCurrency('Bali, Indonesia').code).toBe('IDR');
    expect(getDestinationCurrency('Paris, France').code).toBe('EUR');
    expect(getDestinationCurrency('London, UK').code).toBe('GBP');
    expect(getDestinationCurrency('Goa, India').code).toBe('INR');
    expect(getDestinationCurrency('Unknown city').code).toBe('USD');
  });

  it('formats amounts into INR accurately', () => {
    expect(formatInrAmount(100)).toBe('₹9,490');
    expect(formatInrAmount(0)).toBe('₹0');
  });

  it('produces dual INR and local currency prices', () => {
    const kyotoPrice = formatDualPrice(100, 'Japan');
    expect(kyotoPrice.inr).toBe('₹9,490');
    expect(kyotoPrice.local).toContain('JPY');
    expect(kyotoPrice.dual).toBe('₹9,490 (¥15,500 JPY)');
  });

  it('converts price ranges with night/day suffixes', () => {
    const range = convertPriceRangeString('$120–180/night', 'Japan');
    expect(range.inr).toContain('₹11,388');
    expect(range.inr).toContain('17,082/night');
    expect(range.local).toContain('JPY/night');
    expect(range.dual).toContain('(¥18,600–27,900 JPY/night)');
  });
});
