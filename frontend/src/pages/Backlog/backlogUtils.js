// Progress on a checklist isn't "bad" when it's low — it's just early in the week.
// So unlike the attendance meter on the dashboard, this ramp only turns green on completion.
export const meterColor = (pct) => (pct >= 100 ? '#10b981' : '#3b82f6');

// Same rotation the month cards use, so the two sections of the app feel related
export const SECTION_GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
  'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
  'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #06b6d4 100%)',
];

export const gradientFor = (i) => SECTION_GRADIENTS[i % SECTION_GRADIENTS.length];

export const PRIORITY_STYLES = {
  high:   { label: 'High',   color: '#ef4444', bg: '#fff5f5', border: '#fee2e2' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
  low:    { label: 'Low',    color: '#3b82f6', bg: '#eff6ff', border: '#dbeafe' },
};

// ─── Local rollup ───────────────────────────────────────────
// Mirrors recomputeSubsection/Section/Week in backlogController.js so an
// optimistic toggle shows exactly the state the API confirms a moment later.

const rollupSubsection = (sub) => {
  const total = sub.steps.length;
  const done  = sub.steps.filter((s) => s.isDone).length;
  return {
    ...sub,
    // A subsection with no steps is a leaf task — keep whatever was ticked by hand
    isDone: total > 0 ? done === total : sub.isDone,
    progress: { done, total },
  };
};

const rollupSection = (section) => {
  const subsections = section.subsections.map(rollupSubsection);
  return {
    ...section,
    subsections,
    isDone: subsections.length > 0 && subsections.every((s) => s.isDone),
    progress: {
      done:     subsections.reduce((n, s) => n + s.progress.done, 0),
      total:    subsections.reduce((n, s) => n + s.progress.total, 0),
      subDone:  subsections.filter((s) => s.isDone).length,
      subTotal: subsections.length,
    },
  };
};

export const rollupWeek = (week) => {
  const sections = week.sections.map(rollupSection);
  return {
    ...week,
    sections,
    isDone: sections.length > 0 && sections.every((s) => s.isDone),
  };
};

// ─── Optimistic tree edits ──────────────────────────────────
// Every step-level change is applied in place rather than refetched. Adding five
// steps in a row would otherwise fire five overlapping GETs whose responses can
// land out of order and clobber each other.

// Replace one subsection, then re-roll the whole tree
const mapSubsection = (week, subsectionId, fn) => rollupWeek({
  ...week,
  sections: week.sections.map((sec) => ({
    ...sec,
    subsections: sec.subsections.map((sub) => (sub._id === subsectionId ? fn(sub) : sub)),
  })),
});

export const setStepDone = (week, subsectionId, stepId, isDone) =>
  mapSubsection(week, subsectionId, (sub) => ({
    ...sub,
    steps: sub.steps.map((st) => (st._id === stepId ? { ...st, isDone } : st)),
  }));

export const appendSteps = (week, subsectionId, steps) =>
  mapSubsection(week, subsectionId, (sub) => ({ ...sub, steps: [...sub.steps, ...steps] }));

export const removeStep = (week, subsectionId, stepId) =>
  mapSubsection(week, subsectionId, (sub) => ({
    ...sub,
    steps: sub.steps.filter((st) => st._id !== stepId),
  }));

export const renameStep = (week, subsectionId, stepId, title) =>
  mapSubsection(week, subsectionId, (sub) => ({
    ...sub,
    steps: sub.steps.map((st) => (st._id === stepId ? { ...st, title } : st)),
  }));

// Ticking a subsection ticks every step under it
export const setSubsectionDone = (week, subsectionId, isDone) =>
  mapSubsection(week, subsectionId, (sub) => ({
    ...sub,
    isDone,
    steps: sub.steps.map((st) => ({ ...st, isDone })),
  }));

// Ticking a section ticks every subsection and step under it
export const setSectionDone = (week, sectionId, isDone) => rollupWeek({
  ...week,
  sections: week.sections.map((sec) =>
    sec._id !== sectionId ? sec : {
      ...sec,
      isDone,
      subsections: sec.subsections.map((sub) => ({
        ...sub,
        isDone,
        steps: sub.steps.map((st) => ({ ...st, isDone })),
      })),
    }
  ),
});

// Move an item one slot up or down, returning the reordered array
export const moveItem = (items, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= items.length) return null;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};
