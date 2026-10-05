import React from "react";

const Footer = () => (
  <footer id="contact" className="bg-royal-900 text-royal-100 border-t-4 border-gold-500">
    <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-2">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <img src="/logo.jpeg" alt="Logo" className="h-14 w-14 rounded-full bg-white object-cover ring-2 ring-gold-500" />
          <p className="text-gold-400 font-bold text-lg leading-tight">श्री कृष्णा महारानी मण्डल (रजि.)</p>
        </div>
        <p className="text-sm text-royal-100/80">समाज की सेवा, एकता और सहयोग के लिए समर्पित संस्था।</p>
      </div>

      <div>
        <h4 className="text-gold-400 font-semibold mb-3">संपर्क / Contact</h4>
        <p className="text-sm">📍 शालीमार बाग, दिल्ली</p>
        <div className="mt-4 flex gap-2">
          <span className="h-1.5 w-10 rounded bg-gold-500" />
          <span className="h-1.5 w-10 rounded bg-pink-brand" />
          <span className="h-1.5 w-10 rounded bg-leaf" />
        </div>
      </div>
    </div>

    <div className="bg-black/30 text-center text-xs py-3 px-4">
      © {new Date().getFullYear()} श्री कृष्णा महारानी मण्डल (रजि.), शालीमार बाग, दिल्ली. All rights reserved.
    </div>
  </footer>
);

export default Footer;
