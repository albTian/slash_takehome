// FROM SHADCN
"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

// Create a function for fetching daily totals
const fetchDailyTotals = async (month: number, year: number) => {
  const response = await fetch(
    `/transaction/daily-totals?month=${month}&year=${year}`
  );
  const data = await response.json();
  return data.dailyTotals;
};

// Custom hook to fetch daily totals for two months
function useDailyTotals(currentDate: Date) {
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  const currentMonthQuery = useQuery({
    queryKey: ["dailyTotals", currentMonth, currentYear],
    queryFn: () => fetchDailyTotals(currentMonth, currentYear),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const nextMonthQuery = useQuery({
    queryKey: ["dailyTotals", nextMonth, nextYear],
    queryFn: () => fetchDailyTotals(nextMonth, nextYear),
    staleTime: 5 * 60 * 1000,
  });

  return {
    dailyTotals: {
      ...(currentMonthQuery.data || {}),
      ...(nextMonthQuery.data || {}),
    },
    isLoading: currentMonthQuery.isLoading || nextMonthQuery.isLoading,
    isError: currentMonthQuery.isError || nextMonthQuery.isError,
    error: currentMonthQuery.error || nextMonthQuery.error,
  };
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [month, setMonth] = React.useState<Date>(date?.from || new Date());
  const { dailyTotals, isLoading, isError, error } = useDailyTotals(month);

  // If there's an error, log it but don't interrupt the UI
  React.useEffect(() => {
    if (isError) {
      console.error("Error fetching transaction days:", error);
    }
  }, [isError, error]);

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
              // Optional: Show loading state in a non-intrusive way
              className={cn(isLoading && "opacity-70")}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
