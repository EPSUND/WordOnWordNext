import type { ReactNode } from "react";
import "./Icon.css";

/* Delade SVG-ikoner. SVG:n ärver textfärgen via currentColor och
   ser likadan ut överallt. Storleken är 1em (följer font-size); sätt en egen bredd
   via className där en annan storlek behövs. Lägg till nya ikoner i PATHS. */

export type IconName = "first" | "prev" | "next" | "last" | "expand";

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
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 16 16"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
