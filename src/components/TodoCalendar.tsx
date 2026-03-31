import { getCategoryMeta } from "@/lib/todo-config";
import type { Todo } from "@/types/todo";
import { useMemo, useState } from "react";

type TodoCalendarProps = {
  todos: Todo[];
  onOpenFocus: (id: string) => void;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TodoCalendar({ todos, onOpenFocus }: TodoCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [navDirection, setNavDirection] = useState<"forward" | "backward">("forward");

  const { days, monthLabel } = useMemo(() => {
    const now = new Date();
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstWeekday = monthStart.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabelValue = monthStart.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const calendarDays = Array.from({ length: 35 }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

      if (!isCurrentMonth) {
        return {
          id: `empty-${index}`,
          dateKey: "",
          label: "",
          isCurrentMonth: false,
          isToday: false,
          tasks: [] as Todo[],
        };
      }

      const date = new Date(year, month, dayNumber);
      const dateKey = date.toISOString().slice(0, 10);

      return {
        id: dateKey,
        dateKey,
        label: String(dayNumber),
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        tasks: todos.filter((todo) => todo.dueDate === dateKey),
      };
    });

    return { days: calendarDays, monthLabel: monthLabelValue };
  }, [monthOffset, todos]);

  return (
    <section className="calendar-card">
      <div className="calendar-head">
        <div>
          <p className="panel-kicker">Due date calendar</p>
          <h3>{monthLabel}</h3>
        </div>
        <div className="calendar-nav">
          <button
            type="button"
            onClick={() => {
              setNavDirection("backward");
              setMonthOffset((current) => current - 1);
            }}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              setNavDirection(monthOffset > 0 ? "backward" : "forward");
              setMonthOffset(0);
            }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              setNavDirection("forward");
              setMonthOffset((current) => current + 1);
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div
        key={`${monthLabel}-${navDirection}`}
        className={`calendar-grid calendar-grid-month calendar-grid-animated calendar-grid-${navDirection}`}
      >
        {days.map((day) => (
          <article
            key={day.id}
            className={`calendar-day${day.isCurrentMonth ? "" : " is-muted"}${
              day.isToday ? " is-today" : ""
            }`}
          >
            {day.isCurrentMonth ? (
              <>
                <div className="calendar-date">
                  <strong>{day.label}</strong>
                </div>

                <div className="calendar-items">
                  {day.tasks.length === 0 ? (
                    <p className="calendar-empty">No due tasks</p>
                  ) : (
                    day.tasks.slice(0, 3).map((todo) => {
                      const categoryMeta = getCategoryMeta(todo.category);

                      return (
                        <button
                          key={todo.id}
                          type="button"
                          className={`calendar-task ${categoryMeta.tone}`}
                          onClick={() => onOpenFocus(todo.id)}
                        >
                          <span>{categoryMeta.emoji}</span>
                          <strong>{todo.title}</strong>
                        </button>
                      );
                    })
                  )}

                  {day.tasks.length > 3 ? (
                    <small className="calendar-more">+{day.tasks.length - 3} more</small>
                  ) : null}
                </div>
              </>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
