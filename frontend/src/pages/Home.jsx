import React from "react";
import Navbar from "../components/Navbar";
import Footer, { MAP_QUERY, PHONE } from "../components/Footer";

// Public landing page: hero, about, activities, location aur social links
const ABOUT_POINTS = [
  { icon: "🙏", title: "भक्ति", text: "राधा-कृष्ण की भक्ति, कीर्तन और सत्संग से जुड़ा परिवार।" },
  { icon: "🤝", title: "सेवा", text: "ज़रूरतमंदों और श्रद्धालुओं की निःस्वार्थ सेवा।" },
  { icon: "🌸", title: "एकता", text: "समाज को एक सूत्र में बाँधने वाला पंजीकृत मण्डल।" },
];

const ACTIVITIES = [
  { icon: "🎶", title: "कीर्तन व सत्संग", text: "नियमित भजन-कीर्तन और सत्संग का आयोजन।", color: "from-pink-brand to-[#b3126b]" },
  { icon: "📖", title: "कथा व प्रवचन", text: "भागवत कथा और धार्मिक प्रवचन।", color: "from-royal-500 to-royal-700" },
  { icon: "🎉", title: "उत्सव व त्योहार", text: "एकादशी, जन्माष्टमी, होली जैसे पर्वों का भव्य आयोजन।", color: "from-gold-500 to-gold-600" },
  { icon: "🛕", title: "धर्मशाला सेवा", text: "बरसाना आने वाले यात्रियों के लिए ठहरने की व्यवस्था।", color: "from-leaf to-[#1f7a3a]" },
];

const STATS = [
  { value: "100%", label: "सेवा भाव" },
  { value: "रजि.", label: "पंजीकृत संस्था" },
  { value: "बरसाना", label: "श्रीजी की नगरी" },
];

const SectionTitle = ({ eyebrow, title, light }) => (
  <div className="mb-10 text-center">
    <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">{eyebrow}</p>
    <h3 className={`mt-2 text-2xl font-bold md:text-3xl ${light ? "text-white" : "text-royal-900"}`}>{title}</h3>
    <div className="mt-3 flex items-center justify-center gap-2">
      <span className="h-px w-10 bg-gold-500/70" />
      <span className="text-gold-500">✦</span>
      <span className="h-px w-10 bg-gold-500/70" />
    </div>
  </div>
);

const icon = (d) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
    <path d={d} />
  </svg>
);

const SOCIALS = [
  {
    name: "Instagram",
    handle: "@shreejisevadhamdharamshala",
    url: "https://www.instagram.com/shreejisevadhamdharamshala",
    color: "from-[#f58529] via-[#dd2a7b] to-[#8134af]",
    icon: icon(
      "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.9a4.9 4.9 0 100 9.8 4.9 4.9 0 000-9.8zm0 8.1a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.1-9.4a1.1 1.1 0 100 2.3 1.1 1.1 0 000-2.3z"
    ),
  },
  {
    name: "Facebook",
    handle: "Shreeji Seva Dham",
    url: "https://www.facebook.com/profile.php?id=61593040596188",
    color: "from-[#1877f2] to-[#0b5fcc]",
    icon: icon(
      "M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z"
    ),
  },
  {
    name: "YouTube",
    handle: "@ShreejiDhamEkadashiMataMandir",
    url: "https://www.youtube.com/@ShreejiDhamEkadashiMataMandir",
    color: "from-[#ff0000] to-[#c4302b]",
    icon: icon(
      "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"
    ),
  },
];

