"use client";

import { useMemo, useState } from "react";

type Step = "start" | "phone" | "taste" | "ready";

const foods = ["Jain", "Veg", "South Indian", "Gujarati", "Tiffin", "Snacks"];
const featureChips = ["Verified cooks", "Diet match", "Pickup window", "Source proof"];
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
          <h1>Homemade food, available near you.</h1>
          <p>Say what you want. Foodie finds a nearby plate, checks the details, and gets you to pickup without downloading another app.</p>
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
                <span className="waBack">‹</span>
                <span className="waAvatar">F</span>
                <div>
                  <strong>Foodie</strong>
                  <span>online</span>
                </div>
              </div>
              <div className="waHeaderActions" aria-label="WhatsApp actions">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="chatCanvas">
              <div className="waDate">Today</div>
              <div className="previewBubble agent intro">
                Hi Rohan. I have your Tracy profile and Jain/veg rules saved. What should I find tonight?
                <span className="bubbleTime">6:11 PM</span>
              </div>
              <div className="previewBubble user">
                Jain dinner near me tonight?
                <span className="bubbleTime">6:12 PM ✓✓</span>
              </div>
              <div className="previewBubble agent">
                Found one strong match. Verified Jain thali from Asha, 2.4 mi away. Pickup is open 6:00-7:30 PM.
                <span className="bubbleTime">6:12 PM</span>
              </div>

              <div className="foodCard">
                <div className="dishPhoto" aria-hidden="true">
                  <span />
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
                    <span /> Verified kitchen + source photo checked
                  </div>
                </div>
              </div>

              <div className="quickActions" aria-label="Suggested actions">
                <button>Reserve 3 plates</button>
                <button>Show pickup</button>
              </div>
            </div>

            <div className="composer">
              <span className="composerPlus">+</span>
              <span className="composerField">Message</span>
              <span className="composerMic" aria-label="Voice message" />
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
            <h2>Explore today's homemade options?</h2>
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
