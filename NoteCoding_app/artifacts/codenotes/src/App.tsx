import { useState, useEffect, useCallback } from "react";
import { useNotes } from "@/hooks/useNotes";
import { Sidebar } from "@/components/Sidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { PremiumModal } from "@/components/PremiumModal";
import { Note, NoteInput } from "@/db";
import { downloadJSON } from "@/utils";
import { payment } from "@/payment";
import { Star } from "lucide-react";

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const {
    filteredNotes,
    loading,
    searchQuery,
    setSearchQueryImmediate,
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
    notes,
  } = useNotes();

  useEffect(() => {
    setIsPremium(payment.isPremium());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-testid="input-search"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) ?? null : null;

  const handleNewNote = () => {
    setSelectedId(null);
    setIsNew(true);
  };

  const handleSelectNote = (id: string) => {
    setSelectedId(id);
    setIsNew(false);
  };

  const handleSaveNew = useCallback(async (data: NoteInput) => {
    const note = await createNote(data);
    setSelectedId(note.id);
    setIsNew(false);
  }, [createNote]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<NoteInput>) => {
    await updateNote(id, updates);
  }, [updateNote]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteNote(id);
    if (selectedId === id) {
      setSelectedId(null);
      setIsNew(false);
    }
  }, [deleteNote, selectedId]);

  const handleDeleteFromSidebar = useCallback((id: string) => {
    handleDelete(id);
  }, [handleDelete]);

  const handlePin = useCallback(async (id: string) => {
    await togglePin(id);
  }, [togglePin]);

  const handleExport = useCallback(async () => {
    const data = await downloadJSON(notes, `codenotes-export-${Date.now()}.json`);
    return data;
  }, [notes]);

  const handleImport = useCallback(async (imported: Note[]) => {
    await importNotes(imported);
  }, [importNotes]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center fade-in">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading CodeNotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background font-sans">
      <Sidebar
        notes={filteredNotes}
        selectedId={selectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQueryImmediate}
        activeTag={activeTag}
        onTagChange={setActiveTag}
        sortMode={sortMode}
        onSortChange={setSortMode}
        allTags={allTags}
        onNewNote={handleNewNote}
        onSelectNote={handleSelectNote}
        onDeleteNote={handleDeleteFromSidebar}
        onExport={handleExport}
        onImport={handleImport}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-card">
          <button
            onClick={() => setShowPremium(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
              isPremium
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
            }`}
            data-testid="button-premium"
          >
            <Star size={11} className={isPremium ? "fill-amber-400" : ""} />
            {isPremium ? "Premium" : "Upgrade"}
          </button>
        </div>

        <NoteEditor
          note={isNew ? null : selectedNote}
          isNew={isNew}
          onSave={handleSaveNew}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onPin={handlePin}
          onDebouncedSave={debouncedSave}
        />
      </main>

      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          onPurchase={() => setIsPremium(true)}
        />
      )}
    </div>
  );
}
