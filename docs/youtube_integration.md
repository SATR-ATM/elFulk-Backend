## Options at a Glance

| Option           | Layer                  | Hosted | Public API | Ad-Free | Risk   |
| ---------------- | ---------------------- | ------ | ---------- | ------- | ------ |
| YouTube Data API | Metadata only          | No     | Yes        | No      | Low    |
| NewPipeExtractor | Stream extract (JVM)   | Yes    | No         | Yes     | Medium |
| Piped            | Stream extract (HTTP)  | Yes    | Yes        | Yes     | Medium |
| yt-dlp           | Stream extract (CLI)   | Yes    | No         | Yes     | Medium |
| ReVanced         | APK patching (Android) | N/A    | No         | Device  | High   |

---

## Option 1 — YouTube Data API (Official)

### What it is

Google's official, documented API for accessing YouTube metadata: video info,
search results, channel data, playlists. It does **not** provide stream URLs or
ad-free playback — it only surfaces the same data visible on the YouTube
website.

### Hosting

None required. Calls are made directly from your backend to Google's API.

### Integration with NestJS

Straightforward HTTP module integration. A dedicated `YoutubeModule` wraps API
calls using `@nestjs/axios`. Responses are clean, stable JSON with a
well-documented schema.

### Limits

- Free tier: 10,000 units/day (search = 100 units, video lookup = 1 unit).
- Extended quota available but requires Google approval.
- No stream URLs — cannot serve actual video/audio to users.

### When to use

If your product only needs metadata (titles, thumbnails, descriptions, channel
info) and does not need to serve or proxy actual video/audio streams. Combine
with an embedded YouTube player on the frontend for playback.

### References

- [YouTube Data API v3 — Getting Started][yt-api-overview]
- [YouTube Data API — Quota Cost Calculator][yt-quota]
- [NestJS HttpModule documentation][nestjs-http]
- [google-api-nodejs-client (official Node.js client)][google-node-client]

[yt-api-overview]: https://developers.google.com/youtube/v3/getting-started
[yt-quota]: https://developers.google.com/youtube/v3/determine_quota_cost
[nestjs-http]: https://docs.nestjs.com/techniques/http-module
[google-node-client]: https://github.com/googleapis/google-api-nodejs-client

---

## Option 2 — Piped (Recommended for stream access)

### What it is

An open-source YouTube frontend written in Java that uses **NewPipeExtractor**
internally and exposes a clean REST API. It reverse-engineers YouTube's internal
(private) API to extract direct stream URLs without going through Google's
official API, meaning no ads are ever injected into the stream.

Supports: video info, stream URLs, search, channel data, playlists, comments.

### Hosting

Two sub-options:

- **Self-hosted:** Run your own Piped instance via Docker Compose. Full control,
  no dependency on third parties, but you own maintenance and IP-ban risk.
- **Public instances:** The Piped project maintains a list of community-run
  public instances (e.g., `pipedapi.kavin.rocks`). No hosting cost, but you
  depend on third-party availability and rate limits. Suitable for development
  or low-traffic use; not recommended for production with paying customers.

### Integration with NestJS

Piped exposes a REST API that your NestJS backend consumes via `HttpModule`.
Your app calls your own Piped instance internally — end users never interact
with Piped directly. A dedicated `VideoModule` wraps Piped calls, maps
responses to your own DTOs, and handles errors. Redis caching on the NestJS
side reduces call volume and latency significantly.

### Stability consideration

YouTube actively fights third-party clients. Piped breaks periodically when
YouTube updates its internal API or adds integrity checks (e.g., `poToken` /
DroidGuard requirements). The Piped team typically issues fixes within days,
but this is a recurring maintenance reality to plan for.

### References

- [Piped — Backend source (GitHub)][piped-backend]
- [Piped — Docker self-hosting guide][piped-docker]
- [Piped — REST API documentation][piped-api-docs]
- [Piped — Public instances list][piped-instances]
- [NewPipeExtractor — Core library (GitHub)][newpipe-extractor]
- [NewPipeExtractor — Javadoc API reference][newpipe-javadoc]

[piped-backend]: https://github.com/TeamPiped/Piped
[piped-docker]: https://github.com/TeamPiped/Piped-Docker
[piped-api-docs]: https://docs.piped.video/docs/api-documentation/
[piped-instances]: https://github.com/TeamPiped/Piped/wiki/Instances
[newpipe-extractor]: https://github.com/TeamNewPipe/NewPipeExtractor
[newpipe-javadoc]: https://teamnewpipe.github.io/NewPipeExtractor/javadoc/

---

## Option 3 — yt-dlp

### What it is

A Python command-line tool (maintained fork of `youtube-dl`) that extracts
direct stream URLs from YouTube and hundreds of other platforms. It is the most
actively maintained extractor available and recovers from YouTube changes faster
than NewPipeExtractor/Piped in most cases.

### Hosting

Required. You run it as a subprocess from your backend. There is no native REST
API — you invoke it via shell and parse its JSON output.

### Integration with NestJS

A `ProcessService` in NestJS spawns `yt-dlp` as a child process, passing a
video ID and receiving a JSON response with stream URLs and metadata. This is
less clean than an HTTP call to Piped, adds Python as a runtime dependency, and
requires careful handling of process lifecycle and errors. It also adds latency
compared to a persistent HTTP service.

Alternatively, wrap yt-dlp in a small FastAPI or Express service to give it a
stable HTTP interface your NestJS app can call like any other microservice.

### When to use

As a fallback or supplement to Piped when Piped is broken. Many production
setups use both: Piped for normal operation, yt-dlp as a recovery path.

### References

