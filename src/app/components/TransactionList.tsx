'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const url = cursor
      ? `/transaction?cursor=${encodeURIComponent(cursor)}`
      : '/transaction';

    try {
      const response = await fetch(url);
      const data = await response.json();

      setTransactions((prev) => [...prev, ...data.transactions]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchTransactions();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchTransactions]);

  return (
    <div >
      <table className="min-w-full bg-white border-gray-150 border-l border-r border-b">
        <thead className="bg-gray-100 sticky top-24 z-2">
          <tr className="border-gray-150 border-t">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img className="h-10 w-10 rounded-full object-cover border" src={transaction.merchantImage} alt={transaction.merchantName} />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{transaction.merchantName}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{new Date(transaction.date).toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">${(transaction.amountCents / 100).toFixed(2)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-4 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {capitalizeFirstLetter(transaction.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table >
      {hasMore && (
        <div ref={loaderRef} className="text-center py-4">
          {isLoading ? 'Loading more...' : 'Scroll to load more'}
        </div>
      )
      }
    </div >
  );
}
