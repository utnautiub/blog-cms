"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { isSoundEnabled, playSound, setSoundEnabled } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(isSoundEnabled()), []);

  return (
    <button
      type="button"
      data-sound="none"
      aria-label={on ? "Tắt âm thanh" : "Bật âm thanh"}
      title={on ? "Tắt âm thanh" : "Bật âm thanh"}
      onClick={() => {
        const next = !on;
        setSoundEnabled(next);
        setOn(next);
        if (next) playSound("toggle");
      }}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {on ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}
