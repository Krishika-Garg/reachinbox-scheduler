import { useNavigate, useLocation } from "react-router-dom";

import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

import type { Email } from "../types/email";

interface User {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface EmailDetailProps {
  user: User;
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function EmailDetail({
  user,
}: EmailDetailProps) {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * The email is passed from EmailRow through
   * react-router navigation state.
   */
  const email = (
    location.state as {
      email?: Email;
    } | null
  )?.email;

  /*
   * If someone directly opens /emails/:id without
   * coming from the dashboard, we currently don't
   * have the individual-email API wired yet.
   */
  if (!email) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999999"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16v16H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </div>

            <p className="text-sm font-medium text-[#444444]">
              Email not found
            </p>

            <p className="mt-1 text-xs text-[#999999]">
              Please open an email from the dashboard.
            </p>

            <Button
              variant="secondary"
              className="mt-5"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sender =
    user.email || "Unknown sender";

  const recipient =
    email.recipient || "Unknown recipient";

  const emailDate =
    email.sentAt ||
    email.scheduledAt;

  /*
   * The backend currently stores the email body
   * as HTML because of our rich text editor.
   */
  const body = email.body || "";

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#333333]">
      <div className="min-h-screen bg-white">

        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <header className="flex h-[62px] items-center justify-between border-b border-[#eeeeee] px-7">

          {/* Back */}

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[#777777] transition hover:bg-[#f5f6f5] hover:text-[#333333]"
            aria-label="Back to dashboard"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>

            <span className="text-[11px]">
              Back
            </span>
          </button>

          {/* Actions */}

          <div className="flex items-center gap-1">

            {/* Star */}

            <button
              type="button"
              aria-label="Star email"
              title="Star"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#999999] transition hover:bg-[#f5f6f5] hover:text-[#555555]"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
              </svg>
            </button>

            {/* Reply */}

            <button
              type="button"
              aria-label="Reply"
              title="Reply"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#999999] transition hover:bg-[#f5f6f5] hover:text-[#555555]"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 17 4 12l5-5" />
                <path d="M4 12h10a6 6 0 0 1 6 6v1" />
              </svg>
            </button>

            {/* Delete */}

            <button
              type="button"
              aria-label="Delete email"
              title="Delete"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#999999] transition hover:bg-[#fff4f4] hover:text-[#d94b4b]"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7h16" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M6 7l1 14h10l1-14" />
                <path d="M9 7V4h6v3" />
              </svg>
            </button>
          </div>
        </header>

        {/* =====================================================
            EMAIL CONTENT
        ===================================================== */}

        <main className="mx-auto max-w-[1000px] px-8 py-10">

          {/* Subject */}

          <div className="border-b border-[#eeeeee] pb-7">

            <h1 className="text-[24px] font-semibold tracking-[-0.3px] text-[#222222]">
              {email.subject ||
                "(No subject)"}
            </h1>

            <div className="mt-3 flex items-center gap-2">

              {email.status ===
                "scheduled" && (
                <span className="rounded-full bg-[#fff1df] px-2.5 py-1 text-[9px] font-medium text-[#e88a28]">
                  ◷ Scheduled
                </span>
              )}

              {email.status ===
                "sent" && (
                <span className="rounded-full bg-[#eef7f0] px-2.5 py-1 text-[9px] font-medium text-[#4caf50]">
                  Sent
                </span>
              )}

              {email.status ===
                "failed" && (
                <span className="rounded-full bg-[#fff1f1] px-2.5 py-1 text-[9px] font-medium text-[#d94b4b]">
                  Failed
                </span>
              )}
            </div>
          </div>

          {/* =================================================
              SENDER
          ================================================= */}

          <div className="flex items-start justify-between border-b border-[#eeeeee] py-7">

            <div className="flex min-w-0 items-center gap-3">

              <Avatar
                name={user.name}
                email={sender}
                picture={user.picture}
                size="lg"
              />

              <div className="min-w-0">

                <p className="text-[14px] font-semibold text-[#333333]">
                  {user.name ||
                    "Google User"}
                </p>

                <p className="mt-0.5 text-[11px] text-[#888888]">
                  {sender}
                </p>

                <p className="mt-1 text-[10px] text-[#999999]">
                  To: {recipient}
                </p>
              </div>
            </div>

            {/* Date */}

            {emailDate && (
              <div className="ml-6 shrink-0 pt-1 text-right">
                <p className="text-[10px] text-[#999999]">
                  {formatDate(emailDate)}
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              BODY
          ================================================= */}

          <article className="py-8">

            <div
              className="prose prose-sm max-w-none text-[14px] leading-7 text-[#444444]"
              dangerouslySetInnerHTML={{
                __html: body,
              }}
            />
          </article>

          {/* =================================================
              ATTACHMENTS
          ================================================= */}

          {/* 
             Attachment rendering will be connected once
             the backend returns attachment metadata.
          */}

          {/* =================================================
              FOOTER ACTIONS
          ================================================= */}

          <div className="mt-4 flex items-center gap-3 border-t border-[#eeeeee] pt-6">

            <Button
              variant="secondary"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Back to Inbox
            </Button>

            <Button
              onClick={() => {
                // Reply functionality will be connected later.
                navigate("/compose");
              }}
            >
              <span className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 17 4 12l5-5" />
                  <path d="M4 12h10a6 6 0 0 1 6 6v1" />
                </svg>

                Reply
              </span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EmailDetail;