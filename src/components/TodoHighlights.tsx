import { getCategoryMeta, isDueToday, isUpcoming } from "@/lib/todo-config";
import type { Todo } from "@/types/todo";

type TodoHighlightsProps = {
  todos: Todo[];
};

export function TodoHighlights({ todos }: TodoHighlightsProps) {
  const dueToday = todos.filter(isDueToday).slice(0, 3);
  const upcoming = todos.filter(isUpcoming).slice(0, 3);

  return (
    <div className="highlight-grid">
      <section className="highlight-card">
        <div className="highlight-head">
          <p className="panel-kicker">Due today</p>
          <strong>{todos.filter(isDueToday).length}</strong>
        </div>
        {dueToday.length === 0 ? (
          <p className="highlight-empty">Nothing urgent today. Nice breathing room.</p>
        ) : (
          <div className="highlight-list">
            {dueToday.map((todo) => {
              const categoryMeta = getCategoryMeta(todo.category);

              return (
                <article key={todo.id} className="highlight-item">
                  <span className={`category-pill ${categoryMeta.tone}`}>
                    {categoryMeta.emoji} {categoryMeta.label}
                  </span>
                  <strong>{todo.title}</strong>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="highlight-card">
        <div className="highlight-head">
          <p className="panel-kicker">Upcoming</p>
          <strong>{todos.filter(isUpcoming).length}</strong>
        </div>
        {upcoming.length === 0 ? (
          <p className="highlight-empty">No upcoming deadlines in the next 7 days.</p>
        ) : (
          <div className="highlight-list">
            {upcoming.map((todo) => {
              const categoryMeta = getCategoryMeta(todo.category);

              return (
                <article key={todo.id} className="highlight-item">
                  <span className={`category-pill ${categoryMeta.tone}`}>
                    {categoryMeta.emoji} {categoryMeta.label}
                  </span>
                  <strong>{todo.title}</strong>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
