import { describe, expect, it } from 'vitest';

import { eastJavaTrip, kyotoTrip } from '@/lib/demo-trips';
import { TripPlanSchema } from '@/lib/schemas';

describe('demo trips', () => {
  it('keeps the Kyoto fallback schema-valid and complete', () => {
    expect(() => TripPlanSchema.parse(kyotoTrip)).not.toThrow();
    expect(kyotoTrip.days).toHaveLength(3);
  });

  it('keeps the East Java and Bali fallback schema-valid and complete', () => {
    expect(() => TripPlanSchema.parse(eastJavaTrip)).not.toThrow();
    expect(eastJavaTrip.days).toHaveLength(4);
  });
});
