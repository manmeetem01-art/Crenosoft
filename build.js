(function(){
// Crenosoft static site builder. Vercel runs: node build.js -> dist/
// Content lives in content-*.json at the repo root (one file per page).
const fs = require("fs"), path = require("path");
const DOMAIN = "https://www.crenosoft.com";
const ROOT = __dirname, OUT = path.join(ROOT, "dist");
const CK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = s => String(s).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const slug = s => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const HEADER = `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
<nav class="wrap nav" aria-label="Main">
<a class="brand" href="/" aria-label="Crenosoft home"><img src="/logo.png" alt="Crenosoft" width="199" height="38"></a>
<button class="menu-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<ul class="nav-links" id="nav-links">
<li><a href="/ai-employees/">AI Employees</a></li>
<li><a href="/#services">Services</a></li>
<li><a href="/#industries">Industries</a></li>
<li><a href="/#assessment">AI Tools</a></li>
<li><a href="/locations/melbourne/">Locations</a></li>
<li><a href="/about/">About</a></li>
<li><a href="/insights/">Blog</a></li>
<li><a href="#contact">Contact</a></li>
</ul>
<a class="btn btn-primary" href="#contact">Get Started</a>
</nav>
</header>`;
const FOOTER = `<footer>
<div class="wrap">
<div class="foot-grid">
<div>
<a class="brand" href="/" aria-label="Crenosoft home"><img src="/logo-light.png" alt="Crenosoft" width="178" height="34"></a>
<p>AI agency in Melbourne building AI agents, AI receptionists and workflow automation for businesses across Australia.</p>
<p style="margin:0">Melbourne, Victoria, Australia</p>
</div>
<div><h3>Services</h3><ul>
<li><a href="/ai-consulting/">AI Consulting</a></li>
<li><a href="/ai-automation/">AI Automation</a></li>
<li><a href="/ai-agents/">AI Agents</a></li>
<li><a href="/ai-development/">AI Development</a></li>
<li><a href="/ai-agents/ai-receptionist/">AI Receptionist</a></li>
<li><a href="/ai-consulting/ai-readiness-assessment/">AI Readiness Assessment</a></li>
</ul></div>
<div><h3>Locations</h3><ul>
<li><a href="/locations/melbourne/">AI Agency Melbourne</a></li>
<li><a href="/locations/sydney/">AI Agency Sydney</a></li>
<li><a href="/locations/brisbane/">AI Agency Brisbane</a></li>
<li><a href="/locations/perth/">AI Agency Perth</a></li>
<li><a href="/locations/adelaide/">AI Agency Adelaide</a></li>
</ul></div>
<div><h3>Company</h3><ul>
<li><a href="/about/">About Us</a></li>
<li><a href="/case-studies/">Case Studies</a></li>
<li><a href="/pricing/">Pricing</a></li>
<li><a href="/insights/">Blog</a></li>
<li><a href="/privacy/">Privacy Policy</a></li>
<li><a href="#contact">Contact</a></li>
</ul></div>
</div>
<div class="foot-base"><span>Copyright © <span id="yr">2026</span> Crenosoft. All rights reserved. All prices in AUD.</span><span>We acknowledge the Traditional Owners of the lands on which we work.</span></div>
</div>
</footer>
<button class="chat-fab" id="chat-fab" aria-expanded="false" aria-controls="chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>Ask Crenosoft AI</button>
<div class="chat" id="chat" role="dialog" aria-label="Crenosoft AI assistant">
<div class="chat-head"><b>Crenosoft AI Assistant</b><button id="chat-close" aria-label="Close chat">×</button></div>
<div class="chat-log" id="chat-log" aria-live="polite"><div class="msg bot">Hi, I’m Crenosoft’s AI assistant. Ask me anything about this service, how projects work, or what AI could do for your business.</div></div>
<form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Type your question" aria-label="Your question" maxlength="500"><button type="submit">Send</button></form>
</div>`;
const contact = (h, p) => `<section id="contact" class="soft" aria-labelledby="contact-title">
<div class="wrap">
<div class="cta-band"><div><h2>${h}</h2><p>${p}</p></div><a class="btn btn-primary" href="#audit-form">Book Free Consultation</a></div>
<div class="contact-grid">
<div>
<span class="label">Contact</span>
<h2 id="contact-title">Book Your Free AI Audit</h2>
<p class="lead">Tell us what you’d like to automate. We’ll come to the call with two or three ideas already sketched for your business.</p>
<ul><li>${CK}We review your real workflows, not a generic demo</li><li>${CK}You leave with a shortlist ranked by payback</li><li>${CK}No obligation and no pushy follow-up</li></ul>
</div>
<form class="audit" id="audit-form" novalidate data-endpoint="">
<div class="f-row">
<div class="f"><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required></div>
<div class="f"><label for="f-email">Work email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
</div>
<div class="f-row">
<div class="f"><label for="f-company">Company</label><input id="f-company" name="company" autocomplete="organization"></div>
<div class="f"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="04xx xxx xxx"></div>
</div>
<div class="f"><label for="f-task">What would you like to automate?</label><textarea id="f-task" name="task"></textarea></div>
<p class="f-error" id="f-error">Add your name and a valid work email so we can reach you.</p>
<button class="btn btn-primary" type="submit" style="width:100%">Book My Free AI Audit</button>
<div class="form-done" id="form-done" aria-live="polite"><h3>Audit request received</h3><p style="color:var(--ink-2);margin:0">Thanks <span id="done-name"></span>. We’ll email you within one business day with times for your audit.</p></div>
</form>
</div>
</div>
</section>`;
function schema(p) {
  const url = DOMAIN + p.path;
  const crumbs = [["Home", "/"]].concat(p.crumbs).map(([n, u], i) => ({"@type": "ListItem", position: i + 1, name: n, item: DOMAIN + u}));
  const service = {"@type": "Service", "@id": url + "#service", name: p.service_name, serviceType: p.service_type || p.service_name,
    description: strip(p.answer), url,
    provider: {"@type": ["Organization", "ProfessionalService"], "@id": DOMAIN + "/#org", name: "Crenosoft", url: DOMAIN + "/",
      address: {"@type": "PostalAddress", addressLocality: "Melbourne", addressRegion: "VIC", addressCountry: "AU"}},
    areaServed: p.area || [{"@type": "Country", name: "Australia"}]};
  if (p.catalog) service.hasOfferCatalog = {"@type": "OfferCatalog", name: p.service_name,
    itemListElement: p.catalog.map(([n, u]) => ({"@type": "Offer", itemOffered: {"@type": "Service", name: n, url: DOMAIN + u}}))};
  const graph = [
    {"@type": "WebPage", "@id": url + "#webpage", url, name: p.title, description: p.desc, inLanguage: "en-AU",
     isPartOf: {"@id": DOMAIN + "/#website"}, about: {"@id": url + "#service"}, breadcrumb: {"@id": url + "#breadcrumb"},
     speakable: {"@type": "SpeakableSpecification", cssSelector: [".answer-box p", ".faq-answer"]}},
    {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", itemListElement: crumbs},
    service,
    {"@type": "FAQPage", "@id": url + "#faq", mainEntity: p.faqs.map(([q, a]) => ({"@type": "Question", name: q, acceptedAnswer: {"@type": "Answer", text: strip(a)}}))}
  ];
  return JSON.stringify({"@context": "https://schema.org", "@graph": graph});
}
const cards = items => '<ul class="svc-list">' + items.map(([n, u, d]) => `<li><a href="${u}">${n}</a><p>${d}</p></li>`).join("") + "</ul>";
function render(p) {
  let body = p.body.replace("{{CARDS}}", p.catalog ? cards(p.catalog) : "");
  body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, t) => `<h2 id="${slug(t)}">${t}</h2>`);
  const crumbs = '<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>' +
    p.crumbs.map(([n, u], i) => i < p.crumbs.length - 1 ? `<li><a href="${u}">${n}</a></li>` : `<li aria-current="page">${n}</li>`).join("") + "</ol></nav>";
  const facts = p.facts.map(f => `<li>${CK}<span>${f}</span></li>`).join("");
  const faqs = p.faqs.map(([q, a], i) => `<details${i ? "" : " open"}><summary>${q}</summary><p class="faq-answer">${a}</p></details>`).join("");
  const related = p.related.map(([n, u, d]) => `<li><a href="${u}">${n}</a><p>${d}</p></li>`).join("");
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${DOMAIN}${p.path}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="geo.region" content="AU-VIC">
<meta name="geo.placename" content="Melbourne">
<meta name="theme-color" content="#F07336">
<link rel="icon" type="image/png" href="/favicon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_AU">
<meta property="og:site_name" content="Crenosoft">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${DOMAIN}${p.path}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${schema(p)}</script>
</head>
<body>
${HEADER}
<main id="main">
<section class="page-hero" aria-labelledby="page-title">
<div class="wrap">
${crumbs}
<div class="page-hero-grid">
<div>
<span class="pill"><i aria-hidden="true"></i>${p.pill}</span>
<h1 id="page-title">${p.h1}</h1>
<p class="lead">${p.lead}</p>
<div class="hero-ctas"><a class="btn btn-primary" href="#contact">Book a Free AI Audit</a><a class="btn btn-outline" href="${p.cta2_url || "/#assessment"}">${p.cta2 || "Check your AI readiness"}</a></div>
</div>
<aside class="facts" aria-labelledby="facts-title"><h2 id="facts-title">${p.facts_title || "At a glance"}</h2><ul>${facts}</ul></aside>
</div>
</div>
</section>
<section class="content" aria-label="Page content">
<div class="wrap content-grid">
<article class="prose">
<div class="answer-box"><h3>${p.answer_q}</h3><p>${p.answer}</p></div>
${body}
<h2 id="faq">Frequently asked questions</h2>
<div class="faq" style="margin:0">${faqs}</div>
</article>
<div class="aside">
<nav class="toc" aria-label="On this page"><h2>On this page</h2><ol id="toc-list"></ol></nav>
<div class="aside-cta"><h2>Free 30-minute AI audit</h2><p>We map your workflows and show where AI pays back first.</p><a class="btn btn-primary" href="#contact">Book my audit</a></div>
</div>
</div>
</section>
<section class="related" aria-labelledby="related-title">
<div class="wrap">
<div class="section-head"><span class="label">Keep exploring</span><h2 id="related-title">${p.related_title || "Related services"}</h2></div>
<ul class="ind-list">${related}</ul>
</div>
</section>
${contact(p.cta_h || "Ready to see what AI could take off your plate?", p.cta_p || "Free 30-minute AI audit. We look at your workflows and tell you honestly where AI will and won’t pay off.")}
</main>
${FOOTER}
<script src="/site.js" defer></script>
</body>
</html>
`;
}
fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(OUT, {recursive: true});
const SKIP = /^(build\.js|content-.*\.json|package\.json|vercel\.json|README\.md|dist|node_modules|\..*)$/;
for (const f of fs.readdirSync(ROOT)) {
  if (SKIP.test(f) || fs.statSync(path.join(ROOT, f)).isDirectory()) continue;
  fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
const urls = ["/", "/ai-consulting/", "/ai-automation/", "/ai-agents/", "/ai-development/", "/locations/melbourne/"];
const OVR = {"/ai-agents/ai-receptionist/":{"title":"AI Receptionist Australia | 24/7 Phone Answering | Crenosoft"},"/ai-agents/ai-voice-agent/":{"title":"AI Voice Agent Australia | AI Phone Calls | Crenosoft","desc":"AI voice agents for Australian businesses: natural phone calls for reminders, quote follow-ups, lead qualification and support, with handover to staff.","body_append":"<h2>AI voice agent use cases by industry</h2><p>Clinics use voice agents to confirm tomorrow’s appointments and fill late cancellations from a waitlist. Trades businesses use them to follow up every quote within two days and book site visits. Real estate agencies call new enquiries to qualify buyers and book inspections. Professional services firms use them to chase missing documents before deadlines such as end of financial year. In each case the agent handles the routine conversation, and your team steps in only when a caller wants a person or the conversation goes outside the agreed script.</p><p>If you are weighing up several AI projects, our <a href=\"/ai-consulting/ai-readiness-assessment/\">AI Readiness Assessment</a> helps you decide whether voice should come first.</p>"}};
let built = 0;
for (const f of fs.readdirSync(ROOT).filter(f => /^content-.*\.json$/.test(f)).sort()) {
  const p = JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
  const o = OVR[p.path];
  if (o) { if (o.body_append) p.body += o.body_append; Object.keys(o).forEach(k => { if (k !== "body_append") p[k] = o[k]; }); }
  const dir = path.join(OUT, p.path.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, "index.html"), render(p));
  if (!urls.includes(p.path)) urls.push(p.path);
  built++;
}
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${DOMAIN}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
console.log(`Built ${built} content pages, sitemap has ${urls.length} URLs`);
})();
