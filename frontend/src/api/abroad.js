import api from './axios.js';

// ─── Countries ──────────────────────────────────────────────
export const getCountries  = (signal)   => api.get('/abroad/countries', { signal });
export const getCountry    = (id, signal) => api.get(`/abroad/countries/${id}`, { signal });
export const createCountry = (data)     => api.post('/abroad/countries', data);
export const updateCountry = (id, data) => api.put(`/abroad/countries/${id}`, data);
export const deleteCountry = (id)       => api.delete(`/abroad/countries/${id}`);

// ─── Sections of a country's log ────────────────────────────
// kind ∈ 'checklist' | 'programs' | 'contacts' | 'videos' | 'notes'
export const createItem = (countryId, kind, data) => api.post(`/abroad/countries/${countryId}/${kind}`, data);
export const updateItem = (kind, id, data)        => api.put(`/abroad/${kind}/${id}`, data);
export const deleteItem = (kind, id)              => api.delete(`/abroad/${kind}/${id}`);

export const importChecklist = (countryId, markdown) =>
  api.post(`/abroad/countries/${countryId}/checklist/import`, { markdown });
