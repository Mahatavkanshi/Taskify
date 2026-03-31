import { categories, getDateKeyFromOffset, getTodayKey } from "@/lib/todo-config";
import type { Todo } from "@/types/todo";

type TodoAnalyticsProps = {
  todos: Todo[];
  completedDays: string[];
};

export function TodoAnalytics({ todos, completedDays }: TodoAnalyticsProps) {
  const bars = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const dateKey = getDateKeyFromOffset(offset);
    const completed = completedDays.includes(dateKey) ? 1 : 0;
    const due = todos.filter((todo) => todo.dueDate === dateKey).length;

    return {
      dateKey,
      label: dateKey === getTodayKey() ? "Today" : dateKey.slice(8, 10),
      completed,
      due,
    };
  });

  const completionRate =
    todos.length === 0
      ? 0
      : Math.round((todos.filter((todo) => todo.completed).length / todos.length) * 100);
  const deepWorkCount = todos.filter((todo) => todo.energy === "deep-work").length;
  const recurringCount = todos.filter((todo) => todo.recurrence !== "none").length;

  const categoryBreakdown = categories.map((category) => {
    const count = todos.filter((todo) => todo.category === category.id).length;
    const percent = todos.length === 0 ? 0 : Math.round((count / todos.length) * 100);

    return { ...category, count, percent };
  });

  return (
    <section className="analytics-card">
      <div className="analytics-head">
        <div>
          <p className="panel-kicker">Weekly analytics</p>
          <h3>Momentum snapshot</h3>
        </div>
        <span className="analytics-pill">{completionRate}% done</span>
      </div>

      <div className="analytics-stats">
        <article>
          <strong>{todos.length}</strong>
          <span>visible tasks</span>
        </article>
        <article>
          <strong>{deepWorkCount}</strong>
          <span>deep work tasks</span>
        </article>
        <article>
          <strong>{completedDays.length}</strong>
          <span>logged days</span>
        </article>
        <article>
          <strong>{recurringCount}</strong>
          <span>recurring tasks</span>
        </article>
      </div>

      <div className="analytics-chart">
        {bars.map((bar) => (
          <div key={bar.dateKey} className="chart-bar-group">
            <div className="chart-bars">
              <span
                className="chart-bar chart-bar-complete"
                style={{ height: `${bar.completed * 100}%` }}
              />
              <span
                className="chart-bar chart-bar-due"
                style={{ height: `${Math.min(bar.due * 24, 100)}%` }}
              />
            </div>
            <small>{bar.label}</small>
          </div>
        ))}
      </div>

      <div className="category-breakdown">
        <div className="breakdown-head">
          <p className="panel-kicker">Category breakdown</p>
        </div>
        <div className="breakdown-list">
          {categoryBreakdown.map((item) => (
            <article key={item.id} className="breakdown-row">
              <div className="breakdown-label">
                <span className={`category-pill ${item.tone}`}>
                  {item.emoji} {item.label}
                </span>
                <small>
                  {item.count} task{item.count === 1 ? "" : "s"}
                </small>
              </div>
              <div className="breakdown-bar-shell">
                <span className={`breakdown-bar ${item.tone}`} style={{ width: `${item.percent}%` }} />
              </div>
              <strong>{item.percent}%</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
