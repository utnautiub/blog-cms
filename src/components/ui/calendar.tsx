"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { vi } from "date-fns/locale";

import { clx } from "@/lib/utils";

const navBtn =
  "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      locale={vi}
      weekStartsOn={1}
      className={clx("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",
        button_previous: navBtn,
        button_next: navBtn,
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium capitalize",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-[0.75rem] font-normal text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
        selected:
          "[&>button]:bg-foreground [&>button]:text-background [&>button:hover]:bg-foreground",
        today: "[&>button]:ring-1 [&>button]:ring-ring",
        outside: "text-muted-foreground/40",
        disabled: "opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) => {
          if (orientation === "left") return <ChevronLeft className={clx("size-4", c)} />;
          if (orientation === "right") return <ChevronRight className={clx("size-4", c)} />;
          return <ChevronDown className={clx("size-4", c)} />;
        },
      }}
      {...props}
    />
  );
}
