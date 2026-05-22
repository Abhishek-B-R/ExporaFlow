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
      const scrollAmount = cardWidth + marginRight;

      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative flex flex-col justify-center border-t border-(--border) bg-(--background) px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 gap-y-3 sm:gap-y-4 md:gap-y-5 pt-14 pb-20 xl:pb-24">
      <div className="relative">
        <p className="text-xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-(--foreground) pb-2">
          Everything you need
        </p>
        <p className="text-sm md:text-base text-(--muted-2) max-w-3xl">
          Workspace delivery, incident and change management, store directory, and team
          structure — aligned with how your dashboard is organized.
        </p>
        <div className="mt-8 relative">
          <ScrollingButton
            onClickFn={() => scrollByCard("left")}
            svg={RAW_ICONS.ArrowLeft}
            className="left-[6px]"
          />

          <div
            ref={scrollRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hidden snap-x snap-mandatory sm:hidden pb-2 h-[430px] scroll-smooth"
          >
            {FeaturesArray.map((feature, index) => (
              <div
                key={index}
                ref={index === 0 ? cardRef : null}
                className="snap-center shrink-0 w-full"
              >
                <MobileFeatureCard
                  heading={feature.heading}
                  description={feature.description}
                />
              </div>
            ))}
          </div>

          <ScrollingButton
            onClickFn={() => scrollByCard("right")}
            svg={RAW_ICONS.ArrowRight}
            className="right-[6px]"
          />

          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 h-[430px]">
            {FeaturesArray.map((feature, index) => (
              <FeatureCard
                key={index}
                heading={feature.heading}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const ScrollingButton = ({
  onClickFn,
  svg,
  className,
}: {
  onClickFn: () => void;
  svg: string;
  className: string;
}) => {
  return (
    <button
      type="button"
      className={`${className} absolute h-10 w-10 flex justify-center items-center top-1/2 -translate-y-1/2 z-20 rounded-full border border-(--border) bg-(--surface-2) text-(--muted) shadow-sm sm:hidden hover:bg-(--surface-3) transition-colors`}
      onClick={onClickFn}
      aria-label="Scroll features"
    >
      <SVGIcon className="flex w-5" svgString={svg} />
    </button>
  );
};
