/**
 * Formats a date string to remove any 'T' character and returns in YYYY, MMM format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or 'N/A' if no date provided
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  // Remove the 'T' character and anything that follows it
  const cleanDateString = dateString.split('T')[0];
  const date = new Date(cleanDateString);
  const year = date.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${year}, ${month}`;
};

/**
 * Simple formatter that just removes the T and anything after it
 * @param {string} dateString - The date string to clean
 * @returns {string} Cleaned date string or 'N/A' if no date provided
 */
export const cleanDateString = (dateString) => {
  if (!dateString) return 'N/A';
  return dateString.split('T')[0];
};