// FROM SHADCN
"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, DailyTotalsMap } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [month, setMonth] = React.useState<Date>(date?.from || new Date());
  const [dailyTotals, setDailyTotals] = useState<DailyTotalsMap>({});

  // Update useMemo to handle the new data structure
  const fetchTransactionDays = React.useMemo(async () => {
    const currentMonth = month.getMonth() + 1;
    const currentYear = month.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    try {
      const [currentMonthData, nextMonthData] = await Promise.all([
        fetch(
          `/transaction/daily-totals?month=${currentMonth}&year=${currentYear}`
        ).then((res) => res.json()),
        fetch(
          `/transaction/daily-totals?month=${nextMonth}&year=${nextYear}`
        ).then((res) => res.json()),
      ]);

      // Merge the two maps
      return {
        ...currentMonthData.dailyTotals,
        ...nextMonthData.dailyTotals,
      };
    } catch (error) {
      console.error("Error fetching transaction days:", error);
      return {};
    }
  }, [month]);

  // Handle the async result
  useEffect(() => {
    fetchTransactionDays.then(setDailyTotals);
  }, [fetchTransactionDays]);

  // Add preset options
  const presets = [
    {
      label: "Today",
      dates: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Yesterday",
      dates: {
        from: addDays(new Date(), -1),
        to: addDays(new Date(), -1),
      },
    },
    {
      label: "This Month",
      dates: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: "Last Month",
      dates: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
    {
      label: "This Year",
      dates: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
      },
    },
    {
      label: "Last Year",
      dates: {
        from: new Date(new Date().getFullYear() - 1, 0, 1),
        to: new Date(new Date().getFullYear() - 1, 11, 31),
      },
    },
  ];

  const handleSelect = (newDate: DateRange | undefined) => {
    onDateChange(newDate);
  };

  const handlePresetClick = (preset: { dates: DateRange }) => {
    onDateChange(preset.dates);
    if (preset.dates.to) {
      setMonth(preset.dates.to);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="flex flex-col gap-1 p-3 border-r border-border">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="justify-start font-normal"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              month={month}
              onMonthChange={setMonth}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              dailyTotals={dailyTotals}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
