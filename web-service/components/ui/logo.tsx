"use client";

import { useEffect, useState } from "react";

export default function Logo() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="brand-logo">
      <svg width="38" height="38" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="veltrixGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ffcc" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#veltrixGradient)"
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />

        {/* Inner V mark (clean geometric) */}
        <path
          d="M30 35 L50 75 L70 35"
          stroke="url(#veltrixGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className={pulse ? "brand-mark-path brand-mark-path-active" : "brand-mark-path"}
        />

        {/* Core dot */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="#00ffcc"
          opacity={pulse ? 1 : 0.6}
          className="brand-mark-dot"
        />
      </svg>

      <div className="brand-mark-copy">
        <span className="brand-name">
          VELTRIX
        </span>

        <span className="brand-subtitle">
          Trading made easy
        </span>
      </div>
    </div>
  );
}
