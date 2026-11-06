import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../app/actions", () => ({
  sendContact: vi.fn(),
}));

import ContactForm from "../components/ContactForm";
import { sendContact } from "../app/actions";

const empty = { name: "", email: "", message: "" };

beforeEach(() => {
  sendContact.mockReset();
});

test("affiche les trois champs et le bouton Envoyer", () => {
  render(<ContactForm />);
  expect(screen.getByLabelText("Nom")).toBeTruthy();
  expect(screen.getByLabelText("Email")).toBeTruthy();
  expect(screen.getByLabelText("Message")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Envoyer" })).toBeTruthy();
});

test("envoie les valeurs saisies et affiche le message de succès", async () => {
  sendContact.mockResolvedValue({
    ok: true,
    message: "Merci ! Votre message a bien été envoyé.",
    errors: {},
    values: empty,
  });

  render(<ContactForm />);
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Wrida" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrida@example.com" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Un message de test suffisamment long." } });
  fireEvent.submit(screen.getByRole("button", { name: "Envoyer" }).closest("form"));

  await waitFor(() => expect(screen.getByText("Merci ! Votre message a bien été envoyé.")).toBeTruthy());

  const formData = sendContact.mock.calls[0][1];
  expect(formData.get("name")).toBe("Wrida");
  expect(formData.get("email")).toBe("wrida@example.com");
});

test("affiche l'erreur d'un champ refusé par l'API", async () => {
  sendContact.mockResolvedValue({
    ok: false,
    message: "Veuillez corriger les champs signalés.",
    errors: { email: "Invalid email address" },
    values: { name: "Wrida", email: "pas-un-email", message: "Un message de test suffisamment long." },
  });

  render(<ContactForm />);
  fireEvent.submit(screen.getByRole("button", { name: "Envoyer" }).closest("form"));

  await waitFor(() => expect(screen.getByText("Invalid email address")).toBeTruthy());
  expect(screen.getByText("Veuillez corriger les champs signalés.")).toBeTruthy();
});
