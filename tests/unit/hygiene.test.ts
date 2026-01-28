
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Hygiene System', () => {
  it('should have a hygiene-status.json file', () => {
    const statusPath = path.resolve(__dirname, '../../hygiene-status.json');
    expect(fs.existsSync(statusPath)).toBe(true);
  });

  it('should have a clean hygiene score', () => {
    const statusPath = path.resolve(__dirname, '../../hygiene-status.json');
    if (fs.existsSync(statusPath)) {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      expect(status.score).toBeGreaterThan(80);
    }
  });
});
