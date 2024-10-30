"use client";

import { endOfDay, startOfDay } from "date-fns";
import { useState, useEffect, useCallback, useRef } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./DateRangePicker";

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

  const filteredTransactions = transactions.filter((transaction) => {
    if (!dateRange?.from) return true;
    if (!dateRange?.to) return true;
    const transactionDate = new Date(transaction.date);
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
  });

  return (
    <div className="space-y-4">
      <DatePickerWithRange
        date={dateRange}
        onDateChange={(newDateRange) => {
          setDateRange(newDateRange);
        }}
      />
      <table className="min-w-full bg-white border-gray-150 border-l border-r border-b">
        <thead className="bg-gray-100 sticky top-24 z-2">
          <tr className="border-gray-150 border-t">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Merchant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTransactions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-4">
                No transactions found
              </td>
            </tr>
          )}
          {filteredTransactions.map((transaction, index) => (
            <tr
              key={
                transaction.id +
                transaction.date +
                transaction.merchantName +
                transaction.amountCents +
                index
              }
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full object-cover border"
                      src={transaction.merchantImage}
                      alt={transaction.merchantName}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.merchantName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  ${(transaction.amountCents / 100).toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between w-full">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              page === 1 || isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || isLoading}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              !hasMore || isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">Loading transactions...</div>
      )}
    </div>
  );
}
