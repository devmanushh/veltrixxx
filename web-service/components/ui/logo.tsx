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
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          style={{
            transform: pulse ? "scale(1.03)" : "scale(1)",
            transformOrigin: "center",
            transition: "all 0.6s ease",
          }}
        />

        {/* Core dot */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="#00ffcc"
          opacity={pulse ? 1 : 0.6}
          style={{ transition: "all 0.6s ease" }}
        />
      </svg>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#ffffff",
          }}
        >
          VELTRIX
        </span>

        <span
          style={{
            fontSize: 15,
            color: "#8b8b8b",
            letterSpacing: "1px",
          }}
        >
          VELTRIXXX
        </span>
      </div>
    </div>
  );
}