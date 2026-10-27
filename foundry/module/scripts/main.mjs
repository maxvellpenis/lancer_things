// Точка входа модуля «Лансеровские штучки»
import { MOD } from "./util.mjs";
import { LsPilotSheet } from "./pilot-sheet.mjs";
import { LsMechSheet } from "./mech-sheet.mjs";

Hooks.once("init", () => {
  if (game.system.id !== "lancer") {
    console.warn(`${MOD} | работает только с системой LANCER`);
    return;
  }
  foundry.documents.collections.Actors.registerSheet(MOD, LsPilotSheet, {
    types: ["pilot"],
    makeDefault: false,
    label: "Лансеровские штучки — пилот",
  });
  foundry.documents.collections.Actors.registerSheet(MOD, LsMechSheet, {
    types: ["mech"],
    makeDefault: false,
    label: "Лансеровские штучки — мех",
  });
  console.log(`${MOD} | листы пилота и меха зарегистрированы`);
});
