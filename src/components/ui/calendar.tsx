"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DayPicker, DayContentProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type DailyTotalsMap = {
  [date: string]: {
    totalAmount: number;
    transactionCount: number;
  };
};

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  dailyTotals?: DailyTotalsMap;
};

const formatCurrency = (amount: number) => {
  const dollars = amount / 100;
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}m`;
  }
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(2)}`;
};

const getMinMaxAmounts = (dailyTotals: DailyTotalsMap) => {
  const amounts = Object.values(dailyTotals)
    .map((day) => day.totalAmount)
    .filter((amount) => amount > 0);

  if (amounts.length === 0) return { min: 0, max: 0 };

  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
  };
};

const getAmountColorClass = (amount: number, min: number, max: number) => {
  if (min === max) return "text-green-500";

  const range = max - min;
  const normalizedValue = range === 0 ? 0 : (amount - min) / range;

  if (normalizedValue >= 0.66) return "text-red-500";
  if (normalizedValue >= 0.33) return "text-yellow-500";
  return "text-green-500";
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  dailyTotals = {},
  ...props
}: CalendarProps) {
  // Calculate min and max once
  const { min, max } = React.useMemo(
    () => getMinMaxAmounts(dailyTotals),
    [dailyTotals]
  );

  // Custom DayContent component
  function CustomDayContent(props: DayContentProps) {
    const { date, activeModifiers } = props;
    const dateKey = date.toISOString().split("T")[0];
    const dayData = dailyTotals[dateKey];

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-1">
        <div className="font-semibold">{date.getDate()}</div>
        {dayData && dayData.totalAmount && (
          <>
            <div
              className={`text-xs  ${getAmountColorClass(
                dayData.totalAmount,
                min,
                max
              )}`}
            >
              {formatCurrency(dayData.totalAmount)}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1 ",
        head_row: "flex justify-between px-4 border-b",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-14 w-14 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeftIcon className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRightIcon className="h-4 w-4" />,
        DayContent: CustomDayContent,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
