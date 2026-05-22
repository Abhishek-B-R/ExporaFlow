import React from "react";

/** Map legacy dark-theme icon fills/strokes to currentColor for light UI. */
function normalizeSvgColors(svg: string): string {
  return svg
    .replace(/fill="white"/gi, 'fill="currentColor"')
    .replace(/fill="#fff(f{3})?"/gi, 'fill="currentColor"')
    .replace(/fill="#E6E6E6"/gi, 'fill="currentColor"')
    .replace(/fill="#D9D9D9"/gi, 'fill="currentColor"')
    .replace(/fill="#C9C9CC"/gi, 'fill="currentColor"')
    .replace(/fill="#97989A"/gi, 'fill="currentColor"')
    .replace(/fill="#c7c8c8"/gi, 'fill="currentColor"')
    .replace(/stroke="#D9D9D9"/gi, 'stroke="currentColor"')
    .replace(/stroke="#C9C9CC"/gi, 'stroke="currentColor"')
    .replace(/color="#D9D9D9"/gi, 'color="currentColor"')
    .replace(/color="#C9C9CC"/gi, 'color="currentColor"');
}

const SVGIcon = ({
  svgString,
  className,
}: {
  svgString: string;
  className?: string;
}) => {
  return (
    <div
      className={`inline-flex shrink-0 text-(--foreground) [&_svg]:block [&_svg]:h-full [&_svg]:w-full ${className ?? ""}`}
      dangerouslySetInnerHTML={{
        __html: normalizeSvgColors(svgString),
      }}
    />
  );
};

export default SVGIcon;
