"use client";

import { useSession } from "next-auth/react";
import Dashboard from "@/components/Dashboard";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
