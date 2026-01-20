import React from "react";

export const LogoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
    <path
      d="M16 2L2 9L2 23L16 30L30 23L30 9L16 2Z"
      fill="url(#logo-grad-auth)"
      fillOpacity="0.1"
      stroke="url(#logo-grad-auth)"
      strokeWidth="2"
    />
    <path
      d="M16 8V24"
      stroke="url(#logo-grad-auth)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 12L16 16L24 12"
      stroke="url(#logo-grad-auth)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="3" fill="var(--accent-cyan)" />
    <defs>
      <linearGradient
        id="logo-grad-auth"
        x1="0"
        y1="0"
        x2="32"
        y2="32"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);
