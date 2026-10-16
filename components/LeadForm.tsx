"use client";

import { ConvexReactClient } from "convex/react";
import { useMemo, useState, type FormEvent } from "react";
import { submitLeadRef } from "../lib/spec";

function useSubmitLead() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  // Imperative client: public pages stay provider-free for a static shell.
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);
  return async (args: { name: string; email: string; message: string; pageSlug: string }) => {
    if (!client) throw new Error("This form is not connected yet.");
    await client.mutation(submitLeadRef, args);
  };
}

export function LeadForm({ pageSlug, submitLabel }: { pageSlug: string; submitLabel: string }) {
  const submit = useSubmitLead();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      await submit({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        message: String(data.get("message") ?? ""),
        pageSlug,
      });
      setState("sent");
      event.currentTarget.reset();
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : "Something went wrong. Try again.");
    }
  }

  if (state === "sent") return <p className="prose">Thanks — your message is in. We will reply soon.</p>;
  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <label>
        Name
        <input name="name" type="text" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Message
        <textarea name="message" rows={5} required />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="btn" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
