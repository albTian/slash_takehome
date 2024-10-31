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
import { Button } from "@/components/ui/button";
import { XIcon, DownloadIcon } from "lucide-react";

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

// Add new fetch function for exporting
const fetchAllTransactions = async ({
  dateRange,
  selectedMerchant,
  amountRange,
}: {
  dateRange: DateRange | undefined;
  selectedMerchant: string;
  amountRange: { min?: number; max?: number };
}) => {
  let allTransactions: Transaction[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      page: currentPage.toString(),
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
    const data = await response.json();
    allTransactions = [...allTransactions, ...data.transactions];

    hasMore = data.pagination.hasNextPage;
    currentPage++;
  }

  return allTransactions;
};

// Update the export function to handle the fetching
const exportTransactionsToCSV = async ({
  dateRange,
  selectedMerchant,
  amountRange,
}: {
  dateRange: DateRange | undefined;
  selectedMerchant: string;
  amountRange: { min?: number; max?: number };
}) => {
  try {
    const transactions = await fetchAllTransactions({
      dateRange,
      selectedMerchant,
      amountRange,
    });

    // Define CSV headers
    const headers = ["Date", "Merchant", "Amount", "Status"];

    // Convert transactions to CSV rows
    const csvRows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.merchantName,
      (t.amountCents / 100).toFixed(2),
      t.status,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting transactions:", error);
    // You might want to add some error handling UI here
  }
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
  const [isExporting, setIsExporting] = useState(false);

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

  const resetFilters = useCallback(() => {
    // Reset all filters to default values
    setDateRange(undefined);
    setSelectedMerchant("");
    setInputAmountRange({});
    setPage(1);

    // Update URL by removing all filter parameters
    const params = new URLSearchParams();
    router.push("?");
  }, [router]);

  const hasActiveFilters = useMemo(() => {
    return (
      selectedMerchant !== "" ||
      inputAmountRange.min !== undefined ||
      inputAmountRange.max !== undefined ||
      (dateRange?.from &&
        dateRange.from.getTime() !== startOfMonth(new Date()).getTime()) ||
      (dateRange?.to &&
        dateRange.to.getTime() !== endOfMonth(new Date()).getTime())
    );
  }, [dateRange, selectedMerchant, inputAmountRange]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportTransactionsToCSV({
        dateRange,
        selectedMerchant,
        amountRange: inputAmountRange,
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        <div className="w-full sm:w-auto">
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="font-semibold"
              onClick={resetFilters}
            >
              <XIcon className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          )}
        </div>
        <div className="w-full sm:w-auto lg:ml-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoading || isExporting}
            className="font-semibold"
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
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
