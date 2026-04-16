export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';

  return name
    .trim()
    .split(/\s+/) // Split by one or more whitespace characters
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

export const stringToDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date; // handle invalid dates
};
