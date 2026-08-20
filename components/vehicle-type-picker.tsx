"use client";

import { PillPicker } from "@/components/pill-picker";
import en, { type Dictionary } from "@/lib/i18n/dictionaries/en";

const VEHICLE_TYPES = ["Bus", "Minivan", "Car", "Jeep", "SUV"];

export function VehicleTypePicker({
  name,
  defaultValue,
  dict = en,
}: {
  name: string;
  defaultValue?: string;
  dict?: Pick<Dictionary, "vehicleTypes" | "tourForm" | "common">;
}) {
  return (
    <PillPicker
      name={name}
      options={VEHICLE_TYPES}
      defaultValue={defaultValue}
      renderLabel={(type) => dict.vehicleTypes[type] ?? type}
      customPlaceholder={dict.tourForm.customVehiclePlaceholder}
      otherLabel={dict.common.other}
    />
  );
}
