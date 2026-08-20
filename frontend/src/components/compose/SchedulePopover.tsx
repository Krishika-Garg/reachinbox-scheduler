import { useEffect, useMemo, useState } from "react";

interface SchedulePopoverProps {
  onSchedule: (date: Date) => void;
  onClose: () => void;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getTodayString() {
  const today = new Date();

  return `${today.getFullYear()}-${pad(
    today.getMonth() + 1
  )}-${pad(today.getDate())}`;
}

function SchedulePopover({
  onSchedule,
  onClose,
}: SchedulePopoverProps) {
  const now = new Date();

  const [date, setDate] = useState(getTodayString());

  const [hour, setHour] = useState(
    String(now.getHours() % 12 || 12)
  );

  const [minute, setMinute] = useState(
    pad(now.getMinutes())
  );

  const [period, setPeriod] = useState<"AM" | "PM">(
    now.getHours() >= 12 ? "PM" : "AM"
  );

  const [error, setError] = useState("");

  const today = useMemo(
    () => getTodayString(),
    []
  );

  useEffect(() => {
    setError("");
  }, [date, hour, minute, period]);

  const handleSchedule = () => {
    console.log(
      "Schedule button clicked"
    );

    const numericHour = Number(hour);
    const numericMinute = Number(minute);

    if (
      !hour ||
      Number.isNaN(numericHour) ||
      numericHour < 1 ||
      numericHour > 12
    ) {
      setError(
        "Hour must be between 1 and 12."
      );
      return;
    }

    if (
      !minute ||
      Number.isNaN(numericMinute) ||
      numericMinute < 0 ||
      numericMinute > 59
    ) {
      setError(
        "Minutes must be between 00 and 59."
      );
      return;
    }

    const [year, month, day] =
      date.split("-").map(Number);

    let hours24 = numericHour;

    if (period === "AM") {
      hours24 =
        numericHour === 12
          ? 0
          : numericHour;
    } else {
      hours24 =
        numericHour === 12
          ? 12
          : numericHour + 12;
    }

    const selectedDate = new Date(
      year,
      month - 1,
      day,
      hours24,
      numericMinute,
      0,
      0
    );

    console.log(
      "Selected schedule date:",
      selectedDate
    );

    if (selectedDate <= new Date()) {
      setError(
        "Please choose a future date and time."
      );
      return;
    }

    console.log(
      "Calling Compose onSchedule..."
    );

    onSchedule(selectedDate);
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.12)]">

      {/* Header */}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[#222222]">
            Schedule email
          </p>

          <p className="mt-0.5 text-[10px] text-[#999999]">
            Choose when this email should be sent
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[18px] text-[#999999] hover:text-[#333333]"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Date */}

      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-medium text-[#555555]">
          Date
        </label>

        <input
          type="date"
          value={date}
          min={today}
          onChange={(event) =>
            setDate(event.target.value)
          }
          className="h-10 w-full rounded-lg border border-[#e4e4e4] bg-white px-3 text-[12px] text-[#333333] outline-none focus:border-[#4caf50]"
        />
      </div>

      {/* Time */}

      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-medium text-[#555555]">
          Time
        </label>

        <div className="flex items-center gap-2">

          {/* Hour */}

          <input
            type="number"
            min={1}
            max={12}
            value={hour}
            onChange={(event) => {
              const value =
                event.target.value;

              if (value === "") {
                setHour("");
                return;
              }

              const numericValue =
                Number(value);

              if (
                numericValue >= 1 &&
                numericValue <= 12
              ) {
                setHour(value);
              }
            }}
            placeholder="HH"
            className="h-10 w-[75px] rounded-lg border border-[#e4e4e4] px-3 text-center text-[13px] outline-none focus:border-[#4caf50]"
          />

          <span className="text-[#888888]">
            :
          </span>

          {/* Minute */}

          <input
            type="number"
            min={0}
            max={59}
            value={minute}
            onChange={(event) => {
              const value =
                event.target.value;

              if (value === "") {
                setMinute("");
                return;
              }

              const numericValue =
                Number(value);

              if (
                numericValue >= 0 &&
                numericValue <= 59
              ) {
                setMinute(
                  value.padStart(2, "0")
                );
              }
            }}
            placeholder="MM"
            className="h-10 w-[75px] rounded-lg border border-[#e4e4e4] px-3 text-center text-[13px] outline-none focus:border-[#4caf50]"
          />

          {/* AM / PM */}

          <select
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target.value as
                  | "AM"
                  | "PM"
              )
            }
            className="h-10 rounded-lg border border-[#e4e4e4] bg-white px-3 text-[12px] outline-none focus:border-[#4caf50]"
          >
            <option value="AM">
              AM
            </option>

            <option value="PM">
              PM
            </option>
          </select>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="mb-3 rounded-lg bg-[#fff4f4] px-3 py-2 text-[10px] text-[#d94b4b]">
          {error}
        </div>
      )}

      {/* Actions */}

      <div className="flex justify-end gap-2">

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#dddddd] px-4 py-2 text-[11px] font-medium text-[#666666] hover:bg-[#f8f8f8]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSchedule}
          className="rounded-full bg-[#4caf50] px-4 py-2 text-[11px] font-medium text-white hover:bg-[#429a48]"
        >
          Schedule
        </button>

      </div>
    </div>
  );
}

export default SchedulePopover;