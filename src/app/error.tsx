"use client";

import { useEffect } from "react";
import { RotateCcw, ServerCrash, Sparkles } from "lucide-react";

export default function ApplicationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const unavailable = error.name === "BACKEND_UNAVAILABLE" || error.message.toLowerCase().includes("backend");
  return <main className="application-error-page">
    <section className="application-error-card">
      <div className="application-error-brand"><span><Sparkles size={18}/></span>Arffy <b>AI</b></div>
      <div className="application-error-icon"><ServerCrash size={27}/></div>
      <span className="application-error-code">{unavailable ? "CONNECTION INTERRUPTED" : "SOMETHING WENT WRONG"}</span>
      <h1>{unavailable ? "We can’t reach your workspace" : "That didn’t go as planned"}</h1>
      <p>{unavailable ? "The Arffy AI backend is temporarily unavailable. Your data is safe—retry once the service is running." : "A temporary application error stopped this page from loading. Please try it again."}</p>
      <button className="primary-button" onClick={reset}><RotateCcw size={16}/> Try again</button>
      {error.digest && <small>Reference: {error.digest}</small>}
    </section>
  </main>;
}
