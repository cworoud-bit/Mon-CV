import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" style={{ padding: "2rem" }}>
      <h2>Contact</h2>
      <ul style={{ fontFamily: "monospace", listStyle: "none", padding: 0, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <li><a href="mailto:cworoud@gmail.com">cworoud@gmail.com</a></li>
        <li><a href="https://github.com/cworoud-bit">github.com/cworoud-bit</a></li>
        <li>Tozeur, Tunisie</li>
      </ul>
      <ContactForm />
    </section>
  );
}
