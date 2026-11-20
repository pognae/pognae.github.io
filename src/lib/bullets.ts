/** 블렛 직렬화·역직렬화. 저장 형식은 `• 내용` 한 줄 목록이다. */

const BULLET_MARKER = /^\s*(?:[•·▪◦‣∙]\s*|[-*+]\s+|\d{1,3}[.)]\s+)/;

export function stripBulletMarker(line: string): string {
  return line.replace(BULLET_MARKER, '').trim();
}

/** 저장된 문자열 → 편집기 블렛 배열. 마커 없는 옛 텍스트도 줄 단위로 살린다. */
export function parseContent(content: string | null | undefined): string[] {
  if (!content) return [];
  return content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(stripBulletMarker)
    .filter((line) => line.length > 0);
}

/** 편집기 블렛 배열 → 저장 문자열. 빈 줄은 버린다. */
export function serializeBullets(bullets: readonly string[]): string {
  return bullets
    .map((bullet) => bullet.replace(/\r?\n/g, ' ').trim())
    .filter((bullet) => bullet.length > 0)
    .map((bullet) => `• ${bullet}`)
    .join('\n');
}

export function countFilledBullets(bullets: readonly string[]): number {
  return bullets.filter((bullet) => bullet.trim().length > 0).length;
}
