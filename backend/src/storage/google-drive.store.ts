import fs from 'fs';
import { google, drive_v3 } from 'googleapis';
import { DataStore } from './storage.interface';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const JSON_MIME_TYPE = 'application/json';

interface GoogleDriveStoreOptions {
  credentialsPath: string;
  rootFolderName: string;
}

/**
 * Persists the virtual JSON tree to real Google Drive. Each virtual path
 * segment maps to a Drive folder (created lazily under a root folder), and
 * the final segment is stored as a JSON file named `<segment>.json`.
 *
 * Folder id lookups are cached in memory for the lifetime of the process to
 * avoid redundant Drive API calls.
 */
export class GoogleDriveStore implements DataStore {
  private readonly drive: drive_v3.Drive;
  private readonly rootFolderName: string;
  private rootFolderIdPromise: Promise<string> | null = null;
  private readonly folderIdCache = new Map<string, Promise<string>>();

  constructor(options: GoogleDriveStoreOptions) {
    if (!options.credentialsPath || !fs.existsSync(options.credentialsPath)) {
      throw new Error(
        'GoogleDriveStore requires a valid service account credentials file.\n' +
          'Set GOOGLE_APPLICATION_CREDENTIALS to the path of a Google Cloud service account JSON key.\n' +
          'To obtain one:\n' +
          '  1. Open https://console.cloud.google.com/ and select (or create) a project.\n' +
          '  2. Enable the "Google Drive API" for that project.\n' +
          '  3. Go to IAM & Admin > Service Accounts, create a service account.\n' +
          '  4. Create a JSON key for it and download the file.\n' +
          '  5. Share the target Google Drive folder (or "My Drive") with the service account email.\n' +
          '  6. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json in your .env file.'
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: options.credentialsPath,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.rootFolderName = options.rootFolderName;
  }

  async readJson<T>(virtualPath: string, fallback: T): Promise<T> {
    const segments = this.splitPath(virtualPath);
    const fileId = await this.findFileId(segments);
    if (!fileId) {
      return fallback;
    }
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' }
    );
    const raw = response.data as unknown as string;
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  }

  async writeJson<T>(virtualPath: string, data: T): Promise<void> {
    const segments = this.splitPath(virtualPath);
    const fileName = segments[segments.length - 1];
    const folderSegments = segments.slice(0, -1);
    const parentId = await this.ensureFolderPath(folderSegments);
    const existingFileId = await this.findFileInFolder(parentId, `${fileName}.json`, false);

    const body = JSON.stringify(data, null, 2);
    const media = { mimeType: JSON_MIME_TYPE, body };

    if (existingFileId) {
      await this.drive.files.update({ fileId: existingFileId, media });
    } else {
      await this.drive.files.create({
        requestBody: {
          name: `${fileName}.json`,
          parents: [parentId],
          mimeType: JSON_MIME_TYPE
        },
        media
      });
    }
  }

  async listChildren(virtualPathPrefix: string): Promise<string[]> {
    const segments = this.splitPath(virtualPathPrefix);
    const folderId = await this.findFolderId(segments, false);
    if (!folderId) {
      return [];
    }
    const children = await this.listChildEntries(folderId);
    return children
      .filter((entry) => entry.mimeType === FOLDER_MIME_TYPE || entry.name?.endsWith('.json'))
      .map((entry) =>
        entry.mimeType === FOLDER_MIME_TYPE ? (entry.name as string) : (entry.name as string).replace(/\.json$/, '')
      );
  }

  private splitPath(virtualPath: string): string[] {
    return virtualPath.split('/').filter(Boolean);
  }

  private async getRootFolderId(): Promise<string> {
    if (!this.rootFolderIdPromise) {
      this.rootFolderIdPromise = this.findOrCreateFolder(this.rootFolderName, undefined);
    }
    return this.rootFolderIdPromise;
  }

  private async ensureFolderPath(segments: string[]): Promise<string> {
    let parentId = await this.getRootFolderId();
    let cacheKey = '';
    for (const segment of segments) {
      cacheKey += `/${segment}`;
      let folderPromise = this.folderIdCache.get(cacheKey);
      if (!folderPromise) {
        folderPromise = this.findOrCreateFolder(segment, parentId);
        this.folderIdCache.set(cacheKey, folderPromise);
      }
      parentId = await folderPromise;
    }
    return parentId;
  }

  private async findFolderId(segments: string[], createIfMissing: boolean): Promise<string | null> {
    let parentId = await this.getRootFolderId();
    let cacheKey = '';
    for (const segment of segments) {
      cacheKey += `/${segment}`;
      const cached = this.folderIdCache.get(cacheKey);
      if (cached) {
        parentId = await cached;
        continue;
      }
      if (createIfMissing) {
        const folderPromise = this.findOrCreateFolder(segment, parentId);
        this.folderIdCache.set(cacheKey, folderPromise);
        parentId = await folderPromise;
      } else {
        const existing = await this.findFileInFolder(parentId, segment, true);
        if (!existing) {
          return null;
        }
        this.folderIdCache.set(cacheKey, Promise.resolve(existing));
        parentId = existing;
      }
    }
    return parentId;
  }

  private async findFileId(segments: string[]): Promise<string | null> {
    if (segments.length === 0) {
      return null;
    }
    const fileName = segments[segments.length - 1];
    const folderSegments = segments.slice(0, -1);
    const folderId = await this.findFolderId(folderSegments, false);
    if (!folderId) {
      return null;
    }
    return this.findFileInFolder(folderId, `${fileName}.json`, false);
  }

  private async findOrCreateFolder(name: string, parentId: string | undefined): Promise<string> {
    const existing = await this.findFileInFolder(parentId, name, true);
    if (existing) {
      return existing;
    }
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: FOLDER_MIME_TYPE,
        parents: parentId ? [parentId] : undefined
      },
      fields: 'id'
    });
    if (!response.data.id) {
      throw new Error(`Failed to create Google Drive folder "${name}"`);
    }
    return response.data.id;
  }

  private async findFileInFolder(
    parentId: string | undefined,
    name: string,
    isFolder: boolean
  ): Promise<string | null> {
    const mimeClause = isFolder ? ` and mimeType = '${FOLDER_MIME_TYPE}'` : '';
    const parentClause = parentId ? ` and '${parentId}' in parents` : '';
    const query = `name = '${this.escapeQueryValue(name)}' and trashed = false${mimeClause}${parentClause}`;
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    const files = response.data.files ?? [];
    return files.length > 0 ? (files[0].id as string) : null;
  }

  private async listChildEntries(folderId: string): Promise<drive_v3.Schema$File[]> {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive',
      pageSize: 1000
    });
    return response.data.files ?? [];
  }

  private escapeQueryValue(value: string): string {
    return value.replace(/'/g, "\\'");
  }
}
