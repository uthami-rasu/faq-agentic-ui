"use client";

import { Activity, LoaderCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadOrganizationActivityAction } from "@/app/actions";

export function ActivityTimeline({ organizationId, entityType, entityId, title = "Activity history" }: { organizationId: string; entityType?: string; entityId?: string; title?: string }) {
  const query = useQuery({
    queryKey: ["organization-activity", organizationId, entityType, entityId],
    queryFn: () => loadOrganizationActivityAction({ organizationId, entityType, entityId }),
    staleTime: 10_000,
  });
  return <section className="panel entity-activity-panel"><div className="panel-title"><div><h2>{title}</h2><p>Who changed what and when. History remains available after an entity is deleted.</p></div></div>{query.isLoading && <div className="entity-activity-state"><LoaderCircle className="spin"/>Loading activity…</div>}{query.isError && <div className="entity-activity-state danger">Activity could not be loaded for your current role.</div>}<div className="entity-activity-list">{query.data?.map((event) => <article key={event.id}><span><Activity size={15}/></span><div><b>{event.label}</b><p>{event.context}</p><small>{event.actor_subject ?? "system"} · {new Date(event.occurred_at).toLocaleString()}</small></div><em>{event.event_type.replaceAll("_", " ")}</em></article>)}{query.data?.length === 0 && <div className="entity-activity-state">No activity has been recorded for this entity yet.</div>}</div></section>;
}
