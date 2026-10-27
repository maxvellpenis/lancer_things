// Лист меха «Лансеровские штучки» для системы Lancer (Foundry VTT 13)
import { RU, MOD, esc, sgn, fmt, asset, MANU, MANU_FULL, MANU_ORDER, MANU_COL, ruName, lidOf, packDocs, tokenImg, pickTokenImg } from "./util.mjs";

const PILOT_PACK = "world.pilot-items", MECH_PACK = "world.mech-items";
const MOUNT_RU = { Main: "Основной", Heavy: "Тяжёлый", Flex: "Гибкий", "Main/Aux": "Основной/Вспом.", "Aux/Aux": "Вспом./Вспом.", Aux: "Вспомогательный", Integrated: "Встроенный", Superheavy: "Сверхтяжёлый", Unknown: "Особый" };
const FIT_RU = { Auxiliary: "вспом.", Main: "осн.", Flex: "гибкий", Heavy: "тяж.", Superheavy: "сверхтяж.", Integrated: "встроенный" };
const WSIZE_RU = { Auxiliary: "Вспом.", Main: "Осн.", Heavy: "Тяж.", Superheavy: "Сверхтяж." };
const WTYPE_RU = { Melee: "ОББ", CQB: "ОБД", Rifle: "Винтовка", Launcher: "ПУ", Cannon: "Пушка", Nexus: "Звено" };
const RNG_RU = { Range: "Дальн.", Threat: "Угроза", Thrown: "Метание", Line: "Линия", Cone: "Конус", Blast: "Взрыв", Burst: "Разрыв" };
const DMG_RU = { Kinetic: "кин.", Energy: "энерг.", Explosive: "взр.", Burn: "горения", Heat: "нагрева", Variable: "на выбор" };
const SYS_TYPE_RU = { System: "Система", AI: "ИИ", Shield: "Щит", Deployable: "Развёртываемое", Drone: "Дрон", Tech: "Технология", Armor: "Броня", "Flight System": "Полёт", Integrated: "Встроенное", Mod: "Мод" };
/* какой размер оружия влезает в какой тип слота */
const FITS = { Auxiliary: ["Auxiliary"], Main: ["Auxiliary", "Main"], Flex: ["Auxiliary", "Main"], Heavy: ["Auxiliary", "Main", "Heavy", "Superheavy"], Superheavy: ["Auxiliary", "Main", "Heavy", "Superheavy"], Integrated: ["Auxiliary"] };
const FITM = { Aux: ["Auxiliary"], "Aux/Aux": ["Auxiliary", "Auxiliary"], Flex: ["Flex", "Auxiliary"], Main: ["Main"], "Main/Aux": ["Main", "Auxiliary"], Heavy: ["Heavy"], Superheavy: ["Superheavy"], Integrated: ["Integrated"], Unknown: ["Integrated"] };
const TABS = [["build", "Сборка"], ["combat", "Бой"], ["notes", "Заметки"]];
const IC = { w: "⚔", s: "⬢", m: "✚", f: "◭" };

const tagTxt = t => { const r = RU.tags[t.lid]; return r ? r.n.replace("{VAL}", t.val ?? "X") : (t.name || t.lid).replace("{VAL}", t.val ?? "X"); };
const tagTip = t => RU.tags[t.lid]?.d || t.description || "";
const tagsHtml = tags => (tags || []).filter(t => t && !t.hidden && t.lid !== "tg_round").map(t => `<span class="ls-tag" title="${esc(tagTip(t))}">${esc(tagTxt(t))}</span>`).join("");
const prof = w => w.system.active_profile || w.system.profiles?.[w.system.selected_profile_index || 0] || w.system.profiles?.[0] || {};
const dmgTxt = d => (d || []).map(x => `${x.val} ${DMG_RU[x.type] || x.type}`).join(" + ");
const rngTxt = r => (r || []).map(x => `${RNG_RU[x.type] || x.type} ${x.val}`).join(", ");
const html2txt = h => String(h || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p>/gi, "\n").replace(/<[^>]+>/g, "").trim();
const isInt = lid => /_integrated$/.test(lid || "");

