import { tagColor } from '../utils/tagColor';
import './TagChip.css';

export default function TagChip({ name, onRemove }) {
  const [bg, text] = tagColor(name);
  return (
    <span className="tag-chip" style={{ '--tag-bg': bg, '--tag-text': text }}>
      {name}
      {onRemove && (
        <button className="tag-remove" onClick={e => { e.stopPropagation(); onRemove(); }} title="Remove tag">
          ✕
        </button>
      )}
    </span>
  );
}
