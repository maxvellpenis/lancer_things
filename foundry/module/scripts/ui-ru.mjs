// Перевод «зашитых» английских надписей системы LANCER (окна бросков, урона, структуры, карточки в чате, листы НИП).
// Строки, которые система берёт из языкового файла, переводит lang/ru.json; здесь — то, что вписано прямо в код.
const D = {
  // окно броска атаки / проверки
  "Flat Modifier": "Модификатор", "Grit:": "Стойкость:", "Tier:": "Ранг:", "Tech Attack:": "Тех. атака:", "Weapon Base:": "Оружие:", "Tech Item Base:": "Система:",
  "Total:": "Итого:", "Accuracy": "Точность", "Difficulty": "Неточность", "Manual Adjust": "Вручную", "Targeting": "Цели", "Total": "Итого",
  "Accurate (+1)": "Точное (+1)", "Inaccurate (-1)": "Неточное (−1)", "Smart (*)": "Умное (*)", "Seeking (*)": "Искатель (*)", "Thrown (*)": "Метание (*)",
  "Impaired (-1)": "Ослаблен (−1)", "Engaged (-1)": "Вовлечён (−1)", "Lock On (+1)": "Захват (+1)", "Consume Lock On (+1)": "Потратить Захват (+1)",
  "Prone (+1)": "Цель сбита с ног (+1)", "Stunned (EVA=5)": "Цель ошеломлена (Укл.=5)", "Stunned": "Ошеломлён", "Invisible (*)": "Невидим (*)", "Spotter (*)": "Корректировщик (*)",
  "No Cover": "Без укрытия", "Soft Cover (-1)": "Лёгкое укрытие (−1)", "Hard Cover (-2)": "Твёрдое укрытие (−2)", "Cover": "Укрытие",
  "Roll": "Бросить", "Cancel": "Отмена", "Escape": "Отмена",
  "Increase accuracy": "Добавить точность", "Increase difficulty": "Добавить неточность", "Increase flat bonus": "Увеличить модификатор", "Decrease flat bonus": "Уменьшить модификатор",
  "Add global accuracy": "Добавить точность", "Add global difficulty": "Добавить неточность", "Global Accuracy/Difficulty Adjustment": "Точность/неточность для всех целей",
  "Attack bonus": "Бонус атаки",
  // окно урона
  "Base Damage": "Основной урон", "Bonus Damage": "Бонусный урон", "Bonus": "Бонус", "Configuration": "Настройки",
  "Armor Piercing (AP)": "Бронебойное (ББ)", "Cannot be Reduced": "Нельзя уменьшить", "Half Damage": "Половина урона", "Overkill": "Избыточный Урон", "Reliable": "Надёжное",
  "Crit": "Крит", "Hit": "Попадание", "Miss": "Промах", "Damage Roll": "Бросок урона", "Remove this damage type": "Убрать этот тип урона",
  "Add a base damage type": "Добавить тип основного урона", "Add a bonus damage type": "Добавить тип бонусного урона", "Add new base damage type": "Добавить тип основного урона",
  "Add new bonus damage type": "Добавить тип бонусного урона", "Add a bonus damage type for only this target": "Бонусный урон только по этой цели",
  "For effects which cause the attacker to deal half damage in addition to resistance, like Heavy Gunner": "Для эффектов, из-за которых атакующий наносит половину урона (вдобавок к сопротивлению), как у «Тяжёлого Стрелка»",
  "Kinetic": "Кинетический", "Energy": "Энергетический", "Explosive": "Взрывной", "Heat": "Нагрев", "Burn": "Горение", "Variable": "На выбор",
  // структура / нагрузка
  "Structure Damage": "Урон структуре", "Stress Damage": "Урон нагрузке", "UNKNOWN MECH": "НЕИЗВЕСТНЫЙ МЕХ",
  // заголовки и кнопки бросков
  "BASIC ATTACK": "БАЗОВАЯ АТАКА", "TECH ATTACK": "ТЕХ. АТАКА", "CASCADE": "КАСКАД", "FULL REPAIR": "ПОЛНЫЙ РЕМОНТ", "System Destruction": "Система уничтожена",
  "Weapon Destruction": "Оружие уничтожено", "BURN :: ENG": "ГОРЕНИЕ :: ИНЖ", "UNKNOWN ACTION": "НЕИЗВЕСТНОЕ ДЕЙСТВИЕ", "OVERCHARGE": "ПЕРЕГРУЗКА",
  "Reroll this attack": "Перебросить атаку", "This row is bonus damage": "Это бонусный урон", "BONUS": "БОНУС",
  "EVASION": "УКЛОНЕНИЕ", "E-DEF": "Э-ЗАЩИТА", "HULL": "КОРПУС", "AGILITY": "МАНЕВРЕННОСТЬ", "SYSTEMS": "СИСТЕМЫ", "ENGINEERING": "ИНЖЕНЕРИЯ", "GRIT": "СТОЙКОСТЬ",
  "Hull": "Корпус", "Agility": "Маневренность", "Systems": "Системы", "Engineering": "Инженерия", "Structure": "Структура", "Stress": "Нагрузка", "Speed": "Скорость",
  "Sensor Range": "Сенсоры", "Save Target": "Спас. Цель", "Max HP": "Макс. ПЗ", "Heat Cap": "Тепл. Макс.", "Evasion": "Уклонение", "E-Defense": "Э-Защита", "Armor": "Броня",
  "WEAPONS": "ОРУЖИЕ", "TRAITS": "ЧЕРТЫ", "TECH ATTACKS": "ТЕХ. АТАКИ", "Please select your two Stabilize actions": "Выберите два эффекта Стабилизации",
  "Restore HP": "Восстановить ПЗ", "Reload": "Перезарядить", "Clear Burn": "Снять горение", "Clear Own Condition": "Снять своё состояние", "Clear Ally Condition": "Снять состояние союзника",
  "Cool Mech": "Охладить мех", "OPTION 1": "ВАРИАНТ 1", "OPTION 2": "ВАРИАНТ 2", "CASCADE CHECK": "ПРОВЕРКА КАСКАДА",
  // листы (НИП и прочее, что ещё открывается в листах системы)
  "ACTIONS": "ДЕЙСТВИЯ", "BONUSES": "БОНУСЫ", "// BONUSES": "// БОНУСЫ", "COUNTERS": "СЧЁТЧИКИ", "DEPLOYABLES": "РАЗВЁРТЫВАЕМОЕ", "SYNERGIES": "СИНЕРГИИ",
  "INTEGRATED ITEMS": "ВСТРОЕННОЕ", "TAGS": "МЕТКИ", "DESCRIPTION": "ОПИСАНИЕ", "EFFECT": "ЭФФЕКТ", "TRIGGER": "ТРИГГЕР", "USES": "ЗАРЯДЫ", "Uses": "Заряды",
  "STATUS": "СОСТОЯНИЕ", "TYPE": "ТИП", "PASSIVE": "ПАССИВНО", "ACTIVE": "АКТИВНО", "OPTIONAL FEATURES": "ДОП. ЧЕРТЫ", "BASE FEATURES": "БАЗОВЫЕ ЧЕРТЫ",
  "ON HIT": "ПРИ ПОПАДАНИИ", "INTEGRATED GEAR": "ВСТРОЕННОЕ СНАРЯЖЕНИЕ", "RANK": "РАНГ", "Rank": "Ранг", "RANK:": "РАНГ:", "USE": "ИСПОЛЬЗОВАТЬ", "QUICK": "БЫСТРОЕ",
  "FULL": "ПОЛНОЕ", "REACTION": "РЕАКЦИЯ", "PROTOCOL": "ПРОТОКОЛ", "OTHER": "ДРУГОЕ", "NONE": "НЕТ", "LOADED": "ЗАРЯЖЕНО", "CHARGED": "ЗАРЯЖЕНО", "CONSUMABLE": "РАСХОДУЕМОЕ",
  "No Mod Installed": "Мод не установлен", "No License": "Нет лицензии", "Empty": "Пусто", "DELETE": "УДАЛИТЬ", "DROP HERE": "ПЕРЕТАЩИТЕ СЮДА",
  "DROP NPC FEATURES HERE": "ПЕРЕТАЩИТЕ СЮДА ЧЕРТЫ НИП", "FEATURE TYPE:": "ТИП ЧЕРТЫ:", "MAX HP": "МАКС. ПЗ", "SOURCE": "ИСТОЧНИК", "SIZE": "РАЗМЕР",
  "MOUNTED WEAPONS": "ОРУЖИЕ В СЛОТАХ", "MOUNTED SYSTEMS": "СИСТЕМЫ", "AVAILABLE WEAPON MOUNTS": "ДОСТУПНЫЕ СЛОТЫ", "MAIN": "ОСНОВНОЙ", "HEAVY": "ТЯЖЁЛЫЙ",
  "FLEX": "ГИБКИЙ", "MAIN/AUX": "ОСН./ВСПОМ.", "AUX/AUX": "ВСПОМ./ВСПОМ.", "SUPERHEAVY": "СВЕРХТЯЖЁЛЫЙ", "INTEGRATED": "ВСТРОЕННЫЙ", "LOCKED: BRACING": "ЗАНЯТ: УПОР",
  "CORE": "ЯДРО", "// CORE SYSTEM": "// СИСТЕМА ЯДРА", "// PASSIVE": "// ПАССИВНО", "// ACTIVE": "// АКТИВНО", "// Bonuses": "// Бонусы", "Effect": "Эффект",
  "Prerequisite": "Требование", "Resist": "Сопротивление", "Value:": "Значение:", "Min:": "Мин.:", "Max:": "Макс.:", "Name": "Имя",
  "INIT": "НАЧАЛО", "View Inventory": "Инвентарь", "Equip weapon": "Взять оружие", "Equip gear": "Взять снаряжение", "Equip armor": "Надеть броню", "Equip reserve": "Взять резерв",
};
const RX = [
  [/^Total vs (.+)$/, "Итого против $1"], [/^(.+) DAMAGE$/, "$1 — УРОН"], [/^FULL REPAIR - (.+)$/, "ПОЛНЫЙ РЕМОНТ — $1"], [/^STABILIZE - (.+)$/, "СТАБИЛИЗАЦИЯ — $1"],
  [/^RESERVE :: (.+)$/, "РЕЗЕРВ :: $1"], [/^CORE ACTIVATION :: (.+)$/, "АКТИВАЦИЯ ЯДРА :: $1"], [/^SCAN: (.+)$/, "СКАНИРОВАНИЕ: $1"],
];
const ATTR = ["title", "aria-label", "data-tooltip", "placeholder"];
const ROOTS = ".lancer-hud, #hudzone, .chat-message, .application.lancer, .lancer-hud-zone, .lancer-flow-button-grid";

