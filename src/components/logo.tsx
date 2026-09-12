export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ProcureFlow logo"
    >
      {/* Shield shape */}
      <path
        d="M20 2L4 10V20C4 30 10.8 37.2 20 40C29.2 37.2 36 30 36 20V10L20 2Z"
        fill="#2563EB"
      />
      {/* Inner document / checklist icon */}
      <rect x="13" y="10" width="14" height="18" rx="2" fill="white" opacity="0.95" />
      <path
        d="M16.5 15.5L18 17L23.5 11.5"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="16" y1="20" x2="24" y2="20" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="23" x2="22" y2="23" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="26" x2="20" y2="26" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
