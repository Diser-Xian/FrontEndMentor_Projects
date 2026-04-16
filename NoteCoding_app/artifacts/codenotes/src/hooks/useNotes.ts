import { useState, useEffect, useCallback, useRef } from "react";
import { db, Note, NoteInput, NoteUpdate } from "@/db";
import { debounce } from "@/utils";

export type SortMode = "recent" | "alphabetical" | "pinned" | "oldest";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [allTags, setAllTags] = useState<string[]>([]);
  const saveQueueRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const loadNotes = useCallback(async () => {
    try {
      const all = await db.getAllNotes();
      setNotes(all);
      const tags = new Set<string>();
      all.forEach((n) => n.tags.forEach((t) => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const createNote = useCallback(async (input: NoteInput): Promise<Note> => {
    const note = await db.createNote(input);
    await loadNotes();
    return note;
  }, [loadNotes]);

  const updateNote = useCallback(async (id: string, updates: NoteUpdate): Promise<void> => {
    await db.updateNote(id, updates);
    await loadNotes();
  }, [loadNotes]);

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    await db.deleteNote(id);
    await loadNotes();
  }, [loadNotes]);

  const debouncedSave = useCallback(
    (id: string, updates: NoteUpdate) => {
      const existing = saveQueueRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        try {
          await db.updateNote(id, updates);
          await loadNotes();
        } catch (err) {
          console.error("Autosave failed:", err);
        }
        saveQueueRef.current.delete(id);
      }, 600);
      saveQueueRef.current.set(id, timer);
    },
    [loadNotes]
  );

  const togglePin = useCallback(async (id: string): Promise<void> => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    await db.updateNote(id, { pinned: !note.pinned });
    await loadNotes();
  }, [notes, loadNotes]);

  const importNotes = useCallback(async (imported: Note[]): Promise<void> => {
    await db.importNotes(imported);
    await loadNotes();
  }, [loadNotes]);

  const filteredNotes = useCallback((): Note[] => {
    let result = [...notes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.code.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) {
      result = result.filter((n) => n.tags.includes(activeTag));
    }
    switch (sortMode) {
      case "recent":
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case "oldest":
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "pinned":
        result.sort((a, b) => {
          if (a.pinned === b.pinned) return b.updatedAt - a.updatedAt;
          return a.pinned ? -1 : 1;
        });
        break;
    }
    return result;
  }, [notes, searchQuery, activeTag, sortMode]);

  return {
    notes,
    filteredNotes: filteredNotes(),
    loading,
    searchQuery,
    setSearchQuery: debounce((q: string) => setSearchQuery(q), 150) as (q: string) => void,
    setSearchQueryImmediate: setSearchQuery,
    activeTag,
    setActiveTag,
    sortMode,
    setSortMode,
    allTags,
    createNote,
    updateNote,
    deleteNote,
    debouncedSave,
    togglePin,
    importNotes,
    refresh: loadNotes,
  };
}
