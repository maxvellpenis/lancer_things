# Лансеровские штучки

Неофициальный бесплатный фанатский помощник для настольной игры **Lancer**: библиотека и бой НИП, лист пилота как в Comp/Con, флот (Battlegroup), справочник правил, таблицы ГМа, редактор гекс-токенов. Работает в браузере без интернета; данные хранятся в браузере.

**Открыть:** `index.html` — это вся программа одним файлом. На GitHub Pages сайт открывается по адресу `https://<ваш-ник>.github.io/<имя-репозитория>/`.

## Как выложить на GitHub Pages
1. Создайте репозиторий (**New repository**), например `lancer-shtuchki`, публичный.
2. **Add file → Upload files**, перетащите все файлы из этой папки (`index.html`, `.nojekyll`, `README.md`, архив исходников) и нажмите **Commit changes**.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, ветка `main`, папка `/ (root)` → **Save**.
4. Через минуту-две сайт появится по адресу выше.

Обновление: загрузите новый `index.html` (и новый архив исходников) поверх старых, потом обновите страницу в браузере через Ctrl+F5.

## Исходники
`lancer-shtuchki-v34-src.zip` — все исходники и скрипты сборки (внутри свой README). Сборка: `python3 player-mode/build.py v34`.

## Правовое
Неофициальный некоммерческий фанатский инструмент: распространяется бесплатно, не продаётся и не связан с Massif Press.

«Лансеровские штучки» is not an official Lancer product; it is a third party work, and is not affiliated with Massif Press.
«Лансеровские штучки» is published via the Lancer Third Party License. Lancer is copyright Massif Press.

Спасибо Massif Press за систему и вселенную Lancer. Названия, правила, тексты и иллюстрации книг Lancer и дополнений принадлежат Massif Press и их авторам.
