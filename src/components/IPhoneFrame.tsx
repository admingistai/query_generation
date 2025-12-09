"use client";

import { ReactNode } from "react";

interface IPhoneFrameProps {
  children: ReactNode;
}

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="relative w-[375px] h-[812px] bg-black rounded-[40px] p-[12px] shadow-2xl">
      {/* Device bezel */}
      <div className="relative w-full h-full bg-background rounded-[32px] overflow-hidden">
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-10" />

        {/* Content area */}
        <div className="h-full pt-10 pb-6">
          {children}
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-foreground/20 rounded-full" />
      </div>
    </div>
  );
}
