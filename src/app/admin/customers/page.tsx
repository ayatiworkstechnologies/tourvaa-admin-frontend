"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuRefreshCw as RefreshCw } from "react-icons/lu";

import CustomerFilters, { CustomerFilterState } from "@/components/customers/CustomerFilters";
import CustomerTable from "@/components/customers/CustomerTable";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { useAuthContext } from "@/providers/AuthProvider";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import {
  blockCustomer,
  Customer,
  getCustomers,
  resetCustomerPassword,
  unblockCustomer,
} from "@/lib/api/services/customerService";

const initialFilters: CustomerFilterState = {
  search: "",
  country: "",
  status: "",
  booking_status: "",
  payment_status: "",
  start_date: "",
  end_date: "",
  sort_by: "newest",
};

export default function CustomersPage() {
  const pagination = usePagination(10);
  const { page, limit, total, totalPages, setPage, setTotal, setTotalPages } = pagination;
  const { hasPermission } = useAuthContext();
  const toast = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const canBlock = hasPermission("customers.block") || hasPermission("customers.edit");
  const canUnblock = hasPermission("customers.unblock") || hasPermission("customers.edit");
  const canReset = hasPermission("customers.reset_password") || hasPermission("customers.edit");

  const debouncedSearch = useDebounce(filters.search, 350);

  const filterParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      country: filters.country,
      status: filters.status,
      booking_status: filters.booking_status,
      payment_status: filters.payment_status,
      start_date: filters.start_date,
      end_date: filters.end_date,
      sort_by: filters.sort_by,
    }),
    [filters, debouncedSearch, limit, page]
  );

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCustomers(filterParams);
      setCustomers(response.items || response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch {
      toast.error("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [filterParams, setTotal, setTotalPages, toast]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const updateFilter = (key: keyof CustomerFilterState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const handleBlock = async (customer: Customer) => {
    const reason = window.prompt("Enter block reason");
    if (!reason?.trim()) return;

    setSavingId(customer.id);
    try {
      await blockCustomer(customer.id, reason);
      toast.success("Customer blocked.");
      await fetchCustomers();
    } catch {
      toast.error("Could not block customer.");
    } finally {
      setSavingId(null);
    }
  };

  const handleUnblock = async (customer: Customer) => {
    if (!window.confirm("Unblock this customer?")) return;

    setSavingId(customer.id);
    try {
      await unblockCustomer(customer.id);
      toast.success("Customer unblocked.");
      await fetchCustomers();
    } catch {
      toast.error("Could not unblock customer.");
    } finally {
      setSavingId(null);
    }
  };

  const handleResetPassword = async (customer: Customer) => {
    if (!window.confirm("Send password reset email to this customer?")) return;

    setSavingId(customer.id);
    try {
      await resetCustomerPassword(customer.id);
      toast.success("Password reset email sent.");
    } catch {
      toast.error("Could not send password reset email.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <ModuleWrapper title="Customers" requiredPermission="customers.view">
      <div className="space-y-6">
        <section className="rounded-xl border border-dash-border bg-white p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-dash-text">Customer Management</h2>
              <p className="mt-1 text-sm leading-6 text-dash-muted">
                Search customers, review travel/payment summaries, and control account access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchCustomers()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
          <CustomerFilters filters={filters} onChange={updateFilter} />
        </section>

        <section className="overflow-hidden rounded-xl border border-dash-border bg-white">
          {loading ? (
            <Loader label="Loading customers..." />
          ) : (
            <CustomerTable
              customers={customers}
              page={page}
              limit={limit}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              savingId={savingId}
              canBlock={canBlock}
              canUnblock={canUnblock}
              canReset={canReset}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onReset={handleResetPassword}
            />
          )}
        </section>
      </div>
    </ModuleWrapper>
  );
}
