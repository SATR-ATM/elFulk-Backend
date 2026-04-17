# Task Description

- I want to write some of the documentation for a new feature which aims to integrate Youtube playback
  while removing ads to ensure a good user experience.
- The goal is for the final document to be easy to read and follow, consider switching between
  paragraphs and bullets as needed to ensure easy reading and clear comprehension
- Make sure to enhance my explanation with some things from documentation and some more details to
  help understanding, and to also validate my statements especially about external systems
- Add a section about other features/parts of the system that are related to the system that we need
  to consider later, with a brief explanation about them
- I will be sketching out the plan for how to go about implementing the feature, it includes:
  - Interactions between various components
  - Discussion of trade-offs
  - Explanation of technical choices
- The plan would be in a paragraph format, which is just a dump of my thoughts, and me trying to
  explain my thought process
- I want you to assist me with the following
  - Start by giving me a general overview of how the feature would work. The goal is for me to
    make sure that my thoughts are clear to you and to help me figure out if there is something I
    have missed in my explanation and analysis

  - Help me with the boring straight things that are basically just information gathering, for
    this prefer using official documentation whenever possible, or well-known useful sources

  - Help me with the diagrams
    - Entity & Class diagrams: for this I will be trying to figure out some useful fields that
      would be needed to implement the ideas I have for the system. I will be providing as well
      the initial class diagram for the whole project for you to use as reference. I need you to
      just add anythings that I might have missed out, or any generic stuff. You are also tasked
      with generating the final diagram
    - Sequence diagrams: for this, based on the text I give you explaining the system, I need
      you to propose what sequence diagrams are needed, describing what are they about so I can
      validate them. The goal is not to have so much back-and-forth about them so try to focus on
      this. Then I want for each that you explain the sequence in plain text (as bullet points for
      example) then to generate the final diagram.

  - Help me with documentation of the APIs and core logic
    - Youtube Data API: I mainly need to, based on the flow I explain in the plan/paragraph, explain
      how to: - Authenticate to the Youtube API - How to use it in the application - What are some technical requirements to consider for using the API
    - Ad-blocking and Recommendations: I want to explain
      - How does the logic for blocking the display of ads work
      - How do the tools used to block ads work to do so
      - How to integrate the tools into the system
      - How does the system interact with them
      - What are some pitfalls to consider:
        - Potential legal challenges
        - Potential things that might affect availability of the platform
        - Some suggestions of workarounds

  - Help me with FR and NFR: For this it is hard to come up with them myself, so I need you to use
    the provided material to propose some that I can validate myself. I would make sure to mention
    things that are relevant while creating the plan.

  - Help me figure out what are some legal considerations for us to look more into and to consider
    for our platform. Make sure to point out some potential things that might be really dangerous
    and risk shutting down the platform. I know you are not a legal adviser, but just based on legal
    texts, terms of service and some documented cases you know of.

Make sure you go through each step one by one, and wait for my input to move to the next. The goal
is to have a good result with the least of iterations possible for each step.

Below are more details about what I have to do:
<task>
docs: Implementation and technical specs for Visual Content module
Description

    This task covers the architectural design and documentation for the video content feature. The focus is on integrating YouTube playback while maintaining a clean, ad-free-like experience as per the Figma logic.
    Tasks

        Create docs/visual_content.md: Centralize all research and technical specs.
        Diagrams:
            Entity Diagram: Map out Video, Channel, and Playlist models.
            Class Diagram: plan for class diagram
            Sequence Diagram: Detail the video loading and "clean-view" filtering process.
        Technical Research Implementation:
            Document YouTube Data API .
            Document the logic for blocking external recommendations and ads.
        Requirements Documentation:
            List Functional Requirements (FR) for video playback.
            List Non-Functional Requirements (NFR) for performance and privacy.

    Tools & Resources

        Figma Logic: figma ui , flows
        Excalidraw: (Highly recommended for diagrams—use Excalidraw MCP with Claude/Codex for quick exports).
        Reference File: docs/visual_content.md

    Deliverables

    A comprehensive markdown file in docs/visual_content.md that serves as the technical source of truth for this feature.

</task>

## Documenting tools

- I want you to also include information about the various tools/APIs that would be relevant during
  implementation: 1. What is the tool, and what is its purpose 2. Limitations to consider during implementation: API limits, Authorization, Quotas 3. How to authenticate to the API 4. Useful references for developers to look more into
