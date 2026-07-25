# nginx: dictionary-compressed Zstandard (`dcz`)

The build writes pre-compressed `dcz` variants next to the hashed assets in `_astro/`
(see `frontend/scripts/dcz/`), so nginx only needs to pick the right file — no zstd module
and no per-deploy configuration changes. Until the snippets below are installed the variants
are simply unused files.

## Install (one time)

```bash
scp deploy/nginx/compression-dictionary*.conf root@$REMOTE_HOST:/etc/nginx/snippets/
```

```nginx
http {
    # ...
    include /etc/nginx/snippets/compression-dictionary-map.conf;

    server {
        server_name pavelmazhuga.com;
        # ...
        # Must come before other regex locations that match .js / .css,
        # because nginx uses the first matching regex location.
        include /etc/nginx/snippets/compression-dictionary.conf;
    }
}
```

```bash
nginx -t && systemctl reload nginx
```

## Verify

```bash
# any asset now advertises itself as a dictionary for its chunk family
curl -sSI https://pavelmazhuga.com/_astro/client.BFvOi2Pq.js | grep -i use-as-dictionary
# => use-as-dictionary: match="/_astro/client*.js", id="BFvOi2Pq"

# a client holding dictionary BFvOi2Pq gets the delta, if a variant exists for it
curl -sS -o /dev/null -D - \
    -H 'Accept-Encoding: br, zstd, dcz' \
    -H 'Dictionary-ID: "BFvOi2Pq"' \
    https://pavelmazhuga.com/_astro/client.NEWHASH.js | grep -iE 'content-(encoding|length)'
# => content-encoding: dcz
```

`chrome://net-internals/#sharedDictionary` lists the dictionaries a browser has stored.

## Notes

- Chromium 130+ only; other browsers ignore `Use-As-Dictionary` and get the usual brotli
  response. Requires HTTPS with a publicly trusted certificate (localhost is exempt).
- HTML is not covered: it is served with `Cache-Control: no-cache`, so browsers never keep
  it as a dictionary.
- `Vary: Accept-Encoding, Available-Dictionary` is what keeps intermediate caches from
  handing a delta to a client that has no matching dictionary.
