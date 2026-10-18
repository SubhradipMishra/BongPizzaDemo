import React, { useEffect, useRef } from "react";

/**
 * SplashScreen
 * ─────────────
 * Plays a premium logo intro animation (≈3 s) then calls onFinish().
 * Uses CSS keyframes injected via a <style> tag so the animation
 * fires immediately on mount — no state-phase tricks needed.
 */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');

  .bong-splash {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a0a 0%, #1c0404 50%, #0a0a0a 100%);
    animation: splashFadeOut 0.55s ease 2.6s forwards;
  }

  /* ── glow orb ───────────────────────────── */
  .bong-splash__glow {
    position: absolute;
    width: 360px;
    height: 360px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(214,40,40,0.3) 0%, transparent 70%);
    animation: splashGlowIn 0.8s ease 0.1s both;
  }

  /* ── outer rings ────────────────────────── */
  .bong-splash__ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid rgba(214,40,40,0.35);
    animation: splashRingExpand 2s ease-out 0.2s both;
  }
  .bong-splash__ring--1 { width: 180px; height: 180px; }
  .bong-splash__ring--2 { width: 230px; height: 230px; animation-delay: 0.35s; opacity: 0.5; }

  /* ── logo circle ────────────────────────── */
  .bong-splash__logo {
    position: relative;
    z-index: 2;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(255,255,255,0.12);
    box-shadow: 0 0 60px rgba(214,40,40,0.55), 0 0 20px rgba(214,40,40,0.3);
    animation: splashLogoIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;
  }
  .bong-splash__logo img {
    width: 100%; height: 100%; object-fit: cover;
  }

  /* ── brand text ─────────────────────────── */
  .bong-splash__brand {
    position: relative;
    z-index: 2;
    margin-top: 24px;
    text-align: center;
    animation: splashTextIn 0.55s ease 0.7s both;
  }
  .bong-splash__title {
    margin: 0;
    font-size: 38px;
    font-weight: 900;
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #ffffff 0%, #fca5a5 55%, #D62828 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .bong-splash__sub {
    margin: 6px 0 0;
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.38);
    font-family: 'Outfit', sans-serif;
    font-weight: 400;
  }

  /* ── loading bar ────────────────────────── */
  .bong-splash__bar-wrap {
    position: absolute;
    bottom: 52px;
    width: 160px;
    height: 2px;
    border-radius: 2px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
    animation: splashTextIn 0.4s ease 0.9s both;
  }
  .bong-splash__bar-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, #D62828, #f87171);
    animation: splashBarFill 1.8s ease 0.9s both;
  }

  /* ── keyframes ──────────────────────────── */
  @keyframes splashFadeOut {
    to { opacity: 0; pointer-events: none; }
  }
  @keyframes splashGlowIn {
    from { opacity: 0; transform: scale(0.4); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes splashRingExpand {
    from { opacity: 0; transform: scale(0.3); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes splashLogoIn {
    from { opacity: 0; transform: scale(0.3) translateY(30px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes splashTextIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes splashBarFill {
    from { width: 0%; }
    to   { width: 100%; }
  }
`;

const SplashScreen = ({ onFinish }) => {
  const styleRef = useRef(null);

  useEffect(() => {
    // Inject keyframe styles once
    const tag = document.createElement("style");
    tag.textContent = STYLES;
    document.head.appendChild(tag);
    styleRef.current = tag;

    // After animation completes (splashFadeOut ends at 2.6s + 0.55s = 3.15s)
    const timer = setTimeout(() => {
      onFinish?.();
    }, 3200);

    return () => {
      clearTimeout(timer);
      tag.remove();
    };
  }, [onFinish]);

  return (
    <div className="bong-splash" aria-hidden="true">
      <div className="bong-splash__glow" />
      <div className="bong-splash__ring bong-splash__ring--1" />
      <div className="bong-splash__ring bong-splash__ring--2" />

      <div className="bong-splash__logo">
        <img src="/images/logo.jpeg" alt="বং Pizza" />
      </div>

      <div className="bong-splash__brand">
        <h1 className="bong-splash__title">বং Pizza</h1>
        <p className="bong-splash__sub">Restaurant POS</p>
      </div>

      <div className="bong-splash__bar-wrap">
        <div className="bong-splash__bar-fill" />
      </div>
    </div>
  );
};

export default SplashScreen;
