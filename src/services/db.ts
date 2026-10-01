import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class DatabaseService {
  private sqlite: SQLiteConnection;
    private db: SQLiteDBConnection | null = null;
      private isInitialized = false;

        constructor() {
            this.sqlite = new SQLiteConnection(CapacitorSQLite);
              }

                async init(): Promise<void> {
                    if (this.isInitialized) return;

                        if (Capacitor.getPlatform() === 'web') {
                              console.warn('SQLite plugin runs natively on Android/iOS.');
                                    return;
                                        }

                                            try {
                                                  this.db = await this.sqlite.createConnection(
                                                          'story_local_db',
                                                                  false,
                                                                          'no-encryption',
                                                                                  1,
                                                                                          false
                                                                                                );

                                                                                                      await this.db.open();

                                                                                                            const schema = `
                                                                                                                    CREATE TABLE IF NOT EXISTS settings (
                                                                                                                              key TEXT PRIMARY KEY NOT NULL,
                                                                                                                                        value TEXT NOT NULL
                                                                                                                                                );
                                                                                                                                                        CREATE TABLE IF NOT EXISTS stories (
                                                                                                                                                                  id TEXT PRIMARY KEY NOT NULL,
                                                                                                                                                                            title TEXT NOT NULL,
                                                                                                                                                                                      created_at INTEGER NOT NULL
                                                                                                                                                                                              );
                                                                                                                                                                                                      CREATE TABLE IF NOT EXISTS chapters (
                                                                                                                                                                                                                id TEXT PRIMARY KEY NOT NULL,
                                                                                                                                                                                                                          story_id TEXT NOT NULL,
                                                                                                                                                                                                                                    title TEXT NOT NULL,
                                                                                                                                                                                                                                              content TEXT NOT NULL,
                                                                                                                                                                                                                                                        updated_at INTEGER NOT NULL,
                                                                                                                                                                                                                                                                  FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                `;

                                                                                                                                                                                                                                                                                      await this.db.execute(schema);
                                                                                                                                                                                                                                                                                            this.isInitialized = true;
                                                                                                                                                                                                                                                                                                } catch (err) {
                                                                                                                                                                                                                                                                                                      console.error('Failed to initialize SQLite:', err);
                                                                                                                                                                                                                                                                                                            throw err;
                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                    async getDb(): Promise<SQLiteDBConnection> {
                                                                                                                                                                                                                                                                                                                        if (!this.isInitialized || !this.db) {
                                                                                                                                                                                                                                                                                                                              await this.init();
                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                      return this.db!;
                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                          // API Key management
                                                                                                                                                                                                                                                                                                                                            async saveApiKey(key: string): Promise<void> {
                                                                                                                                                                                                                                                                                                                                                const db = await this.getDb();
                                                                                                                                                                                                                                                                                                                                                    await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['gemini_api_key', key]);
                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                        async loadApiKey(): Promise<string | null> {
                                                                                                                                                                                                                                                                                                                                                            const db = await this.getDb();
                                                                                                                                                                                                                                                                                                                                                                const res = await db.query('SELECT value FROM settings WHERE key = ?', ['gemini_api_key']);
                                                                                                                                                                                                                                                                                                                                                                    return res.values && res.values.length > 0 ? res.values[0].value : null;
                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                      export const dbService = new DatabaseService();