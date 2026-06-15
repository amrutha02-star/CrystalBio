import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ClientErrorLogStore } from './crystalBioApi';

export function createJsonlClientErrorLogStore(filePath: string): ClientErrorLogStore {
  mkdirSync(dirname(filePath), { recursive: true });
  return {
    add(event) {
      appendFileSync(filePath, `${JSON.stringify(event)}\n`, 'utf8');
    },
    list(limit = 50) {
      if (!existsSync(filePath)) return [];
      return readFileSync(filePath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .slice(-limit)
        .reverse()
        .map((line) => JSON.parse(line));
    },
  };
}
