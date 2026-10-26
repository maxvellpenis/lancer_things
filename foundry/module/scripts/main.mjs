// Точка входа модуля «Лансеровские штучки»
import { MOD } from "./util.mjs";
import { LsPilotSheet } from "./pilot-sheet.mjs";

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
  console.log(`${MOD} | лист пилота зарегистрирован`);
});