export class LsMechSheet extends foundry.applications.sheets.ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["ls-sheet", "ls-mech"],
    position: { width: 960, height: 860 },
    window: { resizable: true },
  };
  tab = "build";
  open = {};
  /** без пилота лицензии не проверяем — показываем всё */
  get showAll() { return !this.pilot; }
  pickFrame = false;
  busy = false;

  /* ---------- данные ---------- */
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const [frames, weapons, systems, mods, talents] = await Promise.all([
      packDocs(MECH_PACK, "frame"), packDocs(MECH_PACK, "mech_weapon"), packDocs(MECH_PACK, "mech_system"), packDocs(MECH_PACK, "weapon_mod"), packDocs(PILOT_PACK, "talent"),
    ]);
    // встроенное в рамы/таланты — не показываем в общих списках
    const hidden = new Set();
    frames.forEach(f => { (f.system.core_system?.integrated || []).forEach(l => hidden.add(l)); (f.system.traits || []).forEach(t => (t.integrated || []).forEach(l => hidden.add(l))); });
    talents.forEach(t => (t.system.ranks || []).forEach(r => (r.integrated || []).forEach(l => hidden.add(l))));
    Object.assign(ctx, { frames, weapons, systems, mods, hidden });
    return ctx;
  }
  get mech() { return this.document; }
  get pilot() { return this.document.system.pilot?.value ?? null; }
  get frame() { return this.document.system.loadout?.frame?.value ?? null; }
  licRanks() {
    const r = {};
    (this.pilot?.items || []).forEach(i => { if (i.type === "license") r[i.system.key] = Math.max(r[i.system.key] || 0, i.system.curr_rank || 0); });
    return r;
  }
  allowed(doc, R = this.licRanks()) {
    const s = doc.system, ll = doc.type === "frame" ? (s.license_level ?? 2) : (s.license_level || 0);
    if (!ll || s.manufacturer === "GMS") return true;
    return (R[s.license] || 0) >= ll;
  }
  visible(doc, ctx, R) { return !ctx.hidden.has(lidOf(doc)) && !isInt(lidOf(doc)) && (this.showAll || this.allowed(doc, R)); }
  srcMounts() { return foundry.utils.deepClone(this.document.system._source.loadout.weapon_mounts || []); }
  equippedIds() {
    const ids = new Set(), ld = this.document.system._source.loadout;
    if (ld.frame) ids.add(ld.frame);
    (ld.systems || []).forEach(x => x && ids.add(x));
    (ld.weapon_mounts || []).forEach(m => m.slots.forEach(s => { if (s.weapon) ids.add(s.weapon); if (s.mod) ids.add(s.mod); }));
    return ids;
  }

  /* ---------- отрисовка ---------- */
  async _renderHTML(ctx, options) {
    const a = this.document, s = a.system, f = this.frame, fl = lidOf(f), rf = RU.frames[fl], p = this.pilot;
    const sp = s.loadout?.sp || { value: 0, max: 0 };
    const head = `<header class="ls-head ls-mhead" ${RU.art[fl] ? `style="background-image:linear-gradient(90deg,#1d0a0c 35%,rgba(29,10,12,.55)),url('${asset(RU.art[fl])}')"` : ""}>
      <img class="ls-portrait" src="${esc(tokenImg(a))}" data-ls="img" title="Сменить картинку жетона (на столе тоже)">
      <div class="ls-names"><input class="ls-big" data-lsf="name" value="${esc(a.name)}" placeholder="Имя меха">
        <div class="ls-sub">${f ? `<b>${esc(rf?.n || f.name)}</b> · ${esc(MANU[f.system.manufacturer] || f.system.manufacturer || "")}${rf?.role ? " · " + esc(rf.role) : ""}` : '<span class="ls-muted">Рама не выбрана</span>'}</div>
        <div class="ls-sub">Пилот: ${p ? `<button type="button" class="ls-link" data-ls="pilotopen">${esc(p.system.callsign || p.name)}</button>` : `<select data-ls="pilotset"><option value="">— выбрать пилота —</option>${game.actors.filter(x => x.type === "pilot" && x.isOwner).map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>`}</div></div>
      <div class="ls-ll"><span>Системные очки</span><b class="${sp.value > sp.max ? "ls-over" : ""}">${sp.value}/${sp.max}</b></div>
    </header>
    <nav class="ls-tabs">${TABS.map(([k, l]) => `<button type="button" class="ls-tab ${this.tab === k ? "on" : ""}" data-ls="tab" data-v="${k}">${l}</button>`).join("")}</nav>`;
    let body;
    if (this.tab === "build") body = this.renderBuild(ctx);
    else if (this.tab === "combat") body = this.renderCombat(ctx);
    else body = `<h2>Заметки</h2><textarea class="ls-notes" data-lsf="system.notes" rows="20">${esc(html2txt(s.notes))}</textarea>`;
    return `<div class="ls-root">${head}<section class="ls-body">${this.busy ? '<div class="ls-busy">Сохраняю…</div>' : ""}${body}</section></div>`;
  }
  _replaceHTML(result, content, options) {
    const sc = content.querySelector(".ls-body")?.scrollTop ?? 0;
    content.innerHTML = result;
    const b = content.querySelector(".ls-body");
    if (b) b.scrollTop = sc;
  }

  statBlock() {
    const s = this.document.system, grit = this.pilot?.system.grit ?? 0;
    const C = [["ПЗ", s.hp?.max], ["Броня", s.armor], ["Структура", s.structure?.max], ["Нагрузка", s.stress?.max],
      ["Уклонение", s.evasion], ["Э-Защита", s.edef], ["Скорость", s.speed], ["Размер", s.size === 0.5 ? "½" : s.size],
      ["Тепл. Макс.", s.heat?.max], ["Лимит Ремонта", s.repairs?.max], ["Сенсоры", s.sensor_range], ["Спас. Цель", s.save],
      ["Тех. Атака", sgn(s.tech_attack ?? 0)], ["Атака", sgn(grit)], ["СП", s.loadout?.sp?.max], ["Доп. заряды", s.loadout?.limited_bonus ?? 0]];
    return `<div class="ls-mstats">${C.map(([l, v]) => `<div><span>${l}</span><b>${esc(v ?? "—")}</b></div>`).join("")}</div>`;
  }

  /* --- карточки предметов --- */
  weaponCard(w, opts = {}) {
    const lid = lidOf(w), ru = RU.weapons[lid], pr = prof(w), key = "w:" + (opts.k || w.id), op = this.open[key];
    const dmg = pr.all_damage?.length ? pr.all_damage : pr.damage, rng = pr.all_range?.length ? pr.all_range : pr.range, tags = pr.all_tags?.length ? pr.all_tags : pr.tags;
    const txt = ru?.t || [pr.effect, pr.on_attack && "**При атаке:** " + pr.on_attack, pr.on_hit && "**При попадании:** " + pr.on_hit, pr.on_crit && "**При крите:** " + pr.on_crit].filter(Boolean).map(html2txt).join("\n");
    const profs = (w.system.profiles || []).length > 1 ? `<select data-ls="wprof" data-v="${w.id}">${w.system.profiles.map((x, i) => `<option value="${i}" ${i === (w.system.selected_profile_index || 0) ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : "";
    return `<div class="ls-item w ${w.system.destroyed ? "dead" : ""}"><div class="ls-ih"><button type="button" class="ls-in" data-ls="open" data-v="${esc(key)}">${IC.w} ${esc(ru?.n || w.name)}</button>
        <span class="ls-pill">${esc(WSIZE_RU[w.system.size] || w.system.size || "")} ${esc(WTYPE_RU[pr.type] || pr.type || "")}</span>${rng?.length ? `<span class="ls-pill">${esc(rngTxt(rng))}</span>` : ""}${dmg?.length ? `<span class="ls-pill dmg">${esc(dmgTxt(dmg))}</span>` : ""}${w.system.sp ? `<span class="ls-pill">${w.system.sp} СП</span>` : ""}
        ${opts.right || ""}</div>
      ${op ? `<div class="ls-ib">${profs}<div class="ls-tags">${tagsHtml(tags)}</div>${txt ? `<div class="ls-txt">${fmt(txt)}</div>` : ""}<div class="ls-muted ls-small">${esc(w.name)}</div></div>` : ""}</div>`;
  }
  sysCard(x, kind, opts = {}) {
    const lid = lidOf(x), ru = kind === "m" ? RU.mods[lid] : RU.systems[lid], key = kind + ":" + (opts.k || x.id), op = this.open[key];
    const txt = ru?.t || html2txt(x.system.effect || x.system.description || "");
    return `<div class="ls-item ${kind} ${x.system.destroyed ? "dead" : ""}"><div class="ls-ih"><button type="button" class="ls-in" data-ls="open" data-v="${esc(key)}">${IC[kind]} ${esc(ru?.n || x.name)}</button>
        ${x.system.sp ? `<span class="ls-pill">${x.system.sp} СП</span>` : ""}${kind === "s" && x.system.type ? `<span class="ls-pill">${esc(SYS_TYPE_RU[x.system.type] || x.system.type)}</span>` : ""}${opts.right || ""}</div>
      ${op ? `<div class="ls-ib"><div class="ls-tags">${tagsHtml(x.system.tags)}</div>${txt ? `<div class="ls-txt">${fmt(txt)}</div>` : ""}<div class="ls-muted ls-small">${esc(x.name)}</div></div>` : ""}</div>`;
  }
  usesHtml(it) {
    const u = it.system.uses, lim = (it.system.tags || []).some(t => t.lid === "tg_limited");
    let h = "";
    if (lim && u) h += `<span class="ls-uses">заряды <button type="button" class="ls-pm" data-ls="uses" data-v="${it.id}" data-d="-1">−</button><b>${u.value ?? 0}/${u.max ?? 0}</b><button type="button" class="ls-pm" data-ls="uses" data-v="${it.id}" data-d="1">+</button></span>`;
    if ((it.system.tags || []).some(t => t.lid === "tg_loading")) h += `<button type="button" class="ls-chip ${it.system.loaded ? "on" : ""}" data-ls="loaded" data-v="${it.id}">${it.system.loaded ? "заряжено" : "разряжено"}</button>`;
    h += `<button type="button" class="ls-chip ${it.system.destroyed ? "bad" : ""}" data-ls="destroyed" data-v="${it.id}" title="Уничтожено">${it.system.destroyed ? "уничтожено" : "цело"}</button>`;
    return h;
  }

  /* --- вкладка «Сборка» --- */
  frameGrid(ctx) {
    const R = this.licRanks(), cur = lidOf(this.frame);
    const list = ctx.frames.filter(f => this.showAll || this.allowed(f, R) || lidOf(f) === cur);
    const byM = {};
    list.forEach(f => { const m = f.system.manufacturer || "?"; (byM[m] = byM[m] || []).push(f); });
    const order = [...MANU_ORDER.filter(m => byM[m]), ...Object.keys(byM).filter(m => !MANU_ORDER.includes(m))];
    return order.map(m => `<div class="ls-man" style="--mc:${MANU_COL[m] || "#666"}"><div class="ls-mh">${RU.logo[m] ? `<img src="${asset(RU.logo[m])}">` : "◆"} ${esc(MANU_FULL[m] || m)}</div><div class="ls-fgrid">${byM[m].sort((x, y) => (RU.frames[lidOf(x)]?.n || x.name).localeCompare(RU.frames[lidOf(y)]?.n || y.name)).map(f => {
      const l = lidOf(f), r = RU.frames[l], ok = this.allowed(f, R);
      return `<button type="button" class="ls-fcard ${l === cur ? "on" : ""} ${ok ? "" : "lock"}" data-ls="frame" data-v="${f.id}" ${RU.art[l] ? `style="background-image:linear-gradient(0deg,rgba(10,11,14,.95) 25%,rgba(10,11,14,.1)),url('${asset(RU.art[l])}')"` : ""}>
        <b>${esc(r?.n || f.name)}</b><i>${esc(r?.role || "")}</i>${ok ? "" : "<small>⚠ нет лицензии</small>"}</button>`;
    }).join("")}</div></div>`).join("");
  }
  frameInfo() {
    const f = this.frame; if (!f) return "";
    const r = RU.frames[lidOf(f)], cs = f.system.core_system || {};
    const traits = r?.tr?.length ? r.tr : (f.system.traits || []).map(t => ({ n: t.name, t: html2txt(t.description) }));
    const c = r?.core || { n: cs.name, pn: cs.passive_name, pt: html2txt(cs.passive_effect), an: cs.active_name, at: html2txt(cs.active_effect), ag: "" };
    return `<h2>Черты рамы</h2>${traits.map(t => `<div class="ls-trait"><b>${esc(t.n)}</b><div class="ls-txt">${fmt(t.t)}</div></div>`).join("")}
      <h2>Система ядра — ${esc(c.n || "")}</h2>${c.pn && c.pt ? `<div class="ls-trait"><b>${esc(c.pn)}</b> <span class="ls-muted">(пассивно)</span><div class="ls-txt">${fmt(c.pt)}</div></div>` : ""}
      ${c.an ? fmt("⟦A:c⟧" + c.an + "⟦T⟧" + (c.ag || "Активное (1 Мощь Ядра)") + "⟦E⟧" + c.at + "⟦Z⟧") : ""}`;
  }
  weaponOptions(ctx, sizes, curId, R) {
    const a = this.document, eq = this.equippedIds();
    const store = a.items.filter(i => i.type === "mech_weapon" && !eq.has(i.id) && sizes.includes(i.system.size));
    const list = ctx.weapons.filter(w => sizes.includes(w.system.size) && this.visible(w, ctx, R));
    const byM = {};
    list.forEach(w => { const m = w.system.manufacturer || "?"; (byM[m] = byM[m] || []).push(w); });
    const order = [...MANU_ORDER.filter(m => byM[m]), ...Object.keys(byM).filter(m => !MANU_ORDER.includes(m))];
    const lab = w => `${esc(ruName("weapons", lidOf(w), w.name))} · ${esc(WSIZE_RU[w.system.size] || "")} ${esc(WTYPE_RU[prof(w).type] || prof(w).type || "")}`;
    return `<option value="">${curId ? "✕ снять оружие" : "— пусто: выбрать оружие —"}</option>${store.length ? `<optgroup label="Со склада">${store.map(w => `<option value="own:${w.id}">${lab(w)}</option>`).join("")}</optgroup>` : ""}
      ${order.map(m => `<optgroup label="${esc(MANU_FULL[m] || m)}">${byM[m].sort((x, y) => ruName("weapons", lidOf(x), x.name).localeCompare(ruName("weapons", lidOf(y), y.name))).map(w => `<option value="pk:${w.id}">${lab(w)}${this.allowed(w, R) ? "" : " ⚠"}</option>`).join("")}</optgroup>`).join("")}`;
  }
  modOptions(ctx, w, R) {
    const pt = prof(w).type, sz = w.system.size;
    const list = ctx.mods.filter(m => (m.system.allowed_types?.[pt] ?? true) && (m.system.allowed_sizes?.[sz] ?? true) && this.visible(m, ctx, R));
    if (!list.length) return "";
    return list.map(m => `<option value="pk:${m.id}">${esc(ruName("mods", lidOf(m), m.name))} (${m.system.sp} СП)${this.allowed(m, R) ? "" : " ⚠"}</option>`).join("");
  }
  renderMounts(ctx) {
    const a = this.document, R = this.licRanks(), mounts = a.system.loadout.weapon_mounts || [];
    const hasSH = mounts.some(m => m.slots.some(s => s.weapon?.value?.system.size === "Superheavy"));
    return mounts.map((mt, mi) => {
      const fi = this.frameIntegrated();
      if (mt.type === "Integrated" && (fi.includes(lidOf(mt.slots[0]?.weapon?.value)) || isInt(lidOf(mt.slots[0]?.weapon?.value)))) {
        const w = mt.slots[0]?.weapon?.value;
        return `<div class="ls-mount int"><div class="ls-mth">${mi + 1}. Встроенное оружие</div>${w ? this.weaponCard(w, { k: "m" + mi }) : '<span class="ls-muted">—</span>'}</div>`;
      }
      const flexMain = mt.type === "Flex" && mt.slots[0]?.weapon?.value && mt.slots[0].weapon.value.system.size !== "Auxiliary";
      const slots = mt.slots.map((sl, si) => {
        if (flexMain && si > 0) return `<div class="ls-slot ls-muted ls-small">второй слот недоступен: в Гибком слоте стоит основное оружие</div>`;
        const w = sl.weapon?.value, mod = sl.mod?.value, sizes = FITS[sl.size] || [];
        const modOpts = w && !w.system.no_mods ? this.modOptions(ctx, w, R) : "";
        return `<div class="ls-slot"><div class="ls-row"><span class="ls-fit">${esc(FIT_RU[sl.size] || sl.size)}</span>
            <select data-ls="slotw" data-m="${mi}" data-s="${si}">${w ? `<option value="keep" selected>${esc(ruName("weapons", lidOf(w), w.name))}</option>` : ""}${this.weaponOptions(ctx, sizes, w?.id, R)}</select>
            ${w && modOpts ? `<select data-ls="slotm" data-m="${mi}" data-s="${si}">${mod ? `<option value="keep" selected>мод: ${esc(ruName("mods", lidOf(mod), mod.name))}</option><option value="">✕ снять мод</option>` : '<option value="">мод: нет</option>'}${modOpts}</select>` : ""}</div>
          ${w ? this.weaponCard(w, { k: `m${mi}s${si}`, right: this.usesHtml(w) }) : ""}${mod ? this.sysCard(mod, "m", { k: `m${mi}s${si}m` }) : ""}</div>`;
      }).join("");
      return `<div class="ls-mount"><div class="ls-mth">${mi + 1}. ${esc(MOUNT_RU[mt.type] || mt.type)} слот
        ${hasSH || mt.bracing ? `<label class="ls-small"><input type="checkbox" data-ls="brace" data-m="${mi}" ${mt.bracing ? "checked" : ""}> упор для сверхтяжёлого</label>` : ""}</div>${slots}</div>`;
    }).join("");
  }
  validate() {
    const a = this.document, out = [], sp = a.system.loadout?.sp, R = this.licRanks();
    if (!this.frame) return ["Выберите раму."];
    if (sp && sp.value > sp.max) out.push(`Системных очков больше лимита: ${sp.value}/${sp.max}.`);
    const ai = a.system.loadout?.ai_cap; if (ai && ai.value > ai.max) out.push(`Слишком много ИИ: ${ai.value}/${ai.max}.`);
    const ms = a.system.loadout.weapon_mounts || [], bracing = ms.some(m => m.bracing);
    ms.forEach((m, i) => {
      if (m.type === "Integrated") return;
      let n = 0, flexMain = false;
      m.slots.forEach(sl => {
        const w = sl.weapon?.value; if (!w) return; n++;
        if (!(FITS[sl.size] || []).includes(w.system.size)) out.push(`Слот ${i + 1}: ${ruName("weapons", lidOf(w), w.name)} (${WSIZE_RU[w.system.size] || w.system.size}) не влезает в ${FIT_RU[sl.size] || sl.size} слот.`);
        if (sl.size === "Flex" && w.system.size !== "Auxiliary") flexMain = true;
        if (w.system.size === "Superheavy" && !bracing) out.push(`Сверхтяжёлому оружию (${ruName("weapons", lidOf(w), w.name)}) нужен второй слот как упор — отметьте «упор» на другом слоте.`);
      });
      if (flexMain && n > 1) out.push(`Слот ${i + 1}: Гибкий слот — либо одно основное, либо два вспомогательных.`);
    });
    const nolic = [];
    if (this.pilot) for (const it of a.items) if (["frame", "mech_weapon", "mech_system", "weapon_mod"].includes(it.type) && this.equippedIds().has(it.id) && !isInt(lidOf(it)) && !this.allowed(it, R)) nolic.push(RU.frames[lidOf(it)]?.n || RU.weapons[lidOf(it)]?.n || RU.systems[lidOf(it)]?.n || RU.mods[lidOf(it)]?.n || it.name);
    if (nolic.length) out.push("Нет лицензии у пилота: " + nolic.join(", ") + ".");
    const uniq = {}; for (const it of a.items) if (this.equippedIds().has(it.id) && (it.system.tags || []).some(t => t.lid === "tg_unique")) { const l = lidOf(it); uniq[l] = (uniq[l] || 0) + 1; }
    Object.entries(uniq).filter(([, n]) => n > 1).forEach(([l]) => out.push(`Уникальное установлено дважды: ${ruName("systems", l, ruName("weapons", l, l))}.`));
    return out;
  }
  renderBuild(ctx) {
    const a = this.document, R = this.licRanks(), eq = this.equippedIds();
    const v = this.validate();
    if (!ctx.frames.length) return `<p class="ls-warn">Компендиум системы Lancer не найден: откройте «LANCER Compendium Manager» и импортируйте книги.</p>`;
    const frameBlock = (!this.frame || this.pickFrame) ? `<h2>Выбор рамы ${this.frame ? `<button type="button" class="ls-btn" data-ls="pickframe">✕ отмена</button>` : ""}</h2>
        ${this.pilot ? "" : '<p class="ls-muted ls-small">Пилот не выбран — показаны все рамы.</p>'}${this.frameGrid(ctx)}`
      : `<div class="ls-row"><button type="button" class="ls-btn" data-ls="pickframe">◭ Сменить раму</button></div>`;
    if (!this.frame) return frameBlock;
    const sysl = (a.system.loadout.systems || []).map(x => x?.value).filter(Boolean);
    const store = a.items.filter(i => ["mech_weapon", "mech_system", "weapon_mod"].includes(i.type) && !eq.has(i.id));
    const sysAvail = ctx.systems.filter(x => this.visible(x, ctx, R));
    const byM = {};
    sysAvail.forEach(x => { const m = x.system.manufacturer || "?"; (byM[m] = byM[m] || []).push(x); });
    const order = [...MANU_ORDER.filter(m => byM[m]), ...Object.keys(byM).filter(m => !MANU_ORDER.includes(m))];
    const storeSys = store.filter(i => i.type === "mech_system");
    const sp = a.system.loadout?.sp || { value: 0, max: 0 };
    return `${frameBlock}
      ${v.length ? `<div class="ls-warn">${v.map(esc).join("<br>")}</div>` : '<div class="ls-ok">Сборка корректна ✓</div>'}
      ${this.statBlock()}
      <div class="ls-spbar ${sp.value > sp.max ? "over" : ""}">Системные очки: <b>${sp.value} / ${sp.max}</b><div class="ls-meter"><i style="width:${Math.min(100, sp.value / Math.max(1, sp.max) * 100)}%"></i></div></div>
      ${this.frameInfo()}
      <h2>Слоты и оружие <button type="button" class="ls-btn" data-ls="resetmounts" title="Пересобрать слоты по раме и бонусам ядра пилота">↺ слоты по раме</button></h2>
      <div class="ls-mounts">${this.renderMounts(ctx)}</div>
      <h2>Системы <span class="ls-muted ls-small">${sp.value}/${sp.max} СП</span></h2>
      <div class="ls-list">${sysl.map((x, i) => this.sysCard(x, "s", { right: this.usesHtml(x) + `<button type="button" class="ls-x" data-ls="sysdel" data-v="${x.id}" title="Снять систему">✕</button>` })).join("") || '<p class="ls-muted">Систем нет</p>'}</div>
      <div class="ls-row"><select data-ls="sysadd"><option value="">＋ добавить систему…</option>
        ${storeSys.length ? `<optgroup label="Со склада">${storeSys.map(x => `<option value="own:${x.id}">${esc(ruName("systems", lidOf(x), x.name))} · ${x.system.sp} СП</option>`).join("")}</optgroup>` : ""}
        ${order.map(m => `<optgroup label="${esc(MANU_FULL[m] || m)}">${byM[m].sort((x, y) => ruName("systems", lidOf(x), x.name).localeCompare(ruName("systems", lidOf(y), y.name))).map(x => `<option value="pk:${x.id}">${esc(ruName("systems", lidOf(x), x.name))} · ${x.system.sp} СП${this.allowed(x, R) ? "" : " ⚠"}</option>`).join("")}</optgroup>`).join("")}</select></div>
      ${store.length ? `<h2>Склад <span class="ls-muted ls-small">не установлено на мех</span></h2><div class="ls-list">${store.map(x => (x.type === "mech_weapon" ? this.weaponCard(x, { right: `<button type="button" class="ls-x" data-ls="del" data-v="${x.id}">✕</button>` }) : this.sysCard(x, x.type === "weapon_mod" ? "m" : "s", { right: `<button type="button" class="ls-x" data-ls="del" data-v="${x.id}">✕</button>` }))).join("")}</div>` : ""}`;
  }

  /* --- вкладка «Бой» (основа; полная автоматизация — этап 3) --- */
  track(label, path, val, max, extra = "") {
    return `<div class="ls-trk"><span>${label}</span><div><button type="button" class="ls-pm" data-ls="trk" data-p="${path}" data-d="-1">−</button><b>${val ?? 0}${max != null ? "/" + max : ""}</b><button type="button" class="ls-pm" data-ls="trk" data-p="${path}" data-d="1">+</button></div>${extra}</div>`;
  }
  renderCombat(ctx) {
    const a = this.document, s = a.system, f = this.frame;
    const oc = s.overcharge_sequence || ["+1", "+1d3", "+1d6", "+1d6+4"];
    const weapons = (s.loadout.weapon_mounts || []).flatMap(m => m.slots.map(x => x.weapon?.value)).filter(Boolean);
    const sysl = (s.loadout.systems || []).map(x => x?.value).filter(Boolean);
    const btn = (act, l, t = "") => `<button type="button" class="ls-btn" data-ls="${act}" title="${esc(t)}">${l}</button>`;
    return `<div class="ls-trks">
        ${this.track("ПЗ", "system.hp.value", s.hp?.value, s.hp?.max)}${this.track("Сверхщит", "system.overshield.value", s.overshield?.value)}
        ${this.track("Нагрев", "system.heat.value", s.heat?.value, s.heat?.max)}${this.track("Структура", "system.structure.value", s.structure?.value, s.structure?.max)}
        ${this.track("Нагрузка", "system.stress.value", s.stress?.value, s.stress?.max)}${this.track("Горение", "system.burn", s.burn)}
        ${this.track("Ремонт", "system.repairs.value", s.repairs?.value, s.repairs?.max)}${this.track("Мощь ядра", "system.core_energy", s.core_energy, 1)}
      </div>
      <div class="ls-row ls-wrap">
        ${btn("flow:beginBasicAttackFlow", "⚔ Базовая атака")}${btn("flow:beginBasicTechAttackFlow", "⌁ Тех-атака")}${btn("flow:beginDamageFlow", "✹ Урон")}
        ${btn("flow:beginOverchargeFlow", `♨ Перегрузка (${esc(oc[Math.min(s.overcharge || 0, oc.length - 1)])} нагрева)`)}<button type="button" class="ls-pm" data-ls="ocreset" title="Сбросить перегрузку">↺</button>
        ${btn("flow:beginStabilizeFlow", "⛨ Стабилизация")}${btn("flow:beginStructureFlow", "▼ Проверка структуры")}${btn("flow:beginOverheatFlow", "▲ Проверка перегрева")}
        ${btn("flow:beginBurnFlow", "🔥 Горение")}${btn("flow:beginFullRepairFlow", "✚ Полный ремонт")}
        ${f ? btn("core", "◆ Активировать ядро") : ""}
      </div>
      <h2>Оружие</h2>${weapons.map(w => this.weaponCard(w, { k: "c" + w.id, right: `${this.usesHtml(w)}<button type="button" class="ls-roll" data-ls="watk" data-v="${w.id}">Атака</button><button type="button" class="ls-roll" data-ls="wdmg" data-v="${w.id}">Урон</button>` })).join("") || '<p class="ls-muted">Оружия нет</p>'}
      <h2>Системы</h2>${sysl.map(x => this.sysCard(x, "s", { k: "c" + x.id, right: `${this.usesHtml(x)}${(x.system.actions || []).map((ac, i) => `<button type="button" class="ls-roll" data-ls="act" data-v="${x.id}" data-i="${i}">${esc(ac.name || "Действие")}</button>`).join("")}<button type="button" class="ls-roll" data-ls="sysuse" data-v="${x.id}">В чат</button>` })).join("") || '<p class="ls-muted">Систем нет</p>'}
      <p class="ls-muted ls-small">Броски и проверки идут в чат через систему LANCER. Трекер хода и полная автоматизация боя — этап 3.</p>`;
  }

  /* ---------- действия ---------- */
  _onFirstRender(ctx, options) {
    super._onFirstRender?.(ctx, options);
    this.element.addEventListener("click", ev => this.#onClick(ev));
    this.element.addEventListener("change", ev => this.#onChange(ev));
  }
  async #run(fn) {
    if (this.busy) return;
    this.busy = true;
    try { await fn(); } catch (e) { console.error(`${MOD} |`, e); ui.notifications?.error("Лансеровские штучки: " + e.message); }
    finally { this.busy = false; this.render(); }
  }
  async #fromPack(id) { return game.packs.get(MECH_PACK)?.getDocument(id); }
  async #own(doc) {
    const a = this.document;
    if (a.quickOwn) {
      const before = new Set(a.items.map(i => i.id));
      const [first] = await a.quickOwn(doc);
      // quickOwn возвращает предметы не по порядку (вместе со встроенными) — ищем именно нужный
      return a.items.find(i => !before.has(i.id) && i.type === doc.type && lidOf(i) === lidOf(doc)) ?? first;
    }
    const obj = doc.toObject(); delete obj._id;
    const [it] = await a.createEmbeddedDocuments("Item", [obj]); return it;
  }
  /** Значение из выпадающего списка: own:<id> — предмет со склада, pk:<id> — из компендиума */
  async #resolve(v) {
    if (!v) return null;
    const [k, id] = v.split(":");
    if (k === "own") return this.document.items.get(id) ?? null;
    if (k === "pk") { const d = await this.#fromPack(id); return d ? this.#own(d) : null; }
    return null;
  }
  frameIntegrated(f = this.frame) { return f ? [...(f.system.core_system?.integrated || []), ...(f.system.traits || []).flatMap(t => t.integrated || [])] : []; }
  /** Слоты по раме и бонусам ядра пилота (как resetMounts системы, но с ожиданием и без гонки обновлений) */
  buildMounts() {
    const a = this.document, f = this.frame; if (!f) return [];
    const out = [], gen = mt => ({ bracing: false, type: mt, slots: (FITM[mt] || ["Main"]).map(size => ({ weapon: null, mod: null, size })) });
    let base = [...(f.system.mounts || [])];
    const cb = l => (this.pilot?.items || []).some(i => i.type === "core_bonus" && lidOf(i) === l);
    if (base.length < 3 && cb("cb_improved_armament")) base.push("Main");
    if (cb("cb_mount_retrofitting")) for (const mt of ["Aux", "Aux/Aux", "Main", "Flex"]) { const i = base.indexOf(mt); if (i >= 0) { base[i] = "Main/Aux"; break; } }
    if (cb("cb_integrated_weapon")) base = ["Integrated", ...base];
    for (const l of f.system.core_system?.integrated || []) {
      const it = a.items.find(x => lidOf(x) === l && x.type === "mech_weapon");
      if (it) out.push({ bracing: false, type: "Integrated", slots: [{ weapon: it.id, mod: null, size: "Integrated" }] });
    }
    base.forEach(mt => out.push(gen(mt)));
    return out;
  }
  async #setFrame(packId) {
    const a = this.document, doc = await this.#fromPack(packId); if (!doc) return;
    const old = this.frame;
    const oldInt = this.frameIntegrated(old);
    const nf = await this.#own(doc);
    const kill = [];
    if (old) kill.push(old.id);
    a.items.forEach(i => { if (i.id !== nf.id && i.type === "frame" && !kill.includes(i.id)) kill.push(i.id); if (oldInt.includes(lidOf(i)) && i.id !== nf.id) kill.push(i.id); });
    const keepSys = (a.system._source.loadout.systems || []).filter(id => id && !kill.includes(id));
    const newInt = this.frameIntegrated(nf);
    a.items.forEach(i => { if (i.type === "mech_system" && newInt.includes(lidOf(i)) && !keepSys.includes(i.id)) keepSys.push(i.id); });
    await a.update({ "system.loadout.frame": nf.id, "system.loadout.systems": keepSys, "system.loadout.weapon_mounts": [] });
    if (kill.length) await a.deleteEmbeddedDocuments("Item", kill.filter(id => a.items.get(id)));
    try { await a.swapFrameImage?.(nf); } catch (e) { }
    try { await a.updateTokenSize?.(nf); } catch (e) { }
    await a.update({ "system.loadout.weapon_mounts": this.buildMounts() });
    const s = a.system;
    await a.update({ "system.hp.value": s.hp.max, "system.heat.value": 0, "system.structure.value": s.structure.max, "system.stress.value": s.stress.max, "system.repairs.value": s.repairs.max });
    this.pickFrame = false;
  }
  async #setSlotWeapon(mi, si, v) {
    const a = this.document, mounts = this.srcMounts(), sl = mounts[mi]?.slots[si]; if (!sl) return;
    const oldW = sl.weapon, oldM = sl.mod;
    const it = await this.#resolve(v);
    sl.weapon = it ? it.id : null; sl.mod = null;
    if (it && it.system.size === "Superheavy" && !mounts.some(m => m.bracing)) { const o = mounts.findIndex((m, i) => i !== mi && m.type !== "Integrated"); if (o >= 0) mounts[o].bracing = true; }
    if (mounts[mi].type === "Flex" && si === 0 && it && it.system.size !== "Auxiliary" && mounts[mi].slots[1]?.weapon) {
      // основное в гибком — второй слот освобождаем (оружие уходит на склад)
      mounts[mi].slots[1].weapon = null; mounts[mi].slots[1].mod = null;
    }
    await a.update({ "system.loadout.weapon_mounts": mounts });
    // снятое оружие из компендиума удаляем, если оно больше нигде не стоит; мод снятого оружия тоже
    const del = [oldW, oldM].filter(id => id && id !== sl.weapon && a.items.get(id));
    if (del.length) await a.deleteEmbeddedDocuments("Item", del);
  }
  async #setSlotMod(mi, si, v) {
    const a = this.document, mounts = this.srcMounts(), sl = mounts[mi]?.slots[si]; if (!sl) return;
    const oldM = sl.mod, it = await this.#resolve(v);
    sl.mod = it ? it.id : null;
    await a.update({ "system.loadout.weapon_mounts": mounts });
    if (oldM && oldM !== sl.mod && a.items.get(oldM)) await a.deleteEmbeddedDocuments("Item", [oldM]);
  }
  async #onClick(ev) {
    const b = ev.target.closest("[data-ls]");
    if (!b || b.disabled || b.tagName === "SELECT" || b.tagName === "TEXTAREA" || (b.tagName === "INPUT")) return;
    ev.preventDefault();
    const a = this.document, act = b.dataset.ls, v = b.dataset.v, d = +b.dataset.d || 0;
    if (act === "tab") { this.tab = v; return this.render(); }
    if (act === "open") { this.open[v] = !this.open[v]; return this.render(); }
    if (act === "pilotopen") return this.pilot?.sheet.render(true);
    if (!this.isEditable) return;
    if (act.startsWith("flow:")) { const fn = act.slice(5); if (a[fn]) return a[fn](); return; }
    const it = v ? a.items.get(v) : null;
    switch (act) {
      case "img": return pickTokenImg(a);
      case "pickframe": this.pickFrame = !this.pickFrame; return this.render();
      case "frame": return this.#run(() => this.#setFrame(v));
      case "resetmounts": return this.#run(async () => {
        // оружие, которое влезает, остаётся на своих местах по порядку; остальное — на склад
        const fi = this.frameIntegrated();
        const old = this.srcMounts().flatMap(m => m.slots.filter(x => x.weapon && !fi.includes(lidOf(a.items.get(x.weapon)))).map(x => ({ w: x.weapon, mod: x.mod })));
        const nm = this.buildMounts();
        for (const m of nm) for (const sl of m.slots) {
          if (sl.weapon) continue;
          const i = old.findIndex(o => (FITS[sl.size] || []).includes(a.items.get(o.w)?.system.size));
          if (i >= 0) { sl.weapon = old[i].w; sl.mod = old[i].mod; old.splice(i, 1); if (sl.size === "Flex" && a.items.get(sl.weapon)?.system.size !== "Auxiliary") break; }
        }
        await a.update({ "system.loadout.weapon_mounts": nm });
      });
      case "sysdel": return this.#run(async () => { await a.update({ "system.loadout.systems": (a.system._source.loadout.systems || []).filter(x => x && x !== v) }); if (a.items.get(v)) await a.deleteEmbeddedDocuments("Item", [v]); });
      case "del": return it?.delete();
      case "uses": if (it) return it.update({ "system.uses.value": Math.max(0, Math.min(it.system.uses.max ?? 99, (it.system.uses.value ?? 0) + d)) }); return;
      case "loaded": return it?.update({ "system.loaded": !it.system.loaded });
      case "destroyed": return it?.update({ "system.destroyed": !it.system.destroyed });
      case "trk": {
        const p = b.dataset.p, cur = foundry.utils.getProperty(a, p) ?? 0;
        const maxP = p.endsWith(".value") ? p.replace(/\.value$/, ".max") : null, max = maxP ? foundry.utils.getProperty(a, maxP) : (p === "system.core_energy" ? 1 : null);
        let nv = cur + d; if (p !== "system.hp.value" && p !== "system.heat.value") nv = Math.max(0, nv); if (max != null && p !== "system.heat.value") nv = Math.min(max, nv);
        return a.update({ [p]: nv });
      }
      case "ocreset": return a.update({ "system.overcharge": 0 });
      case "core": return this.frame?.beginCoreActiveFlow?.();
      case "watk": return it?.beginWeaponAttackFlow?.();
      case "wdmg": return it?.beginDamageFlow?.();
      case "sysuse": return it?.beginSystemFlow?.();
      case "act": return it?.beginActivationFlow?.(`system.actions.${b.dataset.i}`);
    }
  }
  async #onChange(ev) {
    const t = ev.target, a = this.document;
    if (!this.isEditable) return;
    if (t.dataset.lsf === "system.notes") return a.update({ "system.notes": "<p>" + esc(t.value).replace(/\n/g, "<br>") + "</p>" });
    if (t.dataset.lsf) return a.update({ [t.dataset.lsf]: t.value });
    const act = t.dataset.ls;
    if (act === "pilotset") { const p = game.actors.get(t.value); if (!p) return; await a.update({ "system.pilot": p.uuid }); return p.update({ "system.active_mech": a.uuid }); }
    if (act === "slotw" && t.value !== "keep") return this.#run(() => this.#setSlotWeapon(+t.dataset.m, +t.dataset.s, t.value));
    if (act === "slotm" && t.value !== "keep") return this.#run(() => this.#setSlotMod(+t.dataset.m, +t.dataset.s, t.value));
    if (act === "sysadd" && t.value) return this.#run(async () => { const it = await this.#resolve(t.value); if (it) await a.update({ "system.loadout.systems": [...(a.system._source.loadout.systems || []).filter(Boolean), it.id] }); });
    if (act === "brace") { const m = this.srcMounts(); m.forEach((x, i) => x.bracing = i === +t.dataset.m ? t.checked : false); return a.update({ "system.loadout.weapon_mounts": m }); }
    if (act === "wprof") return a.items.get(t.dataset.v)?.update({ "system.selected_profile_index": +t.value });
  }
}
