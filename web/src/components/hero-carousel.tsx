"use client";

import { useEffect, useState } from "react";

// Book-themed illustrated slides in the brand palette. Pure inline SVG so
// there are no image files to host or license.
const SLIDES = [
  {
    caption: "Minglab kitoblar yangi egasini kutmoqda",
    art: (
      <svg viewBox="0 0 320 240" className="h-full w-full" aria-hidden>
        <rect x="30" y="150" width="260" height="14" rx="4" fill="#2d4232" />
        <rect x="55" y="60" width="34" height="90" rx="4" fill="#3f5b45" />
        <rect x="93" y="45" width="30" height="105" rx="4" fill="#8fa98f" />
        <rect x="127" y="72" width="26" height="78" rx="4" fill="#2f5f8a" />
        <rect x="157" y="52" width="36" height="98" rx="4" fill="#c9a24a" />
        <rect x="197" y="80" width="24" height="70" rx="4" fill="#7d5a3c" />
        <rect x="225" y="58" width="32" height="92" rx="4" fill="#3f5b45" />
        <rect x="60" y="74" width="24" height="6" rx="3" fill="#e8efe6" />
        <rect x="162" y="66" width="26" height="6" rx="3" fill="#faf7f0" />
        <rect x="230" y="72" width="22" height="6" rx="3" fill="#e8efe6" />
        <circle cx="280" cy="40" r="16" fill="#c9a24a" opacity="0.35" />
        <circle cx="40" cy="34" r="10" fill="#3f5b45" opacity="0.25" />
      </svg>
    ),
  },
  {
    caption: "Sotuvchi bilan bevosita kelishing — ortiqcha toʻlovsiz",
    art: (
      <svg viewBox="0 0 320 240" className="h-full w-full" aria-hidden>
        <circle cx="90" cy="90" r="34" fill="#8fa98f" />
        <circle cx="230" cy="90" r="34" fill="#c9a24a" />
        <rect x="56" y="130" width="68" height="60" rx="14" fill="#3f5b45" />
        <rect x="196" y="130" width="68" height="60" rx="14" fill="#7d5a3c" />
        <rect x="132" y="118" width="56" height="42" rx="5" fill="#2f5f8a" />
        <rect x="138" y="124" width="44" height="6" rx="3" fill="#e6eef5" />
        <rect x="138" y="136" width="34" height="5" rx="2.5" fill="#e6eef5" opacity="0.7" />
        <path
          d="M124 160 q36 26 72 0"
          stroke="#2d4232"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    caption: "Kitob hadya qiling — bilim ulashing",
    art: (
      <svg viewBox="0 0 320 240" className="h-full w-full" aria-hidden>
        <rect x="100" y="110" width="120" height="84" rx="10" fill="#3f5b45" />
        <rect x="100" y="110" width="120" height="26" rx="10" fill="#2d4232" />
        <rect x="152" y="110" width="16" height="84" fill="#c9a24a" />
        <path
          d="M160 96 c-12 -26 -52 -20 -46 6 c4 18 30 26 46 40 c16 -14 42 -22 46 -40 c6 -26 -34 -32 -46 -6z"
          fill="#b0523f"
        />
        <circle cx="66" cy="70" r="8" fill="#c9a24a" opacity="0.5" />
        <circle cx="256" cy="56" r="12" fill="#8fa98f" opacity="0.5" />
        <circle cx="240" cy="170" r="7" fill="#e8efe6" />
      </svg>
    ),
  },
];

const ROTATE_MS = 5000;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full min-h-[200px] w-full">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.caption}
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${
            i === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="h-44 w-full max-w-xs sm:h-52">{slide.art}</div>
          <p className="mt-1 text-center font-serif text-sm text-brand-dark">
            {slide.caption}
          </p>
        </div>
      ))}

      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.caption}
            type="button"
            aria-label={`Slayd ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-brand" : "w-1.5 bg-brand/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
