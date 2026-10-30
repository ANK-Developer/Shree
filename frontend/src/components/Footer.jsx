import React from "react";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "./Navbar";

export const ADDRESS = "Shreeji Seva Dham Dharamshala, Radhe-Radhe Colony, Rana Ka Pyau, Nandgaon Road, Barsana, Mathura";
export const MAP_QUERY = encodeURIComponent(ADDRESS);
export const PHONE = "9718085085";

const Footer = () => (
  <footer id="contact" className="border-t-4 border-gold-500 bg-royal-900 text-royal-100">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <img src="/logo.jpeg" alt="Logo" className="h-14 w-14 rounded-full bg-white object-cover ring-2 ring-gold-500" />
          <p className="text-lg font-bold leading-tight text-gold-400">श्री कृष्णा महारानी मण्डल (रजि.)</p>
        </div>
        <p className="text-sm leading-relaxed text-royal-100/80">
          समाज की सेवा, एकता और सहयोग के लिए समर्पित संस्था। राधा-कृष्ण की भक्ति और सेवा ही हमारा ध्येय है।
        </p>
        <div className="mt-5 flex gap-2">
          <span className="h-1.5 w-10 rounded bg-gold-500" />
          <span className="h-1.5 w-10 rounded bg-pink-brand" />
          <span className="h-1.5 w-10 rounded bg-leaf" />
        </div>
      </div>

      <div>
        <h4 className="mb-4 font-semibold text-gold-400">क्विक लिंक्स / Quick Links</h4>
        <ul className="space-y-2 text-sm">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition hover:text-gold-400">
                › {l.label} <span className="text-royal-100/50">/ {l.sub}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-4 font-semibold text-gold-400">संपर्क / Contact</h4>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-2">
            <span>📍</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
              target="_blank"
              rel="noopener noreferrer"
              className="leading-relaxed transition hover:text-gold-400"
            >
              {ADDRESS}
            </a>
          </li>
          <li className="flex gap-2">
            <span>📞</span>
            <a href={`tel:+91${PHONE}`} className="transition hover:text-gold-400">
              +91 {PHONE}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="bg-black/20 px-4 py-3 text-xs">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} श्री कृष्णा महारानी मण्डल (रजि.). All rights reserved.</p>
        <Link to="/admin/login" className="transition hover:text-gold-400">
          Admin Login
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
