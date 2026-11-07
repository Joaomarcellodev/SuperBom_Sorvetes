import type { Metadata } from "next";
import { PinLogin } from "@/components/organisms/PinLogin";
import { AuthLayout } from "@/components/templates/AuthLayout";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthLayout>
      <PinLogin />
    </AuthLayout>
  );
}
