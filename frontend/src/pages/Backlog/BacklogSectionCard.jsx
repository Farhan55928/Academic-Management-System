import { useState } from 'react';
import {
  MdExpandMore, MdChevronRight, MdCheck,
  MdAdd, MdEdit, MdDelete, MdArrowUpward, MdArrowDownward,
} from 'react-icons/md';
import BacklogSubsectionRow from './BacklogSubsectionRow.jsx';
import { meterColor, gradientFor } from './backlogUtils.js';

export default function BacklogSectionCard({
  section, index, sectionCount, open, hideDone,
  onToggleOpen, onToggleSection, onToggleSubsection, onToggleStep,
  onEditSection, onDeleteSection, onMoveSection,
  onAddSubsection, onEditSubsection, onDeleteSubsection, onMoveSubsection,
  onAddSteps, onRenameStep, onDeleteStep,
}) {
  const [hovered, setHovered] = useState(false);

  const isOpen = open.has(section._id);
  const { done, total } = section.progress;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const accent = section.isDone ? '#10b981' : '#3b82f6';
  const gradient = section.isDone
    ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
    : gradientFor(index);

  const visibleSubsections = hideDone
    ? section.subsections.filter((s) => !s.isDone)
    : section.subsections;

  return (
    <div
      className={`backlog-section ${section.isDone ? 'is-done' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: hovered ? `2px solid ${accent}33` : '2px solid transparent',
        borderRadius: 28,
        boxShadow: hovered ? `0 12px 32px ${accent}1f` : '0 4px 24px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="backlog-stripe" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: gradient }} />

      {/* ── Section header ─────────────────────────── */}
      <div className="backlog-section-header" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 28px 22px' }}>
        <button
          className="backlog-caret no-print"
          onClick={() => onToggleOpen(section._id)}
          aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex', flexShrink: 0 }}
        >
          {isOpen ? <MdExpandMore size={24} /> : <MdChevronRight size={24} />}
        </button>

        {/* Number badge — mirrors the "1", "2", "3" numbering of the printed sheet */}
        <div className="backlog-section-badge" style={{
          width: 52, height: 52, borderRadius: 16, background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{index + 1}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em',
            color: section.isDone ? '#94a3b8' : '#0f172a',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: 4, overflowWrap: 'anywhere',
          }}>
            {section.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>
              {section.progress.subTotal} {section.progress.subTotal === 1 ? 'item' : 'items'}
              {section.courseCode ? ` • ${section.courseCode}` : ''}
            </p>
            {section.isDone && (
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 999, background: '#f0fdf4', color: '#10b981', border: '1px solid #dcfce7' }}>
                Complete
              </span>
            )}
          </div>
        </div>

        {/* Progress pill */}
        <div className="backlog-section-meta" style={{
          textAlign: 'right', background: `${accent}0f`, border: `1px solid ${accent}1f`,
          padding: '8px 18px', borderRadius: 14, flexShrink: 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>Steps</p>
          <p style={{ fontSize: 19, fontWeight: 900, color: section.isDone ? '#10b981' : '#1a2f5e', fontVariantNumeric: 'tabular-nums' }}>
            {done}/{total}
          </p>
        </div>

        {/* Actions */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onToggleSection(section)}
            title={section.isDone ? 'Mark section not done' : 'Mark whole section done'}
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: section.isDone ? '#10b981' : '#f8fafc',
              border: `1px solid ${section.isDone ? '#10b981' : '#e2e8f0'}`,
              color: section.isDone ? '#fff' : '#cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <MdCheck size={22} />
          </button>

          <div style={{ display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
            <IconBtn title="Move up" disabled={index === 0} onClick={() => onMoveSection(index, -1)}>
              <MdArrowUpward size={16} />
            </IconBtn>
            <IconBtn title="Move down" disabled={index === sectionCount - 1} onClick={() => onMoveSection(index, 1)}>
              <MdArrowDownward size={16} />
            </IconBtn>
            <IconBtn title="Edit section" onClick={() => onEditSection(section)}>
              <MdEdit size={16} />
            </IconBtn>
            <IconBtn title="Delete section" danger onClick={() => onDeleteSection(section)}>
              <MdDelete size={16} />
            </IconBtn>
          </div>
        </div>
      </div>

      {/* Progress rail */}
      <div className="backlog-rail" style={{ padding: '0 28px 18px' }}>
        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: meterColor(pct), borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* ── Body: always rendered so the print stylesheet can force it open ── */}
      <div className={`backlog-body ${isOpen ? '' : 'is-collapsed'}`} style={{ padding: '0 28px 24px' }}>
        {visibleSubsections.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0 4px' }}>
            {section.subsections.length === 0 ? 'No subsections yet.' : 'All subsections complete.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleSubsections.map((sub) => (
              <BacklogSubsectionRow
                key={sub._id}
                subsection={sub}
                number={`${index + 1}.${section.subsections.indexOf(sub) + 1}`}
                index={section.subsections.indexOf(sub)}
                subsectionCount={section.subsections.length}
                isOpen={open.has(sub._id)}
                hideDone={hideDone}
                onToggleOpen={onToggleOpen}
                onToggleSubsection={onToggleSubsection}
                onToggleStep={onToggleStep}
                onEdit={onEditSubsection}
                onDelete={onDeleteSubsection}
                onMove={(i, dir) => onMoveSubsection(section, i, dir)}
                onAddSteps={onAddSteps}
                onRenameStep={onRenameStep}
                onDeleteStep={onDeleteStep}
              />
            ))}
          </div>
        )}

        <button
          className="no-print"
          onClick={() => onAddSubsection(section._id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '12px 20px', borderRadius: 14, width: '100%',
            background: '#f8fafc', border: '1px dashed #cbd5e1',
            color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
        >
          <MdAdd size={17} /> Add subsection
        </button>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, disabled, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36, height: 36, borderRadius: 11,
        background: danger ? '#fff5f5' : '#f8fafc',
        border: `1px solid ${danger ? '#fee2e2' : '#e2e8f0'}`,
        color: danger ? '#ef4444' : '#94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}
