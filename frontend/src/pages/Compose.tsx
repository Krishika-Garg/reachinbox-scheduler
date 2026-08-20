import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import RichTextEditor from "../components/compose/RichTextEditor";
import SchedulePopover from "../components/compose/SchedulePopover";

interface User {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface ComposeProps {
  user: User;
}

function Compose({ user }: ComposeProps) {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recipientFileInputRef =
    useRef<HTMLInputElement>(null);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [delay, setDelay] = useState("0");
  const [hourlyLimit, setHourlyLimit] = useState("0");

  const [attachments, setAttachments] = useState<File[]>([]);

  const [showSchedule, setShowSchedule] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * ============================================================
   * RECIPIENTS
   * ============================================================
   */

  const addRecipient = (value: string) => {
    const email = value.trim().replace(/,$/, "");

    if (!email || recipients.includes(email)) {
      return;
    }

    if (!email.includes("@")) {
      return;
    }

    setRecipients((current) => [...current, email]);
    setRecipientInput("");
  };

  const handleRecipientKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter" ||
      event.key === "," ||
      event.key === "Tab"
    ) {
      if (recipientInput.trim()) {
        event.preventDefault();
        addRecipient(recipientInput);
      }
    }

    if (
      event.key === "Backspace" &&
      !recipientInput &&
      recipients.length > 0
    ) {
      setRecipients((current) => current.slice(0, -1));
    }
  };

  const removeRecipient = (recipient: string) => {
    setRecipients((current) =>
      current.filter((item) => item !== recipient)
    );
  };

  /*
   * ============================================================
   * UPLOAD RECIPIENT LIST
   * ============================================================
   */

  const handleUploadList = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");

      const emails = text
        .split(/[\n,;]/)
        .map((email) => email.trim())
        .filter(
          (email) =>
            email.length > 0 &&
            email.includes("@")
        );

      setRecipients((current) => [
        ...current,
        ...emails.filter(
          (email) => !current.includes(email)
        ),
      ]);
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  /*
   * ============================================================
   * ATTACHMENTS
   * ============================================================
   */

  const handleAttachment = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) {
      return;
    }

    setAttachments((current) => [
      ...current,
      ...files,
    ]);

    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /*
   * ============================================================
   * SCHEDULE EMAIL
   * ============================================================
   */

  
