const DB_NAME = "CodeNotesDB";
const DB_VERSION = 1;
const STORE_NAME = "notes";

export interface Note {
  id: string;
  title: string;
  code: string;
  description: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  language: string;
}

export type NoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;
export type NoteUpdate = Partial<NoteInput>;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("tags", "tags", { unique: false, multiEntry: true });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("pinned", "pinned", { unique: false });
        store.createIndex("language", "language", { unique: false });
      }
    };
    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

function generateId(): string {
  return crypto.randomUUID();
}

export const db = {
  async createNote(input: NoteInput): Promise<Note> {
    const database = await openDB();
    const note: Note = {
      ...input,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(note);
      request.onsuccess = () => resolve(note);
      request.onerror = () => reject(request.error);
    });
  },

  async getNote(id: string): Promise<Note | undefined> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as Note | undefined);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllNotes(): Promise<Note[]> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Note[]);
      request.onerror = () => reject(request.error);
    });
  },

  async updateNote(id: string, updates: NoteUpdate): Promise<Note> {
    const database = await openDB();
    const existing = await this.getNote(id);
    if (!existing) throw new Error(`Note ${id} not found`);
    const updated: Note = { ...existing, ...updates, id, updatedAt: Date.now() };
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteNote(id: string): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async searchNotes(query: string): Promise<Note[]> {
    const all = await this.getAllNotes();
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  async getNotesByTag(tag: string): Promise<Note[]> {
    const all = await this.getAllNotes();
    return all.filter((n) => n.tags.includes(tag));
  },

  async exportAll(): Promise<Note[]> {
    return this.getAllNotes();
  },

  async importNotes(notes: Note[]): Promise<void> {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      notes.forEach((note) => store.put(note));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllTags(): Promise<string[]> {
    const all = await this.getAllNotes();
    const tagSet = new Set<string>();
    all.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },
};
