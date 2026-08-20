"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Loader2, ImageOff, X } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { uploadTourImage, deleteTourImage } from "@/lib/actions/upload";
import { CategoryPicker } from "@/components/category-picker";
import { RegionPicker } from "@/components/region-picker";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const MAX_IMAGES = 10;

type ImageSlot =
  | { status: "empty" }
  | { status: "uploading" }
  | { status: "done"; url: string; fileName?: string }
  | { status: "error"; error: string };

type TourFormValues = {
  title: string;
  description: string;
  category: string;
  durationDays: number;
  basePrice: number;
  isPublished: boolean;
  images: string[];
  regions: string[];
};

export function TourForm({
  action,
  defaultValues,
  submitLabel,
  dict,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<TourFormValues>;
  submitLabel: string;
  dict: Pick<Dictionary, "tourForm" | "tourCategories" | "armenianRegions" | "common">;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [slots, setSlots] = useState<ImageSlot[]>(
    defaultValues?.images?.length
      ? defaultValues.images.map((url): ImageSlot => ({ status: "done", url }))
      : [{ status: "empty" }],
  );

  const anyUploading = slots.some((s) => s.status === "uploading");

  async function handleFileChange(index: number, file: File | null) {
    if (!file) return;
    setSlots((prev) => prev.map((s, i) => (i === index ? { status: "uploading" } : s)));
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadTourImage(fd);
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (result.error || !result.url) return { status: "error", error: result.error ?? dict.tourForm.uploadFailed };
        return { status: "done", url: result.url, fileName: file.name };
      }),
    );
  }

  function removeSlot(index: number) {
    setSlots((prev) => {
      const slot = prev[index];
      if (slot.status === "done") {
        void deleteTourImage(slot.url);
      }
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ status: "empty" }];
    });
  }

  function addSlot() {
    setSlots((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, { status: "empty" }]));
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {dict.tourForm.title}
        <input
          name="title"
          defaultValue={defaultValues?.title}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.tourForm.description}
        <textarea
          name="description"
          defaultValue={defaultValues?.description}
          rows={4}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.tourForm.category}
        <CategoryPicker name="category" defaultValue={defaultValues?.category} dict={dict} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.tourForm.region}
        <RegionPicker name="regions" defaultValue={defaultValues?.regions} dict={dict} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.tourForm.durationDays}
        <input
          name="durationDays"
          type="number"
          min={1}
          defaultValue={defaultValues?.durationDays ?? 1}
          required
          className="max-w-[10rem] rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.tourForm.basePrice}
        <input
          name="basePrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaultValues?.basePrice}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span>{dict.tourForm.photosPrefix} {MAX_IMAGES})</span>
        <div className="flex flex-col gap-2">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-3 rounded-[12px] border border-terracotta/25 bg-white p-2.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-cream-100">
                {slot.status === "done" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slot.url} alt="" className="h-full w-full object-cover" />
                ) : slot.status === "uploading" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-terracotta-700" strokeWidth={1.75} />
                ) : slot.status === "error" ? (
                  <ImageOff className="h-5 w-5 text-danger" strokeWidth={1.75} />
                ) : (
                  <ImagePlus className="h-5 w-5 text-espresso-muted" strokeWidth={1.75} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {slot.status === "empty" && (
                  <label className="inline-flex cursor-pointer items-center text-sm text-terracotta-700 underline">
                    {dict.tourForm.choosePhoto}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => handleFileChange(i, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {slot.status === "uploading" && <p className="text-espresso-muted">{dict.tourForm.uploading}</p>}
                {slot.status === "done" && (
                  <p className="truncate text-espresso-muted">{slot.fileName ?? dict.tourForm.photoUploaded}</p>
                )}
                {slot.status === "error" && (
                  <div className="flex flex-col gap-1">
                    <p className="text-danger">{slot.error}</p>
                    <label className="inline-flex w-fit cursor-pointer items-center text-terracotta-700 underline">
                      {dict.tourForm.tryAgain}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => handleFileChange(i, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                )}
              </div>

              {slot.status === "done" && <input type="hidden" name="images" value={slot.url} />}

              <button
                type="button"
                onClick={() => removeSlot(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-espresso-muted transition-colors hover:bg-cream-100 hover:text-danger"
                aria-label={dict.tourForm.removeImage}
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
        {slots.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={addSlot}
            className="flex w-fit items-center gap-2 rounded-[12px] border border-dashed border-terracotta/30 px-3.5 py-2 text-sm text-terracotta-700 transition-colors hover:bg-cream-100"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
            {dict.tourForm.addAnother}
          </button>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="isPublished"
          type="checkbox"
          defaultChecked={defaultValues?.isPublished}
          className="h-4 w-4"
        />
        {dict.tourForm.publishedLabel}
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || anyUploading}
        className="mt-2 w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? dict.tourForm.saving : anyUploading ? dict.tourForm.uploadingPhotos : submitLabel}
      </button>
    </form>
  );
}
