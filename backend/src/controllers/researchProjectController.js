import ResearchProject from '../models/ResearchProject.js';
import Paper from '../models/Paper.js';
import { deleteDriveFile } from '../services/googleDriveService.js';

// @desc    Get all research projects for the current user
// @route   GET /api/research/projects
export const getProjects = async (req, res) => {
  try {
    const projects = await ResearchProject.find({ userId: req.user._id })
      .sort({ updatedAt: -1 });
    // Attach paper counts in a single aggregate — saves one round-trip per
    // page load compared to populating.
    const counts = await Paper.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$researchProjectId', count: { $sum: 1 }, lastUpload: { $max: '$createdAt' } } },
    ]);
    const byProject = Object.fromEntries(counts.map(c => [String(c._id), c]));
    const enriched = projects.map(p => {
      const o = p.toObject();
      const c = byProject[String(p._id)];
      o.paperCount = c?.count || 0;
      o.lastUploadAt = c?.lastUpload || null;
      return o;
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

// @desc    Create a research project
// @route   POST /api/research/projects
export const addProject = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ code: 'MISSING_FIELDS', message: 'Project name is required' });
    }
    const project = await ResearchProject.create({
      userId: req.user._id,
      name: name.trim(),
      description: (description || '').trim(),
      color: color || '#1e3a6e',
    });
    res.status(201).json(project);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ code: 'DUPLICATE_NAME', message: 'You already have a project with that name' });
    }
    res.status(400).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

// @desc    Update a research project
// @route   PUT /api/research/projects/:id
export const updateProject = async (req, res) => {
  try {
    const project = await ResearchProject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ code: 'NOT_FOUND', message: 'Project not found' });

    const { name, description, color } = req.body;
    if (typeof name === 'string' && name.trim()) project.name = name.trim();
    if (typeof description === 'string') project.description = description.trim();
    if (typeof color === 'string') project.color = color;

    await project.save();
    res.json(project);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ code: 'DUPLICATE_NAME', message: 'You already have a project with that name' });
    }
    res.status(400).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

// @desc    Delete a research project and all its papers
// @route   DELETE /api/research/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await ResearchProject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ code: 'NOT_FOUND', message: 'Project not found' });

    // Cascade-delete all child papers. Best-effort Drive cleanup — if the
    // user revoked our token, the file is already orphaned anyway.
    const papers = await Paper.find({ researchProjectId: project._id });
    const fullUser = req.user.fullUser || req.user;
    for (const paper of papers) {
      if (paper.driveFileId && fullUser.googleRefreshToken) {
        try { await deleteDriveFile(fullUser, paper.driveFileId); } catch (e) {
          console.warn('[deleteProject] drive cleanup failed for', paper.driveFileId, e?.message);
        }
      }
    }
    await Paper.deleteMany({ researchProjectId: project._id });
    await project.deleteOne();

    res.json({ message: 'Project and its papers removed' });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};
