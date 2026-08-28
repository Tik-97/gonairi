"use client";

import { useActionState, useState } from "react";
import { Baby } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import type { CustomerSearchResult } from "@/lib/actions/customers";
import { CustomerCombobox } from "@/components/customer-combobox";
import { PhoneInput } from "@/components/phone-input";
import { calculateBookingTotal, type TravelerPriceType } from "@/lib/bookings/pricing";
import { formatMoney } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

type Traveler = { name: string; isChild: boolean; priceType: TravelerPriceType };

function makeTravelers(count: number, prev: Traveler[]): Traveler[] {
  return Array.from({ length: count }, (_, i) => prev[i] ?? { name: "", isChild: false, priceType: "FULL" });
}

export function BookingForm({
  action,
  maxPax,
  unitPrice,
  currency,
  locale,
  dict,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  maxPax: number;
  unitPrice: number;
  currency: string;
  locale: Locale;
  dict: Pick<Dictionary, "bookingForm" | "customerCombobox" | "phoneInput">;
}) {
  const PRICE_TYPE_OPTIONS: { value: TravelerPriceType; label: string }[] = [
    { value: "FULL", label: dict.bookingForm.fullPrice },
    { value: "HALF", label: dict.bookingForm.halfPrice },
    { value: "FREE", label: dict.bookingForm.free },
  ];
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  // Kept as "" while the user is actively clearing/retyping the field —
  // clamping on every keystroke (the old behavior) snapped the value back
  // to a default the instant the field went empty, making it impossible to
  // backspace out a number to type a new one. Clamping only happens onBlur.
  const [paxCountInput, setPaxCountInput] = useState<number | "">(1);
  const paxCount = paxCountInput === "" ? 1 : paxCountInput;
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [discountPercentInput, setDiscountPercentInput] = useState<number | "">(0);
  const discountPercent = discountPercentInput === "" ? 0 : discountPercentInput;

  function handlePaxChange(raw: string) {
    const next = raw === "" ? "" : Number(raw);
    setPaxCountInput(next);
    setTravelers((prev) => makeTravelers((next === "" ? 1 : next) - 1, prev));
  }

  function handlePaxBlur() {
    setPaxCountInput((prev) => Math.max(1, Math.min(maxPax, prev === "" ? 1 : prev)));
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
        {dict.bookingForm.customer}
        <CustomerCombobox selected={selectedCustomer} onSelect={setSelectedCustomer} dict={dict.customerCombobox} />
      </label>

      {!selectedCustomer && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            {dict.bookingForm.newCustomerName}
            <input
              name="newCustomerName"
              required={!selectedCustomer}
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {dict.bookingForm.newCustomerEmail}
            <input
              name="newCustomerEmail"
              type="email"
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {dict.bookingForm.newCustomerPhone}
            <PhoneInput name="newCustomerPhone" locale={locale} dict={dict.phoneInput} />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {dict.bookingForm.paxCountPrefix} {maxPax})
        <input
          name="paxCount"
          type="number"
          min={1}
          max={maxPax}
          value={paxCountInput}
          onChange={(e) => handlePaxChange(e.target.value)}
          onBlur={handlePaxBlur}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>

      {travelers.length > 0 && (
        <div className="flex flex-col gap-2 text-sm">
          <span>{dict.bookingForm.otherTravelers}</span>
          <p className="text-xs text-espresso-muted">
            {dict.bookingForm.otherTravelersHint}
          </p>
          <div className="flex flex-col gap-2">
            {travelers.map((t, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-[12px] border border-terracotta/25 bg-white p-3">
                <div className="flex items-center gap-2">
                  <input
                    name={`traveler_${i}_name`}
                    value={t.name}
                    onChange={(e) => updateTraveler(i, { name: e.target.value })}
                    placeholder={`${dict.bookingForm.travelerNamePrefix} ${i + 2} ${dict.bookingForm.travelerNameSuffix}`}
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
                    {dict.bookingForm.child}
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
        {dict.bookingForm.discountPercent}
        <input
          name="discountPercent"
          type="number"
          min={0}
          max={100}
          value={discountPercentInput}
          onChange={(e) => setDiscountPercentInput(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={() =>
            setDiscountPercentInput((prev) => Math.max(0, Math.min(100, prev === "" ? 0 : prev)))
          }
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>

      <div className="rounded-[12px] bg-cream-100 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-espresso-muted">{dict.bookingForm.estimatedTotal}</span>
          {/* Node's and the browser's bundled ICU data can render hy-AM currency
              formatting a few bytes apart (e.g. "18 000 ֏" vs "AMD 18,000") —
              harmless, but React would otherwise warn on this every render. */}
          <span className="font-medium text-espresso" suppressHydrationWarning>{formatMoney(estimatedTotal, currency)}</span>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {dict.bookingForm.specialRequests}
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
        {pending ? dict.bookingForm.booking : dict.bookingForm.createBooking}
      </button>
    </form>
  );
}
