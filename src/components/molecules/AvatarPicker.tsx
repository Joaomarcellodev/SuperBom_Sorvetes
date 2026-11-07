"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { Button } from "../atoms/Button";
import { Spinner } from "../atoms/Spinner";

/** Foto grande com botões de trocar/remover. No celular, "Trocar foto" oferece câmera ou galeria. */
export function AvatarPicker({
  name,
  photo,
  onPick,
  onRemove,
}: {
  name: string;
  photo: string | null | undefined;
  onPick: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    try {
      await job();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={photo ? "Trocar foto do perfil" : "Adicionar foto do perfil"}
        className="group relative shrink-0 rounded-full"
      >
        <Avatar name={name} photo={photo} size="xl" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full bg-secondary text-on-secondary ring-4 ring-surface-container transition-transform group-active:scale-90">
          {busy ? <Spinner className="size-4" /> : <Camera className="size-4" />}
        </span>
      </button>
      <div className="flex min-w-0 flex-col gap-2">
        <Button size="sm" variant="soft" icon={<Camera className="size-4" />} disabled={busy} onClick={() => input.current?.click()}>
          {photo ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {photo && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="size-4" />}
            disabled={busy}
            className="text-error"
            onClick={() => void run(onRemove)}
          >
            Remover
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // permite escolher a mesma foto de novo
          if (file) void run(() => onPick(file));
        }}
      />
    </div>
  );
}
