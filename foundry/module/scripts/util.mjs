// Общие помощники модуля «Лансеровские штучки»
import { RU } from "./ru-data.mjs";
export { RU };
export const MOD = "lancer-shtuchki";
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const sgn = n => (n >= 0 ? "+" : "") + n;
/* ---------- текст книги: **жирный**, *курсив*, значки [ТОЧН]/[нагрев], карточки действий ⟦A⟧…⟦T⟧…⟦E⟧…⟦Z⟧ ---------- */
const ICO_RU = { "ТОЧН": ["acc", "точн."], "СЛОЖН": ["dif", "неточн."], "НЕТОЧН": ["dif", "неточн."], "кин": ["", "кин."], "энерг": ["", "энерг."], "взр": ["", "взр."], "горение": ["", "горения"], "нагрев": ["", "нагрева"],
  "Дальн": ["rg", "Дальн."], "Угроза": ["rg", "Угроза"], "Линия": ["rg", "Линия"], "Конус": ["rg", "Конус"], "Взрыв": ["rg", "Взрыв"], "Разрыв": ["rg", "Разрыв"], "ЗАЩ": ["", "защ."] };
function fmt1(s) {
  let h = esc(String(s ?? ""));
  h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  h = h.replace(/(^|[\s(>])\*([^*<\n]+?)\*(?=[\s.,;:)<]|$)/gm, "$1<i>$2</i>");
  h = h.replace(/\[(ТОЧН|СЛОЖН|НЕТОЧН|ЗАЩ|кин|энерг|взр|горение|нагрев|Дальн|Угроза|Линия|Конус|Взрыв|Разрыв)\]\s*/g, (m, k) => { const v = ICO_RU[k]; return `<span class="ls-ico ${v[0]}">${v[1]}</span>${v[0] === "rg" ? "&nbsp;" : " "}`; });
  return h.replace(/\n/g, "<br>");
}
export function fmt(s) {
  s = String(s ?? ""); let h = "", k = 0, m;
  const re = /⟦A(?::(\w))?⟧([\s\S]*?)⟦T⟧([\s\S]*?)⟦E⟧([\s\S]*?)(?:⟦Z⟧|(?=⟦A)|$)/g;
  while ((m = re.exec(s))) {
    const pre = s.slice(k, m.index).trim(); if (pre) h += fmt1(pre);
    const kind = m[1] || "r", name = m[2].trim(), tags = m[3].trim(), body = m[4].trim();
    h += `<div class="ls-abox k${kind}">${name || tags ? `<div class="ah">${name ? `<b>${esc(name)}</b>` : ""}${tags ? `<span>${fmt1(tags)}</span>` : ""}</div>` : ""}${body ? `<div class="ab">${fmt1(body)}</div>` : ""}</div>`;
    k = re.lastIndex;
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  const rest = s.slice(k).trim(); if (rest) h += fmt1(rest);
  return h;
}
export const asset = p => `modules/${MOD}/${p}`;
export const MANU = { GMS: "ДМС", "IPS-N": "ИПС-Н", SSC: "СШК", HORUS: "ХОРУС", HA: "ОПХ" };
export const MANU_FULL = { GMS: "Дженерал Массив Системс", "IPS-N": "ИПС-Нортсторм", SSC: "Смит-Шимано Корпус", HORUS: "ХОРУС", HA: "Оборонная Промышленность Хариссон" };
export const MANU_ORDER = ["GMS", "IPS-N", "SSC", "HORUS", "HA"];
export const MANU_COL = { GMS: "#991e2a", "IPS-N": "#3d5b9c", SSC: "#c9a21f", HORUS: "#1f9e5f", HA: "#7f3fb0" };
/** Русское имя по lid или исходное. */
export function ruName(kind, lid, fallback) {
  const x = RU[kind] && RU[kind][lid];
  return x ? x.n : fallback ?? lid;
}
export const lidOf = d => d?.system?.lid || "";

/* ---------- компендиумы системы Lancer (world.pilot-items, world.mech-items, world.npc-items) ---------- */
const CACHE = {};
export async function packDocs(packId, type) {
  const key = packId + "|" + type;
  if (CACHE[key]) return CACHE[key];
  const pack = game.packs.get(packId);
  if (!pack) return (CACHE[key] = []);
  let docs = [];
  try {
    docs = await pack.getDocuments({ type });
  } catch (e) {
    docs = (await pack.getDocuments()).filter(d => d.type === type);
  }
  return (CACHE[key] = docs);
}
export function clearPackCache() {
  for (const k of Object.keys(CACHE)) delete CACHE[k];
}
Hooks.on("updateCompendium", clearPackCache);
Hooks.on("createItem", (doc) => { if (doc?.pack) clearPackCache(); });

/** Сообщение в чат Foundry от имени актёра. */
export async function chat(actor, title, body) {
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="ls-chat"><div class="ls-chat-h">${esc(title)}</div><div class="ls-chat-b">${body}</div></div>`,
  });
}
/** Бросок кубов в чат (формула Foundry). */
export async function rollChat(actor, formula, title, extra) {
  const r = await new Roll(formula).evaluate();
  await r.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<b>${esc(title)}</b>${extra ? "<br>" + extra : ""}` });
  return r;
}

/* ---------- картинка жетона ---------- */
const DEF_IMG = ["icons/svg/mystery-man.svg", "systems/lancer/assets/icons/pilot.svg", "systems/lancer/assets/icons/mech.svg", "systems/lancer/assets/icons/npc_class.svg", "systems/lancer/assets/icons/deployable.svg"];
export const tokenImg = a => a.prototypeToken?.texture?.src || a.img;
/** Сменить картинку жетона: прототип + все жетоны этого актёра на всех сценах.
 *  Портрет в списке актёров тоже меняется, если он был стандартным или совпадал с жетоном. */
export async function setTokenImg(actor, path) {
  const oldTok = actor.prototypeToken?.texture?.src, oldImg = actor.img;
  const upd = { "prototypeToken.texture.src": path };
  if (!oldImg || DEF_IMG.includes(oldImg) || (typeof CONST !== "undefined" && oldImg === CONST.DEFAULT_TOKEN) || oldImg === oldTok) upd.img = path;
  await actor.update(upd);
  for (const scene of game.scenes ?? []) {
    const toks = scene.tokens.filter(t => t.actorId === actor.id && t.isOwner);
    if (!toks.length) continue;
    try { await scene.updateEmbeddedDocuments("Token", toks.map(t => ({ _id: t.id, "texture.src": path }))); }
    catch (e) { console.warn(`${MOD} | не удалось обновить жетон на сцене ${scene.name}`, e); }
  }
}
export function pickTokenImg(actor) {
  return new foundry.applications.apps.FilePicker.implementation({ type: "image", current: tokenImg(actor), callback: p => setTokenImg(actor, p) }).browse();
}