const Home = () => (
  <div className="min-h-screen bg-royal-900 text-white">
    <Navbar />

    {/* Hero */}
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-royal-900 via-royal-700 to-royal-500">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-pink-brand/25 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 pb-20 text-center md:pt-20 md:pb-28">
        <div className="relative mb-8">
          <span className="absolute inset-0 rounded-full bg-gold-400/40 animate-ping [animation-duration:3s]" />
          <img
            src="/logo.jpeg"
            alt="श्री कृष्णा महारानी मण्डल"
            className="relative h-32 w-32 rounded-full bg-white object-cover ring-4 ring-gold-500 shadow-2xl md:h-40 md:w-40"
          />
        </div>

        <p className="text-sm font-semibold tracking-[0.3em] text-gold-400">॥ राधे राधे ॥</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">श्री कृष्णा महारानी मण्डल</span> (रजि.)
        </h1>
        <p className="mt-3 text-sm tracking-widest text-royal-100 md:text-base">श्रीजी सेवा धाम धर्मशाला, बरसाना</p>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px w-12 bg-gold-500/70 md:w-20" />
          <span className="text-xl text-gold-400">✦</span>
          <span className="h-px w-12 bg-gold-500/70 md:w-20" />
        </div>

        <p className="max-w-2xl text-base text-royal-100 md:text-lg">
          भक्ति, सेवा और एकता के भाव से समाज को जोड़ने वाला मण्डल। आइए, श्रीजी की नगरी बरसाना में हमारे साथ जुड़ें।
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/15 px-4 py-1.5 text-xs font-semibold text-gold-400">
          <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
          वेबसाइट पर काम जारी है / Website under construction
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#about" className="rounded-full bg-gold-500 px-6 py-3 font-semibold text-royal-900 shadow-lg transition hover:bg-gold-400">
            हमारे बारे में जानें
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/20"
          >
            📍 Get Directions
          </a>
          <a
            href={`tel:+91${PHONE}`}
            className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/20"
          >
            📞 {PHONE}
          </a>
        </div>
      </div>
    </section>

    {/* About */}
    <section id="about" className="bg-white text-royal-900">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <SectionTitle eyebrow="हमारे बारे में / About Us" title="भक्ति, सेवा और एकता का संगम" />
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-4 text-base leading-relaxed text-gray-600 md:text-lg">
            <p>
              <b className="text-royal-900">श्री कृष्णा महारानी मण्डल (रजि.)</b> एक पंजीकृत धार्मिक एवं सामाजिक संस्था है, जो राधा-कृष्ण की भक्ति और
              समाज की सेवा के लिए समर्पित है।
            </p>
            <p>
              बरसाना स्थित <b className="text-royal-900">श्रीजी सेवा धाम धर्मशाला</b> के माध्यम से हम श्रद्धालुओं और यात्रियों को आश्रय देते हैं तथा
              कथा, सत्संग और उत्सवों का आयोजन करते हैं।
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {STATS.map((st) => (
                <div key={st.label} className="rounded-xl bg-royal-50 p-3 text-center">
                  <p className="text-xl font-extrabold text-royal-600 md:text-2xl">{st.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{st.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {ABOUT_POINTS.map((p) => (
              <div key={p.title} className="flex items-start gap-4 rounded-2xl border border-royal-100 bg-royal-50/60 p-5 transition hover:shadow-lg">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-500/20 text-2xl">{p.icon}</span>
                <div>
                  <h4 className="font-bold">{p.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Activities */}
    <section id="activities" className="bg-gradient-to-br from-royal-900 via-royal-700 to-royal-600">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <SectionTitle eyebrow="गतिविधियाँ / Activities" title="हमारे कार्य एवं आयोजन" light />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVITIES.map((a) => (
            <div key={a.title} className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
              <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${a.color} text-3xl shadow-lg`}>{a.icon}</span>
              <h4 className="mt-4 text-lg font-bold text-gold-400">{a.title}</h4>
              <p className="mt-2 text-sm text-royal-100">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Address + Map */}
    <section id="location" className="bg-white text-royal-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">पता / Address</p>
          <h3 className="mt-2 text-2xl font-bold md:text-3xl">श्रीजी सेवा धाम धर्मशाला</h3>
          <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg">
            Shreeji Seva Dham Dharamshala,
            <br />
            Radhe-Radhe Colony, Rana Ka Pyau,
            <br />
            Nandgaon Road, Barsana, Mathura
          </p>
          <p className="mt-4 text-base md:text-lg">
            <span className="font-semibold">संपर्क / Phone: </span>
            <a href={`tel:+91${PHONE}`} className="font-semibold text-royal-600 hover:underline">
              +91 {PHONE}
            </a>
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-royal-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-royal-700"
          >
            Google Maps पर देखें →
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-xl ring-4 ring-gold-500/40">
          <iframe
            title="Shreeji Seva Dham location"
            src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
            className="h-72 w-full md:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>

    {/* Social media */}
    <section id="social" className="bg-royal-50 text-royal-900">
      <div className="mx-auto max-w-6xl px-4 py-14 text-center md:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">सोशल मीडिया / Social Media</p>
        <h3 className="mt-2 text-2xl font-bold md:text-3xl">हमसे जुड़े रहें</h3>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">कथा, सत्संग, उत्सव और सेवा की हर जानकारी के लिए हमें फॉलो करें।</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow`}>
                {s.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">{s.name}</span>
                <span className="block truncate text-sm text-gray-500">{s.handle}</span>
              </span>
              <span className="ml-auto text-xl text-gray-300 transition group-hover:translate-x-1 group-hover:text-royal-600">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Home;
