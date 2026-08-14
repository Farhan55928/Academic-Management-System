import BacklogWeek from '../models/BacklogWeek.js';
import BacklogSection from '../models/BacklogSection.js';
import BacklogSubsection from '../models/BacklogSubsection.js';
import BacklogStep from '../models/BacklogStep.js';
import Course from '../models/Course.js';

// ─── Rollup helpers ─────────────────────────────────────────
// Steps are the source of truth. Every mutation ends by calling into this chain,
// which walks upward and only writes when a level's done state actually changed.

const recomputeWeek = async (weekId) => {
  const week = await BacklogWeek.findById(weekId);
  if (!week) return;

  const sections = await BacklogSection.find({ weekId });
  const isDone = sections.length > 0 && sections.every((s) => s.isDone);

  if (week.isDone !== isDone) {
    week.isDone = isDone;
    await week.save();
  }
};

const recomputeSection = async (sectionId) => {
  const section = await BacklogSection.findById(sectionId);
  if (!section) return;

  const subsections = await BacklogSubsection.find({ sectionId });
  const isDone = subsections.length > 0 && subsections.every((s) => s.isDone);

  if (section.isDone !== isDone) {
    section.isDone = isDone;
    await section.save();
  }

  await recomputeWeek(section.weekId);
};

const recomputeSubsection = async (subsectionId) => {
  const subsection = await BacklogSubsection.findById(subsectionId);
  if (!subsection) return;

  // A subsection with no steps is a leaf task — leave whatever was ticked by hand
  const steps = await BacklogStep.find({ subsectionId });
  if (steps.length > 0) {
    const isDone = steps.every((s) => s.isDone);
    if (subsection.isDone !== isDone) {
      subsection.isDone = isDone;
      await subsection.save();
    }
  }

  await recomputeSection(subsection.sectionId);
};

// ─── Weeks ──────────────────────────────────────────────────