const handleSchedule = async (
  scheduledDate: Date
) => {
  if (!recipients.length) {
    setMessage(
      "Please add at least one recipient."
    );
    return;
  }

  if (!subject.trim()) {
    setMessage(
      "Please enter a subject."
    );
    return;
  }

  if (!body.trim()) {
    setMessage(
      "Please enter an email body."
    );
    return;
  }

  try {
    setMessage("");

    /*
     * Convert user settings to numbers.
     */
    const delaySeconds =
      Number(delay) || 0;

    const hourlyLimitNumber =
      Number(hourlyLimit) || 0;

    /*
     * Schedule each recipient separately.
     */
    for (
      let i = 0;
      i < recipients.length;
      i++
    ) {
      const recipient = recipients[i];

      /*
       * Add the configured delay between
       * consecutive emails.
       */
      const recipientScheduledDate =
        new Date(
          scheduledDate.getTime() +
            i *
              delaySeconds *
              1000
        );

      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/emails/schedule`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              recipient,
              subject,
              body,
              scheduledAt:
                recipientScheduledDate.toISOString(),

              /*
               * User-configured sending controls.
               */
              delaySeconds,
              hourlyLimit:
                hourlyLimitNumber,
            }),
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.message ||
            `Failed to schedule email for ${recipient}`
        );
      }
    }

    /*
     * Everything succeeded.
     */
    setShowSchedule(false);

    navigate("/dashboard");
  } catch (error) {
    console.error(
      "Failed to schedule email:",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to schedule email. Please try again."
    );
  }
};


  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#333333]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-white">

        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <header className="flex min-h-[72px] items-center justify-between border-b border-[#e9e9e9] px-8">

          {/* Left */}

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              aria-label="Back to dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[20px] text-[#555555] transition hover:bg-[#f4f5f4] hover:text-[#222222]"
            >
              ←
            </button>

            <div>
              <h1 className="text-[18px] font-semibold tracking-[-0.2px] text-[#222222]">
                Compose New Email
              </h1>

              <p className="mt-0.5 text-[11px] text-[#999999]">
                Create and schedule an email campaign
              </p>
            </div>
          </div>

          {/* Right */}

          <div className="relative flex items-center gap-3">

            {/* Hidden attachment input */}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachment}
            />

            {/* Attachment */}

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Add attachment"
              className="flex h-10 items-center gap-2 rounded-full border border-[#dedede] bg-white px-4 text-[12px] font-medium text-[#555555] transition hover:border-[#4caf50] hover:bg-[#f5fbf6] hover:text-[#3fa34d]"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>

              <span>
                Attach file
              </span>
            </button>

            {/* Send Later */}

            <button
              type="button"
              onClick={() =>
                setShowSchedule(
                  (current) => !current
                )
              }
              className="flex h-10 items-center gap-2 rounded-full border border-[#4caf50] bg-white px-5 text-[12px] font-medium text-[#3fa34d] transition hover:bg-[#f2fbf4]"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path d="M12 7v5l3 2" />
              </svg>

              <span>
                Send Later
              </span>
            </button>

            {/* Schedule Popover */}

            {showSchedule && (
              <div className="absolute right-0 top-[52px] z-50">
                <SchedulePopover
                  onSchedule={handleSchedule}
                  onClose={() =>
                    setShowSchedule(false)
                  }
                />
              </div>
            )}
          </div>
        </header>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="flex-1 px-8 py-8 lg:px-14">

          <div className="mx-auto w-full max-w-[1120px]">

            {/* =================================================
                FROM
            ================================================= */}

            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center border-b border-[#eeeeee] py-5">

              <label className="text-[12px] font-medium text-[#666666]">
                From
              </label>

              <div className="flex items-center gap-3">

                <Avatar
                  name={user.name}
                  email={user.email}
                  picture={user.picture}
                  size="sm"
                />

                <p className="text-[13px] text-[#333333]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* =================================================
                TO
            ================================================= */}

            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-start border-b border-[#eeeeee] py-5">

              <label className="pt-3 text-[12px] font-medium text-[#666666]">
                To
              </label>

              <div>

                <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 transition focus-within:border-[#4caf50]">

                  {recipients.map(
                    (recipient) => (
                      <span
                        key={recipient}
                        className="inline-flex items-center gap-2 rounded-full border border-[#cfe8d3] bg-[#f1faf3] px-3 py-1.5 text-[11px] text-[#3d7544]"
                      >
                        <span>
                          {recipient}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeRecipient(
                              recipient
                            )
                          }
                          aria-label={`Remove ${recipient}`}
                          className="text-[15px] leading-none text-[#76a77c] transition hover:text-[#333333]"
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}

                  <input
                    type="text"
                    value={recipientInput}
                    onChange={(event) =>
                      setRecipientInput(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleRecipientKeyDown
                    }
                    onBlur={() => {
                      if (
                        recipientInput.trim()
                      ) {
                        addRecipient(
                          recipientInput
                        );
                      }
                    }}
                    placeholder={
                      recipients.length
                        ? "Add recipient"
                        : "recipient@example.com"
                    }
                    className="min-w-[220px] flex-1 border-0 bg-transparent px-1 py-2 text-[13px] text-[#333333] outline-none placeholder:text-[#b2b2b2]"
                  />
                </div>

                {/* Upload list */}

                <div className="mt-3">

                  <input
                    ref={recipientFileInputRef}
                    id="recipient-upload"
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={
                      handleUploadList
                    }
                  />

                  <label
                    htmlFor="recipient-upload"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#dcdcdc] bg-white px-4 text-[11px] font-medium text-[#555555] transition hover:border-[#4caf50] hover:bg-[#f5fbf6] hover:text-[#3fa34d]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3v12" />
                      <path d="m7 8 5-5 5 5" />
                      <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                    </svg>

                    Upload recipient list
                  </label>
                </div>
              </div>
            </div>

            {/* =================================================
                SUBJECT
            ================================================= */}

            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center border-b border-[#eeeeee] py-5">

              <label
                htmlFor="subject"
                className="text-[12px] font-medium text-[#666666]"
              >
                Subject
              </label>

              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                placeholder="Enter subject"
                className="h-11 w-full border-0 bg-transparent text-[13px] font-medium text-[#333333] outline-none placeholder:text-[#b4b4b4]"
              />
            </div>

            {/* =================================================
                SENDING CONTROLS
            ================================================= */}

            <div className="flex flex-wrap items-center gap-x-12 gap-y-4 border-b border-[#eeeeee] py-5">

              {/* Delay */}

              <div className="flex items-center gap-3">

                <label
                  htmlFor="delay"
                  className="text-[12px] font-medium text-[#555555]"
                >
                  Delay between emails
                </label>

                <input
                  id="delay"
                  type="number"
                  min="0"
                  value={delay}
                  onChange={(event) =>
                    setDelay(
                      event.target.value
                    )
                  }
                  className="h-10 w-[82px] rounded-lg border border-[#dddddd] bg-white px-3 text-center text-[12px] outline-none transition focus:border-[#4caf50]"
                />

                <span className="text-[11px] text-[#999999]">
                  seconds
                </span>
              </div>

              {/* Hourly limit */}

              <div className="flex items-center gap-3">

                <label
                  htmlFor="hourly-limit"
                  className="text-[12px] font-medium text-[#555555]"
                >
                  Hourly limit
                </label>

                <input
                  id="hourly-limit"
                  type="number"
                  min="0"
                  value={hourlyLimit}
                  onChange={(event) =>
                    setHourlyLimit(
                      event.target.value
                    )
                  }
                  className="h-10 w-[82px] rounded-lg border border-[#dddddd] bg-white px-3 text-center text-[12px] outline-none transition focus:border-[#4caf50]"
                />

                <span className="text-[11px] text-[#999999]">
                  emails / hour
                </span>
              </div>
            </div>

            {/* =================================================
                EMAIL EDITOR
            ================================================= */}

            <div className="mt-7">

              <div className="rounded-xl border border-[#e3e3e3] bg-white">

                <RichTextEditor
                  value={body}
                  onChange={setBody}
                />

              </div>
            </div>

            {/* =================================================
                ATTACHMENTS
            ================================================= */}

            {attachments.length > 0 && (
              <div className="mt-5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">

                <div className="mb-3 flex items-center justify-between">

                  <p className="text-[11px] font-semibold text-[#555555]">
                    Attachments
                  </p>

                  <span className="text-[10px] text-[#999999]">
                    {attachments.length} file
                    {attachments.length === 1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">

                  {attachments.map(
                    (file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-[#e1e1e1] bg-white px-3 py-2.5"
                      >

                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f0f8f2] text-[#4caf50]">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                        </div>

                        <span className="max-w-[300px] truncate text-[11px] text-[#555555]">
                          {file.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeAttachment(
                              index
                            )
                          }
                          aria-label={`Remove ${file.name}`}
                          className="text-[17px] leading-none text-[#999999] transition hover:text-[#333333]"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            

            
            {/* =================================================
                ERROR
            ================================================= */}

            {message && (
              <div className="mt-5 rounded-lg border border-[#f2d2d2] bg-[#fff5f5] px-4 py-3 text-[12px] text-[#d94b4b]">
                {message}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default Compose;