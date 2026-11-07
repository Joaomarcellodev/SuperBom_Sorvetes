import type { Metadata } from "next";
import { PageHeading } from "@/components/molecules/PageHeading";
import { SaleForm } from "@/components/organisms/SaleForm";

export const metadata: Metadata = { title: "Registrar venda" };

export default function RegisterPage() {
  return (
    <>
      <PageHeading title="Registrar venda" description="Conte os pacotes por produto. Salva no aparelho na hora." />
      <SaleForm />
    </>
  );
}
