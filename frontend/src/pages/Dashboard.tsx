
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import EmailRow from "../components/emails/EmailRow";

import type { Email } from "../types/email";

interface User {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ActiveFolder = "scheduled" | "sent";

function Dashboard({
  user,
  onLogout,
}: DashboardProps) {
  const navigate = useNavigate();

  const [activeFolder, setActiveFolder] =
    useState<ActiveFolder>("scheduled");

  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /*
   * Fetch emails from backend.
   */
  const fetchEmails = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/emails`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data = await response.json();

      setEmails(data.emails || []);
    } catch (error) {
      console.error(
        "Failed to load dashboard emails:",
        error
      );

      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  /*
   * Scheduled emails.
   */
  const scheduledEmails = emails.filter(
    (email) =>
      email.status === "scheduled" ||
      email.status === "processing"
  );

  /*
   * Sent emails.
   */
  const sentEmails = emails.filter(
    (email) =>
      email.status === "sent" ||
      email.status === "failed"
  );

  /*
   * Sidebar counts.
   */
  const scheduledCount =
    scheduledEmails.length;

  const sentCount =
    sentEmails.length;

  /*
   * Current email list.
   */
  const displayedEmails =
    activeFolder === "scheduled"
      ? scheduledEmails
      : sentEmails;

  /*
   * Search current folder.
   *
   * Searches recipient, subject and body.
   */
  const filteredEmails = displayedEmails.filter(
    (email) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      const recipient =
        email.recipient?.toLowerCase() || "";

      const subject =
        email.subject?.toLowerCase() || "";

      const body =
        email.body?.toLowerCase() || "";

      return (
        recipient.includes(query) ||
        subject.includes(query) ||
        body.includes(query)
      );
    }
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#333333]">
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="flex w-[205px] shrink-0 flex-col border-r border-[#e8e8e8] bg-white px-3 py-4">

          {/* User */}

          <div className="mb-3 flex items-center justify-between rounded-xl bg-[#f4f6f4] px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar
                name={user.name}
                email={user.email}
                picture={user.picture}
                size="sm"
              />

              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-[#333333]">
                  {user.name || "Google User"}
                </p>

                <p className="max-w-[125px] truncate text-[9px] text-[#888888]">
                  {user.email || ""}
                </p>
              </div>
            </div>

            <span className="ml-1 text-[12px] text-[#888888]">
              ⌄
            </span>
          </div>

          {/* Compose */}

          <Button
            onClick={() => navigate("/compose")}
            variant="secondary"
            className="mb-5 h-[31px] w-full rounded-full border-[#4caf50] bg-white px-3 py-0 text-[11px] font-medium text-[#3fa34d] hover:bg-[#f2fbf4]"
          >
            Compose
          </Button>

          {/* Core */}

          <div className="px-2">
            <p className="mb-2 text-[9px] font-medium uppercase tracking-wide text-[#a0a0a0]">
              Core
            </p>
          </div>

          {/* Navigation */}

          <nav className="space-y-1">
            <SidebarItem
              label="Scheduled"
              count={scheduledCount}
              active={
                activeFolder === "scheduled"
              }
              onClick={() =>
                setActiveFolder("scheduled")
              }
              icon={
                <svg
                  width="13"
                  height="13"
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
              }
            />

            <SidebarItem
              label="Sent"
              count={sentCount}
              active={
                activeFolder === "sent"
              }
              onClick={() =>
                setActiveFolder("sent")
              }
              icon={
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2 11 13" />
                  <path d="m22 2-7 20-4-9-9-4Z" />
                </svg>
              }
            />
          </nav>
        </aside>

        {/* =====================================================
            MAIN EMAIL AREA
        ===================================================== */}

        <main className="min-w-0 flex-1 bg-white">

          {/* Toolbar */}

          <div className="flex h-[58px] items-center border-b border-[#eeeeee] px-5">

            {/* Search */}

            <div className="relative max-w-[460px] flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search"
                className="h-[30px] w-full rounded-full bg-[#f4f6f5] pl-9 pr-4 text-[11px] text-[#555555] outline-none placeholder:text-[#a6a6a6] focus:bg-[#eef1ef]"
              />
            </div>

            {/* Actions */}

            <div className="ml-4 flex items-center gap-4">

              {/* Filter */}

              <button
                type="button"
                aria-label="Filter"
                className="text-[#9a9a9a] transition hover:text-[#555555]"
              >
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
                  <path d="M4 5h16" />
                  <path d="M7 12h10" />
                  <path d="M10 19h4" />
                </svg>
              </button>

              {/* Refresh */}

              <button
                type="button"
                aria-label="Refresh"
                onClick={fetchEmails}
                className="text-[#9a9a9a] transition hover:text-[#555555]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
                  <path d="M4 5v4h4" />
                  <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
                  <path d="M20 19v-4h-4" />
                </svg>
              </button>

              {/* Logout */}

              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-[#e2e2e2] px-3.5 py-1.5 text-[10px] font-medium text-[#777777] transition hover:border-[#d4d4d4] hover:bg-[#f7f7f7] hover:text-[#333333]"
              >
                Logout
              </button>
            </div>
          </div>

          {/* =================================================
              EMAIL LIST
          ================================================= */}

          <div>

            {loading ? (
              <div className="flex min-h-[500px] items-center justify-center">
                <p className="text-[11px] text-[#999999]">
                  Loading emails...
                </p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">

                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f6f5]">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a0a0a0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16v16H4z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  </div>

                  <p className="text-[11px] text-[#999999]">
                    {search.trim()
                      ? "No emails match your search."
                      : activeFolder === "scheduled"
                        ? "No scheduled emails."
                        : "No sent emails."}
                  </p>
                </div>
              </div>
            ) : (
              filteredEmails.map(
                (email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    type={activeFolder}
                  />
                )
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR ITEM
============================================================ */

interface SidebarItemProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  icon,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
        active
          ? "bg-[#f1f6f2] text-[#3fa34d]"
          : "text-[#777777] hover:bg-[#f7f8f7] hover:text-[#444444]"
      }`}
    >
      <span className="flex items-center gap-2.5">
        {icon}

        <span className="text-[11px] font-medium">
          {label}
        </span>
      </span>

      <span
        className={`text-[10px] ${
          active
            ? "text-[#3fa34d]"
            : "text-[#aaaaaa]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default Dashboard;
