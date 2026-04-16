import { useState, useEffect, useRef, useCallback } from "react";
import { Save, Copy, Trash2, Pin, PinOff, Check, ChevronDown, Tag as TagIcon, X } from "lucide-react";
import { Note, NoteInput } from "@/db";
import { CodeEditor } from "./CodeEditor";
import { copyToClipboard, LANGUAGES, LANGUAGE_LABELS } from "@/utils";

interface NoteEditorProps {
  note: Note | null;
  isNew?: boolean;
  onSave: (data: NoteInput) => Promise<void>;
  onUpdate: (id: string, updates: Partial<NoteInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPin: (id: string) => Promise<void>;
  onDebouncedSave: (id: string, updates: Partial<NoteInput>) => void;
}

export function NoteEditor({ note, isNew, onSave, onUpdate, onDelete, onPin, onDebouncedSave }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const noteIdRef = useRef<string | null>(null);

  useEffect(() => {
    isFirstRender.current = true;
    if (note) {
      setTitle(note.title);
      setCode(note.code);
      setDescription(note.description);
      setTags(note.tags);
      setLanguage(note.language || "javascript");
      noteIdRef.current = note.id;
    } else if (isNew) {
      setTitle("");
      setCode("");
      setDescription("");
      setTags([]);
      setLanguage("javascript");
      noteIdRef.current = null;
    }
    setTimeout(() => { isFirstRender.current = false; }, 50);
  }, [note?.id, isNew]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleAutoSave = useCallback((updates: Partial<NoteInput>) => {
    if (isFirstRender.current || !note?.id || isNew) return;
    onDebouncedSave(note.id, updates);
  }, [note?.id, isNew, onDebouncedSave]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    handleAutoSave({ title: val, code, description, tags, language });
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    handleAutoSave({ title, code: val, description, tags, language });
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    handleAutoSave({ title, code, description: val, tags, language });
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setShowLangDropdown(false);
    handleAutoSave({ title, code, description, tags, language: lang });
  };

  const addTag = (tag: string) => {
    const cleaned = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (cleaned && !tags.includes(cleaned)) {
      const newTags = [...tags, cleaned];
      setTags(newTags);
      handleAutoSave({ title, code, description, tags: newTags, language });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    handleAutoSave({ title, code, description, tags: newTags, language });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !code.trim()) return;
    setSaving(true);
    try {
      if (note && !isNew) {
        await onUpdate(note.id, { title, code, description, tags, language });
      } else {
        await onSave({ title: title || "Untitled", code, description, tags, language, pinned: false });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!note) return;
    await onDelete(note.id);
  };

  const handlePin = async () => {
    if (!note) return;
    await onPin(note.id);
  };

  if (!note && !isNew) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8 bg-background">
        <div className="fade-in">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-foreground font-semibold mb-2">Select a note</h2>
          <p className="text-muted-foreground text-sm">Pick a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          data-testid="input-note-title"
        />

        {/* Language selector */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-language-selector"
          >
            <span className="font-mono">{LANGUAGE_LABELS[language] || language}</span>
            <ChevronDown size={11} />
          </button>
          {showLangDropdown && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-popover-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto fade-in">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent/10 transition-colors ${
                    language === lang ? "text-primary" : "text-foreground"
                  }`}
                  data-testid={`button-lang-${lang}`}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Copy code"
            data-testid="button-copy-code"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>

          {note && !isNew && (
            <button
              onClick={handlePin}
              className={`p-1.5 rounded transition-colors ${
                note.pinned
                  ? "text-accent hover:text-accent/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title={note.pinned ? "Unpin note" : "Pin note"}
              data-testid="button-pin-note"
            >
              {note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          )}

          {note && !isNew && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete note"
              data-testid="button-delete-note"
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              saveSuccess
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
            data-testid="button-save-note"
          >
            {saveSuccess ? (
              <><Check size={13} /> Saved</>
            ) : (
              <><Save size={13} /> {saving ? "Saving..." : "Save"}</>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor - main area */}
      <div className="flex-1 min-h-0 p-4">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={language}
          placeholder="// Your code here..."
          data-testid="textarea-code"
        />
      </div>

      {/* Description + Tags */}
      <div className="border-t border-border bg-card px-4 py-3 space-y-3">
        <div>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description, notes, or context..."
            rows={2}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring resize-none transition-colors"
            data-testid="textarea-description"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <TagIcon size={12} className="text-muted-foreground flex-shrink-0" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-accent/15 text-accent border border-accent/20"
                data-testid={`tag-${tag}`}
              >
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                  data-testid={`button-remove-tag-${tag}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder="Add tag..."
              className="flex-1 min-w-[80px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              data-testid="input-tag"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
