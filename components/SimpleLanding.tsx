"use client";

import { useMemo, useState } from "react";

type Step = "start" | "phone" | "taste" | "ready";

const foods = ["Jain", "Veg", "South Indian", "Gujarati", "Tiffin", "Snacks"];

function profileText(phone: string, location: string, choices: string[]) {
  return encodeURIComponent(
    "Hi Foodie, I want to join LocalPlate. My WhatsApp is " +
      phone +
      ". I am near " +
      location +
      ". I am looking for " +
      (choices.length ? choices.join(", ") : "homemade Indian food") +
      " near me tonight."
  );
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
          <h1>Homemade Indian food, found by text.</h1>
          <p>Tell Foodie what you want. It finds nearby home cooks, checks diet fit, and helps you confirm pickup in WhatsApp.</p>
        </div>

        <div className="phonePreview" aria-label="Foodie WhatsApp preview">
          <div className="previewTop"><span>Foodie</span><small>LocalPlate</small></div>
          <div className="previewBubble user">Jain dinner near me tonight?</div>
          <div className="previewBubble agent">
            Asha has verified Jain thali, 2.4 mi away, pickup 6-7:30 PM. Want me to ask for 3 plates?
          </div>
          <div className="previewProof">source proof + pickup details included</div>
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
            <h2>Want tonight's homemade options?</h2>
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
