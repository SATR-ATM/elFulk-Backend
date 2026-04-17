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
- The rotation of IP addresses as described by [Indivious](https://docs.invidious.io/ipv6-rotator/)
  should be done using a CRON job
- Redis should have persistence enabled as it is core the architecture of the solution
- There needs to be a mechanism of reading previously banned IPs from a central log system to avoid
  assigning the same IP address
- Solution Description:

### Architecture Overview

```
Client → NestJS API
              ├── Redis (cache + locks + failure tracking)
              ├── yt-dlp process pool
              └── CDN proxy (fallback only, per failed resolution)
```

---

### 1. Video Resolution Request Flow

**Cold path (cache miss):**

1. Request comes in for `/video/:videoId/manifest`
2. Check Redis for `manifest:${videoId}` — miss
3. Acquire Redis lock `lock:${videoId}` with `SET NX EX 30`
4. If lock not acquired, poll Redis every 500ms up to 25s waiting for another worker — handles concurrent cold requests for the same video
5. Spawn yt-dlp process, extract JSON
6. Parse formats, filter to available resolutions among {144p, 240p, 360p, 480p, 720p, 1080p} — skip missing ones silently
7. Parse `expire` Unix timestamp from CDN URL query string — use as Redis TTL minus 10 minute safety buffer
8. Generate DASH manifest with direct CDN URLs
9. Store `yt-dlp:${videoId}` (raw formats JSON) and `manifest:${videoId}` (MPD XML) with parsed TTL
10. Release lock, return manifest

**Warm path:** Redis hit on `manifest:${videoId}` → return immediately.

---

### 2. Manifest Generation

```typescript
const TARGET_HEIGHTS = [144, 240, 360, 480, 720, 1080];

const videoStreams = formats
  .filter((f) => f.vcodec !== 'none' && f.acodec === 'none')
  .filter((f) => TARGET_HEIGHTS.includes(f.height))
  .reduce((acc, f) => {
    if (!acc[f.height] || f.tbr > acc[f.height].tbr) acc[f.height] = f;
    return acc;
  }, {});

const bestAudio = formats
  .filter((f) => f.acodec !== 'none' && f.vcodec === 'none')
  .sort((a, b) => b.abr - a.abr)[0];
```

Set `Cache-Control: no-store` on all manifest responses — browser must never cache them so backend can transparently swap to fallback.

---

### 3. Frontend Failure Flow

Shaka has built-in retry logic (`streaming.retryParameters`) — configure it to retry automatically before ever calling your backend. Only after Shaka exhausts its retries does the frontend escalate.

```typescript
player.configure({
  streaming: {
    retryParameters: {
      maxAttempts: 3,
      baseDelay: 1000,
      backoffFactor: 2,
    },
  },
});

// Track failures per format client-side
const formatFailures: Record<string, number> = {};
const FAILURE_THRESHOLD = 3; // after Shaka's own retries per attempt

player.addEventListener('error', async (event) => {
  const formatId = getCurrentFormatId(event);
  formatFailures[formatId] = (formatFailures[formatId] ?? 0) + 1;

  if (formatFailures[formatId] >= FAILURE_THRESHOLD) {
    // Call backend once — response IS the new manifest
    const newManifestUrl = await reportFailure(videoId, failedFormatIds);
    await player.load(newManifestUrl);
    // Reset counters for replaced formats
    failedFormatIds.forEach((id) => delete formatFailures[id]);
  }
});
```

The full frontend path is:

```
GET /manifest/:videoId
  → Shaka plays
  → Shaka auto-retries on error (built-in)
  → Client threshold reached
  → POST /video/:videoId/failure { formatIds: [...] }
  → Response: manifest with updated entry where the back-end is the one streaming  ← same URL, backend now serves fallback
  → Shaka loads manifest again
  → Streams via proxy for failed resolutions only
```

No second round-trip. The failure endpoint returns the manifest immediately and the backend has already updated it.

---

### 4. Failure Endpoint Behavior

`POST /video/:videoId/failure` receives the list of failed formatIds from the client.

Backend behavior:

1. Increment `HINCRBY failures:${videoId} total N` (N = number of failed formats reported)
2. Check total against threshold

**If total failures < threshold:**
Read `failover:${videoId}`. If exists update mentioned formats with proxy links. If not exists
take the entry in `manifest:${videoId}` and update mentioned formats. Return new manifest.
Subsequent request follow same workflow: try `manifest:${videoId}` first. If failed use proxy.

**If total failures ≥ threshold:**
The CDN URLs themselves are likely dead, not just an IP mismatch issue. Delete the entire cache entry:

```
DEL yt-dlp:${videoId}
DEL manifest:${videoId}
DEL failover:${videoId}
DEL failures:${videoId}
```

Cold path re-extraction triggers on next manifest request. Return `{ manifestUrl: '/manifest/:videoId' }` — client re-fetches and gets a freshly extracted manifest.

**If the proxy also fails** (upstream fetch returns 403/410):
This is caught in the proxy endpoint itself. Same action: delete cache entry, return 302 to manifest URL, client goes through cold path. Increment `yt-dlp:failures:count` since re-extraction is about to be forced.

**Key point:** the fallback manifest only includes proxy URLs for the specific formats that failed. Working resolutions continue serving direct CDN URLs. A user on 360p is unaffected if only 1080p is broken.

---

### 5. yt-dlp Operational Failure Tracking

**What counts as a yt-dlp failure:**

- Process exits non-zero
- Output JSON is malformed or empty
- Re-extraction triggered by proxy failure returns same dead URLs

**Per-failure action:**

1. Log the current outbound IP used for the extraction attempt
2. Store in database/log: `{ timestamp, ip, videoId, errorType }`
3. Increment `yt-dlp:failures:count`, update `yt-dlp:failures:last`
4. Send notification to responsible party

**Notification content:**

> yt-dlp extraction failed at `[timestamp]` from IP `[x.x.x.x]`.
>
> **First step:** rotate the outbound IP manually if the scheduled CRON rotation has not run recently. This is likely an IP ban.
>
> **If you are receiving multiple notifications like this in a short period**, IP rotation is not resolving the issue. This likely means YouTube has changed its extraction mechanism and yt-dlp has not yet been updated. Flag a temporary downtime, update the yt-dlp container image, and monitor for a fix from the yt-dlp maintainers (typically within 1–2 days). In the meantime, consider activating a backup extraction source (Piped or Invidious).
>
> Banned IP log entry saved. Recent failure count: `[N]`.

**IP ban log** (database table or append-only log file):

```
{ ip, firstFailure, lastFailure, failureCount, resolved: bool }
```

This log is the basis for knowing which IPs are burned so you don't reassign them after rotation. Mark an entry as `resolved` manually once the IP is no longer in use.

**Operational status thresholds:**

```
failures:count < 3   → "operational"
failures:count 3–5   → "degraded" (notify but don't halt)
failures:count > 5   → "down" (halt new extractions, serve cached only, notify urgently)
```

The application should also send notification that the system is no longer using the `yt-dlp` tool
which means, soon users wouldn't be able to view videos. In the notification it should add a
link that would help the admin reset the failures:count or have it as part of an admin dashboard.

---

### 6. IP Rotation Integration

IPv6 rotation runs as a host CRON job independent of your application. The application does not manage rotation — it only:

- Reads the current outbound IP at extraction time (via a simple `ip route get` or equivalent at process start)
- Logs it alongside each failure
- Includes it in failure notifications

When a manual early rotation is triggered (following a notification), the responsible party runs the rotation script manually on the host and resets `yt-dlp:failures:count` in Redis. No application code changes needed.

---

### 7. What Will Break and When

**YouTube format changes (outage scenario):**
yt-dlp stops producing valid URLs. Failure count climbs, system marks itself down, notifications fire. Cached videos continue working until TTL expires. No automated recovery — requires yt-dlp image update. Typical resolution: 1–2 days. Notification message explicitly calls this out as the escalation path after IP rotation fails to help.

**CDN URL expiry:**
Handled by parsing `expire` from the URL directly for TTL. If this is wrong, manifests serve dead URLs which triggers the per-video failure → re-extraction path naturally.

**Redis outage:**
Hard dependency. No locks means concurrent cold requests spawn multiple yt-dlp processes simultaneously. No cache means every request is a cold hit. Run Redis with persistence. No automated mitigation beyond this.

**IP-binding enforcement tightening:**
Direct CDN URLs fail for more users. Fallback proxy absorbs more traffic, bandwidth costs rise. The fallback path handles this correctly already — it just becomes the default for more requests.

**Proxy also failing:**
Handled explicitly — triggers cache eviction and re-extraction. If re-extraction also fails, yt-dlp failure tracking catches it.

---

### 8. Redis Key Summary

| Key                     | Type          | TTL                  |
| ----------------------- | ------------- | -------------------- |
| `yt-dlp:${videoId}`     | string (JSON) | parsed from `expire` |
| `manifest:${videoId}`   | string (XML)  | same                 |
| `failover:${videoId}`   | string (XML)  | same                 |
| `failures:${videoId}`   | hash          | same                 |
| `lock:${videoId}`       | string        | 30s                  |
| `yt-dlp:failures:count` | string        | none (manual reset)  |
| `yt-dlp:failures:last`  | string        | none                 |

Banned IP log lives in your database or a persistent append-only file, not Redis, since it needs to survive Redis restarts and serve as an audit trail.

---

### ⚠️ Standing Caution

yt-dlp is a reverse-engineered tool that depends entirely on YouTube's internal API not changing. YouTube makes breaking changes periodically with no notice. When this happens, **there is no automated fix** — the system will be in a degraded or down state until the yt-dlp maintainers release an update and you deploy it. This is a structural risk of the approach, not an edge case. Plan for it operationally: have a runbook, have a status page or way to communicate downtime to users, and keep the yt-dlp container image update process as frictionless as possible (single command redeploy). Piped or Invidious as a fallback extractor is worth revisiting once the core system is stable.

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
