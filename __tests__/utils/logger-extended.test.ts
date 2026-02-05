/**
 * Tests supplémentaires pour utils/logger.ts
 */

import { logger, LogLevel, log } from '@/utils/logger';

describe('logger - Tests étendus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  describe('setLevel', () => {
    it('devrait changer le niveau de logging', () => {
      logger.setLevel(LogLevel.WARN);
      logger.debug('Debug message');
      logger.warn('Warning message');

      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    });
  });

  describe('setEnabled', () => {
    it('devrait désactiver le logging', () => {
      logger.setEnabled(false);
      logger.info('Info message');
      logger.error('Error message');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('devrait réactiver le logging', () => {
      logger.setEnabled(false);
      logger.setEnabled(true);
      logger.info('Info message');

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('apiRequest', () => {
    it('devrait logger une requête API', () => {
      logger.apiRequest('GET', '/test', { headers: { 'Content-Type': 'application/json' } });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[API]'),
        expect.any(Object)
      );
    });
  });

  describe('apiResponse', () => {
    it('devrait logger une réponse API réussie', () => {
      logger.apiResponse('GET', '/test', 200, 100, { data: 'test' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅'),
        expect.any(Object)
      );
    });

    it('devrait logger une réponse API avec erreur', () => {
      logger.apiResponse('GET', '/test', 404, 50);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
        expect.any(Object)
      );
    });
  });

  describe('apiError', () => {
    it('devrait logger une erreur API', () => {
      const error = new Error('Test error');
      logger.apiError('GET', '/test', 500, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[API ERROR]'),
        error
      );
    });
  });

  describe('log export', () => {
    it('devrait exporter les méthodes de logging', () => {
      log.debug('Debug');
      log.info('Info');
      log.warn('Warning');
      log.error('Error', new Error('Test'));

      expect(console.log).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('devrait exporter les méthodes API', () => {
      log.api.request('GET', '/test');
      log.api.response('GET', '/test', 200, 100);
      log.api.error('GET', '/test', 500, new Error('Test'));

      expect(console.log).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});