function tr(s) {
  const t = s.trim().replace(/\s+/g, " "); if (!t || t.length > 200) return null;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  if (D[t]) return lead + D[t] + trail;
  for (const [re, to] of RX) if (re.test(t)) return lead + t.replace(re, to) + trail;
  return null;
}
function walk(root) {
  if (root.nodeType === 3) { const n = tr(root.nodeValue); if (n !== null && n !== root.nodeValue) root.nodeValue = n; return; }
  if (root.nodeType !== 1) return;
  if (root.matches?.("input, textarea, [contenteditable], .editor-content, .ProseMirror")) return;
  for (const a of ATTR) if (root.hasAttribute?.(a)) { const n = tr(root.getAttribute(a)); if (n !== null) root.setAttribute(a, n); }
  for (const c of root.childNodes) walk(c);
}
const inRoot = n => (n.nodeType === 1 ? n : n.parentElement)?.closest?.(ROOTS);
export function startUiRu() {
  document.querySelectorAll(ROOTS).forEach(walk);
  const mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === "characterData") { if (inRoot(m.target)) walk(m.target); continue; }
      if (m.type === "attributes") { if (inRoot(m.target)) { const n = tr(m.target.getAttribute(m.attributeName) || ""); if (n !== null) m.target.setAttribute(m.attributeName, n); } continue; }
      for (const n of m.addedNodes) { if (n.nodeType === 1 && n.matches?.(ROOTS)) walk(n); else if (inRoot(n)) walk(n); else if (n.nodeType === 1) n.querySelectorAll?.(ROOTS).forEach(walk); }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
}
