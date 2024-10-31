// FROM SHADCN
"use client";

import * as React from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import {
  addDays,
  endOfDay,
  startOfMonth,
  startOfDay,
  format,
  subDays,
  endOfMonth,
  subMonths,
  subYears,
  startOfYear,
  endOfYear,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    },
  },
  {
    label: "Yesterday",
    dates: {
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    },
  },
  {
    label: "This Month",
    dates: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
  },
  {
    label: "Last Month",
    dates: {
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    },
  },
  {
    label: "This Year",
    dates: {
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    },
  },
  {
    label: "Last Year",
    dates: {
      from: startOfYear(subYears(new Date(), 1)),
      to: endOfYear(subYears(new Date(), 1)),
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

  // Calculate adjacent months and years for prefetching
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

  // Enhanced prefetching to include adjacent years
  React.useEffect(() => {
    // Previous year's months
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", currentMonth, currentYear - 1],
      queryFn: () => fetchDailyTotals(currentMonth, currentYear - 1),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", nextMonth, currentYear - 1],
      queryFn: () => fetchDailyTotals(nextMonth, currentYear - 1),
      staleTime: 5 * 60 * 1000,
    });

    // Next year's months
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", currentMonth, currentYear + 1],
      queryFn: () => fetchDailyTotals(currentMonth, currentYear + 1),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", nextMonth, currentYear + 1],
      queryFn: () => fetchDailyTotals(nextMonth, currentYear + 1),
      staleTime: 5 * 60 * 1000,
    });

    // Adjacent months in current year (original prefetching)
    queryClient.prefetchQuery({
      queryKey: ["dailyTotals", prevMonth, prevYear],
      queryFn: () => fetchDailyTotals(prevMonth, prevYear),
      staleTime: 5 * 60 * 1000,
    });
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
    nextMonth,
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
  const [open, setOpen] = React.useState(false);
  const { dailyTotals, isLoading, isError, error } = useDailyTotals(month);

  // Add year navigation functions
  const handlePreviousYear = () => {
    setMonth(subYears(month, 1));
  };

  const handleNextYear = () => {
    setMonth(
      addDays(subDays(addDays(startOfYear(addDays(month, 365)), 1), 1), 1)
    );
  };

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-semibold",
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
          <div className="flex flex-col md:flex-row">
            {/* Mobile Select */}
            <div className="block md:hidden p-2 border-b border-border font-semibold">
              <Select
                onValueChange={(value) => {
                  const preset = PRESET_OPTIONS.find(
                    (option) => option.label === value
                  );
                  if (preset) {
                    handlePresetClick(preset);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((preset) => (
                    <SelectItem
                      key={preset.label}
                      value={preset.label}
                      className="font-semibold"
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex md:flex-col gap-1 p-2 border-r border-border">
              {PRESET_OPTIONS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="justify-start font-semibold"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-col">
              {/* Year Navigation - Updated to match calendar.tsx styling */}
              <div className="flex justify-between px-4 py-2 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousYear}
                  className="h-6 w-6 md:h-7 md:w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                >
                  <ChevronLeftIcon className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <span className="py-1 text-sm font-semibold">
                  {format(month, "yyyy")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextYear}
                  className="h-6 w-6 md:h-7 md:w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                >
                  <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
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
                className={cn(isLoading && "opacity-70", "w-full md:w-auto")}
              />
            </div>
          </div>
          {/* Add close button */}
          <div className="border-t border-border">
            <Button
              variant="ghost"
              className="w-full font-semibold"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
