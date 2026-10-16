"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** "2025-11-03" -> Date (giờ địa phương, tránh lệch múi giờ) */
const parse = (value: string): Date | undefined => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
};

/**
 * Date picker theo mẫu shadcn/ui: Popover + Calendar (react-day-picker).
 * value / onChange dùng chuỗi yyyy-MM-dd.
 */
export function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const date = parse(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-empty={!date}
          className="inline-flex h-10 w-full items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          autoFocus
        />
        <div className="border-t p-2">
          <button
            type="button"
            onClick={() => {
              onChange(format(new Date(), "yyyy-MM-dd"));
              setOpen(false);
            }}
            className="h-8 w-full rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Hôm nay
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
