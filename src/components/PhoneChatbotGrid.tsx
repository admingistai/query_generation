"use client";

import { IPhoneFrame } from "@/components/IPhoneFrame";
import { PhoneChatbot } from "@/components/PhoneChatbot";

export function PhoneChatbotGrid() {
  return (
    <div className="h-screen w-full bg-neutral-900 flex items-center justify-center p-4 overflow-hidden">
      <div
        className="grid grid-cols-4 grid-rows-2 gap-4"
        style={{
          // Scale phones to fit 2 rows within viewport height
          // Phone height is 812px, 2 rows = 1624px + gaps
          // Scale to ~50% to fit in typical viewport
          transform: "scale(0.48)",
          transformOrigin: "center center",
        }}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex justify-center">
            <IPhoneFrame>
              <PhoneChatbot />
            </IPhoneFrame>
          </div>
        ))}
      </div>
    </div>
  );
}
