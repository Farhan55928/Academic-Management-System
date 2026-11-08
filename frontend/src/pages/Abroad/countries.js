// ISO 3166-1 alpha-2 codes → English short names, for the country picker.
const RAW = `AF Afghanistan|AL Albania|DZ Algeria|AD Andorra|AO Angola|AG Antigua and Barbuda|AR Argentina|AM Armenia|AU Australia|AT Austria|AZ Azerbaijan|BS Bahamas|BH Bahrain|BD Bangladesh|BB Barbados|BY Belarus|BE Belgium|BZ Belize|BJ Benin|BT Bhutan|BO Bolivia|BA Bosnia and Herzegovina|BW Botswana|BR Brazil|BN Brunei|BG Bulgaria|BF Burkina Faso|BI Burundi|CV Cabo Verde|KH Cambodia|CM Cameroon|CA Canada|CF Central African Republic|TD Chad|CL Chile|CN China|CO Colombia|KM Comoros|CG Congo|CD Congo (DRC)|CR Costa Rica|CI Côte d'Ivoire|HR Croatia|CU Cuba|CY Cyprus|CZ Czechia|DK Denmark|DJ Djibouti|DM Dominica|DO Dominican Republic|EC Ecuador|EG Egypt|SV El Salvador|GQ Equatorial Guinea|ER Eritrea|EE Estonia|SZ Eswatini|ET Ethiopia|FJ Fiji|FI Finland|FR France|GA Gabon|GM Gambia|GE Georgia|DE Germany|GH Ghana|GR Greece|GD Grenada|GT Guatemala|GN Guinea|GW Guinea-Bissau|GY Guyana|HT Haiti|HN Honduras|HK Hong Kong|HU Hungary|IS Iceland|IN India|ID Indonesia|IR Iran|IQ Iraq|IE Ireland|IL Israel|IT Italy|JM Jamaica|JP Japan|JO Jordan|KZ Kazakhstan|KE Kenya|KI Kiribati|KW Kuwait|KG Kyrgyzstan|LA Laos|LV Latvia|LB Lebanon|LS Lesotho|LR Liberia|LY Libya|LI Liechtenstein|LT Lithuania|LU Luxembourg|MO Macao|MG Madagascar|MW Malawi|MY Malaysia|MV Maldives|ML Mali|MT Malta|MH Marshall Islands|MR Mauritania|MU Mauritius|MX Mexico|FM Micronesia|MD Moldova|MC Monaco|MN Mongolia|ME Montenegro|MA Morocco|MZ Mozambique|MM Myanmar|NA Namibia|NR Nauru|NP Nepal|NL Netherlands|NZ New Zealand|NI Nicaragua|NE Niger|NG Nigeria|KP North Korea|MK North Macedonia|NO Norway|OM Oman|PK Pakistan|PW Palau|PS Palestine|PA Panama|PG Papua New Guinea|PY Paraguay|PE Peru|PH Philippines|PL Poland|PT Portugal|QA Qatar|RO Romania|RU Russia|RW Rwanda|KN Saint Kitts and Nevis|LC Saint Lucia|VC Saint Vincent and the Grenadines|WS Samoa|SM San Marino|ST São Tomé and Príncipe|SA Saudi Arabia|SN Senegal|RS Serbia|SC Seychelles|SL Sierra Leone|SG Singapore|SK Slovakia|SI Slovenia|SB Solomon Islands|SO Somalia|ZA South Africa|KR South Korea|SS South Sudan|ES Spain|LK Sri Lanka|SD Sudan|SR Suriname|SE Sweden|CH Switzerland|SY Syria|TW Taiwan|TJ Tajikistan|TZ Tanzania|TH Thailand|TL Timor-Leste|TG Togo|TO Tonga|TT Trinidad and Tobago|TN Tunisia|TR Türkiye|TM Turkmenistan|TV Tuvalu|UG Uganda|UA Ukraine|AE United Arab Emirates|GB United Kingdom|US United States|UY Uruguay|UZ Uzbekistan|VU Vanuatu|VA Vatican City|VE Venezuela|VN Vietnam|YE Yemen|ZM Zambia|ZW Zimbabwe`;

export const COUNTRIES = RAW.split('|').map((entry) => ({
  code: entry.slice(0, 2),
  name: entry.slice(3),
}));

// Two regional-indicator symbols make a flag emoji ("DE" → 🇩🇪)
export const flagEmoji = (code) =>
  /^[A-Z]{2}$/i.test(code ?? '')
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '🌍';

// ─── Shared labels / styles for the status enums (mirror the backend models) ─

export const COUNTRY_STATUS = {
  exploring:   { label: 'Exploring',   color: '#60a5fa' },
  shortlisted: { label: 'Shortlisted', color: '#fbbf24' },
  applying:    { label: 'Applying',    color: '#34d399' },
  dropped:     { label: 'Dropped',     color: '#94a3b8' },
};

export const PROGRAM_STATUS = {
  researching: { label: 'Researching', color: '#64748b', bg: '#f1f5f9' },
  preparing:   { label: 'Preparing',   color: '#3b82f6', bg: '#eff6ff' },
  applied:     { label: 'Applied',     color: '#6366f1', bg: '#eef2ff' },
  interview:   { label: 'Interview',   color: '#f59e0b', bg: '#fffbeb' },
  accepted:    { label: 'Accepted',    color: '#10b981', bg: '#ecfdf5' },
  rejected:    { label: 'Rejected',    color: '#ef4444', bg: '#fef2f2' },
};

export const CONTACT_STATUS = {
  not_contacted: { label: 'Not contacted', color: '#64748b', bg: '#f1f5f9' },
  emailed:       { label: 'Emailed',       color: '#3b82f6', bg: '#eff6ff' },
  replied:       { label: 'Replied',       color: '#10b981', bg: '#ecfdf5' },
  interview:     { label: 'Interview',     color: '#f59e0b', bg: '#fffbeb' },
  declined:      { label: 'Declined',      color: '#ef4444', bg: '#fef2f2' },
};

export const FACTS = [
  { key: 'tuition',    label: 'Tuition',      placeholder: 'e.g. €0–3k / year' },
  { key: 'livingCost', label: 'Living cost',  placeholder: 'e.g. €950 / month' },
  { key: 'language',   label: 'Language test', placeholder: 'e.g. IELTS 6.5 / TOEFL 90' },
  { key: 'visa',       label: 'Visa',         placeholder: 'e.g. National D visa' },
  { key: 'workRights', label: 'Work rights',  placeholder: 'e.g. 20 h/week' },
  { key: 'currency',   label: 'Currency',     placeholder: 'e.g. EUR' },
  { key: 'intakes',    label: 'Intakes',      placeholder: 'e.g. Winter (Oct), Summer (Apr)' },
];

// "in 12 days" / "today" / "3 days overdue" — for deadlines and due dates
export const relativeDays = (date) => {
  if (!date) return null;
  const day = 24 * 60 * 60 * 1000;
  const start = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const diff = Math.round((start(date) - start(Date.now())) / day);
  if (diff === 0) return { text: 'Today', tone: 'warn' };
  if (diff === 1) return { text: 'Tomorrow', tone: 'warn' };
  if (diff > 1) return { text: `In ${diff} days`, tone: diff <= 14 ? 'warn' : 'calm' };
  return { text: `${-diff} day${diff === -1 ? '' : 's'} overdue`, tone: 'late' };
};

export const daysAgo = (date) => {
  if (!date) return null;
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff} days ago`;
};

export const toDateInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');
export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '';
