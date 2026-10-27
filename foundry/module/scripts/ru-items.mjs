// Русификация данных предметов LANCER: названия и тексты из «Лансеровских штучек» по lid.
// Работает: при создании любого предмета (hook preCreateItem), а у ГМа при входе — по компендиумам, актёрам и меткам.
import { RU, MOD, fmt } from "./util.mjs";

export const RU_VER = 3;
const H = t => (t ? fmt(t) : "");
const BOX = /⟦A(?::(\w))?⟧([\s\S]*?)⟦T⟧([\s\S]*?)⟦E⟧([\s\S]*?)(?:⟦Z⟧|(?=⟦A)|$)/g;

/** Карточки действий из русского текста и текст без них */
function splitBoxes(t) {
  const boxes = [];
  const rest = String(t || "").replace(BOX, (m, k, n, tg, body) => { boxes.push({ name: n.trim(), tags: tg.trim(), body: body.trim() }); return ""; }).trim();
  return { boxes, rest };
}
// частоту (frequency, «1/Round») не трогаем: система принимает только английские значения, переводится только при показе
function boxToAction(a, b) {
  const m = b.body.match(/\*\*Триггер:?\*\*:?\s*([\s\S]*?)\n\s*\*\*Эффект:?\*\*:?\s*([\s\S]*)/);
  return { ...a, name: b.name || a.name, trigger: m ? H(m[1]) : (a.trigger ? "" : a.trigger), detail: H(m ? m[2] : b.body), terse: "" };
}
const ACT_RX = { Reaction: /реакц/i, Protocol: /протокол/i, Quick: /быстр/i, "Quick Tech": /быстр/i, Full: /полн/i, "Full Tech": /полн/i, Free: /свобод/i, Invade: /вторж/i };
/** Переводит массив действий: карточки ⟦A⟧ из русского текста раскладываются по действиям (по порядку или по типу действия),
 *  остальным действиям — имя предмета/ранга и текст без карточек */
function ruActions(actions, t, fallbackName) {
  if (!actions?.length) return { actions, text: t };
  const { boxes, rest } = splitBoxes(t);
  if (boxes.length === actions.length) return { actions: actions.map((a, i) => boxToAction(a, boxes[i])), text: rest };
  const used = new Set();
  const mapped = actions.map(a => { const j = boxes.findIndex((b, k) => !used.has(k) && ACT_RX[a.activation]?.test(b.tags)); if (j < 0) return null; used.add(j); return boxToAction(a, boxes[j]); });
  const left = boxes.filter((b, k) => !used.has(k));
  const text = [rest, ...left.map(b => `⟦A⟧${b.name}⟦T⟧${b.tags}⟦E⟧${b.body}⟦Z⟧`)].filter(Boolean).join("\n");
  let n = 0; const free = mapped.filter(x => !x).length;
  return { actions: actions.map((a, i) => mapped[i] || ({ ...a, name: fallbackName + (free > 1 ? ` (${++n})` : ""), trigger: a.trigger ? "" : a.trigger, detail: H(rest || t), terse: "" })), text };
}

/** Русское имя, которое должно получиться у предмета (или null, если перевода нет) */
export function expectedName(src) {
  const s = src.system || {}, lid = s.lid;
  const T = { skill: RU.skills, reserve: RU.reserves, core_bonus: RU.cbs, pilot_gear: RU.gear, pilot_armor: RU.gear, pilot_weapon: RU.gear, talent: RU.talents,
    frame: RU.frames, mech_weapon: RU.weapons, mech_system: RU.systems, weapon_mod: RU.mods }[src.type];
  if (src.type === "license") return RU.frames[s.key]?.n ?? null;
  return T?.[lid]?.n ?? null;
}
/** Уже переведён (и не перезаписан импортом LCP)? */
export const isRu = src => foundry.utils.getProperty(src, `flags.${MOD}.ru`) === RU_VER && src.name === expectedName(src);

/** Возвращает изменения для данных предмета (toObject()) или null, если перевода нет.
 *  Правило: поле меняется, только если для него есть русский текст; всё остальное остаётся как было. */
