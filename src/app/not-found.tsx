import { ErrorScreen } from "@/components/error-screen";

export default function NotFound() {
  return <ErrorScreen
    code="404"
    eyebrow="Wrong turn"
    title="This page wandered off"
    description="The address may be incorrect, or the page may have moved somewhere new."
    actions={<a className="error-primary-action" href="/">Back to QueryDesk</a>}
  />;
}
