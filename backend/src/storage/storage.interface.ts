export interface DataStore {
  /**
   * Reads and parses the JSON document at the given virtual path.
   * Returns `fallback` when the document does not exist yet.
   */
  readJson<T>(virtualPath: string, fallback: T): Promise<T>;

  /**
   * Serializes `data` as JSON and writes it to the given virtual path,
   * creating any intermediate virtual folders as needed.
   */
  writeJson<T>(virtualPath: string, data: T): Promise<void>;

  /**
   * Lists the child names (without extension) that exist directly under
   * the given virtual folder prefix.
   */
  listChildren(virtualPathPrefix: string): Promise<string[]>;
}
