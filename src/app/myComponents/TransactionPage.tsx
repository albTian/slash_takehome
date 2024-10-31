"use client";

import { Combobox } from "@/components/ui/combobox";
import { Transaction } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, startOfMonth } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { AmountRangePicker } from "./AmountRangePicker";
import { DatePickerWithRange } from "./DateRangePicker";
import TransactionTable from "./TransactionTable";

// Move the fetch logic into a separate function
const fetchTransactions = async ({
  page,
  dateRange,
  selectedMerchant,
  amountRange,
}: {
  page: number;
  dateRange: DateRange | undefined;
  selectedMerchant: string;
  amountRange: { min?: number; max?: number };
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
  });

  if (dateRange?.from) {
    params.append("from", dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append("to", dateRange.to.toISOString());
  }
  if (selectedMerchant !== "all") {
    params.append("merchant", selectedMerchant);
  }
  if (amountRange.min) {
    params.append("minAmount", (amountRange.min * 100).toString());
  }
  if (amountRange.max) {
    params.append("maxAmount", (amountRange.max * 100).toString());
  }

  const response = await fetch(`/transaction?${params}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

// Custom hook for transactions
function useTransactions(
  page: number,
  dateRange: DateRange | undefined,
  selectedMerchant: string,
  amountRange: { min?: number; max?: number }
) {
  return useQuery<{
    transactions: Transaction[];
    allMerchants: string[];
    pagination: {
      totalPages: number;
      hasNextPage: boolean;
    };
  }>({
    queryKey: [
      "transactions",
      page,
      dateRange?.from,
      dateRange?.to,
      selectedMerchant,
      amountRange.min,
      amountRange.max,
    ],
    queryFn: () =>
      fetchTransactions({ page, dateRange, selectedMerchant, amountRange }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export default function TransactionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    return {
      from: fromParam ? new Date(fromParam) : startOfMonth(new Date()),
      to: toParam ? new Date(toParam) : endOfMonth(new Date()),
    };
  });

  const [page, setPage] = useState(1);
  const lastTotalPages = useRef(1);
  const [selectedMerchant, setSelectedMerchant] = useState<string>(() => {
    const merchantParam = searchParams.get("merchant") || "";
    return merchantParam;
  });
  const [inputAmountRange, setInputAmountRange] = useState<{
    min?: number;
    max?: number;
  }>({});

  const { data, isLoading, isError, error } = useTransactions(
    page,
    dateRange,
    selectedMerchant,
    inputAmountRange
  );

  // Create merchant options using allMerchants from API
  const merchantOptions = useMemo(
    () => [
      { value: "all", label: "All Merchants" },
      ...(data?.allMerchants || []).map((merchant) => ({
        value: merchant,
        label: merchant,
      })),
    ],
    [data?.allMerchants]
  );

  // Update lastTotalPages only when we get a valid value
  if (data?.pagination.totalPages) {
    lastTotalPages.current = data.pagination.totalPages;
  }

  useEffect(() => {
    setPage(1);
  }, [dateRange, selectedMerchant, inputAmountRange]);

  const updateUrlWithDateRange = useCallback(
    (newDateRange: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newDateRange?.from) {
        params.set("from", newDateRange.from.toISOString());
      } else {
        params.delete("from");
      }
      if (newDateRange?.to) {
        params.set("to", newDateRange.to.toISOString());
      } else {
        params.delete("to");
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const updateUrlWithMerchant = useCallback(
    (merchant: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (merchant && merchant !== "all") {
        params.set("merchant", merchant);
      } else {
        params.delete("merchant");
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="space-y-4 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full sm:w-auto">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(newDateRange) => {
              setDateRange(newDateRange);
              updateUrlWithDateRange(newDateRange);
            }}
          />
        </div>
        <div className="w-full sm:w-auto">
          <Combobox
            options={merchantOptions}
            value={selectedMerchant}
            setValue={(newMerchant) => {
              setSelectedMerchant(newMerchant);
              updateUrlWithMerchant(newMerchant);
            }}
          />
        </div>
        <div className="w-full sm:w-auto">
          <AmountRangePicker
            value={inputAmountRange}
            onChange={setInputAmountRange}
          />
        </div>
      </div>
      <TransactionTable
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        page={page}
        setPage={setPage}
        totalPages={lastTotalPages.current}
        selectedMerchant={selectedMerchant}
      />
    </div>
  );
}
