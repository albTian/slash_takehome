"use client";

import { endOfDay, startOfDay } from "date-fns";
import { useState, useEffect, useCallback, useRef } from "react";
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

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTransactions = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
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
      const data = await response.json();

      setTransactions(data.transactions);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, dateRange]);

  useEffect(() => {
    setPage(1);
    setTransactions([]);
  }, [dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [page, dateRange]);

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
          <Pagination className="mt-auto">
            <PaginationContent>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1 || isLoading}
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
                aria-disabled={!hasMore || isLoading}
                className={cn(!hasMore && "cursor-not-allowed opacity-50")}
                href={"#"}
              />
            </PaginationContent>
          </Pagination>
          <div className="border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-auto">
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction, index) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* {isLoading && (
        <div className="text-center py-4">Loading transactions...</div>
      )} */}
    </div>
  );
}
