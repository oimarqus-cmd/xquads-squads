import './TagChip.css';

const COLORS = [
  ['#ede9fe', '#5b21b6'], ['#dbeafe', '#1e40af'], ['#dcfce7', '#166534'],
  ['#fef9c3', '#854d0e'], ['#fce7f3', '#9d174d'], ['#ffedd5', '#9a3412'],
  ['#f1f5f9', '#334155'], ['#e0f2fe', '#075985'],
];

function tagColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

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
