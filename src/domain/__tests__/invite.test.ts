import { inviteLink, inviteMessage, normalizeInviteCode, parseInviteLink, sameInviteCode } from '@/domain/invite';

describe('invite', () => {
  it('normaliza códigos nuevos y viejos', () => {
    expect(normalizeInviteCode(' hogar-ab23 cdef ')).toBe('HOGAR-AB23CDEF');
    expect(normalizeInviteCode('HOGAR-1234')).toBe('HOGAR-1234');
    expect(normalizeInviteCode('abc')).toBeNull();
    expect(normalizeInviteCode('HOGAR-<script>')).toBeNull();
  });

  it('compara con o sin el prefijo HOGAR-', () => {
    expect(sameInviteCode('HOGAR-1234', '1234')).toBe(true);
    expect(sameInviteCode('hogar-abcd2345', 'HOGAR-ABCD2345')).toBe(true);
    expect(sameInviteCode('HOGAR-1234', 'HOGAR-1235')).toBe(false);
  });

  it('lee el código del link de la app', () => {
    expect(parseInviteLink('couplesync://join?code=HOGAR-AB23CDEF')).toBe('HOGAR-AB23CDEF');
    expect(parseInviteLink('couplesync:///join/?code=hogar-ab23cdef')).toBe('HOGAR-AB23CDEF');
    expect(parseInviteLink('/join?code=HOGAR-1234')).toBe('HOGAR-1234');
    expect(parseInviteLink('exp://192.168.1.5:8081/--/join?code=HOGAR%2D1234')).toBe('HOGAR-1234');
  });

  it('ignora los demás links', () => {
    // Redirección del login de Google: también trae `code`, pero no es una invitación.
    expect(parseInviteLink('couplesync://?code=pkce-abc123')).toBeNull();
    expect(parseInviteLink('couplesync://dataUrl=nestShareKey')).toBeNull();
    expect(parseInviteLink('/mercado')).toBeNull();
    expect(parseInviteLink('couplesync://join')).toBeNull();
    expect(parseInviteLink('couplesync://join?code=%E0%A4%A')).toBeNull();
  });

  it('arma el link y el mensaje para compartir', () => {
    const link = inviteLink('https://example.com/join.html', 'HOGAR-1234');
    expect(link).toBe('https://example.com/join.html#HOGAR-1234');
    const message = inviteMessage('Nuestro nido', 'Nest', link, 'HOGAR-1234');
    expect(message).toContain(link);
    expect(message).toContain('HOGAR-1234');
  });
});
