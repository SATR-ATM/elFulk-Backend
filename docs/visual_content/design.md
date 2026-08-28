# Visual Content Module — Design Rationale

This document explains the reasoning behind the architectural decisions made for the Visual Content module. It is intended as a companion to the [technical specification](./visual_content.md) and covers the _why_ behind the design, including the alternatives that were considered and rejected.

---

## Table of Contents

1. [Context & Goals](#1-context--goals)
2. [Core Constraint: Bypassing the YouTube Player](#2-core-constraint-bypassing-the-youtube-player)
3. [Stream Extraction: Tool Selection](#3-stream-extraction-tool-selection)
   - [Options Considered](#31-options-considered)
   - [Why yt-dlp Was Chosen](#32-why-yt-dlp-was-chosen)
   - [Alternatives in Depth](#33-alternatives-in-depth)
4. [Infrastructure Constraint: IaaS Only](#4-infrastructure-constraint-iaas-only)
5. [IPv6 Rotation](#5-ipv6-rotation)
6. [Manifest Strategy: DASH + HLS](#6-manifest-strategy-dash--hls)
7. [CDN URL Handling & Failover Design](#7-cdn-url-handling--failover-design)
8. [Redis as a Hard Dependency](#8-redis-as-a-hard-dependency)
9. [PO Tokens & the bgutil Sidecar](#9-po-tokens--the-bgutil-sidecar)
10. [Content Restrictions & Age-Gated Videos](#10-content-restrictions--age-gated-videos)
11. [YouTube Data API & the CRON Sync Job](#11-youtube-data-api--the-cron-sync-job)
12. [Recommendations & End-of-Video Behaviour](#12-recommendations--end-of-video-behaviour)
13. [Key Trade-offs Summary](#13-key-trade-offs-summary)

---

## 1. Context & Goals

The platform's primary requirement is a **curated, ad-free video experience for children**, with full parental control over what content is visible. YouTube was the chosen content source because of its breadth of high-quality educational and children's content, but the native YouTube experience is not acceptable for the target audience:

- Ads are injected by the YouTube player — they cannot be suppressed without replacing the player.
- YouTube's recommendation engine surfaces content outside the curated library.
- The IFrame Player API provides no out of the box mechanism to reliably hide the end-of-video overlay.

---

## 2. Core Constraint: Bypassing the YouTube Player

The decision to bypass the YouTube IFrame Player API and serve video directly from YouTube's CDN is the single most consequential architectural decision in this module. Everything else flows from it.

**Why not use the IFrame API?**

The IFrame API loads a full YouTube player. Ads are injected _by that player_ after it receives the stream — they are not part of the stream itself. There is no API parameter or configuration to disable them. The `rel=0` parameter reduces end-of-video recommendations to the same channel but does not remove the overlay. Even with careful `onStateChange` interception, the ads cannot be removed.

**The alternative:** `yt-dlp` (and similar tools) extract the direct CDN URLs that YouTube itself uses to stream video data. When the frontend player loads these URLs directly, it is talking to YouTube's CDN with no YouTube player in the chain — so there is no player to inject ads, and recommendations are never rendered.

This approach gives full control over the playback experience at the cost of operational complexity, infrastructure constraints, and a structural dependency on a reverse-engineered tool.

---

## 3. Stream Extraction: Tool Selection

### 3.1 Options Considered

| Option           | Layer                 | Hosted | Public API | Ad-Free | Risk   |
| ---------------- | --------------------- | ------ | ---------- | ------- | ------ |
| YouTube Data API | Metadata only         | No     | Yes        | No      | Low    |
| NewPipeExtractor | Stream extract (JVM)  | Yes    | No         | Yes     | Medium |
| Piped            | Stream extract (HTTP) | Yes    | Yes        | Yes     | Medium |
| yt-dlp           | Stream extract (CLI)  | Yes    | No         | Yes     | Medium |
| Invidious        | Stream extract (HTTP) | Yes    | Yes        | Yes     | Medium |

### 3.2 Why yt-dlp Was Chosen

The primary driver is **update velocity**. YouTube makes changes to its internal API that break the way the tools work without notice. When this happens, all extraction tools break. The key differentiator is how fast each recovers:

- `yt-dlp` typically ships a fix within **hours to 1–2 days**.
- `NewPipeExtractor` (used by Piped) tends to lag behind by days to weeks because it is a JVM library with a more complex release cycle.

For a platform that needs to be reliable, the time-to-recovery after a YouTube-side breaking change is the most critical operational metric, which is why yt-dlp was chosen.

The second driver is **platform breadth**: yt-dlp supports hundreds of platforms. If the curated library ever needs to extend beyond YouTube, no tooling change is required.

### 3.3 Alternatives in Depth

#### YouTube Data API (Official)

The official Google API for YouTube metadata. It does not provide stream URLs — it surfaces the same information visible on the YouTube website. It cannot be used for ad-free playback.

**Role in this system:** The Data API _is_ used, but only for its intended purpose — fetching video metadata (titles, thumbnails, duration, categories) and driving the CRON sync job. It is not an alternative to yt-dlp; it is complementary.

---

#### NewPipeExtractor

A Java/Kotlin library that reverse-engineers YouTube's internal API to extract stream URLs. It is the extraction engine behind the Piped project.

**Strengths:**

- Well-documented extraction library with a stable internal API for callers.
- Actively maintained by the NewPipe team.

**Weaknesses:**

- JVM dependency. Integrating it into a NestJS backend requires either a separate JVM microservice or a language-boundary bridge — both add deployment complexity.
- Update velocity is slower than yt-dlp. The library maintainers need to update the extraction logic, release a new JAR, and the Piped team (if using Piped) then needs to integrate and release.

**Verdict:** Not selected as the primary tool due to slower recovery time after YouTube changes and the JVM integration overhead. Viable as a fallback or complementary path if yt-dlp ever becomes inadequate. Though it adds a maintenance cost, which comes from creating a separate micro-service.

---

#### Piped

An open-source YouTube front-end written in Java that uses NewPipeExtractor internally and exposes a REST API. Unlike yt-dlp (a CLI tool), Piped provides an HTTP interface that NestJS can call like any other service.

**Strengths:**

- Clean REST API — no subprocess management, no Python dependency.
- Can be self-hosted via Docker Compose.
- Public community instances are available for development and low-traffic usage (not suitable for production).

**Weaknesses:**

- Inherits NewPipeExtractor's update velocity. When YouTube breaks NewPipeExtractor, Piped is broken, and recovery requires a Piped release on top of a NewPipeExtractor fix — adding another lag step.
- Introduces a Java service into the infrastructure, adding operational surface area.

**Verdict:** A strong option and potentially the better production choice if the operational overhead of yt-dlp (subprocess management, Python runtime, poToken sidecar) outweighs the update velocity advantage. In a production setup, running Piped and yt-dlp in parallel — Piped as the primary path and yt-dlp as the fallback — is a reasonable strategy for maximising both ergonomics and resilience. This is worth revisiting as the system matures.

---

#### Invidious

An open-source alternative YouTube front-end written in Crystal, also using reverse-engineered extraction.

**Strengths:**

- Exposes a REST API (like Piped).
- Has a large community and many self-hosted instances.

**Weaknesses:**

- Written in Crystal — a less common language with a smaller ecosystem. Finding engineers familiar with it for debugging or contributing fixes is harder.
- Update velocity after YouTube changes is similar to or slower than Piped/NewPipeExtractor.
- Less active development in recent years compared to Piped and yt-dlp.

---

## 4. Infrastructure Constraint: IaaS Only

A direct consequence of the yt-dlp extraction approach is the **infrastructure constraint**: the platform must run on IaaS (VMs) or bare metal. Function-as-a-Service (FaaS) platforms like AWS Lambda or Google Cloud Functions, and most PaaS offerings, are not viable.

**Why:**

YouTube blocks IP addresses that make direct requests to its CDN infrastructure at scale. The mitigation is IPv6 rotation — cycling through a `/64` CIDR block to change the outbound IP address. This operation requires:

1. Ability to bind specific IPv6 addresses to the host network interface.
2. Persistence of the network configuration across requests.
3. A CRON job running on the host to execute rotation.

None of these are available in FaaS or most PaaS environments. Each FaaS invocation may run on a different container/IP with no control, and the network interface is not configurable.

IPv4 cannot be used for rotation because a typical VM is assigned a single `/32` address (one IPv4). IPv6 is practical because ISPs and cloud providers typically allocate a `/64` block — providing 2^64 possible host addresses to rotate through. Hosting providers that do not support IPv6 or do not allow changing the outbound IPv6 address cannot host this platform.

---

## 5. IPv6 Rotation

The rotation mechanism operates at the **host level**, not the application level. A CRON job assigns a new IPv6 address from the allocated `/64` block to the outbound network interface on a schedule. The NestJS application does not manage this — it reads the current outbound IP at extraction time (via `ip route get` or equivalent) and logs it for failure tracking purposes.

**Why host-level and not application-level?**

Changing the outbound IP at the application level would require raw socket access or calling OS-level commands from within the Node.js process — both fragile and a security concern. A host-level script is cleaner, isolated from the application, and can be managed and audited independently.

**Why not change the IPv4 address instead?**

IPv4 addresses on cloud VMs are fixed. The provider assigns one address and it cannot be rotated without reprovisioning the VM or acquiring additional elastic IPs (which are limited and charged). IPv6 does not have this constraint.

**Tracking already-banned IPs:**

The failure-tracking mechanism (per-video Redis counters → global failure counter → admin notification) exists partly to detect when the current IP has been banned. A persistent IP failure log (outside Redis, so it survives restarts) records which IPs have triggered bans. This log is read by the rotation script to avoid rotating to a previously banned address.

---

## 6. Manifest Strategy: DASH + HLS

The backend generates both **DASH** (`.mpd`) and **HLS** (`.m3u8`) manifests from the same extracted stream URLs.

**Why two formats?**

iOS and macOS use AVPlayer as the native media layer. AVPlayer does not natively support DASH (MPEG-DASH). On Apple platforms, the player must receive an HLS manifest. Android, web (via Shaka Player), and other platforms handle DASH natively.

**Format negotiation:**

The frontend specifies the desired format when requesting the manifest (via a query parameter or separate endpoint). The backend serves the appropriate manifest type. The extraction step (yt-dlp) only runs once — both manifests are generated from the same raw stream URL data cached in Redis.

---

## 7. CDN URL Handling & Failover Design

When yt-dlp extracts stream URLs, it returns direct CDN links that YouTube uses to serve the video. These links have two important properties:

1. **IP binding:** The CDN URL may be bound to the IP that made the extraction request.
2. **TTL:** The URL expires after a period of time (embedded in the URL as an `expire` parameter).

**IP binding:**

Initial testing showed that CDN URLs could be shared between devices with different public IPs and playback still worked. This suggests that IP binding is not strictly enforced in all cases — or that the binding is loose (e.g., subnet-level). Based on this observation, the default behaviour is to embed direct CDN URLs in the manifest and let the client stream directly from YouTube's CDN.

The fallback path (where the NestJS backend proxies the stream) exists for cases where the CDN does enforce IP binding and the client receives an authorization error. Proxying all traffic by default would be wasteful — YouTube's CDN handles the bandwidth more efficiently, and proxy bandwidth costs are significant at scale.

**TTL handling:**

The CDN URL expiry is parsed from the `expire` parameter and used to set the Redis TTL for the cached manifest, minus a 10-minute safety buffer. This ensures the cache is invalidated before the URLs expire, triggering re-extraction on the next request.

**Failure tracking:**

Per-video failure counters track how many times a specific video's CDN URLs have failed. When the per-video threshold is crossed, it signals that the current IP is likely banned for that content — even fresh re-extraction is failing. This increments the global failure counter. When the global counter crosses the threshold, the system enters a degraded or down state and admin notifications fire.

---

## 8. Redis as a Hard Dependency

Redis is not optional in this architecture. It serves three critical roles:

1. **Manifest caching** — warm-path delivery (under 200ms vs. 5+ seconds cold).
2. **Distributed locking** — prevents multiple concurrent yt-dlp processes from being spawned for the same video under load.
3. **Failure counting** — drives the alerting and degradation logic.

**Why AOF persistence is required:**

Without persistence, a Redis restart loses all cached manifests and lock state. Lost locks mean the next burst of concurrent requests for any video will each independently spawn a yt-dlp process — a thundering herd problem that could saturate CPU and trigger rate-limiting from YouTube simultaneously. AOF with `appendfsync everysec` provides recovery with at most one second of data loss.

---

## 9. PO Tokens & the bgutil Sidecar

YouTube's **Proof of Origin (PO) Token** system validates that the client is a legitimate player, not a bot or scraper. Datacenter IP ranges are treated with heightened suspicion and are more likely to be challenged. Without a valid PO token, yt-dlp requests from a server IP may be rejected or rate-limited.

The `bgutil-ytdlp-pot-provider` sidecar handles PO token generation and caching. yt-dlp is configured to use it via the PO Token Provider Framework.

**Deployment decision — sidecar vs. base image:**

The sidecar can be run as a separate container. An alternative is to use the `bgutil` container as the base image for the backend container, keeping everything in a single deployable unit. This decision depends on the final deployment setup.

Since the platform must run on a VM anyway (see §4), a Docker Compose setup with two services (backend + bgutil sidecar) is the cleanest approach: separation of concerns, independent restart capability, and no need to rebuild the backend image when the sidecar updates.

---

## 10. Content Restrictions & Age-Gated Videos

Some YouTube content requires the viewer to prove they are a real, logged-in user (e.g., age-restricted content). yt-dlp can handle this via cookie injection, but this introduces account risk and management overhead.

**Decision:** Age-gated content is excluded from the platform. The target audience is children, so this content would be inappropriate regardless. The pre-ingestion validation step (attempting a yt-dlp extraction before adding a video to the library) acts as a functional gate: if yt-dlp cannot retrieve a valid stream URL, the video is rejected. This keeps the approach simple and avoids cookie management entirely.

---

## 11. YouTube Data API & the CRON Sync Job

The official YouTube Data API is used only for its intended purpose: metadata. It does not serve stream URLs.

**Why keep the Data API at all?**

- Video metadata (titles, thumbnails, duration, categories) must be stored locally. Fetching it via the official API gives stable, well-documented, rate-limited data.
- The CRON sync job uses the API to detect videos that have been deleted, made private, or otherwise changed on YouTube, keeping the local database consistent.

**Quota management:**

The 10,000 unit/day limit is a hard ceiling that cannot be raised easily (a Google compliance audit is required, and given the nature of this platform, that path is not viable). The `videos.list` endpoint costs 1 unit per call and supports batching up to 50 IDs — meaning 10,000 videos can be synced per day for 1 unit. The CRON job must be designed with batching and graceful failure (queuing rather than dropping on quota exhaustion).

---

## 12. Recommendations & End-of-Video Behaviour

Since the YouTube player is never loaded, YouTube's native recommendation overlays are never rendered — this problem is largely solved by the architecture itself.

The platform controls what appears after a video ends. The default behaviour is to navigate to the next video in the current playlist or filtered list. If there is no next video, the player can seek back to the start of the current video or display the platform's own content suggestions (drawn from the curated library only).

---

## 13. Key Trade-offs Summary

| Decision                            | What was gained                                   | What was accepted                                           |
| ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| yt-dlp over Piped/NewPipeExtractor  | Faster recovery after YouTube changes             | Subprocess complexity, Python runtime, poToken sidecar      |
| IaaS over FaaS/PaaS                 | IPv6 rotation capability                          | Higher operational overhead, no auto-scaling                |
| IPv6 rotation over proxy pool       | Lower cost, simpler architecture                  | Host-level CRON dependency, hosting provider constraint     |
| Direct CDN links over default proxy | Bandwidth cost savings, better latency            | Risk of IP-binding enforcement for some clients             |
| DASH + HLS over DASH only           | iOS/macOS compatibility                           | Backend generates two manifest types                        |
| Redis as hard dependency            | Warm-path performance, thundering herd prevention | Single point of failure (mitigated by AOF persistence)      |
| bgutil sidecar for PO tokens        | Handles YouTube's bot detection                   | Additional container to manage and update                   |
| Excluding age-gated content         | Avoids cookie management complexity               | Minor content coverage gap (irrelevant for target audience) |
| Official Data API for metadata only | Stable, documented metadata                       | 10,000 unit/day hard quota ceiling                          |
