// Общие помощники модуля «Лансеровские штучки»
import { RU } from "./ru-data.mjs";
export { RU };
export const MOD = "lancer-shtuchki";
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const sgn = n => (n >= 0 ? "+" : "") + n;
/** Текст книги: **жирный**, переносы строк, значки [ТОЧН] и т.п. Всё экранируется. */
export function fmt(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\[(ТОЧН|НЕТОЧН|ЗАЩ)\]/g, '<span class="ls-ic">$1</span>')
    .replace(/\n/g, "<br>");
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
