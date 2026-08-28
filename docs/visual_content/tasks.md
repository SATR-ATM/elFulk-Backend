# Visual Content Module — PoC Implementation Tasks

---

## Phase 1 — Docker & yt-dlp baseline

- [ ] **Set up `Dockerfile` with `yt-dlp` and the `bgutil` poToken sidecar**

  Install Python and `yt-dlp` (pinned to a specific version via a `YTDLP_VERSION` build arg) directly into the NestJS backend image. `yt-dlp` is a CLI tool with no HTTP server mode — it runs as a subprocess inside the NestJS container each time a manifest is needed.

  Set up a `docker-compose.yml` with two services: the NestJS backend and the `bgutil-ytdlp-pot-provider` sidecar. The sidecar is what runs as an HTTP server — it handles PO token generation and caching, and `yt-dlp` is configured to reach it over HTTP to fetch tokens during extraction. The sidecar should be reachable from the backend container by name on an internal port only (no public exposure). Add a `TOKEN_TTL` env var on the sidecar (default: `21600`).

---

## Phase 2 — NestJS wiring

- [ ] **Invoke `yt-dlp` from NestJS via a dummy endpoint**

  Create a throwaway `GET /test/ytdlp?videoId=<id>` endpoint that shells out to `yt-dlp` using `child_process.spawn` (or `execFile`) and returns the raw stdout. Use `--dump-json --no-download --no-playlist` flags. The goal is just to confirm the subprocess works, the sidecar is reachable, and the poToken flow does not error out. Delete or gate this endpoint before merging.

- [ ] **Create the `Streaming` NestJS module**

  Scaffold `StreamingModule` with its own folder. Register it in `AppModule`. For now it can be empty — the controller and services will be added in subsequent tasks.

- [ ] **Create `ExtractionService`**

  Lives inside `StreamingModule`. Responsible for invoking `yt-dlp` as a child process and returning parsed JSON output. Key details:
  - Run `yt-dlp --dump-json --no-download --no-playlist <video_url>` via `child_process.spawn`.
  - Collect stdout, handle stderr, and reject on non-zero exit codes with a typed error.
  - Parse and return the raw format array from yt-dlp's JSON output (the `formats` field).
  - Do not implement caching or locking yet — that comes in Phase 5.

---

## Phase 3 — Manifest generation

- [ ] **Identify the relevant fields from `yt-dlp` JSON output for each target resolution**

  Run `yt-dlp --dump-json <video_url>` on a sample video and inspect the `formats` array. For each format entry, the fields you need are:
  - `format_id` — used to identify the stream in the manifest
  - `url` — the direct YouTube CDN URL
  - `ext` / `vcodec` / `acodec` — to distinguish video-only, audio-only, and muxed streams
  - `height` — to match against target resolutions `[144, 240, 360, 480, 720, 1080]`
  - `tbr` / `vbr` / `abr` — bitrate, used to pick the best stream per resolution when multiple candidates exist
  - `expire` param inside `url` — parse the integer from the URL query string; used to derive the Redis TTL (expire timestamp − 10 minutes)

  For DASH you want separate video-only and audio-only streams. Select the best audio stream (highest `abr` among entries where `acodec != "none"` and `vcodec == "none"`). For each target resolution, pick the video-only stream with the matching `height` and highest `vbr`.

- [ ] **Implement `ExtractionService.generateManifests(videoId)`**

  Extend `ExtractionService` with a method that:
  1. Calls `yt-dlp` and gets the raw format list.
  2. Filters to the target video resolutions and best audio stream as described above.
  3. Parses the `expire` timestamp from one of the CDN URLs to compute `ttlSeconds`.
  4. Builds a DASH MPD string (a static `<MPD>` XML with one `AdaptationSet` for video and one for audio, each with `<Representation>` elements pointing to CDN URLs via `<BaseURL>`).
  5. Builds an HLS master playlist string (`.m3u8`) with one `#EXT-X-STREAM-INF` per resolution and one `#EXT-X-MEDIA` tag for audio.
  6. Returns `{ dash: string, hls: string, ttlSeconds: number }`.

  Keep the XML/m3u8 generation in a small dedicated helper (e.g., `ManifestBuilder`) to keep `ExtractionService` readable.

---

## Phase 4 — HTTP layer

- [ ] **Create `StreamingController` with a manifest endpoint**

  `GET /manifest/:videoId` — the main endpoint. Accepts a `format` query parameter (`dash` or `hls`, default `dash`). Returns the appropriate manifest with the correct `Content-Type`:
  - DASH → `Content-Type: application/dash+xml`
  - HLS → `Content-Type: application/vnd.apple.mpegurl`

  Set `Cache-Control: no-store` on the response (caching is handled server-side in Redis; the client should never cache the manifest itself). For now, call `ExtractionService.generateManifests()` directly on every request — no Redis involved yet.

