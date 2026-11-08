import mongoose from 'mongoose';
import AbroadCountry from '../models/AbroadCountry.js';
import AbroadChecklistItem from '../models/AbroadChecklistItem.js';
import AbroadProgram from '../models/AbroadProgram.js';
import AbroadContact from '../models/AbroadContact.js';
import AbroadVideo from '../models/AbroadVideo.js';
import AbroadNote from '../models/AbroadNote.js';
import { getCloudinary, isCloudinaryConfigured, userFolder } from '../config/cloudinary.js';

// ─── Helpers ────────────────────────────────────────────────

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Client mistakes answer with a 4xx here; anything else (including a DB outage)
// falls through to the global handler in app.js, which owns the 503 contract.
const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ code: err.code, message: err.message });
    }
    if (err?.name === 'ValidationError' || err?.name === 'CastError') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
    }
    next(err);
  }
};

const notFound = (what) => new HttpError(404, 'NOT_FOUND', `${what} not found`);

const assertId = (id, what) => {
  if (!mongoose.isValidObjectId(id)) throw notFound(what);
};

// Copy only whitelisted keys; empty strings on date fields mean "clear it"
const pick = (body, fields, dateFields = []) => {
  const out = {};
  for (const key of fields) {
    if (body?.[key] === undefined) continue;
    out[key] = dateFields.includes(key) && body[key] === '' ? null : body[key];
  }
  return out;
};

const findOwnedCountry = async (id, userId) => {
  assertId(id, 'Country');
  const country = await AbroadCountry.findOne({ _id: id, userId });
  if (!country) throw notFound('Country');
  return country;
};

// A cover must be an upload into this user's own Cloudinary folder — that's
// what later lets us delete it safely without trusting the client.
const sanitizeCover = (cover, userId) => {
  if (cover === null || (cover && !cover.url && !cover.publicId)) return { url: '', publicId: '' };
  const url = String(cover?.url ?? '');
  const publicId = String(cover?.publicId ?? '');
  if (!url.startsWith('https://res.cloudinary.com/') || !publicId.startsWith(`${userFolder(userId)}/`)) {
    throw new HttpError(400, 'BAD_COVER', 'Cover must be an image uploaded through the app');
  }
  return { url, publicId };
};

// Best-effort: an orphaned image costs a few KB, a failed request costs the user's edit
const destroyImage = async (publicId, userId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  if (!publicId.startsWith(`${userFolder(userId)}/`)) return;
  try {
    await getCloudinary().uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.error('[abroad] cover cleanup failed:', err?.message);
  }
};

export const detectVideoPlatform = (url) => {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\.|^m\.|^web\./, '');
  } catch {
    return null;
  }
  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') return 'facebook';
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube';
  return null;
};

// ─── Child kinds ────────────────────────────────────────────
// One table drives create/update/delete for every section of a country's log.

const withPlatform = (data) => {
  if (data.url === undefined) return data;
  const platform = detectVideoPlatform(data.url);
  if (!platform) throw new HttpError(400, 'UNSUPPORTED_VIDEO', 'Only Facebook and YouTube links are supported');
  return { ...data, platform };
};

const KINDS = {
  checklist: {
    Model: AbroadChecklistItem,
    fields: ['title', 'isDone', 'dueDate', 'note', 'order'],
    dates: ['dueDate'],
    sort: { order: 1, createdAt: 1 },
    ordered: true,
  },
  programs: {
    Model: AbroadProgram,
    fields: ['university', 'program', 'degree', 'deadline', 'tuition', 'funding', 'link', 'status', 'notes'],
    dates: ['deadline'],
    sort: { createdAt: 1 },
  },
  contacts: {
    Model: AbroadContact,
    fields: ['name', 'university', 'researchArea', 'email', 'profileUrl', 'status', 'lastContactedAt', 'notes'],
    dates: ['lastContactedAt'],
    sort: { createdAt: 1 },
  },
  videos: {
    Model: AbroadVideo,
    fields: ['url', 'title', 'note', 'order'],
    sort: { order: 1, createdAt: 1 },
    ordered: true,
    prepare: withPlatform,
  },
  notes: {
    Model: AbroadNote,
    fields: ['title', 'tags', 'format', 'content', 'pinned'],
    sort: { pinned: -1, updatedAt: -1 },
  },
};

const kindFor = (name) => {
  const kind = KINDS[name];
  if (!kind) throw notFound('Section');
  return kind;
};

// ─── Countries ──────────────────────────────────────────────

const countByCountry = (Model, userId) =>
  Model.aggregate([
    { $match: { userId } },
    { $group: { _id: '$countryId', count: { $sum: 1 } } },
  ]);

// @desc   All countries with section counts and checklist progress
// @route  GET /api/abroad/countries
export const getCountries = handle(async (req, res) => {
  const userId = req.user._id;
  const countries = await AbroadCountry.find({ userId })
    .select('-overview')  // can be long; the card never shows it
    .sort({ pinned: -1, createdAt: -1 })
    .lean();
  if (countries.length === 0) return res.json([]);

  const [checklist, programs, contacts, videos, notes] = await Promise.all([
    AbroadChecklistItem.aggregate([
      { $match: { userId } },
      { $group: { _id: '$countryId', total: { $sum: 1 }, done: { $sum: { $cond: ['$isDone', 1, 0] } } } },
    ]),
    countByCountry(AbroadProgram, userId),
    countByCountry(AbroadContact, userId),
    countByCountry(AbroadVideo, userId),
    countByCountry(AbroadNote, userId),
  ]);

  const byId = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r]));
  const [c, p, k, v, n] = [checklist, programs, contacts, videos, notes].map(byId);

  res.json(countries.map((country) => {
    const id = String(country._id);
    return {
      ...country,
      checklist: { done: c[id]?.done ?? 0, total: c[id]?.total ?? 0 },
      counts: {
        programs: p[id]?.count ?? 0,
        contacts: k[id]?.count ?? 0,
        videos: v[id]?.count ?? 0,
        notes: n[id]?.count ?? 0,
      },
    };
  }));
});

