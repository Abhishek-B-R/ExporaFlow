import Image from "next/image";
import metallicLogo from "@/public/logo.png";
import Link from "next/link";
import { features, product, resources } from "@/utils/footer-list-options";
import SVGIcon from "@/lib/svg-icon";
import { RAW_ICONS } from "@/lib/icons";

export default function Footer() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 border-t border-(--border) bg-(--surface-1)">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-(--border) py-10 md:py-12">
        <div className="flex items-center gap-x-3">
          <Image
            className="w-8 h-8 object-contain"
            src={metallicLogo}
            alt=""
            height={80}
            width={80}
          />
          <p className="text-xl md:text-2xl font-semibold text-(--foreground)">ExporaFlow</p>
        </div>
        <p className="text-sm md:text-base text-(--muted-2) max-w-md">
          Enterprise operations for consulting and managed service delivery.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-y-10 md:gap-y-0 md:grid-cols-4 py-10">
        <FooterColumn title="Features" items={features} />
        <FooterColumn title="Product" items={product} />
        <FooterColumn title="Resources" items={resources} />
        <div className="col-span-1">
          <p className="text-sm font-semibold text-(--foreground)">Connect</p>
          <ul className="flex flex-col mt-6 gap-y-3 text-sm text-(--muted)">
            <div className="flex flex-wrap gap-6">
              <Social href="https://x.com/abhitwt" icon={RAW_ICONS.X} label="X" />
              <Social href="https://github.com/Abhishek-B-R" icon={RAW_ICONS.GitHub} label="GitHub" />
            </div>
            <Social
              href="https://www.linkedin.com/in/abhi-br"
              icon={RAW_ICONS.LinkedIn}
              label="LinkedIn"
            />
          </ul>
        </div>
      </div>

      <div className="border-t border-(--border) py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-(--muted-2)">
        <p>&copy; {new Date().getFullYear()} ExporaFlow. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-(--accent) transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-(--accent) transition-colors">
            Privacy
          </Link>
          <Link href="/workflow/dashboard" className="hover:text-(--accent) transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { title: string; redirectHref: string; target?: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-(--foreground)">{title}</p>
      <ul className="flex flex-col mt-6 gap-y-3 text-sm text-(--muted)">
        {items.map((elem) => (
          <FooterLabel
            key={elem.title}
            title={elem.title}
            redirectHref={elem.redirectHref}
            target={elem.target}
          />
        ))}
      </ul>
    </div>
  );
}

function Social({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 hover:text-(--accent) transition-colors"
    >
      <SVGIcon className="flex w-4" svgString={icon} />
      {label}
    </a>
  );
}

const FooterLabel = ({
  title,
  redirectHref,
  target,
}: {
  title: string;
  redirectHref: string;
  target?: string;
}) => (
  <li>
    <Link
      href={redirectHref}
      target={target}
      className="hover:text-(--accent) transition-colors"
    >
      {title}
    </Link>
  </li>
);
