import { useState } from "react";
import { PhoneShell } from "./shell/PhoneShell";
import { HomePage } from "./pages/Home/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import type { RouteName } from "./constants/apps";

export default function App() {
  const [route, setRoute] = useState<RouteName>("home");
  const [history, setHistory] = useState<RouteName[]>([]);

  function navigate(nextRoute: RouteName) {
    if (nextRoute === route) return;
    setHistory((current) => [...current, route]);
    setRoute(nextRoute);
  }

  function goBack() {
    setHistory((current) => {
      const next = [...current];
      const previous = next.pop();

      if (previous) {
        setRoute(previous);
      } else {
        setRoute("home");
      }

      return next;
    });
  }

  return (
    <PhoneShell
      route={route}
      canGoBack={route !== "home"}
      onBack={goBack}
      onNavigate={navigate}
    >
      {route === "home" ? (
        <HomePage onNavigate={navigate} />
      ) : (
        <PlaceholderPage route={route} onNavigate={navigate} />
      )}
    </PhoneShell>
  );
}
