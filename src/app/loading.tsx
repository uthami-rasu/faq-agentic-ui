export default function Loading() {
  return <main className="app-loading-shell" aria-label="Loading QueryDesk" aria-busy="true">
    <aside className="app-loading-sidebar" aria-hidden="true">
      <div className="loading-brand"><span className="shimmer-block"/><i className="shimmer-block"/></div>
      <div className="loading-workspace shimmer-block"/>
      <div className="loading-nav"><span className="shimmer-block"/><span className="shimmer-block"/><span className="shimmer-block"/><span className="shimmer-block short"/></div>
      <div className="loading-profile shimmer-block"/>
    </aside>
    <section className="app-loading-main">
      <header className="app-loading-topbar"><span className="shimmer-block"/><div><i className="shimmer-block"/><i className="shimmer-block"/><i className="shimmer-block"/></div></header>
      <div className="app-loading-content">
        <div className="loading-page-heading"><span className="shimmer-block"/><b className="shimmer-block"/><i className="shimmer-block"/></div>
        <div className="loading-summary shimmer-block"/>
        <div className="loading-toolbar"><span className="shimmer-block"/><i className="shimmer-block"/></div>
        <div className="loading-card-grid">{Array.from({ length: 6 }, (_, index) => <div className="loading-agent-card" key={index}><span className="shimmer-block"/><b className="shimmer-block"/><i className="shimmer-block"/><i className="shimmer-block compact"/></div>)}</div>
      </div>
    </section>
    <span className="sr-loading-message">Loading your QueryDesk workspace…</span>
  </main>;
}
