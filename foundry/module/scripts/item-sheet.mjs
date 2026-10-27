// Лист предмета «Лансеровские штучки»: оружие, системы, моды, рамы, таланты, бонусы ядра, навыки, снаряжение…
import { RU, MOD, esc, sgn, fmt, asset, MANU, MANU_FULL, ruName, lidOf } from "./util.mjs";

const TYPE_RU = { mech_weapon: "Оружие меха", mech_system: "Система меха", weapon_mod: "Мод оружия", frame: "Рама", talent: "Талант", core_bonus: "Бонус ядра",
  skill: "Навык-триггер", reserve: "Резерв", license: "Лицензия", pilot_gear: "Снаряжение пилота", pilot_weapon: "Оружие пилота", pilot_armor: "Броня пилота", bond: "Узы", organization: "Организация" };
const ACT_RU = { Quick: "Быстрое действие", Full: "Полное действие", "Quick Tech": "Быстрая технология", "Full Tech": "Полная технология", Invade: "Вторжение",
  Reaction: "Реакция", Protocol: "Протокол", Free: "Свободное действие", Passive: "Пассивно", Other: "Особое", None: "—", Move: "Перемещение" };
const ACT_K = { Reaction: "r", Protocol: "o", "Quick Tech": "t", "Full Tech": "t", Invade: "t", Passive: "c", Quick: "s", Full: "s", Free: "s" };
const WSIZE_RU = { Auxiliary: "Вспом.", Main: "Осн.", Heavy: "Тяж.", Superheavy: "Сверхтяж." };
const WTYPE_RU = { Melee: "ОББ", CQB: "ОБД", Rifle: "Винтовка", Launcher: "ПУ", Cannon: "Пушка", Nexus: "Звено" };
const RNG_RU = { Range: "Дальн.", Threat: "Угроза", Thrown: "Метание", Line: "Линия", Cone: "Конус", Blast: "Взрыв", Burst: "Разрыв" };
const DMG_RU = { Kinetic: "кин.", Energy: "энерг.", Explosive: "взр.", Burn: "горения", Heat: "нагрева", Variable: "на выбор" };
const MOUNT_RU = { Main: "Основной", Heavy: "Тяжёлый", Flex: "Гибкий", "Main/Aux": "Основной/Вспом.", "Aux/Aux": "Вспом./Вспом.", Aux: "Вспомогательный", Integrated: "Встроенный", Superheavy: "Сверхтяжёлый" };
const SYS_TYPE_RU = { System: "Система", AI: "ИИ", Shield: "Щит", Deployable: "Развёртываемое", Drone: "Дрон", Tech: "Технология", Armor: "Броня", "Flight System": "Полёт", Integrated: "Встроенное", Mod: "Мод" };

