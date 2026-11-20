import { useEffect, useRef } from 'react';

type AdFormat = 'auto' | 'rectangle' | 'horizontal';

type AdSlotProps = {
  /** 애드센스 광고 단위 ID. 비어 있으면 자동 광고가 채울 자리만 확보한다. */
  slot?: string;
  format?: AdFormat;
  className?: string;
  label?: boolean;
};

const HEIGHT: Record<AdFormat, number> = { auto: 280, rectangle: 250, horizontal: 100 };

export default function AdSlot({ slot, format = 'auto', className = '', label = false }: AdSlotProps) {
  const client = __ADSENSE_CLIENT__;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    try {
      const ads = (window.adsbygoogle = window.adsbygoogle || []);
      ads.push({});
    } catch (error) {
      console.warn('3년 다이어리: 애드센스 광고를 불러오지 못했습니다.', error);
    }
  }, [client, slot]);

  // 광고 단위가 아직 없으면 빈 상자를 남기지 않는다. 승인 후 자동 광고가 채운다.
  if (client && !slot) return null;

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ minHeight: HEIGHT[format], contain: 'layout style' }}
      data-ad-format={format}
    >
      {client && slot ? (
        <ins
          className="adsbygoogle block w-full"
          style={{ display: 'block', minHeight: HEIGHT[format] }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-2xl border border-dashed border-line text-xs text-muted"
          style={{ minHeight: HEIGHT[format] }}
        >
          {label ? '광고 영역 · 애드센스 승인 후 표시' : ''}
        </div>
      )}
    </div>
  );
}
