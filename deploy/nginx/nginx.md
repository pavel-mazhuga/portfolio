# Настройка nginx: словарное сжатие zstd (`dcz`)

Compression Dictionary Transport ([RFC 9842](https://www.rfc-editor.org/rfc/rfc9842.html)) для
хешированных ассетов `_astro/`. Каждый ассет объявляет себя словарём для будущих версий того же
чанка, а билд заранее готовит сжатые дельты. У вернувшегося посетителя изменившийся чанк приезжает
за сотни байт вместо сотен килобайт.

Всю работу по сжатию делает билд (`frontend/scripts/dcz/`), поэтому от nginx нужно только:

1. отдать правильный заголовок `Use-As-Dictionary` на обычных ассетах;
2. подменить ответ на заранее сжатый файл, если браузер сообщил подходящий словарь.

**Модуль zstd для nginx не нужен** — тела уже сжаты на этапе билда. До установки сниппетов
`.dcz.js` файлы просто лежат в `_astro/` и никем не запрашиваются, сайт работает как раньше.

## Что требуется на сервере

- nginx с поддержкой регулярных `location` и именованных групп (любой современный, на проде 1.30.1);
- HTTPS с сертификатом от публично доверенного CA (Let's Encrypt подходит) — Chrome не использует
  словари на нештатных сертификатах, исключение только для `localhost`;
- каталог сборки, куда `rsync` кладёт `frontend/build` (далее `$TARGET/build`).

`ngx_brotli` не обязателен, но если его нет — удали строку `brotli off;` из
`compression-dictionary.conf`, иначе nginx не стартует с `unknown directive "brotli"`.

## Установка (один раз)

1. Скопировать сниппеты:

```bash
scp deploy/nginx/compression-dictionary*.conf $REMOTE_USER@$REMOTE_HOST:/etc/nginx/snippets/
```

2. Подключить их в конфиге сайта. `map` живёт в `http{}`, `location`-блоки — в `server{}`:

```nginx
http {
    # ...
    include /etc/nginx/snippets/compression-dictionary-map.conf;

    server {
        listen 443 ssl;
        http2 on;
        server_name pavelmazhuga.com;
        root /var/www/pavelmazhuga.com/build;

        # ВАЖНО: строго до любых других regex-location, которые матчат .js / .css,
        # и до prefix-location вида `location ^~ /_astro/` — nginx берёт первый
        # подошедший regex-location, а `^~` вообще отменяет проверку регулярок.
        include /etc/nginx/snippets/compression-dictionary.conf;

        location / {
            expires -1;              # HTML остаётся no-cache
            try_files $uri $uri/ =404;
        }
    }
}
```

3. Проверить и применить:

```bash
nginx -t && systemctl reload nginx
```

Конфиг не содержит ни одного хеша, поэтому при последующих деплоях его трогать не нужно.

### Если `_astro` отдаётся через `alias`

`try_files` внутри сниппета опирается на `$uri` относительно `root`. С `alias` эта конструкция
работает иначе (известный подвох nginx), поэтому проще переключить каталог на `root` или
скопировать сниппет и заменить в нём `${uri}` на полный путь через `$dcz_family`/`$dcz_hash`.

## Проверка после reload

```bash
# 1. Обычный ассет объявляет себя словарём для своего семейства чанков
curl -sSI https://pavelmazhuga.com/_astro/client.BFvOi2Pq.js |
    grep -iE 'use-as-dictionary|vary|cache-control'
# use-as-dictionary: match="/_astro/client*.js", id="BFvOi2Pq"
# vary: Accept-Encoding, Available-Dictionary
# cache-control: public, max-age=31536000, immutable
```

```bash
# 2. Найти на сервере готовую пару: <цель>.<id словаря>.dcz.<ext>
ls $TARGET/build/_astro/*.dcz.* | head
# .../Canvas.astro_..._lang.xiDgNZdE.js.BMyXVY8u.dcz.js
#     ^ цель: Canvas.astro_..._lang.xiDgNZdE.js    ^ Dictionary-ID: BMyXVY8u
```

```bash
# 3. Клиент со словарём BMyXVY8u должен получить дельту
curl -sS -o /dev/null -D - \
    -H 'Accept-Encoding: gzip, br, zstd, dcz' \
    -H 'Dictionary-ID: "BMyXVY8u"' \
    'https://pavelmazhuga.com/_astro/Canvas.astro_..._lang.xiDgNZdE.js' |
    grep -iE 'content-(encoding|length)'
# content-encoding: dcz
# content-length: 102

# 4. Тот же URL без словаря — обычный brotli
curl -sS -o /dev/null -D - -H 'Accept-Encoding: gzip, br' <тот же URL> |
    grep -iE 'content-(encoding|length)'
# content-encoding: br

# 5. Прямой запрос варианта закрыт
curl -s -o /dev/null -w '%{http_code}\n' 'https://pavelmazhuga.com/_astro/<...>.dcz.js'
# 404
```

В браузере: `chrome://net-internals/#sharedDictionary` показывает сохранённые словари,
в DevTools → Network у изменившихся чанков будет `Content-Encoding: dcz` и размер в сотни байт.

## Порядок деплоев

Билд берёт словари из **предыдущего** деплоя: перед сборкой CI скачивает
`https://pavelmazhuga.com/_astro/dcz-manifest.json` и сами файлы в `frontend/.dcz-prev/`.

- **Первый деплой** после мержа: манифеста на проде ещё нет, `pnpm dcz:prev` пишет warning и
  выходит с нулём. Появляются только пары внутри одного билда (родственные чанки), а сам манифест
  выкладывается на прод.
- **Со второго деплоя** появляются межбилдовые дельты — то, ради чего всё это делалось.

`rsync --delete-after` сам подчищает варианты прошлого билда, отдельного обслуживания нет.
Клиент со словарём двухлетней давности просто не найдёт свой вариант и получит brotli.

## Диагностика

| Симптом                                                        | Причина                                                                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `nginx: [emerg] unknown "dcz_id" variable`                     | не подключён `compression-dictionary-map.conf` в `http{}`                                                   |
| `unknown directive "brotli" in ...compression-dictionary.conf` | нет `ngx_brotli` — удалить строку `brotli off;` из сниппета                                                 |
| В ответе нет `Use-As-Dictionary`                               | сниппет подключён после другого `location`, матчащего `.js`/`.css` (или после `location ^~ /_astro/`)       |
| `Use-As-Dictionary` есть, но `Content-Encoding` всегда `br`    | на диске нет варианта под этот `Dictionary-ID` — норма для первого деплоя и для клиентов со старым словарём |
| Chrome не присылает `Available-Dictionary`                     | сайт открыт по http или сертификат не от публичного CA; либо ассет отдан с `no-store`/`no-cache`            |
| В ответе два заголовка `Content-Encoding` (`dcz` и `br`)       | тело пережали поверх `dcz` — вернуть в dcz-location `gzip off; brotli off;`, иначе браузер не декодирует    |

`brotli_static on;` / `gzip_static on;` совместимы: `try_files` отрабатывает раньше, поэтому
ветка со словарём отдаёт `.dcz`-файл, а ветка без словаря — заранее сжатый `.br`.

Полезный log_format на время обкатки:

```nginx
log_format dcz '$remote_addr $request_uri $status '
               'enc=$sent_http_content_encoding bytes=$body_bytes_sent dict=$http_dictionary_id';
access_log /var/log/nginx/pavelmazhuga.access.log dcz;
```

```
/_astro/World.D-aHXIT4.js 200 enc=dcz bytes=76    dict=\x22oaNv39Xi\x22
/_astro/World.D-aHXIT4.js 200 enc=br  bytes=10916 dict=-
```

Кавычки вокруг `Dictionary-ID` nginx экранирует как `\x22` — так и должно быть.

## Откат

Убрать оба `include`, `nginx -t && systemctl reload nginx`. Лишние `.dcz.*` файлы в `_astro/`
безвредны (сейчас это ~44 KB на билд), пересборка не нужна. Браузеры, у которых остались словари,
просто не получат на них ответ с `dcz` и продолжат качать обычный brotli.

## Границы применимости

- Работает в Chromium 130+. Остальные браузеры игнорируют `Use-As-Dictionary` и получают brotli.
- HTML не участвует: он отдаётся с `Cache-Control: no-cache`, такой ответ браузер словарём не
  сохраняет.
- `Vary: Accept-Encoding, Available-Dictionary` обязателен: он не даёт промежуточным кешам отдать
  дельту клиенту без словаря.
- Значение `Dictionary-ID` приходит от клиента, поэтому `map` пропускает ровно 8 символов из
  `[A-Za-z0-9_-]` — путь для `try_files` собрать из чужого ввода нельзя.
- Chrome не сохраняет словарём top-level скрипт web worker'а, поэтому билд дописывает в страницы,
  запускающие воркер, `<link rel="compression-dictionary" href="/_astro/canvas.worker-*.js">`. Это
  ожидаемый тег в HTML, а не мусор; на стороне nginx для него ничего настраивать не нужно.
