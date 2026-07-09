"use client";

import { createContext, useContext } from "react";

export const OnboardingContext = createContext<{ openOnboard: () => void }>({
  openOnboard: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);
