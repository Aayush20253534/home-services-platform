const workspaces = [
  { title: 'Customers', description: 'Customer records and service requests', phase: 'Phase 06+' },
  { title: 'Providers', description: 'Professional onboarding and approval', phase: 'Phase 09+' },
  { title: 'Bookings', description: 'Booking queue and manual assignment', phase: 'Phase 11+' },
];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="masthead">
        <span className="eyebrow">HOME SERVICES / ADMIN</span>
        <span className="pill">Foundation · Phase 01</span>
      </header>
      <section className="hero">
        <span className="eyebrow">OPERATIONS CONSOLE</span>
        <h1>One place to manage every service request.</h1>
        <p>
          The admin application is initialized. Customer management, provider approvals and
          booking operations will be connected in later phases.
        </p>
      </section>
      <section className="grid" aria-label="Upcoming administration features">
        {workspaces.map((workspace) => (
          <article className="tile" key={workspace.title}>
            <span className="tile-label">{workspace.phase}</span>
            <h2>{workspace.title}</h2>
            <p>{workspace.description}</p>
          </article>
        ))}
      </section>
      <footer>Backend liveness: http://localhost:4000/health</footer>
    </main>
  );
}
