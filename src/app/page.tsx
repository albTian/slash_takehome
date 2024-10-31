"use client";

import TransactionList from "./myComponents/TransactionPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900  bg-gray-100 z-1 pt-12 pb-4">
            Transactions
          </h1>
          <TransactionList />
        </div>
      </div>
    </QueryClientProvider>
  );
}