/** HTML из данных предмета: без скриптов и обработчиков */
/** «1/Round» → «1/раунд» — только для показа */
const freqRu = f => String(f || "").replace(/round/i, "раунд").replace(/turn/i, "ход").replace(/encounter|scene/i, "сцена").replace(/mission/i, "миссия").replace(/^unlimited$/i, "");
const safe = h => String(h ?? "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
/** Текст: если в нём уже есть разметка — показываем как есть, иначе форматируем как книжный текст */
const txt = h => !h ? "" : /<\w+[\s>]/.test(h) ? safe(h) : fmt(h);
const tagTxt = t => { const r = RU.tags[t.lid]; return (r ? r.n : (t.name || t.lid)).replace("{VAL}", t.val ?? "X"); };
const tagsHtml = tags => (tags || []).filter(t => t && !t.hidden).map(t => `<span class="ls-tag" title="${esc(RU.tags[t.lid]?.d?.replace(/\*\*/g, "") || t.description || "")}">${esc(tagTxt(t))}</span>`).join("");
const dmgTxt = d => (d || []).map(x => `${x.val} ${DMG_RU[x.type] || x.type}`).join(" + ");
const rngTxt = r => (r || []).map(x => `${RNG_RU[x.type] || x.type} ${x.val}`).join(", ");

export class LsItemSheet extends foundry.applications.sheets.ItemSheetV2 {
  static DEFAULT_OPTIONS = { classes: ["ls-sheet", "ls-item-sheet"], position: { width: 620, height: 640 }, window: { resizable: true } };

  get title() { return this.document.name; }
  async _renderHTML(ctx, options) {
    const it = this.document, s = it.system, ty = it.type, own = !!it.actor && it.isOwner;
    const lic = s.license && s.license_level ? `${ruName("frames", s.license, s.license)} ${"I".repeat(s.license_level)}` : "";
    const chips = [TYPE_RU[ty] || ty, s.manufacturer ? (MANU[s.manufacturer] || s.manufacturer) : "", lic ? "Лицензия: " + lic : "", s.sp ? s.sp + " СП" : "",
      ty === "mech_system" && s.type ? (SYS_TYPE_RU[s.type] || s.type) : ""].filter(Boolean);
    const head = `<header class="ls-ihead"><img src="${esc(it.img)}" class="ls-iimg">
      <div class="ls-names"><input class="ls-big" data-lsf="name" value="${esc(it.name)}" ${this.isEditable ? "" : "disabled"}>
      <div class="ls-chips">${chips.map(c => `<span class="ls-pill">${esc(c)}</span>`).join("")}</div></div></header>`;
    let body = "";
    try { body = (this["r_" + ty] ? this["r_" + ty](it, own) : this.r_generic(it, own)); } catch (e) { console.error(`${MOD} | лист предмета`, e); body = this.r_generic(it, own); }
    const en = it.flags?.[MOD]?.en;
    return `<div class="ls-root"><section class="ls-body">${head}${body}
      <div class="ls-ifoot">${en && en !== it.name ? `<span class="ls-muted ls-small">${esc(en)}</span>` : ""}<button type="button" class="ls-btn" data-ls="syssheet">✎ Подробно (лист системы)</button></div></section></div>`;
  }
  _replaceHTML(result, content) { const sc = content.querySelector(".ls-body")?.scrollTop ?? 0; content.innerHTML = result; const b = content.querySelector(".ls-body"); if (b) b.scrollTop = sc; }

  /* --- части --- */
  tags(s) { const t = tagsHtml(s.tags); return t ? `<div class="ls-tags">${t}</div>` : ""; }
  uses(it) {
    const s = it.system, h = [];
    if ((s.tags || []).some(t => t.lid === "tg_limited") && s.uses) h.push(`<span class="ls-uses">заряды <button type="button" class="ls-pm" data-ls="uses" data-d="-1">−</button><b>${s.uses.value ?? 0}/${s.uses.max ?? 0}</b><button type="button" class="ls-pm" data-ls="uses" data-d="1">+</button></span>`);
    if ((s.tags || []).some(t => t.lid === "tg_loading")) h.push(`<button type="button" class="ls-chip ${s.loaded ? "on" : ""}" data-ls="loaded">${s.loaded ? "заряжено" : "разряжено"}</button>`);
    if ("destroyed" in s) h.push(`<button type="button" class="ls-chip ${s.destroyed ? "bad" : ""}" data-ls="destroyed">${s.destroyed ? "уничтожено" : "цело"}</button>`);
    return h.length ? `<div class="ls-row">${h.join("")}</div>` : "";
  }
  /** Карточки действий; path — откуда брать действия для броска системы */
  actions(list, path, own, near = "") {
    const P = typeof path === "function" ? path : (i => (path ? `${path}.${i}` : null));
    const norm = h => String(h || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const dup = new Set([norm(near)].filter(Boolean));
    return (list || []).map((a, i) => `<div class="ls-abox k${ACT_K[a.activation] || "r"}"><div class="ah"><b>${esc(a.name || "Действие")}</b><span>${esc(ACT_RU[a.activation] || a.activation || "")}${freqRu(a.frequency) ? ", " + esc(freqRu(a.frequency)) : ""}${a.heat_cost ? `, ${a.heat_cost} нагрева` : ""}</span></div>
      <div class="ab">${a.trigger ? `<div><b>Триггер:</b> ${txt(a.trigger)}</div>` : ""}${a.detail && !dup.has(norm(a.detail)) ? `<div>${a.trigger ? "<b>Эффект:</b> " : ""}${txt(a.detail)}</div>` : ""}
      ${own && P(i) ? `<button type="button" class="ls-roll" data-ls="act" data-p="${P(i)}">▶ Использовать</button>` : ""}</div></div>`).join("");
  }
  text(h, label) { return h ? `${label ? `<h2>${label}</h2>` : ""}<div class="ls-txt">${txt(h)}</div>` : ""; }
  flav(h) { return h ? `<details class="ls-flav"><summary>Описание</summary><div class="ls-txt">${txt(h)}</div></details>` : ""; }

  r_generic(it, own) { const s = it.system; return `${this.tags(s)}${this.uses(it)}${this.text(s.effect)}${this.text(s.description)}${this.actions(s.actions, "system.actions", own, s.effect)}`; }
  r_mech_weapon(it, own) {
    const s = it.system, pi = s.selected_profile_index || 0, profs = s.profiles || [];
    const p = profs[pi] || profs[0] || {};
    const dmg = p.all_damage?.length ? p.all_damage : p.damage, rng = p.all_range?.length ? p.all_range : p.range, tags = p.all_tags?.length ? p.all_tags : p.tags;
    return `<div class="ls-row">${profs.length > 1 ? `<select data-ls="prof">${profs.map((x, i) => `<option value="${i}" ${i === pi ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}
        <span class="ls-pill">${esc(WSIZE_RU[s.size] || s.size || "")} ${esc(WTYPE_RU[p.type] || p.type || "")}</span>${rng?.length ? `<span class="ls-pill">${esc(rngTxt(rng))}</span>` : ""}${dmg?.length ? `<span class="ls-pill dmg">${esc(dmgTxt(dmg))}</span>` : ""}</div>
      <div class="ls-tags">${tagsHtml(tags)}</div>${this.uses(it)}
      ${own ? `<div class="ls-row"><button type="button" class="ls-btn red" data-ls="atk">⚔ Атака</button><button type="button" class="ls-btn" data-ls="dmg">✹ Урон</button></div>` : ""}
      ${this.text(p.effect)}${p.on_attack ? this.text(p.on_attack, "При атаке") : ""}${p.on_hit ? this.text(p.on_hit, "При попадании") : ""}${p.on_crit ? this.text(p.on_crit, "При крите") : ""}
      ${this.actions(s.actions, "system.actions", own, p.effect)}${this.flav(p.description || s.description)}`;
  }
  r_pilot_weapon(it, own) {
    const s = it.system;
    return `<div class="ls-row">${s.range?.length ? `<span class="ls-pill">${esc(rngTxt(s.range))}</span>` : ""}${s.damage?.length ? `<span class="ls-pill dmg">${esc(dmgTxt(s.damage))}</span>` : ""}</div>${this.tags(s)}${this.uses(it)}
      ${own ? `<div class="ls-row"><button type="button" class="ls-btn red" data-ls="atk">⚔ Атака</button><button type="button" class="ls-btn" data-ls="dmg">✹ Урон</button></div>` : ""}
      ${this.text(s.effect)}${this.actions(s.actions, "system.actions", own, s.effect)}${this.flav(s.description)}`;
  }
  r_mech_system(it, own) {
    const s = it.system;
    return `${this.tags(s)}${this.uses(it)}${own ? `<div class="ls-row"><button type="button" class="ls-btn" data-ls="sysflow">💬 В чат</button></div>` : ""}
      ${this.text(s.effect)}${this.actions(s.actions, "system.actions", own, s.effect)}${this.flav(s.description)}`;
  }
  r_weapon_mod(it, own) {
    const s = it.system, ty = Object.entries(s.allowed_types || {}).filter(([, v]) => v).map(([k]) => WTYPE_RU[k] || k), sz = Object.entries(s.allowed_sizes || {}).filter(([, v]) => v).map(([k]) => WSIZE_RU[k] || k);
    return `<div class="ls-row ls-small ls-muted">Для оружия: ${esc(ty.join(", ") || "любого")} · размер: ${esc(sz.join(", ") || "любой")}</div>${this.r_mech_system(it, own)}
      ${s.added_damage?.length ? `<div class="ls-row"><span class="ls-pill dmg">+${esc(dmgTxt(s.added_damage))}</span></div>` : ""}${s.added_range?.length ? `<div class="ls-row"><span class="ls-pill">+${esc(rngTxt(s.added_range))}</span></div>` : ""}
      ${s.added_tags?.length ? `<div class="ls-tags">+ ${tagsHtml(s.added_tags)}</div>` : ""}`;
  }
  r_frame(it, own) {
    const s = it.system, st = s.stats || {}, cs = s.core_system || {}, art = RU.art[lidOf(it)];
    const C = [["ПЗ", st.hp], ["Броня", st.armor], ["Структура", st.structure], ["Нагрузка", st.stress], ["Уклонение", st.evasion], ["Э-Защита", st.edef], ["Скорость", st.speed], ["Размер", st.size === 0.5 ? "½" : st.size],
      ["Тепл. Макс.", st.heatcap], ["Лимит Ремонта", st.repcap], ["Сенсоры", st.sensor_range], ["Спас. Цель", st.save], ["Тех. Атака", sgn(st.tech_attack ?? 0)], ["СП", st.sp]];
    return `${art ? `<div class="ls-iart" style="background-image:url('${asset(art)}')"></div>` : ""}
      <div class="ls-row ls-small">${esc(RU.frames[lidOf(it)]?.role || "")}</div>
      <div class="ls-mstats">${C.map(([l, v]) => `<div><span>${l}</span><b>${esc(v ?? "—")}</b></div>`).join("")}</div>
      <div class="ls-row">Слоты: ${(s.mounts || []).map(m => `<span class="ls-pill">${esc(MOUNT_RU[m] || m)}</span>`).join("")}</div>
      <h2>Черты</h2>${(s.traits || []).map((t, i) => `<div class="ls-trait"><b>${esc(t.name)}</b><div class="ls-txt">${txt(t.description)}</div>${this.actions(t.actions, `system.traits.${i}.actions`, own, t.description)}</div>`).join("")}
      <h2>Система ядра — ${esc(cs.name || "")}</h2>
      ${cs.passive_name || cs.passive_effect ? `<div class="ls-trait"><b>${esc(cs.passive_name || "")}</b> <span class="ls-muted">(пассивно)</span><div class="ls-txt">${txt(cs.passive_effect)}</div></div>` : ""}
      <div class="ls-abox kc"><div class="ah"><b>${esc(cs.active_name || "")}</b><span>${esc(ACT_RU[cs.activation] || cs.activation || "")} · 1 Мощь Ядра</span></div><div class="ab">${txt(cs.active_effect)}
        ${own ? `<button type="button" class="ls-roll" data-ls="core">◆ Активировать ядро</button>` : ""}</div></div>
      ${this.flav(s.description)}`;
  }
  r_talent(it, own) {
    const s = it.system, r = s.curr_rank || 0; let k = 0;
    return `<div class="ls-row">Ранг: ${[1, 2, 3].map(i => `<button type="button" class="ls-pip ${i <= r ? "on" : ""}" data-ls="rank" data-v="${i === r ? i - 1 : i}">${"I".repeat(i)}</button>`).join("")}</div>
      ${(s.ranks || []).map((rk, i) => {
        const got = i < r, base = k; if (got) k += (rk.actions || []).length;
        // у системы действия открытых рангов собраны подряд в system.actions
        return `<div class="ls-tr ${got ? "got" : ""}"><b>${"I".repeat(i + 1)}. ${esc(rk.name)}</b><div class="ls-txt">${txt(rk.description)}</div>${this.actions(rk.actions, j => got ? `system.actions.${base + j}` : null, own, rk.description)}</div>`;
      }).join("")}`;
  }
  r_core_bonus(it, own) { const s = it.system; return `${this.text(s.effect)}${s.mounted_effect && s.mounted_effect !== s.effect ? this.text(s.mounted_effect, "В слоте") : ""}${this.actions(s.actions, "system.actions", own, s.effect)}${this.flav(s.description)}`; }
  r_skill(it, own) {
    const s = it.system, r = s.curr_rank || 1;
    return `<div class="ls-row">Ранг: ${[1, 2, 3].map(i => `<button type="button" class="ls-pip ${i <= r ? "on" : ""}" data-ls="rank" data-v="${Math.max(1, i)}">${"I".repeat(i)}</button>`).join("")} <b>+${r * 2}</b>
      ${own ? `<button type="button" class="ls-roll" data-ls="skill">d20${sgn(r * 2)}</button>` : ""}</div>${this.text(s.description)}${s.detail ? this.text(s.detail) : ""}`;
  }
  r_license(it) { const s = it.system; return `<div class="ls-row">Производитель: <b>${esc(MANU_FULL[s.manufacturer] || s.manufacturer || "")}</b> · ранг <b>${"I".repeat(s.curr_rank || 1)}</b></div><p class="ls-muted ls-small">Содержимое лицензии видно на листе пилота во вкладке «Пилот».</p>`; }
  r_reserve(it, own) { const s = it.system; return `${this.text(s.description)}${this.actions(s.actions, "system.actions", own, s.description)}`; }

  /* --- действия --- */
  _onFirstRender(ctx, options) {
    super._onFirstRender?.(ctx, options);
    this.element.addEventListener("click", ev => this.#onClick(ev));
    this.element.addEventListener("change", ev => this.#onChange(ev));
  }
  openSystemSheet() {
    const it = this.document, cfg = CONFIG.Item.sheetClasses?.[it.type] || {};
    const e = Object.values(cfg).find(c => c.id?.startsWith("lancer.")) || Object.values(cfg).find(c => c.cls !== LsItemSheet);
    if (!e) return ui.notifications.warn("Лист системы не найден");
    const C = e.cls, isV2 = foundry.applications.api?.ApplicationV2 && C.prototype instanceof foundry.applications.api.ApplicationV2;
    const app = isV2 ? new C({ document: it }) : new C(it, { editable: it.isOwner });
    app.render(true);
  }
  async #onClick(ev) {
    const b = ev.target.closest("[data-ls]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
    ev.preventDefault();
    const it = this.document, s = it.system, act = b.dataset.ls, d = +b.dataset.d || 0;
    if (act === "syssheet") return this.openSystemSheet();
    switch (act) {
      case "atk": return it.beginWeaponAttackFlow?.();
      case "dmg": return it.beginDamageFlow?.();
      case "sysflow": return it.beginSystemFlow?.();
      case "act": return it.beginActivationFlow?.(b.dataset.p);
      case "core": return it.beginCoreActiveFlow?.();
      case "skill": return it.beginSkillFlow?.();
    }
    if (!this.isEditable) return;
    switch (act) {
      case "uses": return it.update({ "system.uses.value": Math.max(0, Math.min(s.uses?.max ?? 99, (s.uses?.value ?? 0) + d)) });
      case "loaded": return it.update({ "system.loaded": !s.loaded });
      case "destroyed": return it.update({ "system.destroyed": !s.destroyed });
      case "rank": { const v = +b.dataset.v; if (v <= 0) return; return it.update({ "system.curr_rank": Math.max(1, Math.min(3, v)) }); }
    }
  }
  async #onChange(ev) {
    const t = ev.target, it = this.document; if (!this.isEditable) return;
    if (t.dataset.lsf) return it.update({ [t.dataset.lsf]: t.value });
    if (t.dataset.ls === "prof") return it.update({ "system.selected_profile_index": +t.value });
  }
}
export const LS_ITEM_TYPES = ["mech_weapon", "mech_system", "weapon_mod", "frame", "talent", "core_bonus", "skill", "reserve", "license", "pilot_gear", "pilot_weapon", "pilot_armor"];
