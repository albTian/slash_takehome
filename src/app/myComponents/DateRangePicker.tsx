// FROM SHADCN
"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, DailyTotalsMap } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PRESET_OPTIONS = [
  {
    label: "Today",
    dates: {
      from: new Date(new Date().setHours(0, 0, 0, 0)),
      to: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  },
  {
    label: "Yesterday",
    dates: {
      from: new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000),
      to: new Date(new Date().setHours(23, 59, 59, 999) - 24 * 60 * 60 * 1000),
    },
  },
  {
    label: "This Month",
    dates: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
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
      to: new Date(new Date().getFullYear() + 1, 0, 0),
    },
  },
  {
    label: "Last Year",
    dates: {
      from: new Date(new Date().getFullYear() - 1, 0, 1),
      to: new Date(new Date().getFullYear(), 0, 0),
    },
  },
];
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

// Custom hook to fetch daily totals for two months and prefetch adjacent months
function useDailyTotals(currentDate: Date) {
  const queryClient = useQueryClient();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  // Calculate previous and future months for prefetching
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const futureMonth = nextMonth === 12 ? 1 : nextMonth + 1;
  const futureYear = nextMonth === 12 ? nextYear + 1 : nextYear;

  // Main queries for visible months
  const currentMonthQuery = useQuery({
    queryKey: ["dailyTotals", currentMonth, currentYear],
    queryFn: () => fetchDailyTotals(currentMonth, currentYear),
    staleTime: 5 * 60 * 1000,
  });

  const nextMonthQuery = useQuery({
    queryKey: ["dailyTotals", nextMonth, nextYear],
    queryFn: () => fetchDailyTotals(nextMonth, nextYear),
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch adjacent months
  React.useEffect(() => {
    // Prefetch previous month
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", prevMonth, prevYear],
      queryFn: () => fetchDailyTotals(prevMonth, prevYear),
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch future month
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", futureMonth, futureYear],
      queryFn: () => fetchDailyTotals(futureMonth, futureYear),
      staleTime: 5 * 60 * 1000,
    });
  }, [
    currentMonth,
    currentYear,
    queryClient,
    prevMonth,
    prevYear,
    futureMonth,
    futureYear,
  ]);

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
              {PRESET_OPTIONS.map((preset) => (
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