// @desc   Get all backlog weeks for the logged-in user
// @route  GET /api/backlog/weeks?semesterId=
export const getWeeks = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.semesterId) filter.semester = req.query.semesterId;

    const weeks = await BacklogWeek.find(filter).sort({ weekNumber: -1 });
    if (weeks.length === 0) return res.json([]);

    const weekIds = weeks.map((w) => w._id);
    const [subsections, steps] = await Promise.all([
      BacklogSubsection.find({ weekId: { $in: weekIds } }),
      BacklogStep.find({ weekId: { $in: weekIds } })
    ]);

    // Step counts drive the meter; incomplete subsections drive the "unfinished" pill
    const tally = {};
    const bucket = (id) => {
      if (!tally[id]) tally[id] = { done: 0, total: 0, unfinished: 0 };
      return tally[id];
    };

    for (const step of steps) {
      const t = bucket(step.weekId.toString());
      t.total += 1;
      if (step.isDone) t.done += 1;
    }
    for (const sub of subsections) {
      const t = bucket(sub.weekId.toString());
      if (!sub.isDone) t.unfinished += 1;
    }

    const result = weeks.map((w) => {
      const t = tally[w._id.toString()] || { done: 0, total: 0, unfinished: 0 };
      return {
        ...w.toObject(),
        progress: { done: t.done, total: t.total },
        unfinished: t.unfinished
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get a single week with its full section → subsection → step tree
// @route  GET /api/backlog/weeks/:id
export const getWeekDetails = async (req, res) => {
  try {
    const week = await BacklogWeek.findById(req.params.id);
    if (!week || week.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Week not found' });
    }

    const [sections, subsections, steps] = await Promise.all([
      BacklogSection.find({ weekId: week._id }).sort({ order: 1, createdAt: 1 }),
      BacklogSubsection.find({ weekId: week._id }).sort({ order: 1, createdAt: 1 }),
      BacklogStep.find({ weekId: week._id }).sort({ order: 1, createdAt: 1 })
    ]);

    // Resolve codes for linked courses so headers can read "CSE 4614 — Technical Report Writing"
    const courseIds = sections.filter((s) => s.course).map((s) => s.course);
    const courses = courseIds.length > 0 ? await Course.find({ _id: { $in: courseIds } }) : [];
    const courseCodes = {};
    for (const course of courses) courseCodes[course._id.toString()] = course.code;

    // Group children by parent id
    const stepsBySubsection = {};
    for (const step of steps) {
      const id = step.subsectionId.toString();
      if (!stepsBySubsection[id]) stepsBySubsection[id] = [];
      stepsBySubsection[id].push(step);
    }

    const subsectionsBySection = {};
    for (const sub of subsections) {
      const id = sub.sectionId.toString();
      if (!subsectionsBySection[id]) subsectionsBySection[id] = [];
      subsectionsBySection[id].push(sub);
    }

    const tree = sections.map((section) => {
      const subs = (subsectionsBySection[section._id.toString()] || []).map((sub) => {
        const subSteps = stepsBySubsection[sub._id.toString()] || [];
        return {
          ...sub.toObject(),
          steps: subSteps,
          progress: { done: subSteps.filter((s) => s.isDone).length, total: subSteps.length }
        };
      });

      // The section counter spans every step beneath it, e.g. [3/25]
      return {
        ...section.toObject(),
        courseCode: section.course ? courseCodes[section.course.toString()] || null : null,
        subsections: subs,
        progress: {
          done: subs.reduce((n, s) => n + s.progress.done, 0),
          total: subs.reduce((n, s) => n + s.progress.total, 0),
          subDone: subs.filter((s) => s.isDone).length,
          subTotal: subs.length
        }
      };
    });

    res.json({ ...week.toObject(), sections: tree });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Create a backlog week (starts empty)
// @route  POST /api/backlog/weeks
export const createWeek = async (req, res) => {
  const { weekNumber, semester } = req.body;
  try {
    if (!weekNumber || !semester) {
      return res.status(400).json({ message: 'Week number and semester are required' });
    }

    const week = await BacklogWeek.create({
      userId: req.user._id,
      semester,
      weekNumber
    });
    res.status(201).json(week);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: `Week ${weekNumber} already exists for this semester` });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc   Update a week, or tick it (which cascades down to everything inside)
// @route  PUT /api/backlog/weeks/:id
export const updateWeek = async (req, res) => {
  try {
    const week = await BacklogWeek.findById(req.params.id);
    if (!week || week.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Week not found' });
    }

    const { weekNumber, semester, isDone } = req.body;
    if (weekNumber !== undefined) week.weekNumber = weekNumber;
    if (semester !== undefined) week.semester = semester;

    if (isDone !== undefined) {
      await Promise.all([
        BacklogSection.updateMany({ weekId: week._id }, { isDone }),
        BacklogSubsection.updateMany({ weekId: week._id }, { isDone }),
        BacklogStep.updateMany({ weekId: week._id }, { isDone })
      ]);
      week.isDone = isDone;
    }

    await week.save();
    res.json(week);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: `Week ${req.body.weekNumber} already exists for this semester` });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete a week and everything under it
// @route  DELETE /api/backlog/weeks/:id
export const deleteWeek = async (req, res) => {
  try {
    const week = await BacklogWeek.findById(req.params.id);
    if (!week || week.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Week not found' });
    }

    await BacklogStep.deleteMany({ weekId: week._id });
    await BacklogSubsection.deleteMany({ weekId: week._id });
    await BacklogSection.deleteMany({ weekId: week._id });
    await week.deleteOne();

    res.json({ message: 'Week and all related data removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Sections ───────────────────────────────────────────────

// @desc   Add a section to a week
// @route  POST /api/backlog/weeks/:weekId/sections
export const createSection = async (req, res) => {
  try {
    const week = await BacklogWeek.findById(req.params.weekId);
    if (!week || week.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Week not found' });
    }

    const { title, course } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const order = await BacklogSection.countDocuments({ weekId: week._id });
    const section = await BacklogSection.create({
      userId: req.user._id,
      weekId: week._id,
      title,
      course: course || null,
      order
    });

    // An empty new section leaves the week incomplete
    await recomputeWeek(week._id);
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Update a section, or tick it (which cascades down to its subsections and steps)
// @route  PUT /api/backlog/sections/:id
export const updateSection = async (req, res) => {
  try {
    const section = await BacklogSection.findById(req.params.id);
    if (!section || section.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const { title, course, isDone } = req.body;
    if (title !== undefined) section.title = title;
    if (course !== undefined) section.course = course || null;

    if (isDone !== undefined) {
      await Promise.all([
        BacklogSubsection.updateMany({ sectionId: section._id }, { isDone }),
        BacklogStep.updateMany({ sectionId: section._id }, { isDone })
      ]);
      section.isDone = isDone;
    }

    await section.save();
    await recomputeWeek(section.weekId);
    res.json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete a section and everything under it
// @route  DELETE /api/backlog/sections/:id
export const deleteSection = async (req, res) => {
  try {
    const section = await BacklogSection.findById(req.params.id);
    if (!section || section.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Section not found' });
    }

    await BacklogStep.deleteMany({ sectionId: section._id });
    await BacklogSubsection.deleteMany({ sectionId: section._id });
    await section.deleteOne();

    await recomputeWeek(section.weekId);
    res.json({ message: 'Section removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Subsections ────────────────────────────────────────────

// @desc   Add a subsection to a section
// @route  POST /api/backlog/sections/:sectionId/subsections
export const createSubsection = async (req, res) => {
  try {
    const section = await BacklogSection.findById(req.params.sectionId);
    if (!section || section.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const { title, priority } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const order = await BacklogSubsection.countDocuments({ sectionId: section._id });
    const subsection = await BacklogSubsection.create({
      userId: req.user._id,
      weekId: section.weekId,
      sectionId: section._id,
      title,
      priority: priority || 'none',
      order
    });

    // An unfinished new subsection un-completes the section and week above it
    await recomputeSection(section._id);
    res.status(201).json(subsection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Update a subsection, or tick it (which cascades down to its steps)
// @route  PUT /api/backlog/subsections/:id
export const updateSubsection = async (req, res) => {
  try {
    const subsection = await BacklogSubsection.findById(req.params.id);
    if (!subsection || subsection.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Subsection not found' });
    }

    const { title, priority, isDone } = req.body;
    if (title !== undefined) subsection.title = title;
    if (priority !== undefined) subsection.priority = priority;

    if (isDone !== undefined) {
      await BacklogStep.updateMany({ subsectionId: subsection._id }, { isDone });
      subsection.isDone = isDone;
    }

    await subsection.save();
    await recomputeSection(subsection.sectionId);
    res.json(subsection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete a subsection and its steps
// @route  DELETE /api/backlog/subsections/:id
export const deleteSubsection = async (req, res) => {
  try {
    const subsection = await BacklogSubsection.findById(req.params.id);
    if (!subsection || subsection.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Subsection not found' });
    }

    await BacklogStep.deleteMany({ subsectionId: subsection._id });
    await subsection.deleteOne();

    await recomputeSection(subsection.sectionId);
    res.json({ message: 'Subsection removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Steps ──────────────────────────────────────────────────

// @desc   Add a step to a subsection
// @route  POST /api/backlog/subsections/:subsectionId/steps
export const createStep = async (req, res) => {
  try {
    const subsection = await BacklogSubsection.findById(req.params.subsectionId);
    if (!subsection || subsection.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Subsection not found' });
    }

    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const order = await BacklogStep.countDocuments({ subsectionId: subsection._id });
    const step = await BacklogStep.create({
      userId: req.user._id,
      weekId: subsection.weekId,
      sectionId: subsection.sectionId,
      subsectionId: subsection._id,
      title,
      order
    });

    // A fresh unticked step un-completes everything above it
    await recomputeSubsection(subsection._id);
    res.status(201).json(step);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Update or tick a step — this is what drives the whole rollup
// @route  PUT /api/backlog/steps/:id
export const updateStep = async (req, res) => {
  try {
    const step = await BacklogStep.findById(req.params.id);
    if (!step || step.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Step not found' });
    }

    const { title, isDone } = req.body;
    if (title !== undefined) step.title = title;
    if (isDone !== undefined) step.isDone = isDone;

    await step.save();
    await recomputeSubsection(step.subsectionId);
    res.json(step);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete a step
// @route  DELETE /api/backlog/steps/:id
export const deleteStep = async (req, res) => {
  try {
    const step = await BacklogStep.findById(req.params.id);
    if (!step || step.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Step not found' });
    }

    await step.deleteOne();

    // Removing the last unticked step can complete the subsection
    await recomputeSubsection(step.subsectionId);
    res.json({ message: 'Step removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reordering ─────────────────────────────────────────────

// @desc   Rewrite sibling order from a full ordered list of ids
// @route  PUT /api/backlog/reorder
export const reorder = async (req, res) => {
  try {
    const { type, ids } = req.body;
    const models = {
      section: BacklogSection,
      subsection: BacklogSubsection,
      step: BacklogStep
    };
    const Model = models[type];

    if (!Model || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'A valid type and an array of ids are required' });
    }

    // Scoped to the owner, so ids from another user are silently skipped
    await Promise.all(
      ids.map((id, index) => Model.updateOne({ _id: id, userId: req.user._id }, { order: index }))
    );

    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