export function ruPatch(src) {
  const s = src.system || {}, lid = s.lid, ty = src.type, exp = expectedName(src);
  if (!exp || isRu(src)) return null;
  const up = {};
  const oldVer = foundry.utils.getProperty(src, `flags.${MOD}.ru`);
  const done = () => {
    for (const k of Object.keys(up)) if (up[k] === undefined) delete up[k];
    up[`flags.${MOD}.ru`] = RU_VER;
    if (src.name !== exp) { up[`flags.${MOD}.en`] = src.name; up[`flags.${MOD}.lost`] = false; }   // свежие данные из LCP
    else if (oldVer === 2) up[`flags.${MOD}.lost`] = true;                                          // переведено версией 0.3.0: часть текста утеряна
    return up;
  };
  switch (ty) {
    case "skill": { const r = RU.skills[lid]; if (!r) return null; up.name = r.n; if (r.t) { up["system.description"] = H(r.t); up["system.detail"] = ""; } return done(); }
    case "reserve": { const r = RU.reserves[lid]; if (!r) return null; up.name = r.n; if (r.t) up["system.description"] = H(r.t); if (s.label) up["system.label"] = r.n; return done(); }
    case "core_bonus": {
      const r = RU.cbs[lid]; if (!r) return null; up.name = r.n;
      if (r.t) { const x = ruActions(s.actions, r.t, r.n); up["system.effect"] = H(x.text); up["system.actions"] = x.actions; if (s.mounted_effect) up["system.mounted_effect"] = H(r.t); }
      return done();
    }
    case "license": { const r = RU.frames[s.key]; if (!r) return null; up.name = r.n; return done(); }
    case "pilot_gear": case "pilot_armor": case "pilot_weapon": {
      const r = RU.gear[lid]; if (!r) return null; up.name = r.n;
      if (r.t) { const x = ruActions(s.actions, r.t, r.n); up["system.effect"] = H(x.text); up["system.actions"] = x.actions; }
      return done();
    }
    case "talent": {
      const r = RU.talents[lid]; if (!r) return null; up.name = r.n;
      up["system.ranks"] = (s.ranks || []).map((rk, i) => {
        const rr = r.r?.[i]; if (!rr || !rr.t) return rr ? { ...rk, name: rr.n } : rk;
        const x = ruActions(rk.actions, rr.t, rr.n);
        return { ...rk, name: rr.n, description: H(x.text), actions: x.actions };
      });
      return done();
    }
    case "frame": {
      const r = RU.frames[lid]; if (!r) return null; up.name = r.n;
      if (r.tr?.length && r.tr.length === (s.traits || []).length) up["system.traits"] = s.traits.map((t, i) => {
        if (!r.tr[i].t) return { ...t, name: r.tr[i].n };
        const x = ruActions(t.actions, r.tr[i].t, r.tr[i].n);
        return { ...t, name: r.tr[i].n, description: H(x.text), actions: x.actions };
      });
      const c = r.core || {}, cs = s.core_system || {};
      if (c.n) {
        const cc = { ...cs, name: c.n };
        if (c.an) cc.active_name = c.an;
        if (c.at) { cc.active_effect = H(c.at); cc.active_actions = (cs.active_actions || []).map(a => ({ ...a, name: c.an || a.name, detail: H(c.at), trigger: a.trigger ? "" : a.trigger, terse: "" })); }
        if (c.pt) { cc.passive_name = c.pn || cs.passive_name; cc.passive_effect = H(c.pt); cc.passive_actions = (cs.passive_actions || []).map(a => ({ ...a, name: c.pn || a.name, detail: H(c.pt), trigger: a.trigger ? "" : a.trigger, terse: "" })); }
        up["system.core_system"] = cc;
      }
      return done();
    }
    case "mech_weapon": {
      const r = RU.weapons[lid]; if (!r) return null; up.name = r.n;
      if (r.t || r.f) {
        const x = r.t ? ruActions(s.actions, r.t, r.n) : { actions: s.actions, text: "" };
        if (r.t) up["system.actions"] = x.actions;
        up["system.profiles"] = (s.profiles || []).map(p => {
          const q = { ...p };
          if (r.f) q.description = H(r.f);
          if (r.t) { const y = ruActions(p.actions, x.text, r.n); Object.assign(q, { effect: H(y.text), on_attack: "", on_hit: "", on_crit: "", actions: y.actions }); }
          return q;
        });
      }
      return done();
    }
    case "mech_system": case "weapon_mod": {
      const r = (ty === "weapon_mod" ? RU.mods : RU.systems)[lid]; if (!r) return null; up.name = r.n;
      if (r.t) { const x = ruActions(s.actions, r.t, r.n); up["system.effect"] = H(x.text); up["system.actions"] = x.actions; }
      if (r.f) up["system.description"] = H(r.f);
      return done();
    }
  }
  return null;
}

/** Текстовые поля предмета (книжные данные) — для восстановления предметов у актёров из компендиума */
const TEXT_FIELDS = ["name", "system.description", "system.effect", "system.detail", "system.label", "system.terse", "system.mounted_effect", "system.actions",
  "system.profiles", "system.core_system", "system.traits", "system.ranks", "flags.lancer-shtuchki"];
