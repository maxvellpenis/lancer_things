// Лист пилота «Лансеровские штучки» для системы Lancer (Foundry VTT 13)
import { RU, MOD, esc, sgn, fmt, asset, MANU, MANU_FULL, MANU_ORDER, MANU_COL, ruName, lidOf, packDocs, chat } from "./util.mjs";

const PILOT_PACK = "world.pilot-items", MECH_PACK = "world.mech-items";
const HASE = [["hull", "Корпус", "К"], ["agi", "Маневренность", "М"], ["sys", "Системы", "С"], ["eng", "Инженерия", "И"]];
const HASE_FX = {
  hull: v => `ПЗ +${2 * v}, Лимит Ремонта +${Math.floor(v / 2)}`,
  agi: v => `Уклонение +${v}, Скорость +${Math.floor(v / 2)}`,
  sys: v => `Э-Защита +${v}, Тех. Атака +${v}, СП +${Math.floor(v / 2)}`,
  eng: v => `Тепл. Макс. +${v}, доп. заряды +${Math.floor(v / 2)}`,
};
const TABS = [["pilot", "Пилот"], ["mechs", "Мехи"], ["combat", "Бой"], ["char", "Персонаж"]];

export class LsPilotSheet extends foundry.applications.sheets.ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["ls-sheet", "ls-pilot"],
    position: { width: 940, height: 820 },
    window: { resizable: true },
  };
  tab = "pilot";
  open = {};

  /* ---------- данные ---------- */
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const [skills, talents, licenses, cbs, reserves, frames, weapons, systems, mods] = await Promise.all([
      packDocs(PILOT_PACK, "skill"), packDocs(PILOT_PACK, "talent"), packDocs(PILOT_PACK, "license"), packDocs(PILOT_PACK, "core_bonus"),
      packDocs(PILOT_PACK, "reserve"), packDocs(MECH_PACK, "frame"), packDocs(MECH_PACK, "mech_weapon"), packDocs(MECH_PACK, "mech_system"),
      packDocs(MECH_PACK, "weapon_mod"),
    ]);
    Object.assign(ctx, { skills, talents, licenses, cbs, reserves, frames, weapons, systems, mods });
    return ctx;
  }
  get pilot() { return this.document; }
  owned(type) { return this.document.items.filter(i => i.type === type); }
  ownedBy(type, lid) { return this.document.items.find(i => i.type === type && lidOf(i) === lid); }

  budgets() {
    const a = this.document, ll = a.system.level || 0;
    const sum = (t) => this.owned(t).reduce((s, i) => s + (i.system.curr_rank || 0), 0);
    return {
      sk: { used: sum("skill"), max: 4 + ll, l: "Навыки-триггеры" },
      tl: { used: sum("talent"), max: 3 + ll, l: "Ранги талантов" },
      hs: { used: HASE.reduce((s, [k]) => s + (a.system[k] || 0), 0), max: 2 + ll, l: "Навыки меха" },
      lc: { used: sum("license"), max: ll, l: "Ранги лицензий" },
      cb: { used: this.owned("core_bonus").length, max: Math.floor(ll / 3), l: "Бонусы ядра" },
    };
  }

  /* ---------- отрисовка ---------- */
  async _renderHTML(ctx, options) {
    const a = this.document, s = a.system, B = this.budgets();
    const bud = b => `<span class="ls-bud ${b.used > b.max ? "over" : b.used === b.max ? "full" : ""}">${esc(b.l)}: <b>${b.used}/${b.max}</b></span>`;
    const head = `<header class="ls-head">
      <img class="ls-portrait" src="${esc(a.img)}" data-ls="img" title="Сменить портрет">
      <div class="ls-names"><input class="ls-big" data-lsf="name" value="${esc(a.name)}" placeholder="Имя пилота">
        <input class="ls-cs" data-lsf="system.callsign" value="${esc(s.callsign)}" placeholder="Позывной"></div>
      <div class="ls-ll"><span>Уровень лицензии</span><div><button type="button" class="ls-pm" data-ls="ll" data-d="-1">−</button><b>${s.level}</b><button type="button" class="ls-pm" data-ls="ll" data-d="1">+</button></div>
        <span class="ls-muted">Стойкость ${sgn(s.grit ?? Math.ceil((s.level || 0) / 2))}</span></div>
    </header>
    <div class="ls-buds">${Object.values(B).map(bud).join("")}</div>
    <nav class="ls-tabs">${TABS.map(([k, l]) => `<button type="button" class="ls-tab ${this.tab === k ? "on" : ""}" data-ls="tab" data-v="${k}">${l}</button>`).join("")}</nav>`;
    let body = "";
    if (this.tab === "pilot") body = this.renderPilot(ctx);
    else if (this.tab === "mechs") body = this.renderMechs(ctx);
    else if (this.tab === "combat") body = this.renderCombat(ctx);
    else body = `<p class="ls-muted">Вкладка «Персонаж» (Киберпанк RED) появится на этапе 5.</p>`;
    return `<div class="ls-root">${head}<section class="ls-body">${body}</section></div>`;
  }
  _replaceHTML(result, content, options) {
    const sc = content.querySelector(".ls-body")?.scrollTop ?? 0, top = content.scrollTop;
    content.innerHTML = result;
    const b = content.querySelector(".ls-body");
    if (b) b.scrollTop = sc;
    content.scrollTop = top;
  }

  renderPilot(ctx) {
    const a = this.document, s = a.system;
    const stats = `<div class="ls-stats">${[["ПЗ", `${s.hp?.value ?? "—"}/${s.hp?.max ?? "—"}`], ["Броня", s.armor ?? 0], ["Уклонение", s.evasion ?? 10], ["Э-Защита", s.edef ?? 10], ["Скорость", s.speed ?? 4], ["Спасбросок", s.save ?? 10]]
      .map(([l, v]) => `<div><span>${l}</span><b>${esc(v)}</b></div>`).join("")}</div>`;
    return `${stats}${this.renderBackground()}${this.renderSkills(ctx)}${this.renderHase()}${this.renderTalents(ctx)}${this.renderLicenses(ctx)}${this.renderCbs(ctx)}${this.renderReserves(ctx)}`;
  }
  renderBackground() {
    const cur = this.document.getFlag(MOD, "bg") || "";
    const bg = RU.backgrounds.find(b => b.id === cur);
    return `<h2>Предыстория</h2><div class="ls-row"><select data-ls="bg"><option value="">— выбрать —</option>${RU.backgrounds.map(b => `<option value="${b.id}" ${b.id === cur ? "selected" : ""}>${esc(b.n)}</option>`).join("")}</select>
      <button type="button" class="ls-btn" data-ls="bgroll">🎲 1d20</button>${bg ? `<span class="ls-muted">Триггеры: ${esc(bg.trig)}</span>` : ""}</div>${bg ? `<p class="ls-txt">${fmt(bg.t)}</p>` : ""}`;
  }
  pips(n, max, act, id) {
    let h = "";
    for (let i = 1; i <= max; i++) h += `<button type="button" class="ls-pip ${i <= n ? "on" : ""}" data-ls="${act}" data-v="${esc(id)}" data-r="${i === n ? i - 1 : i}" title="${i === n ? "снять ранг" : "ранг " + i}">${"I".repeat(i)}</button>`;
    return h;
  }
  renderSkills(ctx) {
    const known = new Set(ctx.skills.map(lidOf));
    const rows = ctx.skills.map(d => {
      const lid = lidOf(d), it = this.ownedBy("skill", lid), r = it ? it.system.curr_rank : 0, ru = RU.skills[lid];
      return `<div class="ls-prow ${r ? "sel" : ""}"><span class="ls-pn" title="${esc(ru?.t || "")}">${esc(ru?.n || d.name)}</span>
        <span class="ls-pp">${this.pips(r, 3, "skill", lid)}<span class="ls-bonus">${r ? "+" + r * 2 : ""}</span>${r ? `<button type="button" class="ls-roll" data-ls="skroll" data-v="${it.id}">d20${sgn(r * 2)}</button>` : ""}</span></div>`;
    }).join("");
    const custom = this.owned("skill").filter(i => !known.has(lidOf(i))).map(i => `<div class="ls-prow sel"><input class="ls-pin" data-lsi="${i.id}" data-k="name" value="${esc(i.name)}">
        <span class="ls-pp">${this.pips(i.system.curr_rank, 3, "cskill", i.id)}<span class="ls-bonus">+${i.system.curr_rank * 2}</span><button type="button" class="ls-roll" data-ls="skroll" data-v="${i.id}">d20${sgn(i.system.curr_rank * 2)}</button><button type="button" class="ls-x" data-ls="del" data-v="${i.id}">✕</button></span></div>`).join("");
    return `<h2>Навыки-триггеры</h2>${ctx.skills.length ? "" : this.noPack()}<div class="ls-plist">${rows}${custom}</div><button type="button" class="ls-btn" data-ls="cskilladd">＋ Свой триггер</button>`;
  }
  renderHase() {
    const s = this.document.system;
    return `<h2>Навыки меха (КМСИ)</h2><div class="ls-hase">${HASE.map(([k, l, sh]) => `<div class="ls-hs"><div class="ls-hl" title="${esc(l)}">${esc(l)}</div>
      <div class="ls-hctl"><button type="button" class="ls-pm" data-ls="hase" data-v="${k}" data-d="-1">−</button><b>${s[k] || 0}</b><button type="button" class="ls-pm" data-ls="hase" data-v="${k}" data-d="1">+</button></div>
      <div class="ls-muted ls-small">${HASE_FX[k](s[k] || 0)}</div><button type="button" class="ls-roll" data-ls="haseroll" data-v="${k}">d20${sgn(s[k] || 0)}</button></div>`).join("")}</div>`;
  }
  renderTalents(ctx) {
    const rows = ctx.talents.map(d => {
      const lid = lidOf(d), it = this.ownedBy("talent", lid), r = it ? it.system.curr_rank : 0, ru = RU.talents[lid], op = this.open["t:" + lid];
      const ranks = (ru?.r || (d.system.ranks || []).map(x => ({ n: x.name, t: x.description })));
      return `<div class="ls-tal ${r ? "sel" : ""}"><div class="ls-talh"><button type="button" class="ls-tn" data-ls="open" data-v="t:${lid}">${op ? "▾" : "▸"} ${esc(ru?.n || d.name)}</button><span class="ls-pp">${this.pips(r, 3, "talent", lid)}</span></div>
        ${op || r ? `<div class="ls-talb">${ranks.map((x, i) => (op || i < r) ? `<div class="ls-tr ${i < r ? "got" : ""}"><b>${"I".repeat(i + 1)}. ${esc(x.n)}</b><div>${fmt(x.t)}</div></div>` : "").join("")}</div>` : ""}</div>`;
    }).join("");
    return `<h2>Таланты</h2>${ctx.talents.length ? "" : this.noPack()}<div class="ls-tals">${rows}</div>`;
  }
  licenseContents(ctx, key, rank) {
    const out = [];
    const take = (list, k) => list.filter(x => x.system.license === key && x.system.license_level === rank).forEach(x => out.push([k, x]));
    take(ctx.weapons, "w"); take(ctx.systems, "s"); take(ctx.mods, "m");
    if (rank === 2) ctx.frames.filter(f => f.system.license === key || lidOf(f) === key).forEach(f => out.push(["f", f]));
    return out;
  }
  renderLicenses(ctx) {
    const B = this.budgets(), free = B.lc.max - B.lc.used;
    const lics = ctx.licenses.filter(l => (l.system.manufacturer || "") !== "GMS");
    const byM = {};
    lics.forEach(l => { const m = l.system.manufacturer || "?"; (byM[m] = byM[m] || []).push(l); });
    const order = [...MANU_ORDER.filter(m => byM[m]), ...Object.keys(byM).filter(m => !MANU_ORDER.includes(m))];
    const IC = { w: "⚔", s: "⬢", m: "✚", f: "◭" };
    const kindN = { w: "weapons", s: "systems", m: "mods", f: "frames" };
    const card = (l) => {
      const key = l.system.key, own = this.document.items.find(i => i.type === "license" && i.system.key === key), r = own ? own.system.curr_rank : 0;
      const frame = ctx.frames.find(f => lidOf(f) === key), fl = frame ? lidOf(frame) : key, ru = RU.frames[fl];
      const op = this.open["l:" + key], art = RU.art[fl];
      return `<div class="ls-lic ${r ? "has" : ""}"><button type="button" class="ls-ban" data-ls="open" data-v="l:${esc(key)}" ${art ? `style="background-image:linear-gradient(90deg,rgba(10,11,14,.95) 30%,rgba(10,11,14,.35)),url('${asset(art)}')"` : ""}>
          <span class="ls-lt"><small>${esc(MANU[l.system.manufacturer] || l.system.manufacturer)}</small><b>${esc(ru?.n || l.name)}</b>${ru?.role ? `<i>${esc(ru.role)}</i>` : ""}</span>
          <span class="ls-lr">${[1, 2, 3].map(i => `<em class="${i <= r ? "on" : ""}">${"I".repeat(i)}</em>`).join("")}</span></button>
        ${op ? `<div class="ls-licb"><div class="ls-lcols">${[1, 2, 3].map(i => `<div class="ls-lcol ${i <= r ? "got" : "lock"}"><div class="ls-lch">РАНГ ${"I".repeat(i)} ${i <= r ? "✓" : "🔒"}</div>
            ${this.licenseContents(ctx, key, i).map(([k, x]) => `<button type="button" class="ls-lit" data-ls="itemcard" data-pack="${MECH_PACK}" data-v="${x.id}"><span>${IC[k]}</span> ${esc(ruName(kindN[k], lidOf(x), x.name))}</button>`).join("") || '<span class="ls-muted">—</span>'}</div>`).join("")}</div>
          <div class="ls-row"><button type="button" class="ls-btn" data-ls="lic" data-v="${esc(key)}" data-r="${Math.max(0, r - 1)}" ${r ? "" : "disabled"}>− Снять ранг</button>
            <button type="button" class="ls-btn red" data-ls="lic" data-v="${esc(key)}" data-r="${r + 1}" ${r >= 3 ? "disabled" : ""}>＋ Открыть ранг ${"I".repeat(Math.min(3, r + 1))}${free <= 0 && r < 3 ? " (нет свободных рангов)" : ""}</button></div></div>` : ""}</div>`;
    };
    return `<h2>Лицензии <span class="ls-muted ls-small">ДМС доступны всегда · свободно рангов: ${Math.max(0, free)}</span></h2>${ctx.licenses.length ? "" : this.noPack()}
      ${order.map(m => `<div class="ls-man" style="--mc:${MANU_COL[m] || "#666"}"><div class="ls-mh">${RU.logo[m] ? `<img src="${asset(RU.logo[m])}">` : "◆"} ${esc(MANU_FULL[m] || m)}</div>${byM[m].sort((x, y) => x.name.localeCompare(y.name)).map(card).join("")}</div>`).join("")}`;
  }
  licRanksOf(m) { return this.owned("license").filter(l => l.system.manufacturer === m).reduce((s, l) => s + (l.system.curr_rank || 0), 0); }
  renderCbs(ctx) {
    const byM = {};
    ctx.cbs.forEach(c => { const m = c.system.manufacturer || "GMS"; (byM[m] = byM[m] || []).push(c); });
    const B = this.budgets();
    const order = [...MANU_ORDER.filter(m => byM[m]), ...Object.keys(byM).filter(m => !MANU_ORDER.includes(m))];
    return `<h2>Бонусы ядра <span class="ls-muted ls-small">по одному на УЛ 3, 6, 9, 12; для производителя (кроме ДМС) нужно 3 ранга его лицензий на каждый бонус</span></h2>
      ${order.map(m => { const own = this.owned("core_bonus").filter(c => (c.system.manufacturer || "GMS") === m).length, need = m === "GMS" ? 0 : (own + 1) * 3, have = this.licRanksOf(m);
        return `<div class="ls-cbm"><div class="ls-cbh" style="--mc:${MANU_COL[m] || "#666"}">${esc(MANU_FULL[m] || m)} ${m !== "GMS" ? `<span class="ls-muted ls-small">рангов лицензий ${have}</span>` : ""}</div>
          ${byM[m].map(c => { const lid = lidOf(c), on = !!this.ownedBy("core_bonus", lid), ru = RU.cbs[lid], ok = on || (B.cb.used < B.cb.max && have >= need);
            return `<div class="ls-cb ${on ? "on" : ""} ${ok ? "" : "lock"}"><label><input type="checkbox" data-ls="cb" data-v="${esc(lid)}" ${on ? "checked" : ""}> <b>${esc(ru?.n || c.name)}</b></label><div class="ls-txt">${fmt(ru?.t || c.system.effect || "")}</div></div>`; }).join("")}</div>`; }).join("")}`;
  }
  renderReserves(ctx) {
    const own = this.owned("reserve");
    return `<h2>Резервы</h2>${own.map(i => { const ru = RU.reserves[lidOf(i)]; return `<div class="ls-res"><b>${esc(ru?.n || i.name)}</b> <button type="button" class="ls-x" data-ls="del" data-v="${i.id}">✕</button><div class="ls-txt">${fmt(ru?.t || i.system.description || "")}</div></div>`; }).join("") || '<p class="ls-muted">Нет</p>'}
      <div class="ls-row"><select data-ls-sel="res">${ctx.reserves.map(r => `<option value="${r.id}">${esc(ruName("reserves", lidOf(r), r.name))}</option>`).join("")}</select><button type="button" class="ls-btn" data-ls="resadd">＋ Резерв</button></div>`;
  }
  myMechs() {
    const me = this.document;
    return game.actors.filter(m => m.type === "mech" && (m.system.pilot?.id === me.uuid || m.system.pilot?.value?.id === me.id));
  }
  renderMechs(ctx) {
    const aid = this.document.system.active_mech?.value?.id ?? null;
    return `<h2>Мехи пилота</h2>${this.myMechs().map(m => `<div class="ls-mechrow ${m.id === aid ? "on" : ""}"><img src="${esc(m.img)}"><b>${esc(m.name)}</b><span class="ls-muted">${esc(ruName("frames", lidOf(m.system.loadout?.frame?.value), m.system.loadout?.frame?.value?.name || "без рамы"))}</span>
        ${m.id === aid ? '<span class="ls-tagon">активный</span>' : `<button type="button" class="ls-btn" data-ls="mechact" data-v="${m.id}">Сделать активным</button>`}
        <button type="button" class="ls-btn" data-ls="mechopen" data-v="${m.id}">Открыть</button></div>`).join("") || '<p class="ls-muted">Мехов пока нет.</p>'}
      <button type="button" class="ls-btn red" data-ls="mechnew">＋ Новый мех</button>
      <p class="ls-muted ls-small">Сборка меха в стиле «Лансеровских штучек» — этап 2.</p>`;
  }
  renderCombat(ctx) {
    const s = this.document.system;
    return `<h2>Пилот вне меха</h2><div class="ls-row"><span>ПЗ</span><button type="button" class="ls-pm" data-ls="hp" data-d="-1">−</button><b>${s.hp?.value ?? 0}/${s.hp?.max ?? 0}</b><button type="button" class="ls-pm" data-ls="hp" data-d="1">+</button></div>
      <p class="ls-muted ls-small">Полная автоматизация боя — этап 3.</p>`;
  }
  noPack() { return `<p class="ls-warn">Компендиум системы Lancer не найден: откройте «LANCER Compendium Manager» и импортируйте книги.</p>`; }

  /* ---------- действия ---------- */
  _onFirstRender(ctx, options) {
    super._onFirstRender?.(ctx, options);
    this.element.addEventListener("click", ev => this.#onClick(ev));
    this.element.addEventListener("change", ev => this.#onChange(ev));
  }
  async #fromPack(packId, id) { const p = game.packs.get(packId); return p ? p.getDocument(id) : null; }
  async #addFromPack(doc, extra) {
    const obj = doc.toObject(); delete obj._id;
    if (extra) foundry.utils.mergeObject(obj, extra);
    return this.document.createEmbeddedDocuments("Item", [obj]);
  }
  async #setRank(type, lid, r, list) {
    const it = this.ownedBy(type, lid);
    if (r <= 0) { if (it) await it.delete(); return; }
    if (it) return it.update({ "system.curr_rank": r });
    const d = list.find(x => lidOf(x) === lid);
    if (d) await this.#addFromPack(d, { system: { curr_rank: r } });
  }
  async #onClick(ev) {
    const b = ev.target.closest("[data-ls]");
    if (!b || b.disabled || b.tagName === "SELECT" || (b.tagName === "INPUT" && b.type !== "checkbox" && b.type !== "button")) return;
    if (b.tagName === "INPUT" && b.type === "checkbox") return; // обрабатывается в change
    ev.preventDefault();
    const a = this.document, act = b.dataset.ls, v = b.dataset.v, d = +b.dataset.d || 0, r = +b.dataset.r || 0;
    if (act === "tab") { this.tab = v; return this.render(); }
    if (act === "open") { this.open[v] = !this.open[v]; return this.render(); }
    if (act === "mechopen") return game.actors.get(v)?.sheet.render(true);
    if (act === "itemcard") { const doc = await this.#fromPack(b.dataset.pack, v); if (doc) doc.sheet.render(true); return; }
    if (!this.isEditable) return;
    const ctx = await this._prepareContext({});
    switch (act) {
      case "img": return new foundry.applications.apps.FilePicker.implementation({ type: "image", current: a.img, callback: p => a.update({ img: p }) }).browse();
      case "ll": return a.update({ "system.level": Math.max(0, Math.min(12, (a.system.level || 0) + d)) });
      case "hase": return a.update({ [`system.${v}`]: Math.max(0, Math.min(6, (a.system[v] || 0) + d)) });
      case "hp": return a.update({ "system.hp.value": Math.max(0, Math.min(a.system.hp.max, a.system.hp.value + d)) });
      case "skill": return this.#setRank("skill", v, r, ctx.skills);
      case "cskill": { const it = a.items.get(v); if (!it) return; return r <= 0 ? it.delete() : it.update({ "system.curr_rank": r }); }
      case "cskilladd": return a.createEmbeddedDocuments("Item", [{ name: "Свой триггер", type: "skill", system: { lid: "sk_ls_" + foundry.utils.randomID(8), curr_rank: 1, description: "" } }]);
      case "talent": return this.#setRank("talent", v, r, ctx.talents);
      case "del": return a.items.get(v)?.delete();
      case "skroll": { const it = a.items.get(v); if (it?.beginSkillFlow) return it.beginSkillFlow(); return; }
      case "haseroll": { if (a.beginStatFlow) return a.beginStatFlow(`system.${v}`, HASE.find(h => h[0] === v)[1]); return; }
      case "bgroll": { const roll = await new Roll("1d20").evaluate(); const i = (roll.total - 1) % RU.backgrounds.length; const bg = RU.backgrounds[i];
        await this.#setBg(bg.id); await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: a }), flavor: `<b>Предыстория:</b> ${esc(bg.n)}` }); return; }
      case "lic": {
        const lic = ctx.licenses.find(l => l.system.key === v);
        const own = a.items.find(i => i.type === "license" && i.system.key === v);
        if (r <= 0) return own?.delete();
        if (own) return own.update({ "system.curr_rank": r });
        if (lic) return this.#addFromPack(lic, { system: { curr_rank: r } });
        return;
      }
      case "mechact": { const m = game.actors.get(v); if (m) return a.update({ "system.active_mech": m.uuid }); return; }
      case "mechnew": {
        if (!game.user.can("ACTOR_CREATE")) return ui.notifications.warn("У вас нет права создавать актёров — попросите ГМа.");
        const m = await Actor.create({ name: (a.system.callsign || a.name) + " — мех", type: "mech", system: { pilot: a.uuid }, ownership: a.ownership });
        if (m) { await a.update({ "system.active_mech": m.uuid }); m.sheet.render(true); }
        return;
      }
      case "resadd": { const sel = this.element.querySelector('[data-ls-sel="res"]'); const doc = ctx.reserves.find(x => x.id === sel?.value); if (doc) return this.#addFromPack(doc); return; }
    }
  }
  async #setBg(id) {
    const bg = RU.backgrounds.find(b => b.id === id);
    await this.document.update({ [`flags.${MOD}.bg`]: id, "system.background": bg ? `<p><b>${esc(bg.n)}</b></p><p>${fmt(bg.t)}</p>` : "" });
  }
  async #onChange(ev) {
    const t = ev.target, a = this.document;
    if (!this.isEditable) return;
    if (t.dataset.lsf) return a.update({ [t.dataset.lsf]: t.value });
    if (t.dataset.lsi) return a.items.get(t.dataset.lsi)?.update({ [t.dataset.k]: t.value });
    if (t.dataset.ls === "bg") return this.#setBg(t.value);
    if (t.dataset.ls === "cb") {
      const ctx = await this._prepareContext({});
      const own = this.ownedBy("core_bonus", t.dataset.v);
      if (t.checked && !own) { const d = ctx.cbs.find(x => lidOf(x) === t.dataset.v); if (d) await this.#addFromPack(d); }
      else if (!t.checked && own) await own.delete();
    }
  }
}
