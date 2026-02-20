import DOMPurify from 'dompurify';

/**
 * Sanitizes user-generated HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @returns {string} - The sanitized HTML string
 */
export const sanitizeHTML = (dirty) => {
  if (!dirty) return '';

  // Configure DOMPurify to allow safe HTML elements
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitizes plain text content (strips all HTML)
 * @param {string} text - The text to sanitize
 * @returns {string} - The sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitizes URLs to prevent javascript: and data: protocols
 * @param {string} url - The URL to sanitize
 * @returns {string} - The sanitized URL or empty string if dangerous
 */
export const sanitizeURL = (url) => {
  if (!url) return '';

  // Remove dangerous protocols
  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // Only allow http(s), mailto, and relative URLs
  if (sanitized.match(/^(https?:\/\/|mailto:|\/|\.\/|#)/i)) {
    return sanitized;
  }

  return '';
};

export default { sanitizeHTML, sanitizeText, sanitizeURL };
