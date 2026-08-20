import { useNavigate } from "react-router-dom";
import type { Email } from "../../types/email";

interface EmailRowProps {
  email: Email;
  type: "scheduled" | "sent";
}

function EmailRow({
  email,
  type,
}: EmailRowProps) {
    const navigate = useNavigate();
  const recipientName =
    email.recipient?.split("@")[0] || "Unknown";

  /*
   * Use scheduledAt for scheduled emails
   * and sentAt for sent emails.
   */
  const emailDate =
    type === "scheduled"
      ? email.scheduledAt
      : email.sentAt;

  /*
   * Format:
   * Mon, 18/08 · 02:30 PM
   */
  const formattedDate = emailDate
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
        .format(new Date(emailDate))
        .replace(",", ", ")
    : "";

  const preview =
    email.body
      ?.replace(/\s+/g, " ")
      .trim()
      .slice(0, 85) || "";

  return (
    <div
  role="button"
  tabIndex={0}
  onClick={() =>
    navigate(`/emails/${email.id}`, {
      state: { email },
    })
  }
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      navigate(`/emails/${email.id}`, {
        state: { email },
      });
    }
  }}
  className="group flex h-14.5 cursor-pointer items-center border-b border-[#eeeeee] px-5 transition hover:bg-[#fafcfb]"
>
      {/* Recipient */}

      <div className="w-36 shrink-0">
        <p className="truncate text-[11px] font-medium text-[#333333]">
          To: {recipientName}
        </p>
      </div>

      {/* Time / Status */}

      <div className="mr-4 w-[110px] shrink-0">
        {type === "scheduled" ? (
          <span className="inline-flex whitespace-nowrap rounded-full bg-[#fff1df] px-2 py-1 text-[9px] font-medium text-[#e88a28]">
            ◷ {formattedDate}
          </span>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded-full bg-[#f0f1f2] px-2 py-1 text-[9px] font-medium text-[#777777]">
            Sent
          </span>
        )}
      </div>

      {/* Subject + Preview */}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center">
          <span className="truncate text-[12px] font-semibold text-[#333333]">
            {email.subject}
          </span>

          {preview && (
            <>
              <span className="mx-1.5 shrink-0 text-[10px] text-[#c0c0c0]">
                -
              </span>

              <span className="truncate text-[10px] text-[#999999]">
                {preview}
                {email.body &&
                email.body.replace(/\s+/g, " ").trim().length >
                  85
                  ? "..."
                  : ""}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Star */}

      {/* <button
        type="button"
        aria-label="Star email"
        className="ml-4 shrink-0 text-[#c5c5c5] transition hover:text-[#888888]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      </button> */}
    </div>
  );
}

export default EmailRow;
