"use client";

import { useMemo, useState } from "react";

type Step = "start" | "phone" | "taste" | "ready";

const foods = ["Jain", "Veg", "South Indian", "Gujarati", "Tiffin", "Snacks"];
const featureChips = ["Verified home cooks", "Diet-safe matches", "Live pickup slots", "WhatsApp pickup"];
const menuFeatures = ["Jain-safe", "3 plates left", "6:00-7:30 PM", "2.4 mi"];

function profileText(phone: string, location: string, choices: string[]) {
  return encodeURIComponent(
    "Hi Foodie, I want to join LocalPlate. My WhatsApp is " +
      phone +
      ". I am near " +
      location +
      ". I am looking for " +
      (choices.length ? choices.join(", ") : "homemade food") +
      " near me tonight."
  );
}

function Icon({ name }: { name: "video" | "phone" | "more" | "mic" | "plus" | "check" | "pin" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "video") {
    return <svg {...common} aria-hidden="true"><path d="M15 10.5 20 7v10l-5-3.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3.5Z" /></svg>;
  }

  if (name === "phone") {
    return <svg {...common} aria-hidden="true"><path d="M22 16.92v2.4a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.6 2 2 0 0 1 4.11 1.4h2.4a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.8a2 2 0 0 1-.45 2.11L7.7 9.05a16 16 0 0 0 7.25 7.25l1.02-1.02a2 2 0 0 1 2.11-.45c.9.31 1.84.53 2.8.66A2 2 0 0 1 22 16.92Z" /></svg>;
  }

  if (name === "more") {
    return <svg {...common} aria-hidden="true"><path d="M12 8h.01" /><path d="M12 12h.01" /><path d="M12 16h.01" /></svg>;
  }

  if (name === "mic") {
    return <svg {...common} aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></svg>;
  }

  if (name === "plus") {
    return <svg {...common} aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
  }

  if (name === "pin") {
    return <svg {...common} aria-hidden="true"><path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" /><path d="M12 10.5h.01" /></svg>;
  }

  return <svg {...common} aria-hidden="true"><path d="m20 6-11 11-5-5" /></svg>;
}

