import ResearchProject from '../models/ResearchProject.js';
import Paper from '../models/Paper.js';
import {
  uploadPdfToDrive,
  deleteDriveFile,
} from '../services/googleDriveService.js';
import { generateSummaryAsync } from '../services/summaryService.js';

async function findOwnedProject(req, projectId) {
  return ResearchProject.findOne({ _id: projectId, userId: req.user._id });
}

async function findOwnedPaper(req, paperId) {
  return Paper.findOne({ _id: paperId, userId: req.user._id });
}

/**
 * GET /api/research/papers?projectId=...
 * Lists the user's papers, optionally filtered to one project. Sorted
 * newest first. Excludes the (potentially large) summaryMarkdown body to
 * keep the listing payload tight — the detail page fetches the full doc.
 */
export const getPapers = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.projectId) filter.researchProjectId = req.query.projectId;

    const papers = await Paper.find(filter)
      .select('-summaryMarkdown')
      .sort({ createdAt: -1 });

    res.json(papers);
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * GET /api/research/papers/:id
 * Full paper doc including summaryMarkdown. The detail page polls this
 * while summaryStatus !== 'ready'.
 */
export const getPaperById = async (req, res) => {
  try {
    const paper = await findOwnedPaper(req, req.params.id);
    if (!paper) return res.status(404).json({ code: 'NOT_FOUND', message: 'Paper not found' });
    res.json(paper);
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * POST /api/research/papers/:projectId  (multipart, field name "pdf")
 * 1. Validate project ownership + Drive connection.
 * 2. Stream the buffer to the user's Drive.
 * 3. Create the Paper doc with summaryStatus: 'pending'.
 * 4. Kick off async summary generation (fire-and-forget).
 * 5. Return the doc so the UI can render "Generating summary…".
 */
export const uploadPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 'NO_FILE', message: 'No PDF file uploaded (expected field "pdf")' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ code: 'BAD_MIME', message: 'Only PDF files are supported' });
    }

    const project = await findOwnedProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ code: 'NOT_FOUND', message: 'Project not found' });

    // Reload user with all Google fields — protect middleware stripped them.
    const fullUser = req.user.fullUser || req.user;
    if (!fullUser.googleRefreshToken) {
      return res.status(409).json({
        code: 'DRIVE_NOT_CONNECTED',
        message: 'Connect your Google Drive in the Research Logs page before uploading.',
      });
    }

    const { driveFileId, driveWebViewLink } = await uploadPdfToDrive(
      fullUser,
      project,
      {
        filename: req.file.originalname,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      }
    );

    const title = (req.body.title || req.file.originalname.replace(/\.pdf$/i, '')).trim();

    const paper = await Paper.create({
      userId: req.user._id,
      researchProjectId: project._id,
      title,
      originalFilename: req.file.originalname,
      driveFileId,
      driveWebViewLink,
      fileSizeBytes: req.file.size,
      summaryStatus: 'pending',
    });

    // Fire and forget. The summary writes back to the doc and the UI
    // polls getPaperById. We catch and log here so an unhandled rejection
    // doesn't crash the lambda.
    generateSummaryAsync(paper._id).catch(err => {
      console.error('[uploadPaper] summary generation crashed:', err?.message);
    });

    res.status(201).json(paper);
  } catch (error) {
    console.error('[uploadPaper]', error);
    if (error?.code === 'DRIVE_NOT_CONNECTED') {
      return res.status(409).json({ code: 'DRIVE_NOT_CONNECTED', message: error.message });
    }
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * POST /api/research/papers/:id/regenerate
 * Retries summary generation (used by the "Retry" button on a failed paper).
 */
export const regeneratePaperSummary = async (req, res) => {
  try {
    const paper = await findOwnedPaper(req, req.params.id);
    if (!paper) return res.status(404).json({ code: 'NOT_FOUND', message: 'Paper not found' });

    if (paper.summaryStatus === 'generating') {
      return res.status(409).json({ code: 'IN_PROGRESS', message: 'Summary is already being generated' });
    }

    generateSummaryAsync(paper._id).catch(err => {
      console.error('[regeneratePaperSummary]', err?.message);
    });

    res.status(202).json({ message: 'Summary regeneration queued' });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * DELETE /api/research/papers/:id
 * Deletes the Drive file (best-effort) then the doc.
 */
export const deletePaper = async (req, res) => {
  try {
    const paper = await findOwnedPaper(req, req.params.id);
    if (!paper) return res.status(404).json({ code: 'NOT_FOUND', message: 'Paper not found' });

    const fullUser = req.user.fullUser || req.user;
    if (fullUser.googleRefreshToken && paper.driveFileId) {
      try { await deleteDriveFile(fullUser, paper.driveFileId); }
      catch (e) { console.warn('[deletePaper] drive cleanup failed:', e?.message); }
    }

    await paper.deleteOne();
    res.json({ message: 'Paper removed' });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};
