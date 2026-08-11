"use client";

import { useActionState, useState } from "react";
import { Baby } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import type { CustomerSearchResult } from "@/lib/actions/customers";
import { CustomerCombobox } from "@/components/customer-combobox";
import { PhoneInput } from "@/components/phone-input";
import { calculateBookingTotal, type TravelerPriceType } from "@/lib/bookings/pricing";
import { formatMoney } from "@/lib/format";

const PRICE_TYPE_OPTIONS: { value: TravelerPriceType; label: string }[] = [
  { value: "FULL", label: "Full price" },
  { value: "HALF", label: "Half price" },
  { value: "FREE", label: "Free" },
];

type Traveler = { name: string; isChild: boolean; priceType: TravelerPriceType };

function makeTravelers(count: number, prev: Traveler[]): Traveler[] {
  return Array.from({ length: count }, (_, i) => prev[i] ?? { name: "", isChild: false, priceType: "FULL" });
}

export function BookingForm({
  action,
  maxPax,
  unitPrice,
  currency,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  maxPax: number;
  unitPrice: number;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [paxCount, setPaxCount] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  function handlePaxChange(value: number) {
    const next = Math.max(1, Math.min(maxPax, value || 1));
    setPaxCount(next);
    setTravelers((prev) => makeTravelers(next - 1, prev));
  }

  function updateTraveler(index: number, patch: Partial<Traveler>) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  const estimatedTotal = calculateBookingTotal({
    unitPrice,
    paxCount,
    travelers: travelers.filter((t) => t.name.trim()).map((t) => ({ priceType: t.priceType })),
    discountPercent,
  });

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="existingCustomerId" value={selectedCustomer?.id ?? ""} />

      <label className="flex flex-col gap-1 text-sm">
        Customer
        <CustomerCombobox selected={selectedCustomer} onSelect={setSelectedCustomer} />
      </label>

      {!selectedCustomer && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            New customer name
            <input
              name="newCustomerName"
              required={!selectedCustomer}
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            New customer email
            <input
              name="newCustomerEmail"
              type="email"
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            New customer phone
            <PhoneInput name="newCustomerPhone" />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Pax count (max {maxPax})
        <input
          name="paxCount"
          type="number"
          min={1}
          max={maxPax}
          value={paxCount}
          onChange={(e) => handlePaxChange(Number(e.target.value))}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>

      {travelers.length > 0 && (
        <div className="flex flex-col gap-2 text-sm">
          <span>Other travelers in this party</span>
          <p className="text-xs text-espresso-muted">
            The customer above counts as traveler 1. Add the rest here if you need their names — leave blank if unknown.
          </p>
          <div className="flex flex-col gap-2">
            {travelers.map((t, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-[12px] border border-terracotta/25 bg-white p-3">
                <div className="flex items-center gap-2">
                  <input
                    name={`traveler_${i}_name`}
                    value={t.name}
                    onChange={(e) => updateTraveler(i, { name: e.target.value })}
                    placeholder={`Traveler ${i + 2} name`}
                    className="flex-1 rounded-[10px] border border-terracotta/20 bg-white px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-espresso-muted">
                    <input
                      type="checkbox"
                      name={`traveler_${i}_isChild`}
                      checked={t.isChild}
                      onChange={(e) => updateTraveler(i, { isChild: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Baby className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Child
                  </label>
                </div>
                <select
                  name={`traveler_${i}_priceType`}
                  value={t.priceType}
                  onChange={(e) => updateTraveler(i, { priceType: e.target.value as TravelerPriceType })}
                  className="rounded-[10px] border border-terracotta/20 bg-white px-3 py-2 text-sm"
                >
                  {PRICE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Discount (%)
        <input
          name="discountPercent"
          type="number"
          min={0}
          max={100}
          value={discountPercent}
          onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>

      <div className="rounded-[12px] bg-cream-100 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-espresso-muted">Estimated total</span>
          <span className="font-medium text-espresso">{formatMoney(estimatedTotal, currency)}</span>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Special requests
        <input
          name="specialRequests"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? "Booking…" : "Create booking"}
      </button>
    </form>
  );
}
