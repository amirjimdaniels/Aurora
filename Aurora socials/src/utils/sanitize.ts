import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  if (!dirty) return '';

  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(dirty, config);
};

export const sanitizeText = (text: string): string => {
  if (!text) return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
};

export const sanitizeURL = (url: string): string => {
  if (!url) return '';

  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  if (sanitized.match(/^(https?:\/\/|mailto:|\/|\.\/|#)/i)) {
    return sanitized;
  }

  return '';
};

export default { sanitizeHTML, sanitizeText, sanitizeURL };
