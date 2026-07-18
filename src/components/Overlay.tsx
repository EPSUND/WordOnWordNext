import type { ReactNode } from "react";

export default function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="overlay">
      <div className="dialog">{children}</div>
    </div>
  );
}
