"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback, useEffect, useState } from "react";
import { DollarSign, X } from "lucide-react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface AmountRange {
  min?: number;
  max?: number;
}

interface AmountRangePickerProps {
  value: AmountRange;
  onChange: (range: AmountRange) => void;
}

export function AmountRangePicker({ value, onChange }: AmountRangePickerProps) {
  // Local state for the inputs inside the popover
  const [localRange, setLocalRange] = useState<AmountRange>(value);

  // Debounce the local range before calling onChange
  const debouncedRange = useDebounce(localRange, 500);

  // Update parent when debounced value changes
  useEffect(() => {
    onChange(debouncedRange);
  }, [debouncedRange, onChange]);

  const handleMinAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalRange((prev) => ({
        ...prev,
        min: e.target.value ? Number(e.target.value) : undefined,
      }));
    },
    []
  );

  const handleMaxAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalRange((prev) => ({
        ...prev,
        max: e.target.value ? Number(e.target.value) : undefined,
      }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setLocalRange({ min: undefined, max: undefined });
  }, []);

  // Format the button text
  const getButtonText = () => {
    if (!value.min && !value.max) return "Any amount";
    if (value.min && !value.max) return `$${value.min}+`;
    if (!value.min && value.max) return `Up to $${value.max}`;
    return `$${value.min} - $${value.max}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[200px] justify-start text-left font-semibold"
        >
          <DollarSign className="mr-2 h-4 w-4 font-semibold" />
          {getButtonText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium leading-none">Amount Range</h4>
              <p className="text-sm text-muted-foreground">
                Set the minimum and maximum transaction amounts
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min-amount">Minimum</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="min-amount"
                    type="number"
                    placeholder="0.00"
                    className="pl-8"
                    value={localRange.min || ""}
                    onChange={handleMinAmountChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-amount">Maximum</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="max-amount"
                    type="number"
                    placeholder="0.00"
                    className="pl-8"
                    value={localRange.max || ""}
                    onChange={handleMaxAmountChange}
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            {(value.min !== undefined || value.max !== undefined) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
