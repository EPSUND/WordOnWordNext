import type { ReactNode } from "react";
import "./Overlay.css";

interface Props {
  children: ReactNode;
  /** Extra klass på dialogrutan, för dialoger som behöver egen storlek. */
  className?: string;
}

export default function Overlay({ children, className }: Props) {
  return (
    <div className="overlay">
      <div className={"dialog" + (className ? " " + className : "")}>{children}</div>
    </div>
  );
}
