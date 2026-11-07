import type { Metadata } from "next";
import { PageHeading } from "@/components/molecules/PageHeading";
import { DataTools } from "@/components/organisms/DataTools";
import { InstallPrompt } from "@/components/organisms/InstallPrompt";
import { PreferencesPanel } from "@/components/organisms/PreferencesPanel";
import { ProfileSwitcher } from "@/components/organisms/ProfileSwitcher";
import { RoutesManager } from "@/components/organisms/RoutesManager";
import { SyncPanel } from "@/components/organisms/SyncPanel";

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage() {
  return (
    <>
      <PageHeading title="Ajustes" />
      <ProfileSwitcher />
      <RoutesManager />
      <InstallPrompt />
      <SyncPanel />
      <DataTools />
      <PreferencesPanel />
    </>
  );
}
