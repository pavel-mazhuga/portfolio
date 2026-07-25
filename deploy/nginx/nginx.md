# Настройка nginx: словарное сжатие zstd (`dcz`)

Compression Dictionary Transport ([RFC 9842](https://www.rfc-editor.org/rfc/rfc9842.html)) для
хешированных ассетов `_astro/`. Каждый ассет объявляет себя словарём для будущих версий того же
чанка, а билд заранее готовит сжатые дельты. У вернувшегося посетителя изменившийся чанк приезжает
за сотни байт вместо сотен килобайт.

Всю работу по сжатию делает билд (`frontend/scripts/dcz/`), поэтому от nginx нужно только:

1. отдать правильный заголовок `Use-As-Dictionary` на обычных ассетах;
2. подменить ответ на заранее сжатый файл, если браузер сообщил подходящий словарь.

**Модуль zstd для nginx не нужен** — тела уже сжаты на этапе билда. До установки конфигов
`.dcz.js` файлы просто лежат в `_astro/` и никем не запрашиваются, сайт работает как раньше.

Этот файл — единственный источник правды по nginx для dcz. Отдельных `.conf` в репо нет:
конфиги ниже копируются на сервер вручную (один раз).

## Что требуется на сервере

- nginx с поддержкой регулярных `location` и именованных групп (на проде 1.30.1);
- HTTPS с сертификатом от публично доверенного CA (Let's Encrypt подходит) — Chrome не использует
  словари на нештатных сертификатах, исключение только для `localhost`;
- каталог сборки, куда `rsync` кладёт `frontend/build` (далее `$TARGET/build`).

`ngx_brotli` не обязателен, но если его нет — удали строку `brotli off;` из `dcz.conf`,
иначе nginx не стартует с `unknown directive "brotli"`.

## Два фрагмента конфига

### A. `map` — контекст `http {}`

Переменная `$dcz_id`: клиент должен и предложить кодировку `dcz`, и прислать
`Dictionary-ID` (8 символов хеша билда). `Available-Dictionary` — base64, в имя файла
не годится. Класс символов режет path traversal из клиентского ввода.

```nginx
# /etc/nginx/conf.d/dcz-map.conf  (или любой include внутри http{})
map "$http_accept_encoding:$http_dictionary_id" $dcz_id {
    default                                      "";
    "~*\bdcz\b.*:\"?(?<id>[A-Za-z0-9_-]{8})\"?$" $id;
}
```

### B. `location` — контекст `server {}`

Варианты на диске: `<asset>.<dictionary-hash>.dcz.<ext>`. Нет варианта → fallback на обычный
ассет (`@astro_asset`). Прямой запрос `*.dcz.js` / `*.dcz.css` → 404.

Базовый вид (без security-headers панели):

```nginx
# Variants are an implementation detail of the negotiation above.
location ~ "\.dcz\.(?:js|css)$" {
    return 404;
}

location ~ "^/_astro/(?<dcz_family>.+?)[.-](?<dcz_hash>[A-Za-z0-9_-]{8})\.(?<dcz_ext>js|css)$" {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header Vary "Accept-Encoding, Available-Dictionary" always;
    add_header Use-As-Dictionary 'match="/_astro/$dcz_family*.$dcz_ext", id="$dcz_hash"' always;
    add_header Content-Encoding "dcz" always;

    # nginx does not know the body is already compressed, and a 206 would ship the encoded
    # bytes without the Content-Encoding header.
    gzip off;
    brotli off;
    max_ranges 0;

    try_files "${uri}.${dcz_id}.dcz.${dcz_ext}" @astro_asset;
}

location @astro_asset {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header Vary "Accept-Encoding, Available-Dictionary" always;
    add_header Use-As-Dictionary 'match="/_astro/$dcz_family*.$dcz_ext", id="$dcz_hash"' always;
}
```

**Порядок location критичен:** эти regex должны идти до любых других regex, матчащих `.js`/`.css`,
и до `location ^~ /_astro/` — nginx берёт первый подошедший regex, а `^~` отменяет проверку
регулярок вообще.

`try_files` опирается на `$uri` относительно `root`. С `alias` для `/_astro` конструкция
ломается — лучше `root`, либо собрать путь из `$dcz_family` / `$dcz_hash` вручную.

---

## Установка на pavelmazhuga.com (ISPmanager)

Панель генерирует vhost `/etc/nginx/vhosts/www-root/pavelmazhuga.com.conf` и может его
перезаписать. Своё держим в подключаемых каталогах; в панельном vhost — минимум правок.

### 1. Map → `/etc/nginx/conf.d/dcz-map.conf`

Проверить, что `conf.d` подключён в `http{}`:

```bash
grep -n 'include' /etc/nginx/nginx.conf
# должно быть: include /etc/nginx/conf.d/*.conf;
```

Создать файл (содержимое = фрагмент A выше):

```bash
sudo tee /etc/nginx/conf.d/dcz-map.conf <<'EOF'
map "$http_accept_encoding:$http_dictionary_id" $dcz_id {
    default                                      "";
    "~*\bdcz\b.*:\"?(?<id>[A-Za-z0-9_-]{8})\"?$" $id;
}
EOF
```

В панельном vhost **не** должно быть `map ... $dcz_id` и include map-файла — иначе дубль
переменной или потеря map при перегенерации панели.

### 2. Locations → `/etc/nginx/vhosts-resources/pavelmazhuga.com/dcz.conf`

Каталог уже подключается обоими `server`-блоками:

```nginx
include /etc/nginx/vhosts-resources/pavelmazhuga.com/*.conf;
```

Нужна копия фрагмента B плюс `access_log off;` и `include .../security-headers.conf` —
**обязательно**: `add_header` внутри `location` отменяет унаследованные `add_header`, без
этого js/css потеряют HSTS/XFO/etc.

```bash
sudo tee /etc/nginx/vhosts-resources/pavelmazhuga.com/dcz.conf <<'EOF'
location ~ "\.dcz\.(?:js|css)$" {
    return 404;
}

location ~ "^/_astro/(?<dcz_family>.+?)[.-](?<dcz_hash>[A-Za-z0-9_-]{8})\.(?<dcz_ext>js|css)$" {
    access_log off;
    include /etc/nginx/vhosts-resources/pavelmazhuga.com/security-headers.conf;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header Vary "Accept-Encoding, Available-Dictionary" always;
    add_header Use-As-Dictionary 'match="/_astro/$dcz_family*.$dcz_ext", id="$dcz_hash"' always;
    add_header Content-Encoding "dcz" always;

    gzip off;
    brotli off;
    max_ranges 0;

    try_files "${uri}.${dcz_id}.dcz.${dcz_ext}" @astro_asset;
}

location @astro_asset {
    access_log off;
    include /etc/nginx/vhosts-resources/pavelmazhuga.com/security-headers.conf;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header Vary "Accept-Encoding, Available-Dictionary" always;
    add_header Use-As-Dictionary 'match="/_astro/$dcz_family*.$dcz_ext", id="$dcz_hash"' always;
}
EOF
```

Нет `ngx_brotli` → удали `brotli off;` из этого файла.

**Не** подключай тот же блок ещё раз через `include /etc/nginx/snippets/...` в vhost —
будет duplicate location.

### 3. Правки в панельном vhost

Панель → Сайты → pavelmazhuga.com → конфигурация nginx.

Обязательно убрать `^~`:

```diff
-    location ^~ /_astro {
+    location /_astro {
```

Со `^~` regex из `dcz.conf` мёртв — ассеты идут обычным brotli без `Use-As-Dictionary`.
Без `^~` js/css попадают в наш regex; остальное в `_astro` (`.wasm`, картинки, шрифты)
обслуживает prefix-`location /_astro`.

Заодно:

- убрать `expires 1y;` у `/_astro` — вместе с `add_header Cache-Control` даёт два
  `Cache-Control` в одном ответе;
- не дублировать `include .../security-headers.conf` на уровне `server`, если он уже
  есть в каждом `location` / в `dcz.conf` (иначе риск двойных заголовков);
- в `security-headers.conf` каждая директива `add_header` — **один раз** (двойной HSTS
  был из двух одинаковых строк в этом файле).

Блок порта 80 тоже подхватит `dcz.conf` через `*.conf`, но `return 301` на уровне `server`
идёт в rewrite-фазе до выбора `location` — https-редирект не ломается.

### 4. Применить

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Конфиг без хешей билда — при деплоях фронта nginx трогать не нужно.

Если панель перегенерирует vhost и вернёт `^~`, dcz тихо отключится (все ответы снова `br`).
После правок сайта в панели — прогнать проверку №1 ниже.

---

## Проверка после reload

```bash
# 1. Обычный ассет = словарь + security headers (HSTS ровно один раз)
ASSET=$(curl -sS https://pavelmazhuga.com/ | grep -oE '/_astro/[^"[:space:]]+\.js' | head -1)
curl -sSI "https://pavelmazhuga.com$ASSET" |
    grep -iE 'use-as-dictionary|vary|cache-control|strict-transport|x-frame|content-encoding'
# use-as-dictionary: match="/_astro/....*.js", id="........"
# vary: Accept-Encoding, Available-Dictionary
# cache-control: public, max-age=31536000, immutable
# content-encoding: br   (без словаря)
curl -sSI https://pavelmazhuga.com/ | grep -ci 'strict-transport-security'
# → 1
```

```bash
# 2. На сервере готовая пара: <цель>.<id словаря>.dcz.<ext>
ls $TARGET/build/_astro/*.dcz.* | head
# .../Canvas.astro_..._lang.xiDgNZdE.js.BMyXVY8u.dcz.js
#     ^ цель: Canvas.astro_..._lang.xiDgNZdE.js    ^ Dictionary-ID: BMyXVY8u
```

```bash
# 3. Клиент со словарём BMyXVY8u → дельта
curl -sS -o /dev/null -D - \
    -H 'Accept-Encoding: gzip, br, zstd, dcz' \
    -H 'Dictionary-ID: "BMyXVY8u"' \
    'https://pavelmazhuga.com/_astro/Canvas.astro_..._lang.xiDgNZdE.js' |
    grep -iE 'content-(encoding|length)'
# content-encoding: dcz
# content-length: 102

# 4. Тот же URL без словаря → brotli
curl -sS -o /dev/null -D - -H 'Accept-Encoding: gzip, br' <тот же URL> |
    grep -iE 'content-(encoding|length)'
# content-encoding: br

# 5. Прямой запрос варианта закрыт
curl -s -o /dev/null -w '%{http_code}\n' 'https://pavelmazhuga.com/_astro/<...>.dcz.js'
# 404
```

В браузере: `chrome://net-internals/#sharedDictionary` — сохранённые словари;
DevTools → Network у изменившихся чанков — `Content-Encoding: dcz`, размер в сотни байт.

## Порядок деплоев

Билд берёт словари из **предыдущего** деплоя: перед сборкой CI скачивает
`https://pavelmazhuga.com/_astro/dcz-manifest.json` и сами файлы в `frontend/.dcz-prev/`.

- **Первый деплой** после настройки: манифеста на проде ещё нет, `pnpm dcz:prev` пишет warning
  и выходит с нулём. Появляются только пары внутри одного билда, манифест выкладывается на прод.
- **Со второго деплоя** — межбилдовые дельты.

`rsync --delete-after` чистит варианты прошлого билда. Клиент со старым словарём не найдёт
вариант и получит brotli.

## Диагностика

| Симптом                                                        | Причина                                                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `nginx: [emerg] unknown "dcz_id" variable`                     | нет `/etc/nginx/conf.d/dcz-map.conf` (или не в `http{}`)                                             |
| `duplicate "dcz_id" variable`                                  | map объявлен дважды (conf.d + vhost)                                                                 |
| `unknown directive "brotli"`                                   | нет `ngx_brotli` — удалить `brotli off;` из `dcz.conf`                                               |
| `duplicate location`                                           | `dcz.conf` и ещё один include того же блока в vhost                                                  |
| В ответе нет `Use-As-Dictionary`                               | `location ^~ /_astro` или другой regex раньше матчит `.js`/`.css`                                    |
| `Use-As-Dictionary` есть, но `Content-Encoding` всегда `br`    | нет файла под этот `Dictionary-ID` — норма для первого деплоя / старого словаря                      |
| Chrome не шлёт `Available-Dictionary`                          | http или непубличный CA; либо ассет с `no-store`/`no-cache`                                          |
| Два `Content-Encoding` (`dcz` и `br`)                          | тело пережали — вернуть `gzip off; brotli off;` в dcz-location                                       |
| Два `Strict-Transport-Security`                                | дубль строки в `security-headers.conf` или двойной include этого файла на один ответ                 |

`brotli_static on;` / `gzip_static on;` совместимы: `try_files` раньше, ветка со словарём
отдаёт `.dcz`, без словаря — `.br`.

Log format на обкатку:

```nginx
log_format dcz '$remote_addr $request_uri $status '
               'enc=$sent_http_content_encoding bytes=$body_bytes_sent dict=$http_dictionary_id';
access_log /var/log/nginx/pavelmazhuga.access.log dcz;
```

```
/_astro/World.D-aHXIT4.js 200 enc=dcz bytes=76    dict=\x22oaNv39Xi\x22
/_astro/World.D-aHXIT4.js 200 enc=br  bytes=10916 dict=-
```

Кавычки вокруг `Dictionary-ID` в логе как `\x22` — норма.

## Откат

Удалить `/etc/nginx/conf.d/dcz-map.conf` и
`/etc/nginx/vhosts-resources/pavelmazhuga.com/dcz.conf`, затем
`nginx -t && systemctl reload nginx`. Файлы `.dcz.*` в `_astro/` безвредны (~десятки KB на
билд), пересборка не нужна. Клиенты со словарями просто снова качают brotli.

## Границы применимости

- Chromium 130+. Остальные игнорируют `Use-As-Dictionary` → brotli.
- HTML не участвует (`Cache-Control: no-cache` — браузер таким словарём не сохраняет).
- `Vary: Accept-Encoding, Available-Dictionary` обязателен — иначе промежуточный кеш может
  отдать дельту клиенту без словаря.
- `Dictionary-ID` с клиента: map пропускает ровно 8 символов `[A-Za-z0-9_-]`.
- Chrome не сохраняет словарём top-level скрипт web worker'а — билд дописывает
  `<link rel="compression-dictionary" href="/_astro/canvas.worker-*.js">`. На nginx для
  этого ничего не нужно.