- The documentation should be in a separate section somewhat at the start of the document, it
  doesn't need much validation from me, and make it collapsible as well. The goal is just to give
  readers some more context and help them find some references easily.

## Extras

- I also want to add a section documenting the different APIs we would be using. This section is
  meant to be generic and to serve as documentation for the things we don't intend to use in our
  solution but that might be useful if want to change it. For example for the Youtube search
  endpoint we don't intend to use it directly, but nevertheless it is useful to document how to do
  certain things in case we want to change something. The section should be collapsible and as much out
  of the way of the reader.

# Plan

## Features

-[x] The platform should allow selecting categories of videos and filtering videos by that category
something similar to what Youtube does with its top bar -[x] The platform should have a search feature

- The app should have a player -[x] It shows watch time so far -[x] Allows playing/pausing playback -[x] Saves progress of playback so far -[x] Display the title of the video -[x] Have the option of previous and next video -[x] The platform should have some recommendations of videos to watch in the home page -[x] The platform should have a similar category-selection and recommendation mechanism when playing
  a single video -[x] The platform should display the progress of already watched videos both inside the player and in
  the home page -[x] The platform should avoid the case of only displaying watched videos -[x] The platform should keep track of previous looked up terms
- The platform shouldn't display any ads while the video is playing
- Only chosen recommendations can be displayed after the video ends. Youtube recommendations should
  be disabled.

## Features analysis

- The search feature is straight forward, we just need to somehow integrate with the Youtube Data
  API to forward search requests to it. Probably some sort of cache is needed to avoid making network
  requests from the back-end each time a search is needed. This would also mean the need of choosing
  a good key for the cache in order to avoid many cache entries
- The recommendation system is interesting, The Youtube API doesn't have support for integrating
  with its recommendation system, and it would be impossible to do so anyways, as users don't translate
  1-to-1 to Youtube accounts. The do have a deprecated `relatedToVideoId` in their search, but it
  might not be stable. I think the best way moving forward is to simply just have a single
  recommendation list for all users. The recommendation in the player is the same as the main -
  (already watched videos). There is also another thing to consider which is how to get videos in the
  first place, we can make home just the results of having an empty search term. In order to ensure
  that videos are appropriate I think we need to have some sort of initial chosen videos and a mechanism
  for users to propose some videos to add to the platform, and for them to specify the age which we
  then validate, or just leave validation for us to remove all bias.
