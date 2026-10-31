"use server";

const EMPTY = { name: "", email: "", message: "" };

export async function sendContact(prevState, formData) {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const base = process.env.API_URL;
  if (!base) {
    return { ok: false, message: "Configuration serveur manquante (API_URL).", errors: {}, values };
  }

  try {
    const res = await fetch(`${base}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 201) {
      return { ok: true, message: "Merci ! Votre message a bien été envoyé.", errors: {}, values: EMPTY };
    }
    if (res.status === 400 && Array.isArray(data.details)) {
      const errors = {};
      for (const d of data.details) errors[d.field] = d.message;
      return { ok: false, message: "Veuillez corriger les champs signalés.", errors, values };
    }
    if (res.status === 429) {
      return { ok: false, message: "Trop d'envois, réessayez dans une minute.", errors: {}, values };
    }
    return { ok: false, message: "Erreur du serveur, réessayez plus tard.", errors: {}, values };
  } catch {
    return { ok: false, message: "API indisponible, réessayez plus tard.", errors: {}, values };
  }
}
