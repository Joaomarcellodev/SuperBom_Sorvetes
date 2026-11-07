"use client";

import { useState } from "react";
import { MapPin, Route as RouteIcon } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Field } from "../molecules/Field";
import { Modal } from "../molecules/Modal";
import { createRoute } from "@/lib/repo";
import type { Route } from "@/lib/types";

const splitCities = (text: string) =>
  text
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter(Boolean);

export function NewRouteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (route: Route) => void;
}) {
  const [name, setName] = useState("");
  const [cities, setCities] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const parsed = splitCities(cities);

  const close = () => {
    setName("");
    setCities("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const route = await createRoute(name, parsed);
      onCreated(route);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a rota.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nova rota"
      footer={
        <>
          <Button variant="soft" fullWidth onClick={close}>Cancelar</Button>
          <Button fullWidth loading={saving} disabled={!name.trim()} onClick={() => void submit()}>Criar rota</Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          // Eventos do React atravessam o portal: não deixa o envio chegar a formulários de fora.
          e.stopPropagation();
          if (name.trim()) void submit();
        }}
      >
        <Field label="Nome da rota ou região" error={error}>
          <Input autoFocus icon={<RouteIcon />} placeholder="Ex.: Zona Norte" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Cidades atendidas" hint="Separe por vírgula. Opcional.">
          <Input icon={<MapPin />} placeholder="Ex.: Teresina, Timon" value={cities} onChange={(e) => setCities(e.target.value)} />
        </Field>
        {parsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {parsed.map((c) => (
              <Badge key={c} tone="primary">{c}</Badge>
            ))}
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
