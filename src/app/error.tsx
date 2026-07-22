"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/error-screen";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return <ErrorScreen
    code="500"
    eyebrow="Temporary detour"
    title="Arffy AI hit a snag"
    description="We couldn’t load this workspace right now. Check the service connection or try the request again."
    reference={error.digest}
    actions={<><button className="error-primary-action" onClick={reset}>Try again</button><a className="error-secondary-action" href="/">Return home</a></>}
  />;
}
