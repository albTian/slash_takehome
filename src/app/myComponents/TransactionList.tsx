"use client";

import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./DateRangePicker";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { endOfDay } from "date-fns";
import { startOfDay } from "date-fns";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: string;
  amountCents: number;
  merchantName: string;
  merchantImage: string;
  date: string;
  status: string;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Move the fetch logic into a separate function
const fetchTransactions = async ({
  page,
  dateRange,
}: {
  page: number;
  dateRange: DateRange | undefined;
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

  const response = await fetch(`/transaction?${params}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

// Custom hook for transactions
function useTransactions(page: number, dateRange: DateRange | undefined) {
  return useQuery({
    queryKey: ["transactions", page, dateRange?.from, dateRange?.to],
    queryFn: () => fetchTransactions({ page, dateRange }),
    // keepPreviousData: true, // Keep old data while fetching new data
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

function TransactionRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="ml-4">
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[150px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-[100px] rounded-full" />
      </TableCell>
    </TableRow>
  );
}

export default function TransactionList() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Use the custom hook
  const { data, isLoading, isError, error } = useTransactions(page, dateRange);

  // Update totalPages when data changes
  useEffect(() => {
    if (data?.pagination.totalPages) {
      setTotalPages(data.pagination.totalPages);
    }
  }, [data?.pagination.totalPages]);

  // Reset to first page when date range changes
  useEffect(() => {
    setPage(1);
  }, [dateRange]);

  if (isError) {
    return (
      <div className="text-red-500 p-4">
        Error: {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-200px)] flex flex-col">
      <DatePickerWithRange
        date={dateRange}
        onDateChange={(newDateRange) => {
          setDateRange(newDateRange);
        }}
      />

      <div className="relative flex-1 flex flex-col">
        <div className="flex flex-col">
          <div className="border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[40%]">Merchant</TableHead>
                  <TableHead className="w-[25%]">Date</TableHead>
                  <TableHead className="w-[15%]">Amount</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-auto">
                {isLoading ? (
                  <>
                    {Array.from({ length: 20 }).map((_, index) => (
                      <TransactionRowSkeleton key={index} />
                    ))}
                  </>
                ) : data?.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.transactions.map(
                    (transaction: Transaction, index: number) => (
                      <TableRow
                        key={
                          transaction.id +
                          transaction.date +
                          transaction.merchantName +
                          transaction.amountCents +
                          index
                        }
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover border"
                                src={transaction.merchantImage}
                                alt={transaction.merchantName}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">
                                {transaction.merchantName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.date).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ${(transaction.amountCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-4 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {capitalizeFirstLetter(transaction.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination className="mt-auto">
            <PaginationContent>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
                className={cn(page === 1 && "cursor-not-allowed opacity-50")}
                href={"#"}
              />

              <PaginationItem>
                <span className="flex h-9 items-center justify-center px-4 text-sm">
                  Page {page} of {totalPages}
                </span>
              </PaginationItem>

              <PaginationNext
                onClick={() => setPage((p) => p + 1)}
                aria-disabled={!data?.pagination.hasNextPage}
                className={cn(
                  !data?.pagination.hasNextPage &&
                    "cursor-not-allowed opacity-50"
                )}
                href={"#"}
              />
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
