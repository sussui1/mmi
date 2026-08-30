import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomDock } from "./BottomDock";
import { routeTitles, type RouteName } from "../constants/apps";

interface PhoneShellProps {
  route: RouteName;
  canGoBack: boolean;
  onBack: () => void;
  onNavigate: (route: RouteName) => void;
  children: ReactNode;
}

export function PhoneShell({
  route,
  canGoBack,
  onBack,
  onNavigate,
  children,
}: PhoneShellProps) {
  const isHome = route === "home";

  return (
    <main className="phone-stage">
      <section className="phone-shell" aria-label="mmi机">
        <TopBar
          title={routeTitles[route]}
          canGoBack={canGoBack}
          onBack={onBack}
          onOpenProfile={() => onNavigate("profiles")}
        />

        <div className={`shell-content ${isHome ? "shell-content-home" : ""}`}>
          {children}
        </div>

        <BottomDock
          activeRoute={route}
          onNavigate={onNavigate}
        />
      </section>
    </main>
  );
}
