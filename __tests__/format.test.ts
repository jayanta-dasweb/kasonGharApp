import { formatINR, indianFYLabel, phoneToAuthEmail } from '../lib/format';

describe('format helpers', () => {
  it('formats INR with en-IN', () => {
    const out = formatINR(12500.5);
    expect(out).toContain('₹');
    expect(out.replace(/,/g, '')).toMatch(/12500/);
  });

  it('builds auth email alias', () => {
    expect(phoneToAuthEmail(' 7002911685 ')).toBe('7002911685@kasonghar.local');
  });

  it('returns Indian FY label shape', () => {
    const label = indianFYLabel(new Date('2025-06-01'));
    expect(label).toBe('2025-26');
  });
});
