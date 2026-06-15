import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ClientErrorLogStore, LoginActivityLogStore } from './crystalBioApi';

const readJsonl = <T>(filePath: string, limit: number): T[] => {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-limit)
    .reverse()
    .map((line) => JSON.parse(line));
};

export function createJsonlClientErrorLogStore(filePath: string): ClientErrorLogStore {
  mkdirSync(dirname(filePath), { recursive: true });
  return {
    add(event) {
      appendFileSync(filePath, `${JSON.stringify(event)}\n`, 'utf8');
    },
    list(limit = 50) {
      return readJsonl(filePath, limit);
    },
  };
}

export function createJsonlLoginActivityLogStore(filePath: string): LoginActivityLogStore {
  mkdirSync(dirname(filePath), { recursive: true });
  return {
    add(event) {
      appendFileSync(filePath, `${JSON.stringify(event)}\n`, 'utf8');
    },
    list(limit = 100) {
      return readJsonl(filePath, limit);
    },
  };
}
