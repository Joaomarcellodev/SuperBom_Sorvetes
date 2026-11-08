"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Skeleton } from "../atoms/Skeleton";

/** QR Code do PIX desenhado no aparelho (sem internet). Fundo branco: a câmera do banco lê melhor. */
export function PixQrCode({ payload, size = 232 }: { payload: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(payload, { margin: 2, width: size * 2, errorCorrectionLevel: "M" })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [payload, size]);

  if (!src) {
    return (
      <div className="mx-auto" style={{ width: size, height: size }}>
        <Skeleton className="size-full" />
      </div>
    );
  }
  return <img src={src} width={size} height={size} alt="QR Code do PIX" className="mx-auto rounded-control bg-white" />;
}
