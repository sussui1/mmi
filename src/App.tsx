import { useEffect, useState } from "react";
import { PhoneShell } from "./shell/PhoneShell";
import { HomePage } from "./pages/Home/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { UserProfilePage } from "./pages/Profile/UserProfilePage";
import { CharactersPage } from "./pages/Characters/CharactersPage";
import type { RouteName } from "./constants/apps";
import type { UserProfile } from "./types/models";
import {
  getUserProfile,
  saveUserProfile,
} from "./db/database";

export default function App() {
  const [route, setRoute] = useState<RouteName>("home");
  const [history, setHistory] = useState<RouteName[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getUserProfile().then((loadedProfile) => {
      if (!cancelled) {
        setProfile(loadedProfile);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profile?.avatarBlob) {
      setAvatarUrl(null);
      return;
    }

    const url = URL.createObjectURL(profile.avatarBlob);
    setAvatarUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [profile?.avatarBlob]);

  function navigate(nextRoute: RouteName) {
    if (nextRoute === route) return;

    setHistory((current) => [...current, route]);
    setRoute(nextRoute);
  }

  function goBack() {
    setHistory((current) => {
      const next = [...current];
      const previous = next.pop();

      setRoute(previous ?? "home");
      return next;
    });
  }

  async function handleProfileSaved(nextProfile: UserProfile) {
    const savedProfile = await saveUserProfile(nextProfile);
    setProfile(savedProfile);
  }

  function renderPage() {
    if (route === "home") {
      return <HomePage onNavigate={navigate} />;
    }

    if (route === "profiles") {
      return <CharactersPage />;
    }

    if (route === "me" && profile) {
      return (
        <UserProfilePage
          profile={profile}
          onSaved={handleProfileSaved}
        />
      );
    }

    return (
      <PlaceholderPage
        route={route}
        onNavigate={navigate}
      />
    );
  }

  return (
    <PhoneShell
      route={route}
      canGoBack={route !== "home"}
      onBack={goBack}
      onNavigate={navigate}
      avatarUrl={avatarUrl}
    >
      {renderPage()}
    </PhoneShell>
  );
}
