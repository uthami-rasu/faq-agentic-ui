import type { ReactNode } from "react";

export function ErrorScreen({ code, eyebrow, title, description, reference, actions }: {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  reference?: string;
  actions: ReactNode;
}) {
  return <main className="friendly-error-page">
    <section className="friendly-error-card">
      <div className="friendly-error-art" aria-hidden="true">
        <span className="error-code-start">{code[0]}</span>
        <span className="error-orbit"><i/><b>!</b></span>
        <span className="error-code-end">{code[2]}</span>
      </div>
      <span className="friendly-error-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {reference && <small>Reference: {reference}</small>}
      <div className="friendly-error-actions">{actions}</div>
      <div className="friendly-error-tip"><span>QD</span><p><b>Your work is safe.</b> This page can be retried without losing saved changes.</p></div>
    </section>
  </main>;
}
