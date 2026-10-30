import React, { useState } from "react";
import { Link } from "react-router-dom";

export const NAV_LINKS = [
  { label: "होम", sub: "Home", href: "#home" },
  { label: "हमारे बारे में", sub: "About", href: "#about" },
  { label: "गतिविधियाँ", sub: "Activities", href: "#activities" },
  { label: "पता", sub: "Location", href: "#location" },
  { label: "सोशल मीडिया", sub: "Social", href: "#social" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-gold-500 bg-royal-900/95 shadow-lg backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <a href="#home" onClick={close} className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="श्री कृष्णा महारानी मण्डल"
            className="h-11 w-11 rounded-full bg-white object-cover ring-2 ring-gold-500 md:h-14 md:w-14"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-gold-400 md:text-xl">श्री कृष्णा महारानी मण्डल (रजि.)</p>
            <p className="text-[10px] tracking-wide text-royal-100 md:text-xs">श्रीजी सेवा धाम धर्मशाला, बरसाना</p>
          </div>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative block rounded-lg px-3 py-2 text-sm font-medium text-royal-100 transition hover:text-gold-400"
              >
                {l.label}
                <span className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded bg-gold-400 transition-transform group-hover:scale-x-100" />
              </a>
            </li>
          ))}
          {/* <li className="ml-2">
            <Link
              to="/admin/login"
              className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-royal-900 shadow transition hover:bg-gold-400"
            >
              Admin Login
            </Link>
          </li> */}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg text-gold-400 transition hover:bg-white/10 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-royal-900 lg:hidden">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={close}
                  className="flex items-baseline justify-between rounded-lg px-3 py-2.5 text-royal-100 transition hover:bg-white/10 hover:text-gold-400"
                >
                  <span className="font-medium">{l.label}</span>
                  <span className="text-xs text-royal-100/60">{l.sub}</span>
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Link
                to="/admin/login"
                onClick={close}
                className="block rounded-full bg-gold-500 px-5 py-2.5 text-center font-semibold text-royal-900"
              >
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
