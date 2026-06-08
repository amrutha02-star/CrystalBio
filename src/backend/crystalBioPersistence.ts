import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { CrystalBioBackendState } from './crystalBioBackend';

export const emptyCrystalBioState = (): CrystalBioBackendState => ({
  nextId: 1,
  agents: [],
  sessions: [],
  attendance: [],
  sales: [],
  service: [],
  leaveRequests: [],
});

export class JsonFileCrystalBioStore {
  constructor(private readonly filePath: string) {}

  load(): CrystalBioBackendState {
    if (!existsSync(this.filePath)) return emptyCrystalBioState();
    const raw = readFileSync(this.filePath, 'utf8');
    if (!raw.trim()) return emptyCrystalBioState();
    return { ...emptyCrystalBioState(), ...JSON.parse(raw) };
  }

  save(state: CrystalBioBackendState) {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(state, null, 2));
  }
}
