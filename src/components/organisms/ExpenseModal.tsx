"use client";

import { useState } from "react";
import { CalendarDays, NotebookPen, ReceiptText } from "lucide-react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Label } from "../atoms/Label";
import { MoneyInput } from "../atoms/MoneyInput";
import { Field } from "../molecules/Field";
import { Modal } from "../molecules/Modal";
import { SellerToggle } from "../molecules/SellerToggle";
import { cn, todayStr } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/finance";
import { saveExpense } from "@/lib/repo";
import type { ExpenseCategory, Seller } from "@/lib/types";

const firstName = (full: string) => full.split(" ")[0] ?? full;

export function ExpenseModal({
  open,
  onClose,
  onSaved,
  seller,
  sellers,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  seller: Seller;
  sellers: Seller[];
}) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("combustivel");
  const [date, setDate] = useState(todayStr);
  const [payer, setPayer] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setAmount(0);
    setDescription("");
    setCategory("combustivel");
    setDate(todayStr());
    setPayer(null);
    setNote("");
    setError(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await saveExpense({ description, category, amountCents: amount, expenseDate: date, sellerId: payer ?? seller.id, note });
      reset();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar o gasto.");
    } finally {
      setSaving(false);
    }
  };

  const options = [seller, ...sellers.filter((s) => s.id !== seller.id)].map((s) => ({
    id: s.id,
    label: s.id === seller.id ? `Eu (${firstName(s.name)})` : firstName(s.name),
    icon: null,
  }));

  return (
    <Modal
      open={open}
      onClose={close}
      title="Registrar gasto"
      footer={
        <>
          <Button variant="soft" fullWidth onClick={close}>Cancelar</Button>
          <Button fullWidth loading={saving} disabled={amount <= 0 || !description.trim()} onClick={() => void submit()}>
            Salvar gasto
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (amount > 0 && description.trim()) void submit();
        }}
      >
        <Field label="Valor">
          <MoneyInput autoFocus value={amount} onChange={setAmount} />
        </Field>
        <Field label="Descrição" error={error}>
          <Input icon={<ReceiptText />} placeholder="Ex.: gasolina da rota Norte" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <div role="radiogroup" aria-label="Categoria" className="grid grid-cols-2 gap-1.5">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "min-h-10 truncate rounded-control px-2 text-label-md transition-colors",
                  category === c.id ? "bg-primary-container font-bold text-on-primary-container" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {sellers.length > 1 && (
          <div className="space-y-1.5">
            <Label>Quem pagou?</Label>
            <SellerToggle options={options} value={payer ?? seller.id} onChange={setPayer} />
          </div>
        )}

        <Field label="Data">
          <Input type="date" icon={<CalendarDays />} value={date} max={todayStr()} onChange={(e) => e.target.value && setDate(e.target.value)} className="[color-scheme:dark]" />
        </Field>
        <Field label="Observação (opcional)">
          <Input icon={<NotebookPen />} placeholder="Ex.: nota fiscal na pasta" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
