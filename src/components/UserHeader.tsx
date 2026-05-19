"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function UserHeader() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--panel)]/50 backdrop-blur-sm border border-[var(--line)]/50">
        <div className="w-6 h-6 bg-[var(--panel-2)]/50 rounded-full animate-pulse"></div>
        <div className="w-16 h-3 bg-[var(--panel-2)]/50 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--panel)]/80 backdrop-blur-sm border border-[var(--line)]/60 hover:bg-[var(--panel-2)]/80 hover:border-[var(--accent)]/30 transition-all duration-200 hover:shadow-[var(--glow)]"
      >
        <div className="flex items-center gap-2">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user?.name || "User"}
              className="w-7 h-7 rounded-full border-2 border-[var(--accent)]/50"
            />
          )}
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-[var(--ink)] leading-tight">
              {session.user?.name?.split(' ')[0] || "Usuário"}
            </span>
          </div>
        </div>
        <svg
          className={`w-3 h-3 text-[var(--ink-soft)] transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--panel)]/95 backdrop-blur-xl rounded-lg shadow-[var(--shadow)] border border-[var(--line)]/60 py-2 z-50">
            <div className="px-3 py-2 border-b border-[var(--line)]/50 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent-2)]/10">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user?.name || "User"}
                    className="w-8 h-8 rounded-full border-2 border-[var(--accent)]/60"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] leading-tight truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)] leading-tight truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-sm text-[var(--accent-3)] hover:bg-[var(--accent-3)]/10 transition-colors duration-200 text-left flex items-center gap-2 group"
              >
                <svg
                  className="w-4 h-4 text-[var(--accent-3)] flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
