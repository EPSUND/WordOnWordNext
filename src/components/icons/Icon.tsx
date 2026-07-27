import type { ReactNode } from "react";
import "./Icon.css";

/* Delade SVG-ikoner. SVG:n ärver textfärgen via currentColor och
   ser likadan ut överallt. Storleken är 1em (följer font-size); sätt en egen bredd
   via className där en annan storlek behövs. Lägg till nya ikoner i PATHS. */

export type IconName =
  | "first"
  | "prev"
  | "next"
  | "last"
  | "expand"
  | "sound-on"
  | "sound-off"
  | "trophy"
  | "undo"
  | "help";

const PATHS: Record<IconName, ReactNode> = {
  first: (
    <>
      <rect x="3" y="3.5" width="1.8" height="9" />
      <path d="M13 3.5 L6.5 8 L13 12.5 Z" />
    </>
  ),
  prev: <path d="M11.5 3.5 L5 8 L11.5 12.5 Z" />,
  next: <path d="M4.5 3.5 L11 8 L4.5 12.5 Z" />,
  last: (
    <>
      <path d="M3 3.5 L9.5 8 L3 12.5 Z" />
      <rect x="11.2" y="3.5" width="1.8" height="9" />
    </>
  ),
  // Disclosure-triangel: pekar åt höger, roteras till nedåt när raden är öppen.
  expand: <path d="M6 4 L11 8 L6 12 Z" />,
  "sound-on": (
    <>
      <path d="M2 6 L4.5 6 L8 3 V13 L4.5 10 L2 10 Z" />
      <path
        className="wave"
        d="M10.5 5.5 Q12.5 8 10.5 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        className="wave"
        d="M12.5 3.8 Q15.5 8 12.5 12.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  "sound-off": (
    <>
      <path d="M2 6 L4.5 6 L8 3 V13 L4.5 10 L2 10 Z" />
      <path
        d="M10.8 5.8 L14.2 9.2 M14.2 5.8 L10.8 9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  trophy: (
    <>
      <path d="M4 2.5 H12 V5 A4 4 0 0 1 4 5 Z" />
      <path
        d="M4 3 H2.3 A2 2 0 0 0 4 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M12 3 H13.7 A2 2 0 0 1 12 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <rect x="7.1" y="9" width="1.8" height="2.2" />
      <rect x="4.8" y="11" width="6.4" height="1.5" rx="0.4" />
      <rect x="5.6" y="12.5" width="4.8" height="1.5" rx="0.4" />
    </>
  ),
  undo: (
    <>
      <path
        d="M12 5 V7 A3.5 3.5 0 0 1 8.5 10.5 H4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 6.8 L2.4 10.5 L7 14.2 Z" />
    </>
  ),
  // Info: ringad "i" (prick + stapel). Ritas i currentColor som de andra.
  help: (
    <>
      <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="4.8" r="1.05" />
      <rect x="7.05" y="6.7" width="1.9" height="4.9" rx="0.9" />
    </>
  ),
};

interface Props {
  name: IconName;
  /** Extra klass, t.ex. för egen storlek. */
  className?: string;
  /** Sätts när ikonen är meningsbärande (annars döljs den för skärmläsare). */
  title?: string;
}

export default function Icon({ name, className, title }: Props) {
  return (
    <svg
      className={`icon icon-${name}${className ? " " + className : ""}`}
      viewBox="0 0 16 16"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