// @desc   One country with every section of its log
// @route  GET /api/abroad/countries/:id
export const getCountry = handle(async (req, res) => {
  const country = await findOwnedCountry(req.params.id, req.user._id);
  const countryId = country._id;

  const entries = await Promise.all(
    Object.entries(KINDS).map(async ([name, { Model, sort }]) =>
      [name, await Model.find({ countryId, userId: req.user._id }).sort(sort).lean()])
  );

  res.json({ ...country.toObject(), ...Object.fromEntries(entries) });
});

const COUNTRY_FIELDS = ['name', 'code', 'overview', 'status', 'pinned'];
const FACT_FIELDS = ['tuition', 'livingCost', 'language', 'visa', 'workRights', 'currency', 'intakes'];

// @route  POST /api/abroad/countries
export const createCountry = handle(async (req, res) => {
  const data = pick(req.body, COUNTRY_FIELDS);
  if (req.body?.facts) data.facts = pick(req.body.facts, FACT_FIELDS);
  if (req.body?.cover !== undefined) data.cover = sanitizeCover(req.body.cover, req.user._id);

  const country = await AbroadCountry.create({ ...data, userId: req.user._id });
  res.status(201).json(country);
});

// @route  PUT /api/abroad/countries/:id
export const updateCountry = handle(async (req, res) => {
  const country = await findOwnedCountry(req.params.id, req.user._id);
  const oldPublicId = country.cover?.publicId;

  country.set(pick(req.body, COUNTRY_FIELDS));
  if (req.body?.facts) {
    for (const [key, value] of Object.entries(pick(req.body.facts, FACT_FIELDS))) {
      country.facts[key] = value;
    }
  }
  if (req.body?.cover !== undefined) country.cover = sanitizeCover(req.body.cover, req.user._id);

  await country.save();

  // Only after the new cover is safely stored
  if (oldPublicId && oldPublicId !== country.cover?.publicId) {
    await destroyImage(oldPublicId, req.user._id);
  }
  res.json(country);
});

// @route  DELETE /api/abroad/countries/:id
export const deleteCountry = handle(async (req, res) => {
  const country = await findOwnedCountry(req.params.id, req.user._id);
  const filter = { countryId: country._id, userId: req.user._id };

  await Promise.all(Object.values(KINDS).map(({ Model }) => Model.deleteMany(filter)));
  await country.deleteOne();
  await destroyImage(country.cover?.publicId, req.user._id);

  res.json({ message: 'Country deleted' });
});

// ─── Children ───────────────────────────────────────────────

// @route  POST /api/abroad/countries/:countryId/:kind
export const createChild = handle(async (req, res) => {
  const kind = kindFor(req.params.kind);
  const country = await findOwnedCountry(req.params.countryId, req.user._id);

  let data = pick(req.body, kind.fields, kind.dates);
  if (kind.prepare) data = kind.prepare(data);
  if (kind.ordered && data.order === undefined) {
    data.order = await kind.Model.countDocuments({ countryId: country._id });
  }

  const doc = await kind.Model.create({ ...data, countryId: country._id, userId: req.user._id });
  res.status(201).json(doc);
});

// @route  PUT /api/abroad/:kind/:id
export const updateChild = handle(async (req, res) => {
  const kind = kindFor(req.params.kind);
  assertId(req.params.id, 'Item');

  let data = pick(req.body, kind.fields, kind.dates);
  if (kind.prepare) data = kind.prepare(data);

  const doc = await kind.Model.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    data,
    { new: true, runValidators: true }
  );
  if (!doc) throw notFound('Item');
  res.json(doc);
});

// @route  DELETE /api/abroad/:kind/:id
export const deleteChild = handle(async (req, res) => {
  const kind = kindFor(req.params.kind);
  assertId(req.params.id, 'Item');

  const doc = await kind.Model.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!doc) throw notFound('Item');
  res.json({ message: 'Deleted' });
});

// ─── Checklist import ───────────────────────────────────────

// "- [ ] Passport", "* [x] IELTS", "1. Transcript" — or, if the paste has no
// list markers at all, one item per non-empty, non-heading line.
export const parseChecklistMarkdown = (markdown) => {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const listItem = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s*)?(.+?)\s*$/;

  const fromList = lines
    .map((line) => line.match(listItem))
    .filter(Boolean)
    .map(([, mark, title]) => ({ title, isDone: mark === 'x' || mark === 'X' }));
  if (fromList.length > 0) return fromList;

  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((title) => ({ title, isDone: false }));
};

// @route  POST /api/abroad/countries/:countryId/checklist/import
export const importChecklist = handle(async (req, res) => {
  const country = await findOwnedCountry(req.params.countryId, req.user._id);
  const parsed = parseChecklistMarkdown(req.body?.markdown).slice(0, 200);
  if (parsed.length === 0) {
    throw new HttpError(400, 'NOTHING_TO_IMPORT', 'No checklist items found in the pasted text');
  }

  const start = await AbroadChecklistItem.countDocuments({ countryId: country._id });
  const items = await AbroadChecklistItem.insertMany(parsed.map((item, i) => ({
    ...item,
    order: start + i,
    countryId: country._id,
    userId: req.user._id,
  })));

  res.status(201).json(items);
});
