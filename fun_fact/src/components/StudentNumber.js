// file: src/components/StudentNumber.js
// Renders a student number (DR-4824-25) with the discriminating middle digits
// emphasised and the constant "DR-" prefix / intake-year suffix de-emphasised,
// so instructors can scan a roster by the only part that actually differs.
// Falls back to rendering the raw string unchanged if it isn't the expected shape.

'use client';

// DR-####-## or DR-#####-##  (archived ids may carry a ~suffix, which we drop)
const NUMBER_RE = /^(DR-)(\d{4,5})(-\d{2})(?:~.*)?$/i;

export default function StudentNumber({ value, className = '', size = 'default' }) {
  if (!value) return null;

  const match = String(value).match(NUMBER_RE);

  // Unknown format — render as-is rather than mangling it
  if (!match) {
    return (
      <span className={`font-mono tabular-nums text-gray-700 ${className}`}>
        {value}
      </span>
    );
  }

  const [, prefix, core, suffix] = match;
  const coreSize = size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <span
      className={`font-mono tabular-nums whitespace-nowrap ${className}`}
      title={String(value)}
    >
      <span className="text-gray-400">{prefix}</span>
      <span className={`font-semibold text-gray-900 ${coreSize}`}>{core}</span>
      <span className="text-gray-400">{suffix}</span>
    </span>
  );
}
