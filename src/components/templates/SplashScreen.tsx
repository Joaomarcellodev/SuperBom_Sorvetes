import { Logo } from "../atoms/Logo";

export function SplashScreen() {
  return (
    <div role="status" aria-label="Carregando" className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse">
        <Logo variant="full" height={150} />
      </div>
    </div>
  );
}
