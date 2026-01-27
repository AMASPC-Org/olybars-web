
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import * as janitor from './janitor';

// Mock fs to avoid reading real files
vi.mock('node:fs');

describe('Janitor Script', () => {
  const MOCK_ROOT = '/mock/root';

  // Spy on fs methods
  const existsSyncMock = vi.mocked(fs.existsSync);
  const readFileSyncMock = vi.mocked(fs.readFileSync);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('checkGcpGuardrails', () => {
    it('should return issue if .gcloudignore is missing', () => {
      existsSyncMock.mockImplementation((pathArg) => {
        const p = pathArg.toString();
        // Simulate server dir exists
        if (p.includes('server')) return true;
        // Simulate gcloudignore missing
        if (p.includes('.gcloudignore')) return false;
        return false;
      });

      const issues = janitor.checkGcpGuardrails();
      expect(issues).toContain('⚠️ No .gcloudignore found in root. GCP might bundle everything.');
    });

    it('should return issue if .gcloudignore exists but lacks exclusions', () => {
      existsSyncMock.mockImplementation((pathArg) => {
        const p = pathArg.toString();
        if (p.includes('server')) return true;
        if (p.includes('.gcloudignore')) return true;
        return false;
      });
      readFileSyncMock.mockReturnValue('node_modules/\n.git/');

      const issues = janitor.checkGcpGuardrails();
      expect(issues.some(i => i.includes('missing exclusions'))).toBe(true);
    });

    it('should pass if .gcloudignore has correct exclusions', () => {
      existsSyncMock.mockImplementation((pathArg) => {
        const p = pathArg.toString();
        if (p.includes('server')) return true;
        if (p.includes('.gcloudignore')) return true;
        return false;
      });
      readFileSyncMock.mockReturnValue('node_modules/\n.git/\ntests/\ndocs/');

      const issues = janitor.checkGcpGuardrails();
      expect(issues).toHaveLength(0);
    });
  });

});
