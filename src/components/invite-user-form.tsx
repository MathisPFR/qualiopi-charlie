"use client";

import { useActionState } from "react";
import { inviteUser, type InviteUserState } from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState<
    InviteUserState | null,
    FormData
  >(inviteUser, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok === true && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Invitation envoyée par email.
        </p>
      )}
      {state?.ok === false && state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="operateur@client.fr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" required maxLength={120} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rôle</Label>
        <select
          id="role"
          name="role"
          required
          defaultValue="OPERATEUR"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="OPERATEUR">Opérateur</option>
          <option value="ADMIN">Administrateur</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Inviter"}
      </Button>
    </form>
  );
}
