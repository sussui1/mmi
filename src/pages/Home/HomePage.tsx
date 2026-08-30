import { useState } from "react";
import type { RouteName } from "../../constants/apps";
import { HomePager } from "./HomePager";

interface HomePageProps {
  onNavigate: (route: RouteName) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [page, setPage] = useState<1 | 2>(1);

  return (
    <div className="home-page">
      <div className="home-heading">
        <div>
          <p className="eyebrow">LOCAL DEVICE</p>
          <h2>你好，user</h2>
        </div>

        <div className="home-orb" aria-hidden="true">
          <span />
        </div>
      </div>

      <HomePager page={page} onPageChange={setPage} onNavigate={onNavigate} />

      <div className="pager-dots" aria-label="桌面分页">
        {[1, 2].map((item) => (
          <button
            key={item}
            className={`pager-dot ${page === item ? "is-active" : ""}`}
            type="button"
            aria-label={`第 ${item} 页`}
            onClick={() => setPage(item as 1 | 2)}
          />
        ))}
      </div>
    </div>
  );
}
