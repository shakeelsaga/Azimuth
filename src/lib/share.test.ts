import { describe, expect, it } from 'vitest';
import { encodeTripToURL, decodeTripFromURL } from '@/lib/share';
import { kyotoTrip } from '@/lib/demo-trips';

describe('share utility', () => {
  it('encodes and decodes a trip plan preserving all fields', () => {
    const encoded = encodeTripToURL(kyotoTrip);
    expect(encoded).toContain('?trip=');

    const param = new URL(encoded).searchParams.get('trip');
    expect(param).toBeTruthy();

    const decoded = decodeTripFromURL(param!);
    expect(decoded).not.toBeNull();
    expect(decoded?.destination).toBe(kyotoTrip.destination);
    expect(decoded?.days).toHaveLength(kyotoTrip.days.length);
    expect(decoded?.days[0].stops[0].title).toBe(kyotoTrip.days[0].stops[0].title);
  });

  it('gracefully returns null for corrupt or invalid trip strings', () => {
    expect(decodeTripFromURL('not-a-valid-lz-string')).toBeNull();
    expect(decodeTripFromURL('')).toBeNull();
  });
});
