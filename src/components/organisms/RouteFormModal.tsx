"use client";

import { useEffect, useState } from "react";
import { MapPin, Route as RouteIcon } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Field } from "../molecules/Field";
import { Modal } from "../molecules/Modal";
import { createRoute, updateRoute } from "@/lib/repo";
import type { Route } from "@/lib/types";

const splitCities = (text: string) =>
  text
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter(Boolean);

/** Criar rota (sem `route`) ou editar nome e cidades de uma rota existente. */
export function RouteFormModal({
  open,
  route,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** rota a editar; ausente = nova rota */
  route?: Route | null;
  onClose: () => void;
  onSaved?: (route: Route) => void;
}) {
  const editing = Boolean(route);
  const [name, setName] = useState("");
  const [cities, setCities] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const parsed = splitCities(cities);

  // Ao abrir, preenche com a rota que vai ser editada (ou limpa, se for nova).
  useEffect(() => {
    if (!open) return;
    setName(route?.name ?? "");
    setCities(route?.cities.join(", ") ?? "");
    setError(null);
  }, [open, route]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (route) {
        await updateRoute(route.id, name, parsed);
        onSaved?.({ ...route, name: name.trim(), cities: parsed });
      } else {
        onSaved?.(await createRoute(name, parsed));
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar a rota.");
    } finally {
      setSaving(false);
    }
  };

  const unchanged = editing && name.trim() === route?.name && parsed.join(",") === route?.cities.join(",");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar rota" : "Nova rota"}
      footer={
        <>
          <Button variant="soft" fullWidth onClick={onClose}>Cancelar</Button>
          <Button fullWidth loading={saving} disabled={!name.trim() || unchanged} onClick={() => void submit()}>
            {editing ? "Salvar alterações" : "Criar rota"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          // Eventos do React atravessam o portal: não deixa o envio chegar a formulários de fora.
          e.stopPropagation();
          if (name.trim() && !unchanged) void submit();
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
        {editing && (
          <p className="text-body-sm text-on-surface-variant">As vendas já registradas nesta rota passam a mostrar o nome novo.</p>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
