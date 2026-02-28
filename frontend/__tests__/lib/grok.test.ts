/**
 * Tests for lib/grok.ts — xAI/Grok AI integration
 *
 * Uses jest.resetModules() + dynamic require() because the module
 * reads XAI_API_KEY at import time.
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

function loadModule() {
  jest.resetModules();
  process.env.XAI_API_KEY = 'test-xai-key';
  process.env.XAI_API_URL = 'https://api.x.ai/v1';
  return require('@/lib/grok') as typeof import('@/lib/grok');
}

function mockGrokResponse(content: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });
}

describe('lib/grok', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('analyzeSymptoms', () => {
    it('sends correct request to xAI API', async () => {
      const { analyzeSymptoms } = loadModule();

      const jsonResponse = JSON.stringify({
        analysis: 'Tension headache likely',
        recommendations: { modalities: ['Acupuncture'], herbs: ['Feverfew'] },
        disclaimer: 'Consult a doctor.',
      });
      mockGrokResponse(jsonResponse);

      const result = await analyzeSymptoms({ symptoms: 'headache and fatigue' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-xai-key',
          },
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('grok-beta');
      expect(body.messages).toHaveLength(2);
      expect(body.messages[1].content).toContain('headache and fatigue');

      expect(result.analysis).toBe('Tension headache likely');
      expect(result.recommendations.modalities).toContain('Acupuncture');
    });

    it('throws when XAI_API_KEY is not set', async () => {
      jest.resetModules();
      delete process.env.XAI_API_KEY;
      const mod = require('@/lib/grok');

      await expect(mod.analyzeSymptoms({ symptoms: 'test' }))
        .rejects.toThrow('XAI_API_KEY is not configured');
    });

    it('throws on API error response', async () => {
      const { analyzeSymptoms } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      await expect(analyzeSymptoms({ symptoms: 'test' }))
        .rejects.toThrow('xAI API error: Invalid API key');
    });

    it('throws when API returns empty content', async () => {
      const { analyzeSymptoms } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '' } }] }),
      });

      await expect(analyzeSymptoms({ symptoms: 'test' }))
        .rejects.toThrow('No response from Grok AI');
    });

    it('handles non-JSON response gracefully', async () => {
      const { analyzeSymptoms } = loadModule();

      mockGrokResponse('This is plain text, not JSON');

      const result = await analyzeSymptoms({ symptoms: 'headache' });

      expect(result.analysis).toBe('This is plain text, not JSON');
      expect(result.recommendations.modalities).toEqual([]);
      expect(result.recommendations.herbs).toEqual([]);
      expect(result.disclaimer).toBeTruthy();
    });

    it('includes context in the prompt when provided', async () => {
      const { analyzeSymptoms } = loadModule();

      const jsonResponse = JSON.stringify({
        analysis: 'Analysis',
        recommendations: { modalities: [], herbs: [] },
        disclaimer: 'Disclaimer',
      });
      mockGrokResponse(jsonResponse);

      await analyzeSymptoms({
        symptoms: 'back pain',
        context: { age: 35, gender: 'female', existingConditions: ['arthritis'] },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = body.messages[1].content;
      expect(userMessage).toContain('30-44'); // age range
      expect(userMessage).toContain('female');
      expect(userMessage).toContain('arthritis');
    });
  });

  describe('generateFollowUpQuestions', () => {
    it('returns parsed questions array', async () => {
      const { generateFollowUpQuestions } = loadModule();

      const questions = [
        { id: 'q1', question: 'How long?', type: 'choice', options: ['1 week', '1 month'] },
      ];
      mockGrokResponse(JSON.stringify(questions));

      const result = await generateFollowUpQuestions('headache');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('q1');
      expect(result[0].question).toBe('How long?');
    });

    it('returns empty array on error', async () => {
      const { generateFollowUpQuestions } = loadModule();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await generateFollowUpQuestions('test');
      expect(result).toEqual([]);

      consoleSpy.mockRestore();
    });

    it('throws when XAI_API_KEY is not set', async () => {
      jest.resetModules();
      delete process.env.XAI_API_KEY;
      const mod = require('@/lib/grok');

      await expect(mod.generateFollowUpQuestions('test'))
        .rejects.toThrow('XAI_API_KEY is not configured');
    });
  });

  describe('summarizeContent', () => {
    it('returns summarized text', async () => {
      const { summarizeContent } = loadModule();

      mockGrokResponse('Brief summary of the content.');

      const result = await summarizeContent('Long original content here...');
      expect(result).toBe('Brief summary of the content.');
    });

    it('returns truncated original on error', async () => {
      const { summarizeContent } = loadModule();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const longContent = 'A'.repeat(300);
      const result = await summarizeContent(longContent, 200);
      expect(result).toHaveLength(203); // 200 chars + '...'
      expect(result.endsWith('...')).toBe(true);

      consoleSpy.mockRestore();
    });

    it('throws when XAI_API_KEY is not set', async () => {
      jest.resetModules();
      delete process.env.XAI_API_KEY;
      const mod = require('@/lib/grok');

      await expect(mod.summarizeContent('test'))
        .rejects.toThrow('XAI_API_KEY is not configured');
    });
  });

  describe('explainFormula', () => {
    it('returns plain-English explanation string', async () => {
      const { explainFormula } = loadModule();

      mockGrokResponse('This formula gently supports your energy. It contains four herbs...');

      const result = await explainFormula({
        formulaName: 'Si Jun Zi Tang',
        ingredients: ['Ren Shen', 'Bai Zhu', 'Fu Ling', 'Gan Cao'],
        actions: 'Tonifies Qi',
        indications: 'Qi deficiency',
      });

      expect(result).toContain('formula');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({ method: 'POST' })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[1].content).toContain('Si Jun Zi Tang');
      expect(body.messages[1].content).toContain('Ren Shen');
    });

    it('throws when XAI_API_KEY is not set', async () => {
      jest.resetModules();
      delete process.env.XAI_API_KEY;
      const mod = require('@/lib/grok');

      await expect(mod.explainFormula({
        formulaName: 'Test',
        ingredients: [],
        actions: '',
        indications: '',
      })).rejects.toThrow('XAI_API_KEY is not configured');
    });

    it('throws on API error response', async () => {
      const { explainFormula } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid key' }),
      });

      await expect(explainFormula({
        formulaName: 'Test',
        ingredients: [],
        actions: '',
        indications: '',
      })).rejects.toThrow('xAI API error');
    });
  });
});
