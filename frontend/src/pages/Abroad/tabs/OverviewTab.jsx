import { useState } from 'react';
import { MdEdit, MdDescription } from 'react-icons/md';
import Markdown from '../../../components/UI/Markdown.jsx';
import MarkdownEditor from '../../../components/UI/MarkdownEditor.jsx';

export default function OverviewTab({ country, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(country.overview ?? '');

  const start = () => { setDraft(country.overview ?? ''); setEditing(true); };
  const save = async () => { if (await onSave(draft)) setEditing(false); };

  if (editing) {
    return (
      <div className="abroad-panel">
        <MarkdownEditor
          value={draft}
          onChange={setDraft}
          minRows={16}
          autoFocus
          placeholder={'Paste your overview here.\n\n## Why this country\n- …\n\n## Costs\n| Item | Per month |\n|---|---|\n| Rent | €450 |'}
        />
        <div className="abroad-panel-actions">
          <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save overview'}
          </button>
        </div>
      </div>
    );
  }

  if (!country.overview?.trim()) {
    return (
      <div className="abroad-tab-empty">
        <MdDescription size={36} />
        <h3>No overview yet</h3>
        <p>Paste a markdown write-up of everything you know about studying in {country.name}. Headings, lists, tables and links all render.</p>
        <button className="btn btn-primary" onClick={start}><MdEdit size={16} /> Write overview</button>
      </div>
    );
  }

  return (
    <article className="abroad-panel abroad-overview">
      <button className="btn btn-outline btn-sm abroad-panel-edit" onClick={start}>
        <MdEdit size={15} /> Edit
      </button>
      <Markdown>{country.overview}</Markdown>
    </article>
  );
}
