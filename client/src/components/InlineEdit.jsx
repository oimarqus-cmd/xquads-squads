import { useState, useEffect, useRef } from 'react';
import './InlineEdit.css';

export default function InlineEdit({ value, onSave, className = '', multiline = false, placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [editing, multiline]);

  function start() { setDraft(value); setEditing(true); }

  function save() {
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); save(); }
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    const Tag = multiline ? 'textarea' : 'input';
    return (
      <Tag
        ref={inputRef}
        className={`inline-input ${className}`}
        value={draft}
        placeholder={placeholder}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={onKey}
        rows={multiline ? 2 : undefined}
      />
    );
  }

  return (
    <span className={`inline-value ${className}`} onClick={start} title="Click to edit">
      {value || <span className="inline-placeholder">{placeholder}</span>}
      <span className="edit-icon">✏️</span>
    </span>
  );
}
