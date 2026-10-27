// Точка входа модуля «Лансеровские штучки»
import { MOD } from "./util.mjs";
import { LsPilotSheet } from "./pilot-sheet.mjs";
import { LsMechSheet } from "./mech-sheet.mjs";
import { LsItemSheet, LS_ITEM_TYPES } from "./item-sheet.mjs";
import { russifyWorld, enName } from "./ru-items.mjs";
import { startUiRu } from "./ui-ru.mjs";

Hooks.once("init", () => {
  if (game.system.id !== "lancer") {
    console.warn(`${MOD} | работает только с системой LANCER`);
    return;
  }
  const Actors = foundry.documents.collections.Actors, Items = foundry.documents.collections.Items;
  Actors.registerSheet(MOD, LsPilotSheet, { types: ["pilot"], makeDefault: true, label: "Лансеровские штучки — пилот" });
  Actors.registerSheet(MOD, LsMechSheet, { types: ["mech"], makeDefault: true, label: "Лансеровские штучки — мех" });
  Items.registerSheet(MOD, LsItemSheet, { types: LS_ITEM_TYPES, makeDefault: true, label: "Лансеровские штучки" });
  game.settings.register(MOD, "autoRu", {
    name: "Переводить предметы на русский", scope: "world", config: true, type: Boolean, default: true,
    hint: "При входе ГМа названия и тексты предметов в компендиумах, у актёров и метки заменяются русскими из «Лансеровских штучек». Новые предметы переводятся сразу. Нужно повторно после импорта LCP — это произойдёт само при следующем входе.",
  });
  console.log(`${MOD} | листы зарегистрированы`);
});

Hooks.once("setup", () => {
  // система ищет арт меха по английскому имени рамы — подставляем его, раз имена теперь русские
  const proto = CONFIG.Actor.documentClass?.prototype;
  if (proto?.swapFrameImage && !proto.swapFrameImage.__ls) {
    const orig = proto.swapFrameImage;
    proto.swapFrameImage = function (f) { return orig.call(this, f && f.type === "frame" ? { name: enName(f), type: "frame" } : f); };
    proto.swapFrameImage.__ls = true;
  }
});

Hooks.once("ready", async () => {
  if (game.system.id !== "lancer") return;
  startUiRu();
  game.modules.get(MOD).api = { russifyWorld };
  if (game.user.isGM && game.settings.get(MOD, "autoRu")) {
    try { await russifyWorld(); } catch (e) { console.error(`${MOD} | перевод`, e); }
  }
});
