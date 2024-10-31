"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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

interface TransactionTableProps {
  data:
    | {
        transactions: Transaction[];
        allMerchants: string[];
        pagination: {
          totalPages: number;
          hasNextPage: boolean;
        };
      }
    | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  selectedMerchant: string;
}

const TransactionTable = ({
  data,
  isLoading,
  isError,
  error,
  page,
  setPage,
  totalPages,
  selectedMerchant,
}: TransactionTableProps) => {
  return (
    <>
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
                ) : data?.transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.transactions?.map(
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
                onClick={() => setPage(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={cn(page === 1 && "cursor-not-allowed opacity-50")}
                href="#"
              />

              <PaginationItem>
                <span className="flex h-9 items-center justify-center px-4 text-sm">
                  Page {page} of {totalPages}
                </span>
              </PaginationItem>

              <PaginationNext
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                aria-disabled={!data?.pagination.hasNextPage}
                className={cn(
                  !data?.pagination.hasNextPage &&
                    "cursor-not-allowed opacity-50"
                )}
                href="#"
              />
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </>
  );
};

export default TransactionTable;
