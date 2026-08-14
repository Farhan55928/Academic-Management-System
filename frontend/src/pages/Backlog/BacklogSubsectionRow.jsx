import { useState } from 'react';
import {
  MdExpandMore, MdChevronRight, MdCheck,
  MdEdit, MdDelete, MdArrowUpward, MdArrowDownward,
} from 'react-icons/md';
import { PRIORITY_STYLES } from './backlogUtils.js';

export default function BacklogSubsectionRow({
  subsection, number, index, subsectionCount, isOpen, hideDone,
  onToggleOpen, onToggleSubsection, onToggleStep,
  onEdit, onDelete, onMove,
  onAddSteps, onRenameStep, onDeleteStep,
}) {
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const { done, total } = subsection.progress;
  const priority = PRIORITY_STYLES[subsection.priority];
  const visibleSteps = hideDone ? subsection.steps.filter((s) => !s.isDone) : subsection.steps;

  const submitDraft = () => {
    if (!draft.trim()) return;
    onAddSteps(subsection._id, draft);
    setDraft('');
  };

  const submitRename = (step) => {
    onRenameStep(subsection._id, step, editingText);
    setEditingId(null);
  };

  return (
    <div
      className={`backlog-subsection ${subsection.isDone ? 'is-done' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: subsection.isDone ? '#fafffc' : '#fff',
        // Longhand on every side — mixing `border` with `borderLeft` makes React
        // warn about shorthand/longhand conflicts on re-render
        borderTop: `1px solid ${hovered ? 'rgba(59,130,246,0.25)' : '#eef2f7'}`,
        borderRight: `1px solid ${hovered ? 'rgba(59,130,246,0.25)' : '#eef2f7'}`,
        borderBottom: `1px solid ${hovered ? 'rgba(59,130,246,0.25)' : '#eef2f7'}`,
        borderLeft: `3px solid ${subsection.isDone ? '#10b981' : '#dbeafe'}`,
        borderRadius: 18,
        boxShadow: hovered ? '0 6px 18px rgba(59,130,246,0.08)' : 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Subsection header ──────────────────────── */}
      <div className="backlog-subsection-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <button
          className="backlog-caret no-print"
          onClick={() => onToggleOpen(subsection._id)}
          aria-label={isOpen ? 'Collapse subsection' : 'Expand subsection'}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#cbd5e1', display: 'flex', flexShrink: 0 }}
        >
          {isOpen ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
        </button>

        <button
          className="backlog-check"
          onClick={() => onToggleSubsection(subsection)}
          title={subsection.isDone ? 'Mark not done' : 'Mark done'}
          style={{
            width: 26, height: 26, borderRadius: 9, flexShrink: 0,
            background: subsection.isDone ? '#10b981' : '#fff',
            border: `2px solid ${subsection.isDone ? '#10b981' : '#cbd5e1'}`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s', padding: 0,
          }}
        >
          {subsection.isDone && <MdCheck size={17} />}
        </button>

        {/* Numbering mirrors the printed sheet: 1.1, 1.2, 4.3 … */}
        <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 26 }}>
          {number}
        </span>

        <span className="backlog-subsection-title" style={{
          flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700,
          color: subsection.isDone ? '#94a3b8' : '#0f172a',
          textDecoration: subsection.isDone ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
        }}>
          {subsection.title}
        </span>

        {priority && (
          <span style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '3px 10px', borderRadius: 999, flexShrink: 0,
            background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`,
          }}>
            {priority.label}
          </span>
        )}

        {total > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 800, color: '#64748b', fontVariantNumeric: 'tabular-nums',
            background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, flexShrink: 0,
          }}>
            {done}/{total}
          </span>
        )}

        <div className="no-print" style={{ display: 'flex', gap: 5, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <MiniBtn title="Move up" disabled={index === 0} onClick={() => onMove(index, -1)}>
            <MdArrowUpward size={14} />
          </MiniBtn>
          <MiniBtn title="Move down" disabled={index === subsectionCount - 1} onClick={() => onMove(index, 1)}>
            <MdArrowDownward size={14} />
          </MiniBtn>
          <MiniBtn title="Edit subsection" onClick={() => onEdit(subsection)}>
            <MdEdit size={14} />
          </MiniBtn>
          <MiniBtn title="Delete subsection" danger onClick={() => onDelete(subsection)}>
            <MdDelete size={14} />
          </MiniBtn>
        </div>
      </div>

      {/* ── Steps: always rendered so the print stylesheet can force it open ── */}
      <div className={`backlog-body ${isOpen ? '' : 'is-collapsed'}`} style={{ padding: '0 18px 14px 56px' }}>
        {visibleSteps.map((step) => (
          <StepRow
            key={step._id}
            step={step}
            editing={editingId === step._id}
            editingText={editingText}
            setEditingText={setEditingText}
            onToggle={() => onToggleStep(subsection._id, step)}
            onStartEdit={() => { setEditingId(step._id); setEditingText(step.title); }}
            onSubmitEdit={() => submitRename(step)}
            onCancelEdit={() => setEditingId(null)}
            onDelete={() => onDeleteStep(subsection._id, step)}
          />
        ))}

        {/* Enter adds a step and keeps focus; pasting several lines adds one step per line */}
        <input
          className="backlog-step-add no-print"
          placeholder="Add a step and press Enter…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitDraft(); }}
          onBlur={submitDraft}
          style={{
            width: '100%', marginTop: 6, padding: '9px 14px',
            background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: 11,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#0f172a', outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderStyle = 'solid'; e.currentTarget.style.borderColor = '#3b82f6'; }}
          onBlurCapture={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        />
      </div>
    </div>
  );
}

function StepRow({ step, editing, editingText, setEditingText, onToggle, onStartEdit, onSubmitEdit, onCancelEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`backlog-step ${step.isDone ? 'is-done' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '7px 12px', borderRadius: 11,
        background: hovered ? '#f8fafc' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <button
        className="backlog-check"
        onClick={onToggle}
        title={step.isDone ? 'Mark not done' : 'Mark done'}
        style={{
          width: 20, height: 20, borderRadius: 7, flexShrink: 0, padding: 0,
          background: step.isDone ? '#10b981' : '#fff',
          border: `2px solid ${step.isDone ? '#10b981' : '#d5dde8'}`,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {step.isDone && <MdCheck size={13} />}
      </button>

      {editing ? (
        <input
          value={editingText}
          autoFocus
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={onSubmitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmitEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          style={{
            flex: 1, padding: '5px 10px', borderRadius: 9,
            border: '2px solid #3b82f6', outline: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, fontWeight: 500, color: '#0f172a',
          }}
        />
      ) : (
        <span className="backlog-step-title" style={{
          flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500,
          color: step.isDone ? '#b0bccd' : '#334155',
          textDecoration: step.isDone ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
        }}>
          {step.title}
        </span>
      )}

      <div className="no-print" style={{ display: 'flex', gap: 5, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
        <MiniBtn title="Rename step" onClick={onStartEdit}><MdEdit size={13} /></MiniBtn>
        <MiniBtn title="Delete step" danger onClick={onDelete}><MdDelete size={13} /></MiniBtn>
      </div>
    </div>
  );
}

function MiniBtn({ children, title, onClick, disabled, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28, height: 28, borderRadius: 9,
        background: danger ? '#fff5f5' : '#f8fafc',
        border: `1px solid ${danger ? '#fee2e2' : '#e8edf4'}`,
        color: danger ? '#ef4444' : '#94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.2s', padding: 0,
      }}
    >
      {children}
    </button>
  );
}
