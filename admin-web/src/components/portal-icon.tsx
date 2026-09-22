import type { IconName } from '@/lib/hrm-modules';

const paths: Record<IconName, React.ReactNode> = {
  settings: <><path d="M4 7h16 M4 17h16" /><circle cx="9" cy="7" r="3" fill="white" /><circle cx="16" cy="17" r="3" fill="white" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />,
  file: <path d="M14 3H5v18h14V8Z M14 3v5h5 M8 12h8 M8 16h6" />,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3 M16 5a3 3 0 0 1 0 6 M18 14a5 5 0 0 1 3 4v3" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 7V4h14v2 M21 11h-6v5h6 M17 13.5h.1" /></>,
  chart: <path d="M4 3v17h17 M8 16v-5 M13 16V7 M18 16V4" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  arrow: <path d="m9 5 7 7-7 7" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4 M17 3v4 M3 11h18 M7 15h3 M14 15h3" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  reconcile: <><path d="M12 3v18M4 14l4-8 4 8H4zm8 0l4-8 4 8h-8z" /><path d="M5 8l7-5 7 5" /></>,
  currency: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" /></>,
  key: <><circle cx="8" cy="12" r="5" /><path d="M13 12h8v4h-3v-2h-3v-2z" /></>,
  app: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><path d="M17 13v8M13 17h8" /></>,
  bot: <><rect x="4" y="7" width="16" height="12" rx="3" /><circle cx="9" cy="12" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" /><path d="M12 2v5M9 16h6" /></>,
};

export function PortalIcon({ name, size = 22, style }: { name: IconName; size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">{paths[name] || paths.settings}</svg>;
}
