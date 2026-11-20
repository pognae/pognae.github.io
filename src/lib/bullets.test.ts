import { describe, expect, it } from 'vitest';
import { countFilledBullets, parseContent, serializeBullets, stripBulletMarker } from './bullets';

describe('블렛 직렬화', () => {
  it('빈 줄은 버리고 `• 내용` 형식으로 잇는다', () => {
    expect(serializeBullets(['아침 산책 30분', '  ', '커피값 4,500원'])).toBe(
      '• 아침 산책 30분\n• 커피값 4,500원',
    );
  });

  it('블렛이 없거나 공백뿐이면 빈 문자열', () => {
    expect(serializeBullets([])).toBe('');
    expect(serializeBullets(['', '   ', '\n'])).toBe('');
    expect(countFilledBullets(['', '한 줄', ' '])).toBe(1);
  });

  it('직렬화 → 역직렬화 왕복에서 내용이 보존된다', () => {
    const bullets = ['장보기: 두부, 달걀', '오후 3시 회의 준비', '잠들기 전 스트레칭 10분'];
    expect(parseContent(serializeBullets(bullets))).toEqual(bullets);
  });
});

describe('역직렬화', () => {
  it('•, ·, ▪, -, *, 숫자 목록 마커를 모두 걷어낸다', () => {
    const content = ['• 하나', '· 둘', '▪ 셋', '- 넷', '* 다섯', '1. 여섯', '2) 일곱'].join('\n');
    expect(parseContent(content)).toEqual(['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱']);
  });

  it('마커 없는 옛 텍스트도 줄 단위로 살린다', () => {
    const legacy = '첫째 줄\n둘째 줄\n\n넷째 줄';
    expect(parseContent(legacy)).toEqual(['첫째 줄', '둘째 줄', '넷째 줄']);
  });

  it('빈 값은 빈 배열', () => {
    expect(parseContent('')).toEqual([]);
    expect(parseContent(null)).toEqual([]);
    expect(parseContent(undefined)).toEqual([]);
  });

  it('본문 안의 하이픈은 마커로 오인하지 않는다', () => {
    expect(stripBulletMarker('• 2026-11-18 회의')).toBe('2026-11-18 회의');
    expect(stripBulletMarker('비밀번호-재설정')).toBe('비밀번호-재설정');
  });
});
