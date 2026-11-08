import { useState } from 'react';
import { flagEmoji } from './countries.js';

// Windows has no flag emoji glyphs (🇩🇪 renders as "DE"), so use a real image
// and only fall back to the emoji if the image can't load.
export default function Flag({ code, size = 24, className = '' }) {
  const [failed, setFailed] = useState(false);
  const valid = /^[A-Z]{2}$/i.test(code ?? '');

  if (!valid || failed) {
    return <span className={`flag flag-emoji ${className}`} style={{ fontSize: size * 0.9 }}>{flagEmoji(code)}</span>;
  }

  return (
    <img
      className={`flag ${className}`}
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      alt=""
      width={Math.round(size * 4 / 3)}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
