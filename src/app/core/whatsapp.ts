import { BRAND } from './catalog';

/**
 * WhatsApp message helpers. WhatsApp draws *bold* and _italic_ itself, but a
 * marker only works within one line, so multi-line text is wrapped line by line.
 * Anything a visitor typed goes through clean() first, so a stray * or _ in a
 * name can't switch formatting on halfway through the message.
 */
export const clean = (s: string | null | undefined): string => (s ?? '').replace(/[*_~`]/g, '').trim();

export const bold = (s: string): string => wrap(s, '*');
export const italic = (s: string): string => wrap(s, '_');

/** A wa.me link that opens a chat with the text typed in. */
export function waLink(text: string, to: string = BRAND.whatsapp): string {
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

function wrap(s: string, marker: string): string {
  return s
    .split('\n')
    .map((line) => (line.trim() ? `${marker}${line.trim()}${marker}` : line))
    .join('\n');
}
