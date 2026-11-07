"use client";

import { ShieldCheck, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { Card } from "../atoms/Card";
import { Toggle } from "../atoms/Toggle";
import { SettingsRow } from "../molecules/SettingsRow";
import { useSoundPref } from "@/lib/feedback";

export const APP_VERSION = "0.1.0";

export function PreferencesPanel() {
  const [sound, setSound] = useSoundPref();

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="mb-1 flex items-center gap-2 font-display text-headline-sm">
        <SlidersHorizontal className="size-5 text-primary" /> Preferências
      </h2>
      <SettingsRow
        icon={sound ? <Volume2 /> : <VolumeX />}
        title="Som de clique"
        subtitle="Clique e vibração ao contar pacotes (neste aparelho)"
        trailing={<Toggle checked={sound} onChange={setSound} label="Som de clique" />}
      />
      <div className="mt-2 flex flex-col items-center gap-1 pt-2 text-center">
        <span className="flex items-center gap-1.5 text-label-md font-bold">
          <ShieldCheck className="size-4 text-secondary" /> Maxbono Sorvetes · app offline
        </span>
        <span className="text-label-sm text-on-surface-variant">Versão {APP_VERSION}</span>
      </div>
    </Card>
  );
}
