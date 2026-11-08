import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { MdAdd, MdPushPin, MdOutlinePushPin, MdStickyNote2, MdSearch, MdArrowForward } from 'react-icons/md';
import toast from 'react-hot-toast';
import { errorMessage } from '../../../api/errors.js';
import { formatDate } from '../countries.js';
import NoteModal from '../NoteModal.jsx';

export default function NotesTab({ list, items }) {
  const { countryId } = useParams();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null);

  const allTags = useMemo(() => [...new Set(list.flatMap((n) => n.tags ?? []))].sort(), [list]);

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...list]
      .filter((n) => !tag || n.tags?.includes(tag))
      .filter((n) => !q || `${n.title} ${(n.tags ?? []).join(' ')} ${n.content}`.toLowerCase().includes(q))
      .sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updatedAt) - new Date(a.updatedAt)));
  }, [list, query, tag]);

  const create = async (form) => {
    try {
      await items.add('notes', form);
      setCreating(false);
    } catch (err) { toast.error(errorMessage(err, 'Failed to save')); }
  };

  const togglePin = (e, n) => {
    e.preventDefault();
    items.patch('notes', n._id, { pinned: !n.pinned });
  };

  return (
    <div>
      <div className="abroad-tab-head">
        <p className="abroad-kicker">Notes</p>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><MdAdd size={16} /> New note</button>
      </div>

      {list.length > 0 && (list.length > 4 || allTags.length > 0) && (
        <div className="notes-toolbar">
          {list.length > 4 && (
            <div className="notes-search">
              <MdSearch size={18} />
              <input className="form-input" placeholder="Search notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}
          {allTags.length > 0 && (
            <div className="notes-tag-filter">
              <button className={`note-tag is-filter ${!tag ? 'active' : ''}`} onClick={() => setTag(null)}>All</button>
              {allTags.map((t) => (
                <button key={t} className={`note-tag is-filter ${tag === t ? 'active' : ''}`} onClick={() => setTag(tag === t ? null : t)}>#{t}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div className="abroad-tab-empty">
          <MdStickyNote2 size={36} />
          <h3>No notes yet</h3>
          <p>Each note gets its own card here and opens on a full reading page. Write in markdown or plain text.</p>
        </div>
      ) : notes.length === 0 ? (
        <p className="abroad-muted-line">No notes match.</p>
      ) : (
        <div className="note-grid">
          {notes.map((n) => (
            <Link key={n._id} to={`/abroad/${countryId}/notes/${n._id}`} className={`note-tile ${n.pinned ? 'is-pinned' : ''}`}>
              <div className="note-tile-head">
                <span className="note-tile-date">{formatDate(n.updatedAt)}</span>
                <button
                  className={`note-pin ${n.pinned ? 'active' : ''}`}
                  onClick={(e) => togglePin(e, n)}
                  aria-label={n.pinned ? 'Unpin note' : 'Pin note'}
                  title={n.pinned ? 'Unpin' : 'Pin'}
                >
                  {n.pinned ? <MdPushPin size={16} /> : <MdOutlinePushPin size={16} />}
                </button>
              </div>
              <h3 className="note-tile-title">{n.title || 'Untitled note'}</h3>
              <div className="note-tile-foot">
                <div className="note-tile-tags">
                  {(n.tags ?? []).map((t) => <span key={t} className="note-tag">#{t}</span>)}
                </div>
                <span className="note-tile-open">Read <MdArrowForward size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {creating && <NoteModal initial={{}} onClose={() => setCreating(false)} onSave={create} />}
    </div>
  );
}
