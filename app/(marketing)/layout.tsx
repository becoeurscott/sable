"use client";

import { useState } from "react";
import { Nav } from "./Nav";
import { OnboardingModal } from "./Onboarding";
import { OnboardingContext } from "./onboarding-context";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <OnboardingContext.Provider value={{ openOnboard: () => setOpen(true) }}>
      <div style={{ minHeight: "100vh", background: "#FFFFFF", overflowX: "hidden" }}>
        <Nav />
        {children}
      </div>
      <OnboardingModal open={open} onClose={() => setOpen(false)} onFinish={() => setOpen(false)} />
    </OnboardingContext.Provider>
  );
}
