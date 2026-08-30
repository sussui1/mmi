import {
  homeApps,
  type AppDefinition,
  type RouteName,
} from "../../constants/apps";

interface HomePagerProps {
  page: 1 | 2;
  onPageChange: (page: 1 | 2) => void;
  onNavigate: (route: RouteName) => void;
}

function AppTile({
  app,
  onClick,
}: {
  app: AppDefinition;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="app-tile"
      onClick={onClick}
      aria-label={app.label}
    >
      <span className={`app-icon app-icon-${app.color}`}>{app.icon}</span>
      <span className="app-label">{app.label}</span>
      <span className="app-subtitle">{app.subtitle}</span>
    </button>
  );
}

export function HomePager({
  page,
  onPageChange,
  onNavigate,
}: HomePagerProps) {
  let startX = 0;
  let startY = 0;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    startX = event.clientX;
    startY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0 && page === 1) onPageChange(2);
    if (deltaX > 0 && page === 2) onPageChange(1);
  }

  return (
    <div
      className="home-pager-viewport"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div
        className="home-pager-track"
        style={{ transform: `translate3d(-${(page - 1) * 50}%, 0, 0)` }}
      >
        {[1, 2].map((currentPage) => (
          <section className="home-page-panel" key={currentPage}>
            <div className="app-grid">
              {homeApps
                .filter((app) => app.page === currentPage)
                .map((app) => (
                  <AppTile
                    key={app.id}
                    app={app}
                    onClick={() => onNavigate(app.id)}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