export function SimpleLanding() {
  const [step, setStep] = useState<Step>("start");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Tracy");
  const [choices, setChoices] = useState<string[]>(["Jain", "Veg"]);

  const canContinue = phone.trim().length >= 7;
  const whatsappHref = useMemo(
    () => "https://wa.me/918097244384?text=" + profileText(phone, location, choices),
    [phone, location, choices]
  );

  function toggleChoice(choice: string) {
    setChoices((current) =>
      current.includes(choice) ? current.filter((item) => item !== choice) : [...current, choice]
    );
  }

  return (
    <main className="simpleLanding">
      <nav className="simpleNav">
        <strong>LocalPlate</strong>
        <a href="/prototype">See demo</a>
      </nav>

      <section className="simpleHero">
        <div className="heroCopy">
          <p className="simpleEyebrow">Tracy pilot</p>
          <h1>Home-cooked food near you, found by text.</h1>
          <p>Tell Foodie what you can eat. It checks trusted nearby home cooks, verifies the details, and gets you to pickup in WhatsApp.</p>
          <div className="heroFeatureChips" aria-label="LocalPlate features">
            {featureChips.map((chip) => <span key={chip}>{chip}</span>)}
          </div>
          <a className="heroStart" href="#join">Start in 30 seconds</a>
        </div>

        <div className="iphonePreview" aria-label="Foodie WhatsApp iPhone preview">
          <div className="iphoneBezel">
            <div className="dynamicIsland" />
            <div className="iosStatus"><span>9:41</span><span>5G 100%</span></div>
            <div className="appHeader">
              <div className="waContact">
                <span className="waBack" aria-hidden="true">‹</span>
                <span className="waAvatar">F</span>
                <div>
                  <strong>Foodie</strong>
                  <span>online</span>
                </div>
              </div>
              <div className="waHeaderActions" aria-label="WhatsApp actions">
                <button type="button" aria-label="Video call"><Icon name="video" /></button>
                <button type="button" aria-label="Call"><Icon name="phone" /></button>
                <button type="button" aria-label="More options"><Icon name="more" /></button>
              </div>
            </div>

            <div className="chatCanvas">
              <div className="waDate">Today</div>
              <div className="previewBubble agent intro">
                Hi Rohan. I saved your Tracy profile, Jain/veg rules, and 8-mile pickup radius. What should I find tonight?
                <span className="bubbleTime">6:11 PM</span>
              </div>
              <div className="previewBubble user">
                Jain dinner near me tonight?
                <span className="bubbleTime">6:12 PM ✓✓</span>
              </div>
              <div className="previewBubble agent">
                Best match: verified Jain thali from Asha, 2.4 miles away. Pickup is open 6:00-7:30 PM.
                <span className="bubbleTime">6:12 PM</span>
              </div>

              <div className="foodCard">
                <div className="dishPhoto" aria-hidden="true">
                  <span className="plate roti" />
                  <span className="plate dal" />
                  <span className="plate shaak" />
                  <span className="dishLabel">Fresh thali</span>
                </div>
                <div className="dishDetails">
                  <div>
                    <strong>Asha's Jain Thali</strong>
                    <small>Pickup tonight</small>
                  </div>
                  <p>Roti, dal, rice, shaak, pickle. No onion, no garlic.</p>
                  <div className="menuFeatureGrid">
                    {menuFeatures.map((feature) => <span key={feature}>{feature}</span>)}
                  </div>
                  <div className="proofLine">
                    <span><Icon name="check" /></span> Verified kitchen + source photo checked
                  </div>
                </div>
              </div>

              <div className="pickupSheet">
                <div><Icon name="pin" /><span>Pickup near Grant Line Rd</span></div>
                <strong>$14/plate</strong>
              </div>

              <div className="quickActions" aria-label="Suggested actions">
                <button>Reserve 3 plates</button>
                <button>Show pickup</button>
              </div>
            </div>

            <div className="composer">
              <span className="composerPlus"><Icon name="plus" /></span>
              <span className="composerField">Message</span>
              <span className="composerMic" aria-label="Voice message"><Icon name="mic" /></span>
            </div>
          </div>
        </div>
      </section>

      <section className="simpleOnboarding" id="join">
        <div className="progressDots" aria-label="Signup progress">
          {["start", "phone", "taste", "ready"].map((item) => (
            <span key={item} className={item === step ? "active" : ""} />
          ))}
        </div>

        {step === "start" && (
          <div className="stepCard">
            <h2>Explore tonight's homemade options?</h2>
            <p>No app. No menu hunting. Start with one WhatsApp message.</p>
            <button className="simplePrimary" onClick={() => setStep("phone")}>Start</button>
          </div>
        )}

        {step === "phone" && (
          <form className="stepCard" onSubmit={(event) => { event.preventDefault(); if (canContinue) setStep("taste"); }}>
            <h2>Where should Foodie look?</h2>
            <label>
              WhatsApp number
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 408 555 1234" autoFocus />
            </label>
            <label>
              Area
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                <option>Tracy</option>
                <option>Mountain House</option>
                <option>Lathrop</option>
                <option>Dublin</option>
              </select>
            </label>
            <button className="simplePrimary" disabled={!canContinue}>Continue</button>
          </form>
        )}

        {step === "taste" && (
          <div className="stepCard">
            <h2>What should it remember?</h2>
            <div className="choiceGrid">
              {foods.map((food) => (
                <button key={food} className={choices.includes(food) ? "selected" : ""} onClick={() => toggleChoice(food)}>
                  {food}
                </button>
              ))}
            </div>
            <button className="simplePrimary" onClick={() => setStep("ready")}>Create my Foodie text</button>
          </div>
        )}

        {step === "ready" && (
          <div className="stepCard readyCard">
            <h2>You're ready.</h2>
            <p>Foodie will open in WhatsApp with your basics already written. Send it, then ask for food naturally.</p>
            <a className="simplePrimary" href={whatsappHref}>Open WhatsApp</a>
            <button className="simpleGhost" onClick={() => setStep("phone")}>Edit details</button>
          </div>
        )}
      </section>

      <section className="simpleHow">
        <article><strong>1</strong><span>Text what you want</span></article>
        <article><strong>2</strong><span>Foodie checks nearby cooks</span></article>
        <article><strong>3</strong><span>Confirm pickup in WhatsApp</span></article>
      </section>
    </main>
  );
}