function copyText(from) { const up = {}; for (const f of TEXT_FIELDS) { const v = foundry.utils.getProperty(from, f); if (v !== undefined) up[f] = foundry.utils.deepClone(v); } return up; }

/** Англ. имя рамы — система ищет арт меха по нему */
export const enName = item => item?.flags?.[MOD]?.en || (item?.type === "frame" ? RU.frames[item.system?.lid]?.en : null) || item?.name;

/* ---------- на лету: всё, что создаётся (компендиум, перетаскивание, импорт Comp/Con) ---------- */
Hooks.on("preCreateItem", (item, data, options, userId) => {
  if (userId !== game.user.id) return;
  try { const p = ruPatch(item.toObject()); if (p) item.updateSource(p); } catch (e) { console.warn(`${MOD} | перевод предмета`, e); }
});

/* ---------- у ГМа при входе: досводим всё, что ещё на английском ---------- */
const PACKS = ["world.pilot-items", "world.mech-items"];
export async function russifyWorld({ quiet = false } = {}) {
  if (!game.user.isGM) return 0;
  let n = 0;
  for (const id of PACKS) {
    const pack = game.packs.get(id); if (!pack) continue;
    const idx = await pack.getIndex({ fields: ["system.lid", "system.key", `flags.${MOD}.ru`] });
    const need = idx.filter(e => expectedName(e) && !isRu(e)).map(e => e._id);
    if (!need.length) continue;
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });
    try {
      const docs = await pack.getDocuments({ _id__in: need }).catch(() => Promise.all(need.map(i => pack.getDocument(i))));
      const ups = [];
      for (const d of docs) { if (!d) continue; const p = ruPatch(d.toObject()); if (p) ups.push({ _id: d.id, ...p }); }
      for (let i = 0; i < ups.length; i += 100) await Item.implementation.updateDocuments(ups.slice(i, i + 100), { pack: id });
      n += ups.length;
    } finally { if (wasLocked) await pack.configure({ locked: true }); }
  }
  // компендиумы по lid — чтобы чинить предметы актёров, переведённые версией 0.3.0
  const ref = {};
  for (const id of PACKS) {
    const pack = game.packs.get(id); if (!pack) continue;
    const idx = await pack.getIndex({ fields: ["system.lid", "system.key", `flags.${MOD}.ru`, `flags.${MOD}.lost`] });
    for (const e of idx) { const l = foundry.utils.getProperty(e, "system.lid"); if (l) ref[e.type + "|" + l] = { pack, e }; }
  }
  let lostPack = Object.values(ref).filter(x => foundry.utils.getProperty(x.e, `flags.${MOD}.lost`)).length;
  let lostActor = 0;
  for (const a of game.actors) {
    const ups = [];
    for (const it of a.items) {
      const o = it.toObject(), isLost = o.flags?.[MOD]?.lost || (o.flags?.[MOD]?.ru === 2);
      const r = isLost && ref[it.type + "|" + o.system?.lid];
      if (r && !foundry.utils.getProperty(r.e, `flags.${MOD}.lost`) && isRu(r.e)) {
        const d = await r.pack.getDocument(r.e._id); if (d) { ups.push({ _id: it.id, ...copyText(d.toObject()) }); continue; }
      }
      const p = ruPatch(o); if (p) ups.push({ _id: it.id, ...p });
      if (isLost || p?.[`flags.${MOD}.lost`]) lostActor++;
    }
    if (ups.length) { await a.updateEmbeddedDocuments("Item", ups, {}); n += ups.length; }
  }
  if (lostPack || lostActor) ui.notifications.warn(`Лансеровские штучки: у ${lostPack + lostActor} предметов часть описаний стёрла версия 0.3.0. Откройте «LANCER Compendium Manager» и импортируйте книги заново (core и LCP), затем перезайдите в мир — тексты восстановятся и переведутся, у актёров тоже.`, { permanent: true });
  // метки (названия и подсказки)
  try {
    const cur = game.settings.get("lancer", "tagConfig") || {};
    const nx = foundry.utils.deepClone(cur); let ch = false;
    for (const [lid, t] of Object.entries(RU.tags)) {
      if (!nx[lid]) continue;
      const desc = String(t.d || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(\S+?)\]/g, " $1 ").replace(/\s+/g, " ").trim();
      if (nx[lid].name !== t.n || nx[lid].description !== desc) { nx[lid] = { ...nx[lid], name: t.n, description: desc }; ch = true; }
    }
    if (ch) { await game.settings.set("lancer", "tagConfig", nx); n++; }
  } catch (e) { console.warn(`${MOD} | метки`, e); }
  if (n && !quiet) ui.notifications.info(`Лансеровские штучки: переведено на русский — ${n}`);
  return n;
}
