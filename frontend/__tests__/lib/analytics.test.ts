describe('analytics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getVariant', () => {
    it('returns treatment when NEXT_PUBLIC_SYMBOLIC_FEATURE is true', () => {
      process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE = 'true';
      const { getVariant } = require('@/lib/analytics');
      expect(getVariant('symbolic_verify')).toBe('treatment');
    });

    it('returns control when NEXT_PUBLIC_SYMBOLIC_FEATURE is not true', () => {
      process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE = 'false';
      const { getVariant } = require('@/lib/analytics');
      expect(getVariant('symbolic_verify')).toBe('control');
    });

    it('returns control when NEXT_PUBLIC_SYMBOLIC_FEATURE is undefined', () => {
      delete process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE;
      const { getVariant } = require('@/lib/analytics');
      expect(getVariant('symbolic_verify')).toBe('control');
    });

    it('returns control for unknown experiments', () => {
      const { getVariant } = require('@/lib/analytics');
      expect(getVariant('unknown_experiment')).toBe('control');
    });
  });

  describe('track', () => {
    it('logs to console in development', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { track } = require('@/lib/analytics');

      track({ event: 'symbolic_verify_click', herbId: 'h1' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'symbolic_verify_click',
        expect.objectContaining({ event: 'symbolic_verify_click', herbId: 'h1' })
      );
      consoleSpy.mockRestore();
    });

    it('does not log in production', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { track } = require('@/lib/analytics');

      track({ event: 'symbolic_verify_click', herbId: 'h1' });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
