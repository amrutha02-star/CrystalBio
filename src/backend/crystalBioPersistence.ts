import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
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

  private backupPath() {
    return `${this.filePath}.bak`;
  }

  private corruptPath() {
    return `${this.filePath}.corrupt`;
  }

  private parseState(raw: string): CrystalBioBackendState {
    if (!raw.trim()) return emptyCrystalBioState();
    return { ...emptyCrystalBioState(), ...JSON.parse(raw) };
  }

  load(): CrystalBioBackendState {
    if (!existsSync(this.filePath)) return emptyCrystalBioState();

    const raw = readFileSync(this.filePath, 'utf8');
    try {
      return this.parseState(raw);
    } catch (error) {
      writeFileSync(this.corruptPath(), raw);
      if (existsSync(this.backupPath())) {
        return this.parseState(readFileSync(this.backupPath(), 'utf8'));
      }
      throw error;
    }
  }

  save(state: CrystalBioBackendState) {
    mkdirSync(dirname(this.filePath), { recursive: true });
    if (existsSync(this.filePath)) copyFileSync(this.filePath, this.backupPath());
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(state, null, 2));
    renameSync(tempPath, this.filePath);
  }
}
