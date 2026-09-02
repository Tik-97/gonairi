"use client";

import { useActionState, useState } from "react";
import { FileText, Loader2, Plus, X } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { PhoneInput } from "@/components/phone-input";
import { uploadCustomerDocument } from "@/lib/actions/upload";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

type CustomerDocumentValue = { url: string; name: string; mimeType?: string; size?: number; downloadUrl?: string };
type CustomerFormValues = {
  fullName: string; email: string; phone: string; nationality: string; notes: string; birthDate: string;
  passportNumber: string; passportIssuedBy: string; passportIssueDate: string; passportExpiryDate: string;
  whatsapp: string; telegram: string; visaStatus: string; visaCountry: string; visaType: string;
  visaApplicationDate: string; visaDecisionDate: string; visaExpiryDate: string; status: string;
  documents: CustomerDocumentValue[];
};

const fieldClass = "rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5";

export function CustomerForm({ action, defaultValues, submitLabel, locale, dict, countries }: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<CustomerFormValues>;
  submitLabel: string;
  locale: Locale;
  dict: Pick<Dictionary, "customerForm" | "phoneInput" | "customerStatus" | "visaStatus">;
  countries: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [documents, setDocuments] = useState<CustomerDocumentValue[]>(defaultValues?.documents ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sameWhatsapp, setSameWhatsapp] = useState(Boolean(defaultValues?.phone && defaultValues.phone === defaultValues.whatsapp));

  async function uploadDocument(file: File | null) {
    if (!file || documents.length >= 20) return;
    setUploading(true);
    setUploadError("");
    const data = new FormData();
    data.set("file", file);
    const result = await uploadCustomerDocument(data);
    if (result.url && result.name) {
      setDocuments((current) => [...current, { url: result.url!, name: result.name!, mimeType: result.mimeType, size: result.size }]);
    } else {
      setUploadError(result.error ?? dict.customerForm.uploadFailed);
    }
    setUploading(false);
  }

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-6">
      <input type="hidden" name="documents" value={JSON.stringify(documents)} />

      <FormSection title={dict.customerForm.personalDetails}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dict.customerForm.fullName}><input name="fullName" defaultValue={defaultValues?.fullName} required className={fieldClass} /></Field>
          <Field label={dict.customerForm.birthDate}><input name="birthDate" type="date" defaultValue={defaultValues?.birthDate} className={fieldClass} /></Field>
          <Field label={dict.customerForm.email}><input name="email" type="email" defaultValue={defaultValues?.email} className={fieldClass} /></Field>
          <Field label={dict.customerForm.phone}><PhoneInput name="phone" defaultValue={defaultValues?.phone} locale={locale} dict={dict.phoneInput} /></Field>
          <Field label={dict.customerForm.nationality}>
            <select name="nationality" defaultValue={defaultValues?.nationality ?? ""} className={fieldClass}>
              <option value="">{dict.customerForm.selectNationality}</option>
              {countries.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
            </select>
          </Field>
          <Field label={dict.customerForm.status}>
            <select name="status" defaultValue={defaultValues?.status ?? "REGISTERED"} className={fieldClass}>
              {Object.entries(dict.customerStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title={dict.customerForm.passportDetails}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dict.customerForm.passportNumber}><input name="passportNumber" defaultValue={defaultValues?.passportNumber} required className={fieldClass} /></Field>
          <Field label={dict.customerForm.passportIssuedBy}><input name="passportIssuedBy" defaultValue={defaultValues?.passportIssuedBy} required className={fieldClass} /></Field>
          <Field label={dict.customerForm.passportIssueDate}><input name="passportIssueDate" type="date" defaultValue={defaultValues?.passportIssueDate} className={fieldClass} /></Field>
          <Field label={dict.customerForm.passportExpiryDate}><input name="passportExpiryDate" type="date" defaultValue={defaultValues?.passportExpiryDate} required className={fieldClass} /></Field>
        </div>
      </FormSection>

      <FormSection title={dict.customerForm.socialNetworks}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm">
            <span>{dict.customerForm.whatsapp}</span>
            <label className="flex items-center gap-2 text-xs text-espresso-muted">
              <input type="checkbox" name="whatsappSameAsPhone" checked={sameWhatsapp} onChange={(event) => setSameWhatsapp(event.target.checked)} />
              {dict.customerForm.sameAsPhone}
            </label>
            {!sameWhatsapp && <PhoneInput name="whatsapp" defaultValue={defaultValues?.whatsapp} locale={locale} dict={dict.phoneInput} />}
          </div>
          <Field label={dict.customerForm.telegram}><input name="telegram" defaultValue={defaultValues?.telegram} placeholder="@username" className={fieldClass} /></Field>
        </div>
      </FormSection>

      <FormSection title={dict.customerForm.visaDetails}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={dict.customerForm.visaStatus}>
            <select name="visaStatus" defaultValue={defaultValues?.visaStatus ?? "NOT_STARTED"} className={fieldClass}>
              {Object.entries(dict.visaStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label={dict.customerForm.visaCountry}><input name="visaCountry" defaultValue={defaultValues?.visaCountry} className={fieldClass} /></Field>
          <Field label={dict.customerForm.visaType}><input name="visaType" defaultValue={defaultValues?.visaType} className={fieldClass} /></Field>
          <Field label={dict.customerForm.visaApplicationDate}><input name="visaApplicationDate" type="date" defaultValue={defaultValues?.visaApplicationDate} className={fieldClass} /></Field>
          <Field label={dict.customerForm.visaDecisionDate}><input name="visaDecisionDate" type="date" defaultValue={defaultValues?.visaDecisionDate} className={fieldClass} /></Field>
          <Field label={dict.customerForm.visaExpiryDate}><input name="visaExpiryDate" type="date" defaultValue={defaultValues?.visaExpiryDate} className={fieldClass} /></Field>
        </div>
      </FormSection>

      <FormSection title={dict.customerForm.documents} hint={dict.customerForm.documentsHint}>
        <div className="flex flex-col gap-2">
          {documents.map((document) => (
            <div key={document.url} className="flex items-center gap-3 rounded-[12px] border border-border bg-white px-3 py-2.5">
              <FileText className="h-4 w-4 text-terracotta-700" />
              {document.downloadUrl
                ? <a href={document.downloadUrl} className="min-w-0 flex-1 truncate text-sm text-terracotta-700 underline">{document.name}</a>
                : <span className="min-w-0 flex-1 truncate text-sm text-espresso">{document.name}</span>}
              <button type="button" onClick={() => setDocuments((items) => items.filter((item) => item.url !== document.url))} aria-label={dict.customerForm.removeDocument}>
                <X className="h-4 w-4 text-espresso-muted hover:text-danger" />
              </button>
            </div>
          ))}
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-[12px] border border-dashed border-terracotta/30 px-3.5 py-2 text-sm text-terracotta-700">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {uploading ? dict.customerForm.uploadingDocument : dict.customerForm.addDocument}
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(event) => void uploadDocument(event.target.files?.[0] ?? null)} />
          </label>
          {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
        </div>
      </FormSection>

      <Field label={dict.customerForm.statusNote}><input name="statusNote" className={fieldClass} /></Field>
      <Field label={dict.customerForm.notes}><textarea name="notes" defaultValue={defaultValues?.notes} rows={3} className={fieldClass} /></Field>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending || uploading} className="w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700">
        {pending ? dict.customerForm.saving : submitLabel}
      </button>
    </form>
  );
}

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className="rounded-[18px] border border-terracotta/15 bg-card p-5">
    <h2 className="mb-1 font-serif text-lg text-espresso">{title}</h2>
    {hint && <p className="mb-4 text-xs text-espresso-muted">{hint}</p>}
    {!hint && <div className="mb-3" />}
    {children}
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-sm">{label}{children}</label>;
}
