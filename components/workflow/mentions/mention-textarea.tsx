"use client";

import {
  filterMentionSuggestions,
  getActiveMentionQuery,
  insertMentionAt,
  type MentionSuggestion,
} from "@/lib/mention-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MentionTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: MentionSuggestion[];
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
};

export function MentionTextarea({
  value,
  onChange,
  suggestions,
  placeholder,
  rows = 3,
  className = "",
  disabled = false,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const activeMention = useMemo(
    () => getActiveMentionQuery(value, cursor),
    [value, cursor],
  );

  const filtered = useMemo(() => {
    if (!activeMention) return [];
    return filterMentionSuggestions(suggestions, activeMention.query);
  }, [activeMention, suggestions]);

  const mentionActive = Boolean(activeMention);
  const showPanel = mentionActive;
  const showList = showPanel && filtered.length > 0;
  const showNoMatches = showPanel && filtered.length === 0 && suggestions.length > 0;
  const showNoPeople = showPanel && suggestions.length === 0;

  useEffect(() => {
    if (mentionActive) setHighlightIndex(0);
  }, [mentionActive, activeMention?.query]);

  const syncCursor = useCallback(() => {
    const el = textareaRef.current;
    if (el) setCursor(el.selectionStart ?? 0);
  }, []);

  const pickSuggestion = useCallback(
    (item: MentionSuggestion) => {
      if (!activeMention) return;
      const { value: next, cursor: nextCursor } = insertMentionAt(
        value,
        activeMention.start,
        activeMention.end,
        item.handle,
      );
      onChange(next);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
        setCursor(nextCursor);
      });
    },
    [activeMention, onChange, value],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showList) {
      if (mentionActive && e.key === "Escape") e.preventDefault();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pickSuggestion(filtered[highlightIndex]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          let pos = e.target.selectionStart ?? next.length;
          if (pos === 0 && /@([a-zA-Z0-9._-]*)$/.test(next)) pos = next.length;
          setCursor(pos);
        }}
        onClick={syncCursor}
        onKeyUp={syncCursor}
        onSelect={syncCursor}
        onKeyDown={onKeyDown}
        className={
          className ||
          "w-full bg-transparent px-3 py-2.5 text-sm outline-none resize-none placeholder:text-(--muted-2) text-(--foreground)"
        }
      />

      {showPanel && (
        <ul
          role="listbox"
          className="absolute left-2 right-2 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-md border border-(--border-strong) bg-(--surface-1) shadow-lg py-1"
        >
          {showNoPeople ? (
            <li className="px-3 py-2 text-xs text-(--muted-2)">
              No people to mention. Add project members or employees in Store.
            </li>
          ) : showNoMatches ? (
            <li className="px-3 py-2 text-xs text-(--muted-2)">
              No matches for &quot;{activeMention?.query}&quot;
            </li>
          ) : showList ? (
            filtered.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === highlightIndex}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    index === highlightIndex
                      ? "bg-sky-100 text-sky-900"
                      : "text-(--foreground) hover:bg-(--surface-3)"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickSuggestion(item);
                  }}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="h-6 w-6 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-center shrink-0">
                      {item.label.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-(--muted-2) ml-1">@{item.handle}</span>
                  </span>
                </button>
              </li>
            ))
          ) : null}
        </ul>
      )}
    </div>
  );
}
