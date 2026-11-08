import { useState } from 'react';
import Markdown from './Markdown.jsx';

/**
 * Textarea with a Write / Preview toggle.
 * `markdown={false}` turns it into a plain textarea (no preview tab).
 */
export default function MarkdownEditor({
  value, onChange, placeholder, minRows = 10, markdown = true, autoFocus = false,
}) {
  const [tab, setTab] = useState('write');

  return (
    <div className="md-editor">
      {markdown && (
        <div className="md-editor-tabs" role="tablist">
          {['write', 'preview'].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`md-editor-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'write' ? 'Write' : 'Preview'}
            </button>
          ))}
          <span className="md-editor-hint">Markdown supported</span>
        </div>
      )}

      {tab === 'write' || !markdown ? (
        <textarea
          className="md-editor-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          autoFocus={autoFocus}
        />
      ) : (
        <div className="md-editor-preview">
          {value?.trim()
            ? <Markdown>{value}</Markdown>
            : <p className="md-editor-empty">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
