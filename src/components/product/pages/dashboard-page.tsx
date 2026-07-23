import { AlertCircle, Bot, CheckCircle2, Database, Files, LoaderCircle, Network, RefreshCw, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { DashboardBackendData, Organization } from "../types";
import { PageHeading } from "../shared";

type Props = {
  organization: Organization;
  data: DashboardBackendData;
  loading?: boolean;
  failed?: boolean;
  retry?: () => void;
};

export function DashboardPage({ organization, data, loading, failed, retry }: Props) {
  const readyPercent = data.documents.total
    ? Math.round((data.documents.ready / data.documents.total) * 100)
    : 0;
  const activePercent = data.agents.total
    ? Math.round((data.agents.active / data.agents.total) * 100)
    : 0;

  return <div className="dashboard-page">
    <PageHeading eyebrow="Organization overview" title={organization.name} description="A live operational snapshot from your backend data.">
      <span className="dashboard-live"><i/>{loading ? "Refreshing" : "Live data"}</span>
    </PageHeading>

    {failed && <div className="dashboard-error"><AlertCircle size={17}/><span>Analytics could not be refreshed.</span><button onClick={retry}><RefreshCw size={14}/>Retry</button></div>}

    <div className={`dashboard-metrics ${loading ? "is-loading" : ""}`} aria-busy={loading}>
      <MetricCard icon={<Bot size={21}/>} label="FAQ agents" value={data.agents.total} detail={`${data.agents.active} active · ${data.agents.draft} draft`} tone="teal"/>
      <MetricCard icon={<Files size={21}/>} label="Documents" value={data.documents.total} detail="Organization knowledge library" tone="blue"/>
      <MetricCard icon={<CheckCircle2 size={21}/>} label="Ready for AI" value={data.documents.ready} detail={`${readyPercent}% of uploaded documents`} tone="green"/>
      <MetricCard icon={<Database size={21}/>} label="Indexed chunks" value={data.documents.chunks} detail="Available retrieval segments" tone="violet"/>
    </div>

    <div className="dashboard-insights">
      <section className="panel pipeline-panel">
        <div className="panel-title"><div><h2>Document pipeline</h2><p>Current processing state across the organization.</p></div><span className="pipeline-rate">{readyPercent}% ready</span></div>
        <div className="pipeline-hero"><div><strong>{data.documents.total}</strong><span>Total documents</span></div><div className="pipeline-ring" style={{ "--pipeline-progress": `${readyPercent * 3.6}deg` } as CSSProperties}><span>{readyPercent}%</span></div></div>
        <div className="pipeline-track" aria-label={`${readyPercent}% of documents ready`}>
          {data.documents.total > 0 && <>
            <i className="ready" style={{ width: `${data.documents.ready / data.documents.total * 100}%` }}/>
            <i className="processing" style={{ width: `${data.documents.processing / data.documents.total * 100}%` }}/>
            <i className="failed" style={{ width: `${data.documents.failed / data.documents.total * 100}%` }}/>
          </>}
        </div>
        <div className="pipeline-stats">
          <span><i className="ready"/><small>Ready</small><b>{data.documents.ready}</b></span>
          <span><i className="processing"/><small>Processing</small><b>{data.documents.processing}</b></span>
          <span><i className="failed"/><small>Failed</small><b>{data.documents.failed}</b></span>
        </div>
      </section>

      <aside className="panel readiness-panel">
        <div className="panel-title"><div><h2>Workspace readiness</h2><p>Configuration that can serve user questions.</p></div></div>
        <ReadinessRow icon={<Sparkles size={18}/>} title="Active FAQ agents" value={`${data.agents.active} of ${data.agents.total}`} progress={activePercent}/>
        <ReadinessRow icon={<Network size={18}/>} title="AI Orchestrator" value={data.orchestrator.active ? "Active" : "Not configured"} complete={data.orchestrator.active}/>
        <ReadinessRow icon={data.documents.processing ? <LoaderCircle className="spin" size={18}/> : <CheckCircle2 size={18}/>} title="Knowledge processing" value={data.documents.processing ? `${data.documents.processing} in progress` : "Queue clear"} complete={!data.documents.processing}/>
        <p className="analytics-note">Conversation and answer-quality analytics will appear after the chat event pipeline is connected. This dashboard does not display generated sample numbers.</p>
      </aside>
    </div>
  </div>;
}

function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: number; detail: string; tone: string }) {
  return <section className="panel dashboard-metric"><span className={`metric-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value.toLocaleString()}</strong><p>{detail}</p></div></section>;
}

function ReadinessRow({ icon, title, value, progress, complete }: { icon: ReactNode; title: string; value: string; progress?: number; complete?: boolean }) {
  return <div className="readiness-row"><span>{icon}</span><div><b>{title}</b><small>{value}</small>{progress !== undefined && <i><em style={{ width: `${progress}%` }}/></i>}</div>{complete !== undefined && <strong className={complete ? "complete" : "pending"}>{complete ? "Ready" : "Action needed"}</strong>}</div>;
}
