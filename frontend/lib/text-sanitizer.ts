/**
 * Text sanitization utilities for TTS (Text-to-Speech) processing
 * Removes formatting characters and normalizes text for better speech synthesis
 */

/**
 * Sanitizes text for TTS by removing characters that shouldn't be spoken
 * and normalizing formatting for better speech synthesis
 */
export function sanitizeTextForTTS(text: string): string {
  return text
    // Remove markdown formatting characters
    .replace(/\*([^*]+)\*/g, '$1') // Bold: *text* -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold: **text** -> text
    .replace(/_([^_]+)_/g, '$1') // Italic: _text_ -> text
    .replace(/__([^_]+)__/g, '$1') // Italic: __text__ -> text
    .replace(/~([^~]+)~/g, '$1') // Strikethrough: ~text~ -> text
    .replace(/~~([^~]+)~~/g, '$1') // Strikethrough: ~~text~~ -> text
    .replace(/`([^`]+)`/g, '$1') // Inline code: `text` -> text
    .replace(/```[\s\S]*?```/g, '') // Code blocks: ```...``` -> (removed)
    
    // Remove other formatting characters
    .replace(/#{1,6}\s+/g, '') // Headers: # ## ### etc. -> (removed)
    .replace(/^\s*[-*+]\s+/gm, '') // List items: - * + -> (removed)
    .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists: 1. 2. etc. -> (removed)
    .replace(/>\s*/g, '') // Blockquotes: > -> (removed)
    .replace(/\|/g, ' ') // Table separators: | -> space
    .replace(/-{3,}/g, ' ') // Horizontal rules: --- -> space
    .replace(/={3,}/g, ' ') // Horizontal rules: === -> space
    
    // Normalize whitespace and punctuation
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .replace(/\s*([.!?])\s*/g, '$1 ') // Normalize sentence endings
    .replace(/\s*([,;:])\s*/g, '$1 ') // Normalize punctuation
    .replace(/\s*\(/g, ' (') // Space before parentheses
    .replace(/\)\s*/g, ') ') // Space after parentheses
    
    // Remove excessive punctuation
    .replace(/[!]{2,}/g, '!') // Multiple exclamations -> single
    .replace(/[?]{2,}/g, '?') // Multiple questions -> single
    .replace(/[.]{3,}/g, '...') // Multiple dots -> ellipsis
    
    // Clean up common TTS issues
    .replace(/\b(https?:\/\/[^\s]+)/g, 'link') // URLs -> "link"
    .replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, 'email') // Emails -> "email"
    .replace(/\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/g, 'phone number') // Phone numbers -> "phone number"
    
    // Final cleanup
    .trim()
}

/**
 * Light sanitization for display text (removes only the most problematic characters)
 */
export function sanitizeTextForDisplay(text: string): string {
  return text
    .replace(/\*([^*]+)\*/g, '$1') // Bold: *text* -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold: **text** -> text
    .replace(/_([^_]+)_/g, '$1') // Italic: _text_ -> text
    .replace(/__([^_]+)__/g, '$1') // Italic: __text__ -> text
    .replace(/~([^~]+)~/g, '$1') // Strikethrough: ~text~ -> text
    .replace(/~~([^~]+)~~/g, '$1') // Strikethrough: ~~text~~ -> text
    .replace(/`([^`]+)`/g, '$1') // Inline code: `text` -> text
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .trim()
}

/**
 * Sanitizes text specifically for scenario prompts (customer service scenarios)
 * Removes formatting while preserving the conversational tone
 */
export function sanitizeScenarioText(text: string): string {
  return text
    // Remove markdown but preserve emphasis
    .replace(/\*([^*]+)\*/g, '$1') // Bold: *text* -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold: **text** -> text
    .replace(/_([^_]+)_/g, '$1') // Italic: _text_ -> text
    .replace(/__([^_]+)__/g, '$1') // Italic: __text__ -> text
    .replace(/~([^~]+)~/g, '$1') // Strikethrough: ~text~ -> text
    .replace(/~~([^~]+)~~/g, '$1') // Strikethrough: ~~text~~ -> text
    .replace(/`([^`]+)`/g, '$1') // Inline code: `text` -> text
    
    // Remove list formatting but preserve content
    .replace(/^\s*[-*+]\s+/gm, '') // List items: - * + -> (removed)
    .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists: 1. 2. etc. -> (removed)
    
    // Clean up URLs and emails
    .replace(/\b(https?:\/\/[^\s]+)/g, 'link') // URLs -> "link"
    .replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, 'email') // Emails -> "email"
    
    // Normalize whitespace
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .replace(/\s*([.!?])\s*/g, '$1 ') // Normalize sentence endings
    .replace(/\s*([,;:])\s*/g, '$1 ') // Normalize punctuation
    
    // Final cleanup
    .trim()
}
