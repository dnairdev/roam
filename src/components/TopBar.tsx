"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

interface Props {
  userName?: string | null;
  userImage?: string | null;
}

export default function TopBar({ userName, userImage }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-gray-900">
          roam
        </span>
        <span className="text-xs text-gray-400 mt-0.5">beta</span>
      </div>

      <div className="relative flex items-center gap-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 transition-colors"
        >
          {userImage ? (
            <img
              src={userImage}
              alt=""
              className="h-7 w-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white font-medium">
              {userName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden sm:inline">
            {userName}
          </span>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => signOut()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
