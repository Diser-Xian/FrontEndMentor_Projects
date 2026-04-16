import { useState, useRef } from "react";
import { Search, Plus, Tag, Pin, Clock, SortAsc, ChevronLeft, ChevronRight, Download, Upload, Star, Trash2 } from "lucide-react";
import { Note } from "@/db";
import { SortMode } from "@/hooks/useNotes";
import { formatDate, downloadJSON, readJSONFile, LANGUAGE_LABELS } from "@/utils";

interface SidebarProps {
  notes: Note[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  allTags: string[];
  onNewNote: () => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onExport: () => void;
  onImport: (notes: Note[]) => void;
}

export function Sidebar({
  notes,
  selectedId,
  searchQuery,
  onSearchChange,
  activeTag,
  onTagChange,
  sortMode,
  onSortChange,
  allTags,
  onNewNote,
  onSelectNote,
  onDeleteNote,
  onExport,
  onImport,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => importRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readJSONFile(file);
      if (Array.isArray(data)) {
        onImport(data as Note[]);
      }
    } catch (err) {
      console.error("Import failed:", err);
    }
    e.target.value = "";
  };

  const sortOptions: { value: SortMode; label: string; icon: React.ReactNode }[] = [
    { value: "recent", label: "Recent", icon: <Clock size={12} /> },
    { value: "pinned", label: "Pinned first", icon: <Pin size={12} /> },
    { value: "alphabetical", label: "A–Z", icon: <SortAsc size={12} /> },
    { value: "oldest", label: "Oldest", icon: <Clock size={12} /> },
  ];

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-2 bg-sidebar border-r border-sidebar-border w-12 min-h-0 gap-3">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Expand sidebar"
          data-testid="button-expand-sidebar"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onNewNote}
          className="p-2 rounded-md hover:bg-sidebar-accent text-primary hover:text-primary transition-colors"
          title="New note"
          data-testid="button-new-note-collapsed"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => searchRef.current?.focus()}
          className="p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Search"
          data-testid="button-search-collapsed"
        >
          <Search size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-sidebar border-r border-sidebar-border w-72 min-w-[220px] max-w-xs min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">CodeNotes</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-collapse-sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* New Note + Actions */}
      <div className="px-3 py-3 flex gap-2 border-b border-sidebar-border">
        <button
          onClick={onNewNote}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          data-testid="button-new-note"
        >
          <Plus size={14} />
          New Note
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-md border border-border hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Export JSON"
          data-testid="button-export"
        >
          <Download size={14} />
        </button>
        <button
          onClick={handleImportClick}
          className="p-2 rounded-md border border-border hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Import JSON"
          data-testid="button-import"
        >
          <Upload size={14} />
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
          data-testid="input-import-file"
        />
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search notes..."
            defaultValue={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-input rounded-md text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-ring focus:outline-none transition-colors"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <div className="flex gap-1 flex-wrap">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                sortMode === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              }`}
              data-testid={`button-sort-${opt.value}`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            data-testid="button-toggle-tags"
          >
            <Tag size={12} />
            <span className="font-medium">Tags</span>
            <span className="ml-auto text-[10px] bg-sidebar-accent px-1.5 rounded-full">{allTags.length}</span>
          </button>
          {showTags && (
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                onClick={() => onTagChange(null)}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  activeTag === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-sidebar-accent text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-tag-all"
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagChange(activeTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    activeTag === tag
                      ? "bg-accent text-accent-foreground"
                      : "bg-sidebar-accent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-tag-${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto py-1">
        {notes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-muted-foreground text-xs">No notes found</div>
            <button
              onClick={onNewNote}
              className="mt-3 text-xs text-primary hover:underline"
              data-testid="button-create-first-note"
            >
              Create your first note
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onSelect={() => onSelectNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-sidebar-border">
        <div className="text-[10px] text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

function NoteListItem({
  note,
  selected,
  onSelect,
  onDelete,
}: {
  note: Note;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative mx-2 my-0.5 px-3 py-2.5 rounded-md cursor-pointer note-card-hover transition-all ${
        selected
          ? "bg-sidebar-accent border border-primary/30 glow-primary"
          : "border border-transparent hover:border-border"
      }`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`note-card-${note.id}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {note.pinned && <Pin size={10} className="text-accent flex-shrink-0" />}
            <span className="text-xs font-medium text-foreground truncate block">
              {note.title || "Untitled"}
            </span>
          </div>
          {note.description && (
            <p className="text-[10px] text-muted-foreground truncate mb-1">{note.description}</p>
          )}
          <div className="flex items-center gap-2">
            {note.language && note.language !== "plaintext" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sidebar-accent text-muted-foreground font-mono">
                {LANGUAGE_LABELS[note.language] || note.language}
              </span>
            )}
            <span className="text-[9px] text-muted-foreground">{formatDate(note.updatedAt)}</span>
          </div>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {note.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent/80">
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">+{note.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
            title="Delete note"
            data-testid={`button-delete-note-${note.id}`}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
      {selected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
      )}
    </div>
  );
}
