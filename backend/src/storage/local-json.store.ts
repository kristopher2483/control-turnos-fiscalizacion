import fs from 'fs/promises';
import path from 'path';
import { DataStore } from './storage.interface';

/**
 * Persists the virtual JSON tree under `backend/data/<virtualPath>.json`
 * using the local filesystem. This is the zero-configuration default
 * provider, useful for local development and as a fallback before the
 * Google Drive integration is wired up.
 */
export class LocalJsonStore implements DataStore {
  private readonly rootDir: string;

  constructor(rootDir: string = path.join(process.cwd(), 'data')) {
    this.rootDir = rootDir;
  }

  private resolvePath(virtualPath: string): string {
    const segments = virtualPath.split('/').filter(Boolean);
    return path.join(this.rootDir, ...segments) + '.json';
  }

  async readJson<T>(virtualPath: string, fallback: T): Promise<T> {
    const filePath = this.resolvePath(virtualPath);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (error) {
      if (this.isNotFound(error)) {
        return fallback;
      }
      throw error;
    }
  }

  async writeJson<T>(virtualPath: string, data: T): Promise<void> {
    const filePath = this.resolvePath(virtualPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async listChildren(virtualPathPrefix: string): Promise<string[]> {
    const segments = virtualPathPrefix.split('/').filter(Boolean);
    const dirPath = path.join(this.rootDir, ...segments);
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory() || (entry.isFile() && entry.name.endsWith('.json')))
        .map((entry) => (entry.isDirectory() ? entry.name : entry.name.replace(/\.json$/, '')));
    } catch (error) {
      if (this.isNotFound(error)) {
        return [];
      }
      throw error;
    }
  }

  private isNotFound(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'ENOENT';
  }
}
