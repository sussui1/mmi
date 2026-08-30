import type { RouteName } from "../constants/apps";
import { routeTitles } from "../constants/apps";

interface PlaceholderPageProps {
  route: RouteName;
  onNavigate: (route: RouteName) => void;
}

export function PlaceholderPage({
  route,
  onNavigate,
}: PlaceholderPageProps) {
  const isProfiles = route === "profiles";

  return (
    <section className="placeholder-page">
      <div className="placeholder-symbol">
        <span />
      </div>

      <h2>{routeTitles[route]}</h2>

      {isProfiles ? (
        <>
          <p>还没有 user 资料</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("home")}
          >
            返回桌面
          </button>
        </>
      ) : (
        <>
          <p>这里将成为「{routeTitles[route]}」</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("home")}
          >
            返回桌面
          </button>
        </>
      )}
    </section>
  );
}
