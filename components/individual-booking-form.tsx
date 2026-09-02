"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type PriceLine = { category: string; description: string; amount: number };
type HotelLine = { name: string; checkIn: string; checkOut: string; address: string; roomType: string };

const fieldClass = "rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5";

export function IndividualBookingForm({ action, customer, currency, dict }: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  customer: { id: string; fullName: string };
  currency: string;
  dict: Pick<Dictionary, "bookingForm" | "tourForm" | "tourPriceCategory">;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [prices, setPrices] = useState<PriceLine[]>([
    { category: "TICKET", description: "", amount: 0 },
    { category: "HOTEL", description: "", amount: 0 },
    { category: "TRANSFER", description: "", amount: 0 },
  ]);
  const [hotels, setHotels] = useState<HotelLine[]>([]);
  const total = prices.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  return <form action={formAction} className="flex max-w-3xl flex-col gap-5">
    <input type="hidden" name="customerId" value={customer.id} />
    <input type="hidden" name="priceBreakdown" value={JSON.stringify(prices)} />
    <input type="hidden" name="hotels" value={JSON.stringify(hotels)} />

    <div className="rounded-[18px] border border-terracotta/15 bg-card p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-espresso-muted">{dict.bookingForm.customer}</p>
      <p className="font-medium text-espresso">{customer.fullName}</p>
    </div>

    <div className="grid gap-4 rounded-[18px] border border-terracotta/15 bg-card p-5 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">{dict.bookingForm.individualTitle}<input name="individualTitle" required className={fieldClass} /></label>
      <label className="flex flex-col gap-1 text-sm">{dict.tourForm.startDate}<input name="travelStartDate" type="date" required className={fieldClass} /></label>
      <label className="flex flex-col gap-1 text-sm">{dict.tourForm.endDate}<input name="travelEndDate" type="date" required className={fieldClass} /></label>
      <label className="flex flex-col gap-1 text-sm">{dict.bookingForm.paxCount}<input name="paxCount" type="number" min={1} defaultValue={1} required className={fieldClass} /></label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">{dict.bookingForm.specialRequests}<textarea name="specialRequests" rows={3} className={fieldClass} /></label>
    </div>

    <div className="flex flex-col gap-3 rounded-[18px] border border-terracotta/15 bg-card p-5">
      <h2 className="font-serif text-lg text-espresso">{dict.tourForm.priceBreakdown}</h2>
      {prices.map((line, index) => <div key={index} className="grid gap-2 rounded-[12px] border border-border bg-white p-3 sm:grid-cols-[1fr_1.5fr_1fr_auto]">
        <select value={line.category} onChange={(event) => setPrices((items) => items.map((item, i) => i === index ? { ...item, category: event.target.value } : item))} className={fieldClass}>
          {Object.entries(dict.tourPriceCategory).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input value={line.description} onChange={(event) => setPrices((items) => items.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} placeholder={dict.tourForm.priceDescription} className={fieldClass} />
        <input value={line.amount} onChange={(event) => setPrices((items) => items.map((item, i) => i === index ? { ...item, amount: Number(event.target.value) } : item))} type="number" min={0} step="0.01" className={fieldClass} />
        <button type="button" onClick={() => setPrices((items) => items.filter((_, i) => i !== index))} aria-label={dict.tourForm.removeLine}><X className="h-4 w-4" /></button>
      </div>)}
      <button type="button" onClick={() => setPrices((items) => [...items, { category: "OTHER", description: "", amount: 0 }])} className="flex w-fit items-center gap-1 text-sm text-terracotta-700 underline"><Plus className="h-4 w-4" />{dict.tourForm.addPriceLine}</button>
      <p className="text-right font-medium text-espresso">{dict.tourForm.total}: {total.toLocaleString()} {currency}</p>
    </div>

    <div className="flex flex-col gap-3 rounded-[18px] border border-terracotta/15 bg-card p-5">
      <h2 className="font-serif text-lg text-espresso">{dict.tourForm.hotels}</h2>
      {hotels.map((hotel, index) => <div key={index} className="grid gap-2 rounded-[12px] border border-border bg-white p-3 sm:grid-cols-2">
        <input value={hotel.name} onChange={(event) => setHotels((items) => items.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder={dict.tourForm.hotelName} required className={fieldClass} />
        <input value={hotel.address} onChange={(event) => setHotels((items) => items.map((item, i) => i === index ? { ...item, address: event.target.value } : item))} placeholder={dict.tourForm.hotelAddress} className={fieldClass} />
        <label className="flex flex-col gap-1 text-xs">{dict.tourForm.checkIn}<input value={hotel.checkIn} onChange={(event) => setHotels((items) => items.map((item, i) => i === index ? { ...item, checkIn: event.target.value } : item))} type="date" required className={fieldClass} /></label>
        <label className="flex flex-col gap-1 text-xs">{dict.tourForm.checkOut}<input value={hotel.checkOut} onChange={(event) => setHotels((items) => items.map((item, i) => i === index ? { ...item, checkOut: event.target.value } : item))} type="date" required className={fieldClass} /></label>
        <input value={hotel.roomType} onChange={(event) => setHotels((items) => items.map((item, i) => i === index ? { ...item, roomType: event.target.value } : item))} placeholder={dict.tourForm.roomType} className={fieldClass} />
        <button type="button" onClick={() => setHotels((items) => items.filter((_, i) => i !== index))} className="w-fit text-xs text-danger underline">{dict.tourForm.removeHotel}</button>
      </div>)}
      <button type="button" onClick={() => setHotels((items) => [...items, { name: "", checkIn: "", checkOut: "", address: "", roomType: "" }])} className="flex w-fit items-center gap-1 text-sm text-terracotta-700 underline"><Plus className="h-4 w-4" />{dict.tourForm.addHotel}</button>
    </div>

    {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    <button type="submit" disabled={pending} className="w-fit rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{pending ? dict.bookingForm.booking : dict.bookingForm.createBooking}</button>
  </form>;
}
