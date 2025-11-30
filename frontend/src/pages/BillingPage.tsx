import React, { useState, useEffect } from 'react';
import { CreditCard, Receipt, Download, Filter, Calendar, TrendingUp, DollarSign, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  client: string;
  service: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  invoiceNumber: string;
  paymentMethod?: string;
}

export const BillingPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Mock transaction data
      const mockData: Transaction[] = [
        {
          id: '1',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          client: 'John Doe',
          service: 'Document Certification',
          amount: 5000,
          status: 'paid',
          invoiceNumber: 'INV-2024-001',
          paymentMethod: 'M-PESA'
        },
        {
          id: '2',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          client: 'Sarah Mwangi',
          service: 'Contract Drafting',
          amount: 15000,
          status: 'paid',
          invoiceNumber: 'INV-2024-002',
          paymentMethod: 'Bank Transfer'
        },
        {
          id: '3',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          client: 'Peter Kamau',
          service: 'Legal Consultation',
          amount: 8000,
          status: 'pending',
          invoiceNumber: 'INV-2024-003'
        },
        {
          id: '4',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          client: 'Mary Wanjiru',
          service: 'Document Review',
          amount: 5000,
          status: 'paid',
          invoiceNumber: 'INV-2024-004',
          paymentMethod: 'M-PESA'
        },
        {
          id: '5',
          date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          client: 'James Omondi',
          service: 'Contract Review',
          amount: 12000,
          status: 'overdue',
          invoiceNumber: 'INV-2024-005'
        }
      ];
      setTransactions(mockData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredTransactions = filterStatus === 'all'
    ? transactions
    : transactions.filter(t => t.status === filterStatus);

  const stats = {
    totalRevenue: transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    overdueAmount: transactions.filter(t => t.status === 'overdue').reduce((sum, t) => sum + t.amount, 0),
    thisMonth: transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear() &&
             t.status === 'paid';
    }).reduce((sum, t) => sum + t.amount, 0)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-sm text-gray-600 mt-1">Manage invoices, payments, and financial records</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.thisMonth)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.overdueAmount)}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">No transactions match your selected filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Receipt className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{transaction.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.client}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{transaction.service}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.amount)}</div>
                        {transaction.paymentMethod && (
                          <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
};
