"use client";

import { CircleCheck, DownloadCloud, Share } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Logo } from "../atoms/Logo";
import { useToast } from "@/providers/ToastProvider";
import { usePwa } from "@/providers/PwaProvider";

/** Convite para instalar o app. Some sozinho quando já está instalado ou o navegador não permite. */
export function InstallPrompt() {
  const { canInstall, installed, isIOS, install } = usePwa();
  const { toast } = useToast();

  if (installed) {
    return (
      <Card tone="low" className="flex items-center gap-3">
        <CircleCheck className="size-6 shrink-0 text-secondary" />
        <p className="text-body-md text-on-surface-variant">App instalado neste aparelho.</p>
      </Card>
    );
  }
  if (!canInstall && !isIOS) return null;

  return (
    <Card className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest">
      <div className="flex items-start gap-3">
        <Logo variant="full" height={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-headline-sm text-primary">Instalar no celular</h2>
            <Badge tone="primary">PWA</Badge>
          </div>
          <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">
            Abre direto da tela inicial, sem barra do navegador, e funciona sem internet.
          </p>
        </div>
      </div>
      {canInstall ? (
        <Button
          className="mt-4"
          size="lg"
          fullWidth
          icon={<DownloadCloud className="size-6" />}
          onClick={async () => {
            const result = await install();
            if (result === "accepted") toast({ title: "App instalado!", description: "Procure o ícone Maxbono na tela inicial." });
          }}
        >
          Instalar app
        </Button>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-control bg-surface-container-lowest p-3 text-body-sm text-on-surface-variant">
          <Share className="mt-0.5 size-4 shrink-0 text-secondary" />
          <span>
            No iPhone: toque em <strong className="text-on-surface">Compartilhar</strong> e depois em{" "}
            <strong className="text-on-surface">Adicionar à Tela de Início</strong>.
          </span>
        </p>
      )}
    </Card>
  );
}
