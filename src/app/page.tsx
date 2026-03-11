"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Dashboard from "@/components/Dashboard";
import LoginScreen from "@/components/LoginScreen";
import OnboardingScreen from "@/components/OnboardingScreen";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  onboarded: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setProfileLoading(true);
      fetch("/api/user")
        .then((r) => r.json())
        .then((data) => setProfile(data))
        .catch(() => {})
        .finally(() => setProfileLoading(false));
    } else {
      setProfile(null);
    }
  }, [session]);

  // Loading
  if (status === "loading" || (session && profileLoading)) {
    return (
      <div
        className="dot-grid"
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F3FA",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle: "italic",
              fontSize: 32,
              color: "#1E1A2E",
              margin: "0 0 8px",
            }}
          >
            roam
          </p>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#A89FC0",
              letterSpacing: "1px",
            }}
          >
            loading...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!session) {
    return <LoginScreen />;
  }

  // Signed in but not yet onboarded
  if (profile && !profile.onboarded) {
    return (
      <OnboardingScreen
        prefillName={session.user?.name ?? ""}
        prefillEmail={session.user?.email ?? ""}
        prefillPhone={profile.phone ?? ""}
        onComplete={() => setProfile((p) => p ? { ...p, onboarded: true } : p)}
      />
    );
  }

  // Fully onboarded
  return <Dashboard />;
}
