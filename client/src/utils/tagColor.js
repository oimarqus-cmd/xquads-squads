const COLORS = [
  ['#ede9fe', '#5b21b6'], ['#dbeafe', '#1e40af'], ['#dcfce7', '#166534'],
  ['#fef9c3', '#854d0e'], ['#fce7f3', '#9d174d'], ['#ffedd5', '#9a3412'],
  ['#f1f5f9', '#334155'], ['#e0f2fe', '#075985'],
];

export function tagColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

// Returns the chart-suitable color: bg in light mode, brightened text in dark mode.
// Pass isDark=true when the app is in dark mode.
export function tagChartColor(name, isDark = false) {
  const [bg, text] = tagColor(name);
  return isDark ? bg : text;
}