- For the category, does search have way of working? Of getting categories?
- For categories shown in the top bar, the [videoCategories.list](https://developers.google.com/youtube/v3/docs/videoCategories/list) endpoint can be used to retrieve available endpoints. The filter by category can be done using the
  `videoCategoryId` of the [search.list](https://developers.google.com/youtube/v3/docs/search/list) endpoint.
- Categories of a specific video can be retrieved when retrieving the information about it using
  [videos.list](https://developers.google.com/youtube/v3/docs/videos/list) and specifying the `id` of
  the video as a query parameter which can be used to gather information about categories for manually
  or community chosen videos
- After looking more at the flow chart, the shown videos are either pre-selected by the authors of
  the platform, or added by parent and he has total control over videos either way. The way it works,
  which is part of the parent module and not this and only mentioned for context, parts that have
  to do with the Youtube Data API are what interest us: - The platform authors choose a set of videos which they also categorize by age and gender. We
  can use the previous method to also gather information about the category of the video in order
  for us to display it as a selector in the home screen. Saving this in our database would require
  that it stays consistent with the actual Youtube API which would require having some CRON jobs
  that would periodically sync the categories with the outside system. The `id` parameter can be
  used to retrieve information about the category using the [VideoCategories.list](https://developers.google.com/youtube/v3/docs/videoCategories/list)
  endpoint. Returning only IDs and having the app do fetches would be too slow. - The parent then has the option of: - Adding a video either by manually inserting a link for which case we can extract the video
  id from the link, for example: `https://youtu.be/RJyPVLMyyuA?si=6-WfTg-87PqvxET_` that you get
  from sharing the video using the link has the id: `RJyPVLMyyuA`. So format is
  `https://youtu.be/VIDEO_ID`. Then we can use the endpoint [videos.list](https://developers.google.com/youtube/v3/docs/videos/list)
  and the `id` parameter to get the video. - The parent can also add a video from the library (videos by authors) and can filter
  using age or gender - Deleting a video using the interface which allows sorting videos using some categories.
  This can be done directly using the platform, no need for APIs
- For search the endpoint [search.list](https://developers.google.com/youtube/v3/docs/search/list)
  returns a list of matches it has information for title, id, and thumbnail all elements useful for
  the display of the results. This is probably not much useful in our case, since search would search
  through our database anyways. In case of wanting to use search, the endpoint doesn't return the
  duration of the video, so another request to `videos.list` is needed with the id of each of the
  results.
- Google does have a package to simplify interacting with its Data API [@googleapis/youtube](https://www.npmjs.com/package/@googleapis/youtube)
- The detailed video retrieval `videos.list` returns: id, title, thumbnail, duration for display in
  the player. The information should only be used when authors or parents add videos for the first time
  and should be saved in the platform afterwards, as they are needed later for example to save video
  progress.
- All API calls to the Youtube API should be done in the back-end using an API key that is generated
  using the [Google Cloud Console](https://console.cloud.google.com/projectselector2/apis/dashboard?pli=1&supportedpurview=project)
  for an account that is linked to the platform
- Calls to the API should be minimal, since we intend to only present content we already filtered out
  it is more useful to have the information saved in our platform in order to also use it in other
  features. A mechanism to periodically sink with the source of data is needed most likely using a
  CRON job. Relevant information to retrieve when a parent adds a video is: generic stuff(title, id,
  duration, thumbnail), category. The parent should be also tasked with suggesting a suitable age
  group. Adding a video only concerns a parent, but added videos should be accessible by an admin
  which would help him consider videos to add to the main library and in which case age suggestion
  might be useful. An important thing for data is that for example Categories can only be those
  from the Youtube APIs since it would be hard to distinguish them from custom ones in a CRON job
  or simply adding a type column would be needed.
- The boundaries of the platform with the Youtube API at least in this design are when authors add
  videos, when parents add videos, and when CRON jobs run. The CRON jobs might present a problem with the
  quota, so this should be handled properly.
- An initial solution for recommendations in both the home page and inside the video player is to
  simply not have any. A future step would be to create an AI model for such things, but this should
  be out of our current scope.
- The categories inside the player would work in a similar way to the home screen
- Displaying progress for videos is a straight forward query to the database
- Avoiding displaying only watched videos is a simple filter inside an sql query, or merging multiple
  queries
- Keeping track of search history would require just adding an entity in the database for this
  which would have a foreign key constraint with a child profile
- For ads the current solution relies on `yt-dlp` python library and builds an architecture around
  it to: 1. Avoid IP bans that would render video playback impossible 2. Reduce the latency of executing a process for every request 3. Support multiple resolutions and ensure easy integration with the front-end 4. Make sure the playback continues even when certain Youtube restrictions apply 5. Make sure the system clearly signals when the playback is no longer possible 6. Ensure the least amount of burden on our infrastructure and that is by minimizing bandwidth
  requirements 7. Make sure request latency is acceptable and reduced
- Due to certain requirements to handle the potential of Youtube restrictions on our platform the
  platform needs to be deployed on a VPS or at least somewhere where we have control over the machine
  and can assign IP addresses. A second requirement is that the hosting service should support
  assigning IPv6 addresses to hosts and that the CIDR block is /64. And the third is that the machine
  uses an IPv6 address. This is following the guide from [Indivious](https://docs.invidious.io/ipv6-rotator/)
- The current architecture uses a simple process invocation of `yt-dlp` to get streaming URLs and
  information of resolution and format. Redis to ensure latency optimization so that the process is
  not executed on every request. And TTL mechanism for Redis to ensure used links are valid.
- The front-end should make sure to fallback properly in case the player is not able to play the
  video and make a request to the back-end accordingly.
- Solution Description:

## Full System Plan

---

### Architecture Overview

```
Client → NestJS API
              ├── Redis (cache + locks + failure tracking)
              ├── yt-dlp process pool
              └── CDN proxy (fallback only)
```

---

### 1. Video Resolution Request Flow

**Cold path (cache miss):**

1. Request comes in for `/video/:videoId`
2. Check Redis for `yt-dlp:${videoId}` — miss
3. Acquire Redis lock `lock:${videoId}` with `SET NX EX 30` (30s timeout)
4. If lock not acquired, poll Redis every 500ms for up to 25s waiting for another worker to finish extraction — this handles concurrent cold requests for the same video
5. Spawn yt-dlp process, extract JSON
6. Parse formats, filter to available resolutions among {144p, 240p, 360p, 480p, 720p, 1080p} — skip missing ones, don't generate broken manifest entries
7. Parse `expire` Unix timestamp from any CDN URL query string — use as Redis TTL minus a 10 minute safety buffer
8. Generate DASH manifest with direct CDN URLs
9. Store in Redis: `yt-dlp:${videoId}` (raw formats JSON) and `manifest:${videoId}` (MPD XML), both with the same TTL
10. Release lock
11. Return manifest

**Warm path (cache hit):**

1. Request comes in
2. Redis hit on `manifest:${videoId}`
3. Return manifest immediately — sub-millisecond

---

### 2. Manifest Generation

Filter yt-dlp formats:

```typescript
const TARGET_HEIGHTS = [144, 240, 360, 480, 720, 1080];

const videoStreams = formats
  .filter((f) => f.vcodec !== 'none' && f.acodec === 'none')
  .filter((f) => TARGET_HEIGHTS.includes(f.height))
  // deduplicate by height, keep highest bitrate per height
  .reduce((acc, f) => {
    if (!acc[f.height] || f.tbr > acc[f.height].tbr) acc[f.height] = f;
    return acc;
  }, {});

const bestAudio = formats
  .filter((f) => f.acodec !== 'none' && f.vcodec === 'none')
  .sort((a, b) => b.abr - a.abr)[0];
```

Generate MPD with direct CDN URLs in `<BaseURL>`. Set `Cache-Control: no-store` on the manifest response so the browser never caches it — the manifest must always come from your backend so you can swap it for the fallback version transparently.

---

### 3. Failure Tracking — Per Format, Not Per Video

Client-side Shaka error handler hits `/video/:videoId/failure` with the formatId that failed. Backend:

```
HINCRBY failures:${videoId} ${formatId} 1
HINCRBY failures:${videoId} total 1
```

Using a Redis hash keyed by formatId means you know which specific stream is broken, not just that something is broken. If `total > threshold` (e.g. 3), regenerate the manifest replacing broken format entries with your proxy URLs. Store the fallback manifest under `manifest:fallback:${videoId}`.

Serve the fallback manifest from the same `/video/:videoId/manifest` endpoint — the client doesn't need a separate endpoint, just re-requests the manifest after reporting failure. The backend decides which manifest to return based on failure state.

---

### 4. Fallback Proxy

When serving from your backend, the proxy endpoint is `/stream/:videoId/:formatId`:

```typescript
const format = JSON.parse(await redis.get(`yt-dlp:${videoId}`)).find(
  (f) => f.format_id === formatId,
);

const upstream = await fetch(format.url, {
  headers: { range: req.headers.range ?? 'bytes=0-' },
});

res.status(upstream.status);
res.setHeader('Accept-Ranges', 'bytes');
res.setHeader('Content-Type', upstream.headers.get('content-type'));
if (upstream.headers.get('content-range'))
  res.setHeader('Content-Range', upstream.headers.get('content-range'));

upstream.body.pipe(res);
```

**When the fallback itself fails:** the proxy is fetching from the same CDN URL stored in Redis. If that URL is expired or banned (not just client IP mismatch), the proxy will also return a non-200. In that case, trigger a fresh yt-dlp extraction, update Redis, and redirect the client to re-fetch the manifest. This is your re-extraction path.

---

### 5. Re-extraction Path

Triggered when:

- Proxy fetch returns 403 or 410 (URL dead, not just IP mismatch)
- Redis TTL expires naturally (handled by cache miss flow)

```
DELETE yt-dlp:${videoId}
DELETE manifest:${videoId}
DELETE manifest:fallback:${videoId}
DELETE failures:${videoId}
→ Re-run cold path
```

Return `302` to the client pointing back at the manifest URL so it re-fetches transparently.

---

### 6. yt-dlp / Redis Operational Failure Tracking

Separate from per-video failure counts. Track system-level health in Redis:

```
yt-dlp:failures:count    # incremented on each process error
yt-dlp:failures:last     # Unix timestamp of last failure
redis:reachable          # checked at startup and on interval
```

On yt-dlp spawn failure, increment `yt-dlp:failures:count`. Expose a `/health` endpoint:

```json
{
  "ytdlp": {
    "operational": true,
    "recentFailures": 2,
    "threshold": 5
  },
  "redis": {
    "operational": true
  },
  "status": "degraded" // "ok" | "degraded" | "down"
}
```

If `recentFailures > threshold`, mark yt-dlp as non-operational. No automatic recovery attempt — this requires human intervention. Surface it in your health endpoint and ideally alert (a simple webhook to a Discord channel or email is enough for a small deployment).

This counter is informational only. The system doesn't try to self-heal yt-dlp failures beyond what the re-extraction path already does.

---

### 7. Concurrency — Process Pool

Don't spawn unbounded yt-dlp processes. Use BullMQ with a concurrency limit:

```typescript
const extractionQueue = new Queue('yt-dlp-extraction');
const worker = new Worker('yt-dlp-extraction', extractVideo, {
  concurrency: 3,
});
```

Concurrency of 3 per core is a reasonable starting point. Requests beyond that queue rather than spawning more processes.

---

### 8. What Will Break and When

**YouTube format changes:**
yt-dlp periodically breaks when YouTube changes signature algorithms or introduces new bot detection. When this happens, extractions fail, `yt-dlp:failures:count` climbs, and the system marks itself as non-operational. Cached videos continue working until their TTL expires, after which new requests fail entirely. **This is an outage scenario with no automated recovery** — it requires updating the yt-dlp binary (usually a container image update). Typical yt-dlp community turnaround is hours to 1-2 days. Keep your container image on a rolling tag and have a runbook for this.

**CDN URL expiry:**
Handled by TTL. If TTL math is wrong (e.g. you used a fixed 6h instead of parsing `expire`), manifests will serve dead URLs. Parse `expire` from the URL directly.

**Redis outage:**
All caching, locking, and failure tracking is gone. Every request hits yt-dlp cold. With no lock mechanism, concurrent requests for the same video spawn multiple processes simultaneously. This likely saturates your server under any real load. No good automated mitigation — Redis is a hard dependency. Run Redis with persistence enabled so restarts don't lose warm cache.

**IP-binding enforcement tightening:**
If YouTube starts enforcing IP-binding strictly, direct CDN URLs stop working for most users and your fallback proxy absorbs all traffic. Bandwidth costs spike. No automated mitigation beyond what the fallback already does — it just becomes the default path instead of the exception.

---

### 9. What the Frontend Needs to Do

- Load manifest from `/video/:videoId/manifest`
- On Shaka error, call `/video/:videoId/failure` with the failing formatId
- Re-fetch manifest from the same URL — backend returns fallback manifest transparently
- Reload player with new manifest

No other frontend logic needed. The backend handles which manifest variant to serve.

---

### Summary of Redis Keys

| Key                            | Type          | TTL                  |
| ------------------------------ | ------------- | -------------------- |
| `yt-dlp:${videoId}`            | string (JSON) | parsed from `expire` |
| `manifest:${videoId}`          | string (XML)  | same                 |
| `manifest:fallback:${videoId}` | string (XML)  | same                 |
| `failures:${videoId}`          | hash          | same                 |
| `lock:${videoId}`              | string        | 30s                  |
| `yt-dlp:failures:count`        | string        | none (manual reset)  |
| `yt-dlp:failures:last`         | string        | none                 |

## Requirements

- Due to the nature of the approach and the fact that the tool we rely on basically uses and exploit
  in the system that Youtube has, constant updates are needed, meaning the need for dedicated effort
  to keep track of changes to the tool and make sure our system integrates with them well. This
  requires some kind of good decoupling of the part of the system that integrate with the tool and
  the rest of the system in order not to break too much when doing updates. We basically don't have
  the luxury of choosing when to update.

## Non-Functional Requirements

- The platform should have the least amount of components that need to be maintained optimally
  focusing only on the main app. So whenever possible we should rely on external dependencies that
  are handled by dedicated teams
- The platform should prioritize stability to ensure good user experience
