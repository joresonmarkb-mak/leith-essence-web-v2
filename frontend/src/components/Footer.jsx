import { Link } from "react-router-dom";

// Edit these to match your real pages and details

 const SITE_LINKS = [
  { label: "Home", to: "/" },
  { label: "Take quiz", to: "/#quiz" },
  { label: "Shop now", to: "/shop" },
  { label: "Our collections", to: "/shop" },
  { label: "About us", to: "/about" },
];

const EMAIL = "leithessence@gmail.com";
const PHONE = "+53124539211"; // <- check this number, it's the one in the mockup
const INSTAGRAM = "leithessence.ph";
const LEGAL = [
  { label: "Privacy & policy", to: "/privacy" },
  { label: "Terms & conditions", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
];

const link =
  "flex min-h-11 items-center font-mono text-xs uppercase tracking-wide text-white hover:underline focus-visible:underline focus-visible:outline-none md:min-h-0 md:py-1";

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-4 pb-6 pt-12 sm:px-8 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[1fr_13rem_17rem] md:gap-x-8">
          {/* Brand */}
          <div>
            <p className="text-[length:clamp(1.5rem,4.5vw,2.5rem)] font-bold uppercase leading-none tracking-[0.3em]">
              Leith Essence
            </p>
            <p className="mt-2 font-mono text-sm uppercase tracking-wide">Crafted for presence.</p>
          </div>

          {/* On phones the two link columns sit side by side */}
          <div className="grid grid-cols-2 gap-x-6 md:contents">
            <nav aria-label="Footer">
              <ul>
                {SITE_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={link}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="flex min-h-11 items-center font-mono text-xs uppercase tracking-wide md:min-h-0 md:py-1">
                Connect with us
              </p>
              <ul>
                <li><a href={`mailto:${EMAIL}`} className={`${link} break-all`}>{EMAIL}</a></li>
                <li><a href={`tel:${PHONE}`} className={link}>{PHONE}</a></li>
                <li>
                  <a href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer" className={link}>
                    @{INSTAGRAM}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 grid gap-y-1 md:mt-24 md:grid-cols-[1fr_13rem_17rem] md:gap-x-8">
          <p className="font-mono text-[10px] uppercase tracking-wide sm:text-[11px]">
            All rights reserved. Leith Essence {new Date().getFullYear()}
          </p>
          <div className="flex flex-wrap gap-x-6 md:col-span-2">
            {LEGAL.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="flex min-h-11 items-center font-mono text-[10px] uppercase tracking-wide hover:underline sm:text-[11px] md:min-h-0"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}