"use client";

import { MobileFeatureCard } from "./mobile-feature-card";
import { FeatureCard } from "./feature-card";
import { FeaturesArray } from "@/utils/features-array";
import SVGIcon from "@/lib/svg-icon";
import { RAW_ICONS } from "@/lib/icons";
import { useRef } from "react";

export default function Features() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const scrollByCard = (direction: "left" | "right") => {
    if (scrollRef.current && cardRef.current) {
      const cardWidth = cardRef.current.offsetWidth;
      const computedStyle = window.getComputedStyle(cardRef.current);
      const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
      scrollRef.current.scrollBy({
        left: direction === "right" ? cardWidth + marginRight : -(cardWidth + marginRight),
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="border-t border-(--border) bg-(--background) ef-page-gutter pt-16 pb-20">
      <p className="ef-kicker">Platform</p>
      <h2 className="ef-section-title mt-2">Everything in one place</h2>
      <p className="ef-section-lead mt-3">
        Tickets, store directory, and delivery views — organized the same way inside the product.
      </p>

      <div className="mt-10 relative">
        <ScrollingButton
          onClickFn={() => scrollByCard("left")}
          svg={RAW_ICONS.ArrowLeft}
          className="left-0"
        />
        <ScrollingButton
          onClickFn={() => scrollByCard("right")}
          svg={RAW_ICONS.ArrowRight}
          className="right-0"
        />

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hidden snap-x snap-mandatory sm:hidden pb-1"
        >
          {FeaturesArray.map((feature, index) => (
            <div
              key={feature.heading}
              ref={index === 0 ? cardRef : null}
              className="snap-center shrink-0 w-[88vw] max-w-sm"
            >
              <MobileFeatureCard feature={feature} />
            </div>
          ))}
        </div>

        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3">
          {FeaturesArray.map((feature) => (
            <FeatureCard key={feature.heading} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScrollingButton({
  onClickFn,
  svg,
  className,
}: {
  onClickFn: () => void;
  svg: string;
  className: string;
}) {
  return (
    <button
      type="button"
      className={`${className} absolute top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex justify-center items-center rounded-full border border-(--border) bg-(--surface-1) text-(--muted) shadow-sm sm:hidden hover:bg-(--surface-3) transition-colors`}
      onClick={onClickFn}
      aria-label="Scroll features"
    >
      <SVGIcon className="flex w-4" svgString={svg} />
    </button>
  );
}
