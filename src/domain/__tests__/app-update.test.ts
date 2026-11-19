import { compareVersions, findAppUpdate } from '@/domain/app-update';

describe('compareVersions', () => {
  it('compara por número, no por texto', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.1', '1.1.0')).toBe(0);
    expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
  });
});

describe('findAppUpdate', () => {
  const manifest = {
    production: { version: '1.2.0', url: 'https://example.com/nest.apk', notes: ' Recordatorios ' },
    preview: { version: '1.1.0', url: 'https://example.com/preview.apk' },
  };

  it('avisa si el canal tiene una versión más nueva', () => {
    expect(findAppUpdate(manifest, 'production', '1.1.0')).toEqual({
      version: '1.2.0',
      url: 'https://example.com/nest.apk',
      notes: 'Recordatorios',
    });
  });

  it('no avisa si ya está al día o el canal no existe', () => {
    expect(findAppUpdate(manifest, 'preview', '1.1.0')).toBeNull();
    expect(findAppUpdate(manifest, 'production', '1.2.0')).toBeNull();
    expect(findAppUpdate(manifest, 'otro', '1.0.0')).toBeNull();
    expect(findAppUpdate(manifest, null, '1.0.0')).toBeNull();
  });

  it('ignora datos incompletos o links que no son https', () => {
    expect(findAppUpdate({ production: { version: '9.0.0', url: '' } }, 'production', '1.0.0')).toBeNull();
    expect(findAppUpdate({ production: { version: '9.0.0', url: 'http://x.com/a.apk' } }, 'production', '1.0.0')).toBeNull();
    expect(findAppUpdate('basura', 'production', '1.0.0')).toBeNull();
  });
});