- [ ] **Set up a minimal frontend to test playback end-to-end**

  Either ask the frontend team to wire up Shaka Player against `GET /manifest/:videoId?format=dash`, or create a standalone `index.html` (not part of the NestJS app) that loads Shaka from a CDN and points it at the local manifest endpoint. The goal is to confirm that a real video plays at multiple resolutions before adding any caching or failure logic.

  > If anything is broken at this point — manifest structure, CDN URL format, resolution selection, audio sync — report it in the group chat before continuing.

---

## Phase 5 — Redis caching

- [ ] **Add Redis to the Docker Compose setup**

  Add a `redis` service to `docker-compose.yml` using the official Redis image. Mount a config file that enables AOF persistence:

  ```
  appendonly yes
  appendfsync everysec
  ```

  Expose port `6379` internally only. Add `@nestjs/cache-manager` and `cache-manager-redis-yet` (or `ioredis` directly) to the NestJS app and wire up the connection in `AppModule`.

- [ ] **Cache manifests in `ExtractionService` with a distributed lock**

  Wrap `ExtractionService.generateManifests()` with the following logic, in order:
  1. Check Redis for `manifest:{videoId}`. If present, return it immediately (warm path, target < 200ms).
  2. Attempt `SET NX EX 30` on `lock:{videoId}`. If the lock is **not** acquired, poll Redis every 500ms for up to 25 seconds waiting for `manifest:{videoId}` to appear, then return it. This handles concurrent requests for the same video — only one process runs yt-dlp.
  3. If the lock **is** acquired: run yt-dlp, build manifests, store `yt-dlp:{videoId}` (raw formats JSON) and `manifest:{videoId}` in Redis with TTL = `ttlSeconds`. Release the lock.

  `manifest:{videoId}` should be stored as a JSON object containing both formats: `{ dash: string, hls: string }`. The controller picks the right field based on the `format` query parameter. This keeps both formats in one key, consistent with the Redis key schema in the spec, and avoids introducing a separate `hls:{videoId}` key.

  Store the raw yt-dlp JSON separately under `yt-dlp:{videoId}` — it will be needed in Phase 6 to build the failover manifest without re-running yt-dlp.

---

## Phase 6 — CDN failure & proxy fallback

- [ ] **Add `POST /video/:videoId/failure` endpoint**

  Accepts `{ formatIds: string[] }` in the body — the list of format IDs that Shaka failed to stream after its internal retries (3 attempts, exponential backoff starting at 1s). No failure counter is incremented at this stage.

  The endpoint:
  1. Reads `manifest:{videoId}` from Redis.
  2. For each format ID in `formatIds`, replaces the CDN `<BaseURL>` (in DASH) or stream URL (in HLS) with a proxy URL pointing to `/proxy/:videoId/:formatId`.
  3. Saves the modified manifest as `failover:{videoId}` in Redis (same TTL as the original). The original `manifest:{videoId}` is **not** touched.
  4. Returns the failover manifest to the client.

  After receiving the failover manifest, the client reloads it. Formats not in `formatIds` continue streaming from the CDN directly; the failed ones are routed through the backend proxy.

- [ ] **Create `ProxyService` and `GET /proxy/:videoId/:formatId`**

  `ProxyService` looks up the CDN URL for the given `formatId` from `yt-dlp:{videoId}` in Redis, then pipes the incoming request to that CDN URL — forwarding the response stream and relevant headers (`Content-Type`, `Content-Length`, `Content-Range`, `Accept-Ranges`) back to the client. Support range requests so the player can seek.

  If the CDN responds with `403` or `410`:
  1. Increment `failures:{videoId}` in Redis. **Do not set a TTL on this key** — it must persist until explicitly reset via the admin panel.
  2. Evict `manifest:{videoId}`, `yt-dlp:{videoId}`, and `failover:{videoId}` from Redis. Leave `failures:{videoId}` intact.
  3. Run a cold-path yt-dlp extraction (same logic as Phase 5 cold path, including the distributed lock).
  4. Store the fresh `manifest:{videoId}` and `yt-dlp:{videoId}` in Redis.
  5. Return the fresh manifest to the client.

  After storing the fresh manifest, check whether `failures:{videoId}` exceeds the configured per-video threshold (env var `FAILURE_THRESHOLD_PER_VIDEO`). If so:
  - Append a structured entry to the IP failure log file (path via `IP_FAILURE_LOG_PATH` env var): `{ videoId, timestamp, ip, errorType }`. Read the current outbound IP once at service startup via `ip route get 8.8.8.8` and keep it in memory.
  - Increment `yt-dlp:failures:count` in Redis (no TTL).
  - If `yt-dlp:failures:count` exceeds the global threshold (env var `FAILURE_THRESHOLD_GLOBAL`), emit an urgent log warning. A real notification channel (email, webhook) can be wired in a later iteration — for the PoC a structured log line is sufficient.