- [yt-dlp — GitHub repository][yt-dlp-github]
- [yt-dlp — JSON output format documentation][yt-dlp-json]
- [yt-dlp-web — community REST wrapper example][yt-dlp-web]

[yt-dlp-github]: https://github.com/yt-dlp/yt-dlp
[yt-dlp-json]: https://github.com/yt-dlp/yt-dlp#output-template
[yt-dlp-web]: https://github.com/Tzahi12345/YoutubeDL-Material

---

## Option 4 — ReVanced

### What it is

A modular Android APK patcher. It takes the official YouTube Android APK,
decompiles it, injects bytecode-level modifications (e.g., making ad-serving
methods no-ops), and repackages it as a modified installable app. Ad-blocking
happens inside the patched app on the device — no network-level interception.

### Hosting

Not applicable. ReVanced is a client-side, end-user tool — it produces a
modified `.apk` file for installation on an Android device. There is no API,
no service, and no server component to deploy.

### Integration with NestJS

**Not possible.** ReVanced operates entirely on the Android client side and has
no interface that a backend can call. It cannot be integrated into a NestJS
service or any server-side architecture.

### When to use

Only relevant if you want to direct individual end users to install ReVanced
themselves on their own personal devices. It cannot form part of a
backend-driven or multi-user solution.

### References

- [ReVanced — Official website][revanced-site]
- [ReVanced — GitHub organisation][revanced-github]
- [revanced-patcher — Core patching library][revanced-patcher]
- [revanced-patches — Patch collection][revanced-patches]
- [ReVanced documentation (DeepWiki)][revanced-deepwiki]

[revanced-site]: https://revanced.app
[revanced-github]: https://github.com/ReVanced
[revanced-patcher]: https://github.com/ReVanced/revanced-patcher
[revanced-patches]: https://github.com/ReVanced/revanced-patches
[revanced-deepwiki]: https://deepwiki.com/ReVanced/revanced-documentation

---

## Legal Implications

> ⚠️ This section reflects informed context, not legal advice.
> For a commercial product with paying users, consult a qualified lawyer.

All options involving stream extraction (Piped, NewPipeExtractor, yt-dlp,
ReVanced) share the same core legal tension: **they violate YouTube's Terms of
Service**. The legal risk varies by mechanism and commercial exposure.

### YouTube Terms of Service

YouTube's ToS explicitly prohibits scraping, automated access outside the
official API, and circumventing their systems. For a **commercial product with
paying customers**, this risk is meaningfully higher than for personal use:

- **Cease-and-desist** is the most likely first enforcement action, meaning
  downtime and legal costs.
- **IP bans** at the infrastructure level can kill your service without any
  legal process.
- **Account/service termination** if your infrastructure is linked to Google
  accounts.
- **Lawsuit** is less common but more plausible once a commercial product gains
  visibility.

The distinction matters: ToS violation is not the same as breaking the law.
Courts (particularly in the US via _hiQ v. LinkedIn_ and _Van Buren_ rulings)
have generally found that scraping publicly accessible data does not violate
the CFAA. However, YouTube can still pursue breach-of-contract or copyright
claims, or apply technical enforcement (IP bans) without needing a court.

### ReVanced — additional risk layer

ReVanced modifies a proprietary binary (the YouTube APK). This is the same
approach that led Google to shut down YouTube Vanced with legal pressure.
Building a commercial product that facilitates or automates ReVanced patching
for customers concentrates that legal exposure directly onto you.

### GPL v3 License (Piped, NewPipeExtractor)

Both Piped and NewPipeExtractor are licensed under GPL v3. For a **SaaS/API
product**, this is largely a non-issue: GPL's copyleft is triggered by
_distribution_ of software, not by running it server-side. Your NestJS backend
calling a self-hosted Piped instance does not require you to open-source your
backend code. Distributing a desktop or mobile client that ships these libraries
would be a different matter.

### Content copyright

Even with legally defensible access methods, the **content** being served
(video, audio) is owned by creators and licensed to YouTube. Risk scales with
what your product does:

| What your product does                                | Copyright exposure |
| ----------------------------------------------------- | ------------------ |
| Returns metadata only                                 | Low                |
| Returns stream URLs (user fetches from YouTube CDN)   | Medium             |
| Proxies or re-serves video/audio through your servers | High               |
| Enables or facilitates downloading                    | High               |

### References

- [YouTube Terms of Service][yt-tos]
- [hiQ v. LinkedIn — Ninth Circuit ruling summary (White & Case)][hiq-ruling]
- [GPL v3 and the SaaS loophole — explainer (Mend.io)][gpl-saas]
- [Web scraping legal landscape 2025 (ScrapeCreators)][scraping-legal]

[yt-tos]: https://www.youtube.com/t/terms
[hiq-ruling]: https://www.whitecase.com/insight-our-thinking/web-scraping-website-terms-and-cfaa-hiqs-preliminary-injunction-affirmed-again
[gpl-saas]: https://www.mend.io/blog/the-saas-loophole-in-gpl-open-source-licenses/
[scraping-legal]: https://scrapecreators.com/blog/is-web-scraping-legal-a-guide-based-on-recent-court-ruling

---

## Recommendation Summary

For a commercial product with end users, the pragmatic path is:

1. **Use the official YouTube Data API** for all metadata needs (search, titles,
   thumbnails, channel info). Eliminates ToS risk for that layer entirely.

2. **Self-host Piped** as an internal sidecar service for stream URL extraction.
   Expose it only internally — your NestJS API talks to it, end users never
   touch Piped directly. Use public instances only as a fallback during
   development.

3. **Keep yt-dlp available** as a recovery mechanism for when Piped breaks,
   optionally wrapped in a small HTTP service.

4. **Do not build on ReVanced** for a server-side product — it is
   architecturally incompatible and carries the highest legal risk.
