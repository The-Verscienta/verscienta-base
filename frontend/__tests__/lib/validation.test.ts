import {
  loginSchema,
  registerSchema,
  reviewSchema,
  contactFormSchema,
  symptomAnalysisSchema,
  validateData,
  formatZodErrors,
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({ username: 'testuser', password: 'pass123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty username', () => {
      const result = loginSchema.safeParse({ username: '', password: 'pass123' });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ username: 'testuser', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const validData = {
      username: 'newuser',
      email: 'user@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects short username', () => {
      const result = registerSchema.safeParse({ ...validData, username: 'ab' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects weak password (no uppercase)', () => {
      const result = registerSchema.safeParse({ ...validData, password: 'password1', confirmPassword: 'password1' });
      expect(result.success).toBe(false);
    });

    it('rejects weak password (no number)', () => {
      const result = registerSchema.safeParse({ ...validData, password: 'Password', confirmPassword: 'Password' });
      expect(result.success).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({ ...validData, confirmPassword: 'Different1' });
      expect(result.success).toBe(false);
    });

    it('rejects username with special characters', () => {
      const result = registerSchema.safeParse({ ...validData, username: 'user@name' });
      expect(result.success).toBe(false);
    });
  });

  describe('reviewSchema', () => {
    it('accepts valid review', () => {
      const result = reviewSchema.safeParse({
        rating: 4,
        comment: 'This is a great herb for stress relief.',
        reviewedEntityType: 'herb',
        reviewedEntityId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects rating below 1', () => {
      const result = reviewSchema.safeParse({
        rating: 0,
        comment: 'Short but valid review text here.',
        reviewedEntityType: 'herb',
        reviewedEntityId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('rejects rating above 5', () => {
      const result = reviewSchema.safeParse({
        rating: 6,
        comment: 'Short but valid review text here.',
        reviewedEntityType: 'herb',
        reviewedEntityId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short comment', () => {
      const result = reviewSchema.safeParse({
        rating: 5,
        comment: 'Short',
        reviewedEntityType: 'herb',
        reviewedEntityId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid entity type', () => {
      const result = reviewSchema.safeParse({
        rating: 5,
        comment: 'This is a valid review comment.',
        reviewedEntityType: 'invalid',
        reviewedEntityId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('contactFormSchema', () => {
    it('accepts valid contact form', () => {
      const result = contactFormSchema.safeParse({
        name: 'Jane',
        email: 'jane@example.com',
        subject: 'Question',
        message: 'Hello, I have a question about herbs.',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short message', () => {
      const result = contactFormSchema.safeParse({
        name: 'Jane',
        email: 'jane@example.com',
        subject: 'Q',
        message: 'Hi',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('symptomAnalysisSchema', () => {
    it('accepts valid symptoms', () => {
      const result = symptomAnalysisSchema.safeParse({
        symptoms: 'I have been experiencing headaches and fatigue for the past week.',
      });
      expect(result.success).toBe(true);
    });

    it('accepts symptoms with context', () => {
      const result = symptomAnalysisSchema.safeParse({
        symptoms: 'I have been experiencing headaches and fatigue for the past week.',
        context: { age: 35, gender: 'female' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects short symptoms', () => {
      const result = symptomAnalysisSchema.safeParse({ symptoms: 'headache' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateData utility', () => {
    it('returns success with valid data', () => {
      const result = validateData(loginSchema, { username: 'user', password: 'pass' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('user');
      }
    });

    it('returns errors with invalid data', () => {
      const result = validateData(loginSchema, { username: '', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('formatZodErrors', () => {
    it('formats errors into field-keyed object', () => {
      const result = loginSchema.safeParse({ username: '', password: '' });
      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted).toHaveProperty('username');
        expect(formatted).toHaveProperty('password');
      }
    });
  });
});
