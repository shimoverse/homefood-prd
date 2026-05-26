import { buyerRequests, drops, launchMetrics, operatorTasks, pantryStatuses, sellerIntakes, sellers } from "@/lib/mock-data";

const sellerPacket = [
  ["Identity", "Seller name, owner name, WhatsApp number, city/cross-street, preferred contact window."],
  ["Food rules", "Cuisine, veg/Jain/vegan claims, allergens, kitchen notes, sample menu photo, price range."],
  ["Operations", "Pickup windows, daily capacity, preorder cutoff, payment methods, sold-out update process."],
  ["Consent", "Permission to list menu, show source proof, receive buyer handoff drafts, and claim/edit the profile."]
];

export function LaunchDashboard() {
  return (
    <main className="page">
      <section className="launchOps standalone">
        <div className="launchHeader">
          <div>
            <p className="eyebrow">LocalPlate launch cockpit</p>
            <h1>Operate the Tracy concierge MVP.</h1>
            <p>Foodie can feel automated to buyers while Mohit keeps seller verification, uncertain diet claims, and first orders under manual control.</p>
          </div>
          <div className="launchLinks">
            <a href="/">Buyer onboarding</a>
            <a href="/prototype">Foodie prototype</a>
          </div>
        </div>

        <div className="launchMetrics">
          {launchMetrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.trend}</p>
              <small>Target: {metric.target}</small>
            </article>
          ))}
        </div>

        <div className="opsGrid">
          <section className="panel opsPanel">
            <div className="panelHeader"><p className="eyebrow">Seller pipeline</p><strong>{sellers.length} sellers</strong></div>
            <div className="sellerList">
              {sellers.map((seller) => (
                <article key={seller.id}>
                  <div><h3>{seller.name}</h3><span>{seller.area} - {seller.status}</span></div>
                  <p>{seller.specialties.join(", ")}</p>
                  <small>{seller.nextStep}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel opsPanel">
            <div className="panelHeader"><p className="eyebrow">Buyer requests</p><strong>{buyerRequests.length} asks</strong></div>
            <div className="requestList">
              {buyerRequests.map((request) => {
                const match = drops.find((drop) => drop.id === request.matchedDropIds[0]);
                return (
                  <article key={request.id}>
                    <div><h3>{request.buyerName}</h3><span>{request.status} - {request.createdAt}</span></div>
                    <p>{request.query}</p>
                    <small>{request.location} - {request.radius} mi - {request.fulfillment} - {match ? "Match: " + match.seller : "No match yet"}</small>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel opsPanel">
            <div className="panelHeader"><p className="eyebrow">Intake queue</p><strong>{sellerIntakes.length} leads</strong></div>
            <div className="intakeList">
              {sellerIntakes.map((lead) => (
                <article key={lead.id}>
                  <div><h3>{lead.sellerName}</h3><span>{lead.source} - {lead.reviewState}</span></div>
                  <p>{lead.sampleMenu}</p>
                  <small>{lead.consentStatus} consent - {lead.nextAction}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel opsPanel">
            <div className="panelHeader"><p className="eyebrow">Live pantry</p><strong>{pantryStatuses.length} items</strong></div>
            <div className="pantryStatusList">
              {pantryStatuses.map((item) => {
                const drop = drops.find((candidate) => candidate.id === item.dropId);
                return (
                  <article key={item.dropId}>
                    <div><h3>{drop?.seller ?? item.dropId}</h3><span>{item.status} - {item.lastVerifiedAt}</span></div>
                    <p>{item.operatorNote}</p>
                    <small>{item.ordersClaimed} claimed - {item.platesRemaining ?? "unknown"} remaining</small>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel opsPanel">
            <div className="panelHeader"><p className="eyebrow">Manual review</p><strong>{operatorTasks.length} tasks</strong></div>
            <div className="taskList">
              {operatorTasks.map((task) => (
                <article key={task.id} className={task.status.replace(" ", "-")}>
                  <div><h3>{task.title}</h3><span>{task.owner} - {task.due}</span></div>
                  <small>{task.priority} - {task.kind} - {task.status}</small>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="sellerIntake">
          <div>
            <p className="eyebrow">What Mohit can collect now</p>
            <h2>Seller launch packet</h2>
          </div>
          {sellerPacket.map(([title, body]) => (
            <article key={title}><strong>{title}</strong><p>{body}</p></article>
          ))}
        </section>
      </section>
    </main>
  );
}
