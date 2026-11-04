(function(){
  "use strict";
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* Mobile menu */
  var mt = document.querySelector(".menu-toggle"), nl = document.getElementById("nav-links");
  if (mt && nl) {
    mt.addEventListener("click", function(){ var o = nl.classList.toggle("open"); mt.setAttribute("aria-expanded", o); });
    Array.prototype.forEach.call(nl.querySelectorAll("a"), function(a){ a.addEventListener("click", function(){ nl.classList.remove("open"); mt.setAttribute("aria-expanded","false"); }); });
  }

  /* Table of contents from the article's H2s */
  var toc = document.getElementById("toc-list"), prose = document.querySelector(".prose");
  if (toc && prose) {
    var hs = prose.querySelectorAll("h2[id]");
    Array.prototype.forEach.call(hs, function(h){
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + h.id; a.textContent = h.textContent; li.appendChild(a); toc.appendChild(li);
    });
    if ("IntersectionObserver" in window) {
      var links = toc.querySelectorAll("a");
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if (e.isIntersecting) { Array.prototype.forEach.call(links, function(l){ l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id); }); } });
      }, {rootMargin: "-20% 0px -70% 0px"});
      Array.prototype.forEach.call(hs, function(h){ io.observe(h); });
    }
  }

  /* Audit form */
  var form = document.getElementById("audit-form");
  if (form) form.addEventListener("submit", function(e){
    e.preventDefault();
    var name = form.name.value.trim(), email = form.email.value.trim(), err = document.getElementById("f-error");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.style.display = "block"; (name ? form.email : form.name).focus(); return; }
    err.style.display = "none";
    var payload = {name:name, email:email, company:form.company.value.trim(), phone:form.phone.value.trim(), task:form.task.value.trim(), page:location.pathname};
    var endpoint = form.getAttribute("data-endpoint");
    var send = endpoint ? fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)}).catch(function(){}) : Promise.resolve();
    send.then(function(){
      Array.prototype.forEach.call(form.querySelectorAll(".f-row,.f,button[type=submit]"), function(n){ n.style.display = "none"; });
      document.getElementById("done-name").textContent = name.split(" ")[0];
      document.getElementById("form-done").style.display = "block";
    });
  });

  /* AI chat assistant: Claude in the artifact viewer, /api/chat when deployed, built-in answers otherwise */
  var samplePromise = (window.claude && typeof window.claude.use === "function") ? window.claude.use("sample").catch(function(){ return null; }) : Promise.resolve(null);
  var aiOff = false;
  var fab = document.getElementById("chat-fab"), chat = document.getElementById("chat"), log = document.getElementById("chat-log"),
      cform = document.getElementById("chat-form"), cin = document.getElementById("chat-input"), closeBtn = document.getElementById("chat-close");
  if (!fab || !chat) return;
  var history = [];
  function toggleChat(open){ chat.classList.toggle("open", open); fab.setAttribute("aria-expanded", open); if (open) cin.focus(); }
  fab.addEventListener("click", function(){ toggleChat(!chat.classList.contains("open")); });
  closeBtn.addEventListener("click", function(){ toggleChat(false); fab.focus(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && chat.classList.contains("open")) { toggleChat(false); fab.focus(); } });
  function addMsg(text, who){ var d = document.createElement("div"); d.className = "msg " + who; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  var CONTEXT = "You are the website assistant for Crenosoft, an AI agency based in Melbourne, Victoria, serving businesses across Australia. " +
    "Services: AI Consulting (AI Strategy & Roadmap, AI Readiness Assessment, Generative AI Consulting, AI Training for Teams); AI Automation (Business Process Automation, AI Workflow Automation with n8n/Make/Zapier, CRM Automation, Document & Data Processing); " +
    "AI Agents (AI Agent Development, AI Voice Agent, AI Receptionist, AI Chatbot Development); AI Development (AI App & Software Development, AI Integration, LLM/RAG knowledge-base bots, Dedicated AI Developers). " +
    "Process: free 30-minute AI audit, written blueprint with a fixed AUD quote, build and test (usually 1 to 6 weeks), then monthly hosting, monitoring and improvement. Systems are designed around the Privacy Act 1988 and the APPs, with a person in the loop. " +
    "The visitor is on the page: " + document.title + ". Rules: answer in 2 to 4 short sentences of plain Australian English. Never invent prices, client names, results or guarantees; pricing is quoted after the free audit. Suggest the free AI audit form when the visitor shows buying interest. Plain text only.";
  function fallbackReply(q){
    q = q.toLowerCase();
    if (/price|cost|how much|quote|\$/.test(q)) return "Every project gets a fixed quote in AUD after a free 30-minute AI audit, because cost depends on the tools involved and the volume of work. Ongoing hosting and improvement is a monthly fee. The audit form is at the bottom of this page.";
    if (/receptionist|call|phone|voice/.test(q)) return "Our AI receptionist answers every call, handles common questions, books appointments into your calendar and texts confirmations. Urgent calls go straight to your team.";
    if (/privacy|data|secure|safe|law/.test(q)) return "We design every system around the Privacy Act 1988 and the Australian Privacy Principles. The AI only sees the data it needs, we use Australian hosting regions where available, and sensitive decisions stay with your team.";
    if (/how long|time|weeks|fast/.test(q)) return "A single automation usually goes live in one to two weeks. A custom AI agent connected to your CRM, calendar and phones usually takes two to six weeks, including testing.";
    if (/where|melbourne|sydney|brisbane|perth|location|office/.test(q)) return "Our team is based in Melbourne and we work with businesses right across Australia. Most projects run remotely, with on-site workshops in Melbourne when they help.";
    return "We build AI agents, AI receptionists, chatbots and workflow automations for Australian businesses. Tell me a task that takes up your team’s week and I’ll suggest how AI could handle it, or book a free AI audit using the form on this page.";
  }
  function askServer(msgs){
    return fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({messages:msgs, page:document.title})})
      .then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ return j && j.reply ? j.reply : null; }).catch(function(){ return null; });
  }
  cform.addEventListener("submit", function(e){
    e.preventDefault();
    var q = cin.value.trim(); if (!q) return;
    cin.value = ""; addMsg(q, "me"); history.push({role:"user", content:q});
    var bot = addMsg("…", "bot");
    var msgs = history.slice(-10).map(function(m){ return {role:m.role, content:m.content}; });
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    (aiOff ? Promise.resolve(null) : samplePromise).then(function(sample){
      if (!sample) return askServer(msgs);
      var m2 = msgs.slice(); m2[0] = {role:"user", content: CONTEXT + "\n\nVisitor: " + m2[0].content};
      return sample(m2, {cache:false, modelTier:"quick", onText:function(p){ bot.textContent = p.text; log.scrollTop = log.scrollHeight; }})
        .then(function(r){ return r.text; }, function(err){ if (err && (err.code === "not_granted" || err.code === "rate_limited")) aiOff = true; return null; });
    }).then(function(text){
      var reply = (text && text.trim()) ? text.trim() : fallbackReply(q);
      bot.textContent = reply; history.push({role:"assistant", content:reply}); log.scrollTop = log.scrollHeight;
    }).catch(function(){ var r = fallbackReply(q); bot.textContent = r; history.push({role:"assistant", content:r}); });
  });
})();
