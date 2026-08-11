"use client";

import { PillPicker } from "@/components/pill-picker";

const VEHICLE_TYPES = ["Bus", "Minivan", "Car", "Jeep", "SUV"];

export function VehicleTypePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <PillPicker name={name} options={VEHICLE_TYPES} defaultValue={defaultValue} customPlaceholder="Custom vehicle type" />
  );
}
