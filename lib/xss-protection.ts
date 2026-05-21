/**
 * XSS Protection Utilities
 * Sanitize user-generated content before rendering
 */

// Simple HTML entity encoding (lightweight alternative to DOMPurify)
export function sanitizeHtml(text: string): string {
  if (!text) return '';
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

// Remove potential script tags and event handlers (basic protection)
export function stripDangerousTags(html: string): string {
  if (!html) return '';
  
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove data: URIs (except images)
  sanitized = sanitized.replace(/data\s*:(?!image\/)[^"']*/gi, '');
  
  return sanitized;
}

// Validate that content is safe for rendering
export function isContentSafe(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /\bon\w+\s*=/i, // Event handlers
    /javascript\s*:/i,
    /vbscript\s*:/i,
    /expression\s*\(/i, // CSS expressions
    /url\s*\(\s*['"]?\s*javascript/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

// Sanitize message before displaying
export function sanitizeMessage(text: string): string {
  // First strip dangerous tags
  const stripped = stripDangerousTags(text);
  
  // Then encode HTML entities
  return sanitizeHtml(stripped);
}

// For admin notes (allow limited HTML like <b>, <i>, <br>)
export function sanitizeAdminNote(html: string): string {
  if (!html) return '';
  
  // Allow only safe tags
  const allowedTags = ['b', 'i', 'u', 'br', 'p', 'strong', 'em'];
  const tagPattern = new RegExp(`<(/?)(${allowedTags.join('|')})\\s*/?>`, 'gi');
  
  // Keep only allowed tags
  let sanitized = html.replace(tagPattern, '<$1$2>');
  
  // Remove all other tags
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // Restore allowed tags
  sanitized = sanitized.replace(/&lt;(\/?)(b|i|u|br|p|strong|em)&gt;/gi, '<$1$2>');
  
  return sanitized;
}

// Generate Content Security Policy header
export function generateCSPHeader(): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  return [
    "default-src 'self'",
    // Allow unsafe-eval in development for React debugging features
    isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net"
      : "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https: data:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
