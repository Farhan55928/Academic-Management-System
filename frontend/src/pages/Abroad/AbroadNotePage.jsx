import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MdArrowBack, MdEdit, MdDelete, MdPushPin, MdOutlinePushPin } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getCountry, updateItem, deleteItem } from '../../api/abroad.js';
import { errorMessage } from '../../api/errors.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import ErrorState from '../../components/UI/ErrorState.jsx';
import Markdown from '../../components/UI/Markdown.jsx';
import Flag from './Flag.jsx';
import NoteModal from './NoteModal.jsx';
import { formatDate } from './countries.js';

// A single note on its own page, laid out for long-form reading
export default function AbroadNotePage() {
  const { countryId, noteId } = useParams();
  const navigate = useNavigate();
  const back = `/abroad/${countryId}#notes`;

  const { data, loading, error, reload } = useAsyncData(
    (signal) => getCountry(countryId, signal).then((r) => r.data),
    [countryId]
  );

  const [note, setNote] = useState(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (data) setNote(data.notes.find((n) => n._id === noteId) ?? null); }, [data, noteId]);

  if (loading && !data) return (
    <div className="abroad-loading" style={{ minHeight: '60vh' }}><div className="loading loading-spinner loading-lg text-blue" /></div>
  );
  if (error) return <div className="page-wrapper"><ErrorState description={error.message} onRetry={reload} /></div>;
  if (!note) return (
    <div className="page-wrapper">
      <ErrorState title="Note not found" description="It may have been deleted." />
      <div style={{ textAlign: 'center', marginTop: 16 }}><Link className="btn btn-outline" to={back}>Back to notes</Link></div>
    </div>
  );

  const save = async (form) => {
    try {
      const { data: doc } = await updateItem('notes', note._id, form);
      setNote(doc);
      setEditing(false);
      toast.success('Note saved');
    } catch (err) { toast.error(errorMessage(err, 'Failed to save')); }
  };

  const togglePin = async () => {
    const pinned = !note.pinned;
    setNote((n) => ({ ...n, pinned }));
    try { await updateItem('notes', note._id, { pinned }); }
    catch (err) { setNote((n) => ({ ...n, pinned: !pinned })); toast.error(errorMessage(err, 'Failed to save')); }
  };

  const remove = async () => {
    if (!confirm(`Delete "${note.title || 'this note'}"?`)) return;
    try {
      await deleteItem('notes', note._id);
      toast.success('Note deleted');
      navigate(back);
    } catch (err) { toast.error(errorMessage(err, 'Failed to delete')); }
  };

  return (
    <div className="abroad-page note-page">
      <div className="note-page-bar">
        <Link to={back} className="note-page-back">
          <MdArrowBack size={18} />
          <Flag code={data.code} size={16} />
          <span>{data.name} · Notes</span>
        </Link>
        <div className="note-page-actions">
          <button className="btn btn-ghost btn-icon" onClick={togglePin} aria-label={note.pinned ? 'Unpin' : 'Pin'} title={note.pinned ? 'Unpin' : 'Pin'}>
            {note.pinned ? <MdPushPin size={18} style={{ color: 'var(--amber)' }} /> : <MdOutlinePushPin size={18} />}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><MdEdit size={15} /> Edit</button>
          <button className="btn btn-ghost btn-icon is-danger" onClick={remove} aria-label="Delete note" title="Delete"><MdDelete size={18} /></button>
        </div>
      </div>

      <article className="note-sheet">
        <header className="note-sheet-head">
          <h1>{note.title || 'Untitled note'}</h1>
          {note.tags?.length > 0 && (
            <div className="note-tile-tags">{note.tags.map((t) => <span key={t} className="note-tag">#{t}</span>)}</div>
          )}
          <p className="note-sheet-meta">
            Updated {formatDate(note.updatedAt)} · {note.format === 'markdown' ? 'Markdown' : 'Plain text'}
          </p>
        </header>
        {note.format === 'markdown'
          ? <Markdown className="note-sheet-body">{note.content}</Markdown>
          : <p className="note-plain note-sheet-body">{note.content}</p>}
      </article>

      {editing && <NoteModal initial={note} onClose={() => setEditing(false)} onSave={save} />}
    </div>
  );
}
