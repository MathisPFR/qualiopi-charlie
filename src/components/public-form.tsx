"use client";

import { useState } from "react";
import { submitPublicForm } from "@/server/actions/public-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormField, FormSection } from "@/lib/public-form-schemas";

export function PublicForm({
  slug,
  formType,
  stagiaireId,
  sections,
  initialValues = {},
}: {
  slug: string;
  formType: string;
  stagiaireId?: string;
  sections: FormSection[];
  initialValues?: Record<string, string>;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const responses: Record<string, string> = {};
    for (const section of sections) {
      for (const f of section.fields) {
        responses[f.name] = String(fd.get(f.name) ?? "").trim();
      }
    }
    try {
      await submitPublicForm(slug, formType, responses, stagiaireId);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Merci — votre réponse a été enregistrée. Le PDF a été généré et archivé
        dans le dossier de la formation.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section) => (
        <fieldset
          key={section.title}
          className="space-y-4 rounded-md border border-slate-200 bg-slate-50/50 p-4"
        >
          <legend className="px-1 text-sm font-semibold text-foreground">
            {section.title}
          </legend>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
          {section.fields.map((f) => (
            <FieldInput key={f.name} field={f} defaultValue={initialValues[f.name]} />
          ))}
        </fieldset>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Envoi et génération du PDF…" : "Envoyer le formulaire"}
      </Button>
    </form>
  );
}

function FieldInput({
  field,
  defaultValue,
}: {
  field: FormField;
  defaultValue?: string;
}) {
  const id = field.name;
  const required = field.required !== false;

  return (
    <div>
      <Label htmlFor={id} className="leading-snug">
        {field.label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      {field.description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{field.description}</p>
      )}
      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={id}
          required={required}
          readOnly={field.readOnly}
          defaultValue={defaultValue}
          placeholder={field.placeholder}
          className="mt-1 min-h-[100px] w-full rounded-md border p-2 text-sm"
        />
      ) : field.type === "select" && field.options ? (
        <select
          id={id}
          name={id}
          required={required}
          disabled={field.readOnly}
          defaultValue={defaultValue ?? ""}
          className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Choisir…
          </option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <Input
          id={id}
          name={id}
          type="number"
          min={1}
          max={10}
          required={required}
          readOnly={field.readOnly}
          defaultValue={defaultValue}
          placeholder={field.placeholder}
          className="mt-1"
        />
      ) : (
        <Input
          id={id}
          name={id}
          type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
          required={required}
          readOnly={field.readOnly}
          defaultValue={defaultValue}
          placeholder={field.placeholder}
          className="mt-1"
        />
      )}
    </div>
  );
}
