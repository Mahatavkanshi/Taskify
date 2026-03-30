import { categories, type CategoryView } from "@/lib/todo-config";

type TodoSidebarProps = {
  activeCategory: CategoryView;
  todayLabel: string;
  progressValue: number;
  overdueCount: number;
  totalCount: number;
  streakCount: number;
  theme: "light" | "dusk";
  getCategoryCount: (categoryId: (typeof categories)[number]["id"]) => number;
  onSelectCategory: (category: CategoryView) => void;
  onToggleTheme: () => void;
};

export function TodoSidebar({
  activeCategory,
  todayLabel,
  progressValue,
  overdueCount,
  totalCount,
  streakCount,
  theme,
  getCategoryCount,
  onSelectCategory,
  onToggleTheme,
}: TodoSidebarProps) {
  return (
    <aside className="sidebar-card">
      <div className="sidebar-header">
        <p className="eyebrow">Taskify Lists</p>
        <div className="sidebar-actions">
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            {theme === "light" ? "Moon mode" : "Sun mode"}
          </button>
          <span className="today-pill">{todayLabel}</span>
        </div>
      </div>

      <div className="sidebar-intro">
        <h2>Choose your focus</h2>
        <p>Jump between your default lists and keep each part of the day tidy.</p>
      </div>

      <div className="category-list" role="tablist" aria-label="Todo categories">
        <button
          type="button"
          className={`category-item${activeCategory === "all" ? " is-active" : ""}`}
          onClick={() => onSelectCategory("all")}
        >
          <span className="category-icon all-icon">✨</span>
          <span className="category-copy">
            <strong>All Tasks</strong>
            <small>Everything in one view</small>
          </span>
          <span className="category-count">{totalCount}</span>
        </button>

        {categories.map((item) => {
          const count = getCategoryCount(item.id);

          return (
            <button
              key={item.id}
              type="button"
              className={`category-item ${item.tone}${activeCategory === item.id ? " is-active" : ""}`}
              onClick={() => onSelectCategory(item.id)}
            >
              <span className="category-icon">{item.emoji}</span>
              <span className="category-copy">
                <strong>{item.label}</strong>
                <small>
                  {count} task{count === 1 ? "" : "s"}
                </small>
              </span>
              <span className="category-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-summary">
        <article>
          <span>{progressValue}%</span>
          <p>Done today</p>
        </article>
        <article>
          <span>{overdueCount}</span>
          <p>Need attention</p>
        </article>
        <article>
          <span>{streakCount}</span>
          <p>Day streak</p>
        </article>
      </div>
    </aside>
  );
}
