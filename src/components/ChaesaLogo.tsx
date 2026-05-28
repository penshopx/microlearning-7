import { useId } from "react";

interface ChaesaLogoProps {
  size?: number;
  className?: string;
}

export function ChaesaLogo({ size = 32, className = "" }: ChaesaLogoProps) {
  const id = useId();
  const bgId = `cl-bg-${id}`;
  const glowId = `cl-glow-${id}`;
  const screenId = `cl-screen-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Chaesa Live"
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id={glowId} x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={screenId} x1="24" y1="22" x2="96" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.97" />
          <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.92" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" rx="26" fill={`url(#${bgId})`} />
      <rect width="120" height="120" rx="26" fill={`url(#${glowId})`} />

      <rect x="18" y="24" width="84" height="56" rx="10" fill={`url(#${screenId})`} />

      <path
        d="M53 42L53 62L71 52L53 42Z"
        fill="#7C3AED"
      />

      <rect x="46" y="80" width="28" height="4" rx="2" fill="white" fillOpacity="0.5" />

      <rect x="36" y="88" width="48" height="3.5" rx="1.75" fill="white" fillOpacity="0.85" />
      <rect x="42" y="95" width="36" height="3" rx="1.5" fill="white" fillOpacity="0.5" />

      <circle cx="100" cy="28" r="7" fill="#34D399" />
      <circle cx="100" cy="28" r="11" fill="#34D399" fillOpacity="0.2" />
    </svg>
  );
}

export function ChaesaLogoMark({ size = 24, className = "" }: ChaesaLogoProps) {
  const id = useId();
  const markId = `cl-mark-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Chaesa Live"
    >
      <defs>
        <linearGradient id={markId} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
      </defs>

      <rect x="18" y="24" width="84" height="56" rx="10" fill="currentColor" fillOpacity="0.9" />

      <path d="M53 42L53 62L71 52L53 42Z" fill={`url(#${markId})`} />

      <rect x="36" y="88" width="48" height="3.5" rx="1.75" fill="currentColor" fillOpacity="0.6" />
      <rect x="42" y="95" width="36" height="3" rx="1.5" fill="currentColor" fillOpacity="0.35" />

      <circle cx="100" cy="28" r="7" fill="#34D399" />
      <circle cx="100" cy="28" r="11" fill="#34D399" fillOpacity="0.2" />
    </svg>
  );
}
