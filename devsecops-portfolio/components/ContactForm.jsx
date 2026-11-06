"use client";

import { useActionState } from "react";
import { sendContact } from "../app/actions";

const initialState = { ok: false, message: "", errors: {}, values: { name: "", email: "", message: "" } };
const fieldStyle = { display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", border: "1px solid #ccc", borderRadius: "4px", font: "inherit" };
const errStyle = { color: "crimson", fontSize: "0.85rem" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: "0.75rem", maxWidth: "32rem", marginTop: "1rem" }}>
      <label>
        Nom
        <input name="name" required minLength={2} maxLength={80} defaultValue={state.values.name} style={fieldStyle} />
        {state.errors.name && <span style={errStyle}>{state.errors.name}</span>}
      </label>
      <label>
        Email
        <input name="email" type="email" required maxLength={120} defaultValue={state.values.email} style={fieldStyle} />
        {state.errors.email && <span style={errStyle}>{state.errors.email}</span>}
      </label>
      <label>
        Message
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} defaultValue={state.values.message} style={fieldStyle} />
        {state.errors.message && <span style={errStyle}>{state.errors.message}</span>}
      </label>
      <button type="submit" disabled={pending} style={{ padding: "0.6rem 1rem", cursor: "pointer", border: "1px solid #333", borderRadius: "4px", background: "#111", color: "#fff", font: "inherit" }}>
        {pending ? "Envoi…" : "Envoyer"}
      </button>
      {state.message && (
        <p role="status" style={{ color: state.ok ? "green" : "crimson", margin: 0 }}>{state.message}</p>
      )}
    </form>
  );
}
