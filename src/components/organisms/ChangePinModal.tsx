"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { Spinner } from "../atoms/Spinner";
import { Modal } from "../molecules/Modal";
import { PinDots } from "../molecules/PinDots";
import { PinPad } from "../molecules/PinPad";
import { PIN_LENGTH, changePin, checkCurrentPin } from "@/lib/account";
import { cn } from "@/lib/format";

type Step = "current" | "new" | "confirm";

const STEPS: Record<Step, { title: string; hint: string }> = {
  current: { title: "Digite o PIN atual", hint: "Para confirmar que é você." },
  new: { title: "Escolha o novo PIN", hint: "4 números. Evite 1234, 0000 ou sua data de nascimento." },
  confirm: { title: "Repita o novo PIN", hint: "Só para garantir que não houve erro de digitação." },
};
const ORDER: Step[] = ["current", "new", "confirm"];

/** Troca de PIN em 3 passos. Precisa de internet (o servidor confere o PIN atual). */
export function ChangePinModal({
  open,
  sellerId,
  online,
  onClose,
  onChanged,
}: {
  open: boolean;
  sellerId: string;
  online: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [step, setStep] = useState<Step>("current");
  const [pin, setPin] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const reset = () => {
    setStep("current");
    setPin("");
    setCurrent("");
    setNext("");
    setError(null);
    setSaving(false);
    busy.current = false;
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const fail = (message: string, backTo: Step) => {
    setError(message);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin("");
      setStep(backTo);
      busy.current = false;
    }, 450);
  };

  const complete = async (value: string) => {
    busy.current = true;
    setError(null);
    if (step === "current") {
      if (!(await checkCurrentPin(sellerId, value))) return fail("PIN atual incorreto.", "current");
      setCurrent(value);
      setTimeout(() => {
        setPin("");
        setStep("new");
        busy.current = false;
      }, 150);
      return;
    }
    if (step === "new") {
      if (value === current) return fail("O novo PIN precisa ser diferente do atual.", "new");
      setNext(value);
      setTimeout(() => {
        setPin("");
        setStep("confirm");
        busy.current = false;
      }, 150);
      return;
    }
    if (value !== next) return fail("Os PINs não são iguais. Escolha o novo PIN de novo.", "new");
    setSaving(true);
    try {
      await changePin(sellerId, current, next);
      onChanged();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível trocar o PIN.";
      setSaving(false);
      fail(message, /atual/i.test(message) ? "current" : "new");
    }
  };

  const addDigit = (d: string) => {
    if (busy.current || pin.length >= PIN_LENGTH) return;
    const value = pin + d;
    setPin(value);
    if (value.length === PIN_LENGTH) void complete(value);
  };

  // Teclado físico (computador).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) addDigit(e.key);
      else if (e.key === "Backspace" && !busy.current) setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const info = STEPS[step];
  const index = ORDER.indexOf(step);

  return (
    <Modal open={open} onClose={onClose} title="Mudar PIN">
      {!online ? (
        <p className="flex items-start gap-2 rounded-control bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-primary" />
          Sem internet. Conecte-se para trocar o PIN: ele precisa chegar também ao aparelho do sócio.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 pb-1">
          <div className="flex w-full max-w-[18rem] gap-1.5" aria-label={`Passo ${index + 1} de 3`}>
            {ORDER.map((s, i) => (
              <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors", i <= index ? "bg-primary-container" : "bg-surface-container-highest")} />
            ))}
          </div>
          <div className="text-center">
            <p className="font-display text-headline-sm text-on-surface">{info.title}</p>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">{info.hint}</p>
          </div>
          <PinDots length={pin.length} total={PIN_LENGTH} state={shake ? "error" : "idle"} />
          <p role="alert" className="min-h-5 text-center text-body-sm text-error">
            {saving ? (
              <span className="inline-flex items-center gap-2 text-on-surface-variant">
                <Spinner className="size-4" /> Salvando no servidor…
              </span>
            ) : (
              error
            )}
          </p>
          <PinPad
            disabled={saving}
            onDigit={addDigit}
            onBackspace={() => !busy.current && setPin((p) => p.slice(0, -1))}
            onClear={() => !busy.current && setPin("")}
          />
        </div>
      )}
    </Modal>
  );
}
