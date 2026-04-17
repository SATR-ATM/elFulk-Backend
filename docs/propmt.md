<integration information>
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

</integration information>

<visual content docs>
# Research

## YouTube Policy

Blocking ads is explicitly prohibited by YouTube's Terms of Service.
The relevant excerpts are documented below for reference.

### Terms of Service — Ads

**[YouTube API Services Terms of Service: Developer Policies — Section I](https://developers.google.com/youtube/terms/developer-policies#i.-additional-prohibitions)**

Under _Additional Prohibitions_:

> You and your API Clients must not, and must not encourage, enable, or
> require others to: [...] modify, interfere with, replace, or block
> advertisements placed or served by YouTube or by YouTube API Services
> including in API Data, YouTube audiovisual content, or YouTube players.

**[YouTube Terms of Service](https://www.youtube.com/t/terms)**

Under _Your Use of the Service → Permissions and Restrictions_:

> You are not allowed to: [...] circumvent, disable, fraudulently engage
> with, or otherwise interfere with the Service (or attempt to do any of
> these things), including security-related features or features that:
> (a) prevent or restrict the copying or other use of Content; or
> (b) limit the use of the Service or Content.

### To Consider

- Blocking ads through the API is not possible without violating YouTube's
  Terms of Service. The "clean view" experience should instead focus on
  controlling the app's own UI around the player.
- If the platform supports recommendations, a strategy is needed to surface
  relevant videos without exposing the full YouTube catalogue to AI
  training systems, or a way to retrieve only what is needed.

---

## Methods for Adding YouTube Videos to the Application

Two APIs are involved:

- **YouTube Data API** — for querying videos, channels, and playlists
- **YouTube IFrame Player API** — for embedding and controlling playback

---

### Authentication

The YouTube Data API requires every request to include either an API key
or an OAuth 2.0 token. Since this application only performs read
operations (searching videos, fetching channel and playlist data),
an API key is sufficient.

#### API Key

- Obtained from the Google Cloud Console, scoped to YouTube Data API v3.
- Stored exclusively on the backend as an environment variable and never
  exposed to the client. All YouTube API calls are made server-side:

```
Frontend → App Backend → YouTube Data API
```

A typical backend request:

```
GET https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&key={API_KEY}
```

> ⚠️ **Quota:** The API enforces a default limit of 10,000 units per day.
> The backend should implement response caching to minimize unnecessary
> quota consumption.

---

### YouTube Data API

All endpoints are relative to `https://www.googleapis.com/youtube/v3`
and require the `key` parameter for read operations.

#### Videos

The `videos` resource represents a YouTube video. The primary operation
is `list`, which retrieves video details given one or more video IDs:

```
GET /videos?part=snippet,contentDetails&id={videoId}&key={API_KEY}
```

Relevant `part` values:

- `snippet` — title, description, channel name, thumbnails, publish date
- `contentDetails` — duration, aspect ratio
- `statistics` — view count, like count

Used to populate the player screen with metadata after a video ID has
been obtained via search or a playlist.

#### Search

The `search` resource returns results matching a query, each pointing
to a video, channel, or playlist. The `list` method is the only
supported operation:

```
GET /search?part=snippet&q={query}&type=video&key={API_KEY}
```

Key parameters:

- `q` — search query string
- `type` — filter by `video`, `channel`, or `playlist`
- `maxResults` — number of results to return (max 50)

> ⚠️ `search.list` costs **100 quota units** per call, making it the
> most expensive operation in the API. Results should be cached
> aggressively on the backend.

#### Playlists & Playlist Items

Two resources work together here. The `playlists` resource retrieves
playlist metadata:

```
GET /playlists?part=snippet,contentDetails&id={playlistId}&key={API_KEY}
```

To retrieve the actual videos inside a playlist, the `playlistItems`
resource is used:

```
GET /playlistItems?part=snippet&playlistId={playlistId}&key={API_KEY}
```

Each item in the response contains a `snippet.resourceId.videoId` field,
which is the video ID passed to the IFrame player for playback.
Pagination is handled via the `pageToken` parameter when a playlist has
more items than `maxResults` allows.

---

### YouTube IFrame Player API

After using the YouTube Data API to retrieve a video ID or playlist ID,
the IFrame Player API is used to actually play the video.

#### Setup

The IFrame Player API is loaded asynchronously by injecting its script
tag into the page. Once loaded, it calls `onYouTubeIframeAPIReady`,
which is where the player is initialized:

```javascript
var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document
  .getElementsByTagName('script')[0]
  .parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'VIDEO_ID',
    playerVars: {
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}
```

The player replaces the DOM element with the matching id with an
`<iframe>`. The `playerVars` object customizes player behavior, and
`events` maps player events to handler functions.

> ⚠️ The embedded player must have a minimum viewport of 200x200px.
> For 16:9 content, 480x270px or larger is recommended.

#### Controlling Recommendations

The IFrame API provides no direct way to suppress YouTube's end-of-video
recommendations overlay — that screen is rendered entirely by YouTube
and cannot be disabled through the API. The `rel=0` player parameter
limits it somewhat by restricting suggestions to the same channel, but
the overlay itself will still appear.

The correct approach is to intercept the `ended` player state via
`onStateChange` and take control before YouTube's overlay renders:

```javascript
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    // Prevent YouTube's endscreen from showing
    // and display the app's own recommendation UI instead
    showAppRecommendations();
  }
}
```

When a video ends, the app dismisses or overlays the player and renders
its own recommendations fetched from the YouTube Data API — giving full
control over what the user sees next without relying on YouTube's
suggestion algorithm.

#### Useful Parameters

| Parameter      | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `autoplay`     | Automatically plays the video on player enter              |
| `cc_lang_pref` | Sets the default subtitle language (e.g. Arabic)           |
| `controls`     | Useful if implementing custom player controls              |
| `enablejsapi`  | Required for programmatic player control                   |
| `rel`          | Limits end-of-video recommendations (partially deprecated) |

---

### Platform-Specific Notes

#### Web

React has a dedicated library for embedding YouTube videos with a
simpler API: [`react-player`](https://www.npmjs.com/package/react-player).

#### Mobile (Flutter)

Playback can be handled through the
[`youtube_player_flutter`](https://pub.dev/packages/youtube_player_flutter)
plugin. Refer to the plugin's documentation for IFrame interaction
details on mobile.

---

# Technical Specs

## Functional Requirements

### Home Page

- The system shall provide a home page for video content
- The home page shall display multiple categories that the user can use
  to filter content
- The home page shall display general video information: title,
  thumbnail, and duration

### Search

- The system shall allow the user to search through video content
- The search interface shall display previous search terms

### Video Player

- Upon selecting a video, the system shall transition to a dedicated
  player screen
- The player shall support pause, resume, and navigation to next and
  previous videos
- The player shall support both windowed and full screen view modes
- In full screen mode, the player shall display the video title and
  allow selection from recommended videos
- At the end of a video, recommendations shall appear automatically
  in full screen mode
- The player screen shall display additional recommendations,
  filterable by category
- When the page is reloaded while a video is paused, the system shall
  display the video thumbnail

### History

- The system shall keep track of videos the user has previously watched

---

## Non-Functional Requirements

### Performance

- The interface shall feel responsive and snappy across all interactions
- Video playback shall begin with minimal loading delay
- The backend shall implement caching for YouTube API responses to
  minimize quota consumption

### Privacy & Experience

- The player shall not display external YouTube recommendations
- Ads cannot be blocked without violating YouTube's Terms of Service
  and are therefore out of scope
  </visual content docs>

<plan>
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
  </plan>

<task1>
# Step 1: General Overview & Gap Analysis

Here's my understanding of the system you're building, followed by what I think might be missing or worth reconsidering.

---

## What You're Building

You're implementing a **curated video platform** — essentially a controlled YouTube frontend — targeting children, with parental oversight. The platform doesn't expose the raw YouTube experience; instead it presents a pre-filtered, ad-free, recommendation-controlled subset of YouTube content.

The system has two distinct layers that are worth keeping clearly separated:

**Content Management Layer** (partially out of scope for this module, but relevant)
Admins and parents populate a curated video library. Videos come from YouTube but are catalogued in your own database with metadata fetched once via the YouTube Data API. Categories, age groups, and gender tags are stored locally. A CRON job keeps metadata in sync.

**Playback Layer** (core of this module)
The actual video streaming bypasses the standard YouTube embed entirely. Instead of using the IFrame Player API, you're using `yt-dlp` to extract direct CDN stream URLs, generating a DASH manifest, and serving it via a media player like Shaka on the frontend. This is what enables ad-free playback — you're not loading the YouTube player at all, so ads are never injected.

The architecture around `yt-dlp` is fairly sophisticated: Redis caching of manifests with TTL derived from CDN URL expiry, a locking mechanism to avoid redundant cold-path extraction, a graduated failure tracking system, a per-format fallback proxy for partial failures, IPv6 rotation to avoid IP bans, and an operational notification system.

**Recommendations & Discovery**
Rather than using YouTube's recommendation engine (which is inaccessible via API), the platform serves recommendations from its own curated database. The initial plan is to have no recommendations at all, with an AI-powered recommendation system as a future milestone. Categories come from YouTube's `videoCategories.list` endpoint, stored locally and synced periodically.

---

## What I Think Is Clear

- The yt-dlp architecture is well thought out: the cold/warm path, the failure escalation, the per-format fallback, and the IP rotation integration are all coherent
- The decision to use `videos.list` for metadata retrieval and store it locally (rather than fetching on demand) is sound
- The category sync via CRON is a reasonable approach
- Keeping all YouTube API calls backend-only is correct

---

## Potential Gaps & Questions to Resolve

**1. The IFrame API vs. yt-dlp split isn't fully addressed**

Your research document mentions the IFrame Player API and `react-player` as if they might be used, but your plan clearly uses `yt-dlp` + Shaka instead. These are mutually exclusive approaches. The documentation needs to make this choice explicit and retire the IFrame API content (or relegate it to the "alternatives" section you mentioned). The `onStateChange` trick for suppressing recommendations is irrelevant if you're not using the IFrame player.

**2. The CDN proxy for fallback — who is actually proxying?**

The plan references a "CDN proxy" as a fallback when direct CDN URLs fail for certain formats, but the specifics of what this proxy is aren't fully defined. Is this your own NestJS backend streaming the bytes? A separate service? This has significant implications for bandwidth costs and infrastructure.

**3. Shaka Player vs. alternatives**

Shaka is mentioned in passing in the frontend code snippets, but there's no documented rationale for choosing it over alternatives (hls.js, Video.js, dash.js). Given that it's a core dependency, this deserves a brief justification.

**4. The `poToken` / bot detection problem**

Your plan mentions IP rotation to handle IP bans, but there's a separate, increasingly significant issue: YouTube's `poToken` / DroidGuard bot detection. This is different from IP-based banning — it's a client attestation mechanism that yt-dlp has had ongoing difficulty with. This is worth calling out explicitly as a known risk distinct from IP bans.

**5. Search flow ambiguity**

You mention that search would go through your own database (not YouTube's search API), which makes sense given the curated nature of the platform. But the search endpoint documentation describes `search.list` in some detail. The documentation should be clear: search is always against your local database; `search.list` is only documented as a reference in case the approach changes.

**6. CRON job quota risk**

You flag this as a concern but don't quantify it. Given 10,000 units/day and that `videos.list` costs 1 unit per call, the math is worth stating explicitly so readers understand the actual exposure.

**7. What happens when yt-dlp is fully down and cache is expired?**

The failure tracking covers notifications and degraded/down states, but the user-facing experience when the system is marked "down" isn't specified. Does the player show an error? A maintenance message? This should be documented.

**8. Redis persistence configuration**

You note Redis needs persistence enabled, but don't specify which mode (RDB vs. AOF) and why. For this use case, AOF with `appendfsync everysec` is probably right, but it's worth stating.

---

Shall I move on to **Step 2: information gathering** (YouTube Data API quota math, yt-dlp documentation details, Shaka Player, Invidious IPv6 rotator, etc.)?
</task1>
<response1>
here are the answers to your concerns

- For shaka+yt-dlp this is the main approach for now, and this doesn't require handling the case
  for Youtube recommendations. The other option of using the Youtube IFrame API is only a fallback and
  for the sake of documentation, along with the approach to use to avoid Youtube recommendations.
- I need you to also suggest a library to use for Flutter to have good playback support like the
  one for Shaka. If a good react alternative exist than also mention it
- The initial solution for the proxy is to have the Nest JS back-end proxy the Youtube traffic and
  have that be a last resort
- Shaka and any other library that is not part of the back-end is just a suggestion, the choice
  is ultimately that of the team developing that part of the system. But you are right, it is worth
  at least documenting the different codec and formats to expect and the different resolutions or
  at least pointing to useful documentation
- For poTokens the `pot` container is supposed to have a server that integrates with yt-dlp and
  handles it. For cookies, based on my conversation with an LLM it is only needed for specific
  age-restricted content (please validate that)
- Yes you should change that about search
- Yes state it directly and make the CRON limitation clearer
- In the case where yt-dlp is completely unusable, and the cache gets invalidated, the platform
  should show a message that the videos section is temporarily down and that other things
  like stories and games are available. As I said in the future in case downtime becomes common
  having a backup might be worth it.
- Yeah you can use that configuration for persistence, I have no idea the idea was proposed by an
  LLM

yes move to the next step, but keep requests to a minimum, only fetch things relevant to the plan, I don't think libraries of front-end for example might be useful
</response1>

<task2>
Good, I have everything I need. Let me now compile the full information-gathering output.

---

# Step 2: Information Gathering

Here are the findings on each area, validated from official sources where possible.

---

## Cookies & Age-Restricted Content

Your assumption is **partially correct but needs nuance**. Cookies are not required for normal public videos. However, YouTube has progressively tightened restrictions, and cookies tied to a logged-in Google account are now required specifically for:

- Age-restricted content
- Some videos behind a "sign in to confirm you're not a bot" gate, which is increasingly triggered by server IPs flagged for automated traffic

The key distinction: cookies are not a routine operational requirement for the curated library you're building, since you control which videos are added and can avoid age-restricted content at the content management level. They become relevant only if a video that was previously accessible later gets age-restricted by YouTube without your knowledge — which is another reason CRON sync jobs matter.

---

## poToken / BotGuard

The `bgutil-ytdlp-pot-provider` is the right tool here. A PO Token (Proof-of-Origin Token) is a cryptographic attestation mechanism YouTube uses to distinguish legitimate traffic from automated bot requests. When accessing YouTube from IP addresses flagged for suspicious activity, the platform may block requests with "Sign in to confirm you're not a bot" errors.

The integration works as follows: the `bgutil-ytdlp-pot-provider` plugin retrieves tokens from the provider and supplies them to yt-dlp using the PO Token Provider Framework. It has two operational modes — an always-running HTTP server and a script invoked per request. The HTTP server option is simpler and faster, and comes with a prebuilt Docker image.

Node.js (≥ 20) or Deno (≥ 2.0.0) is required unless using the Docker image for the HTTP server option. The token cache TTL defaults to 6 hours and is configurable via the `TOKEN_TTL` environment variable.

This is **distinct from IP banning** and should be documented as a separate failure mode in the architecture. IP bans affect extractions from a given IP; poToken failures affect all extractions regardless of IP if YouTube tightens bot detection enforcement. Both can occur simultaneously or independently.

---

## YouTube Data API Quota — Exact Costs

A read operation that retrieves a list of resources — channels, videos, playlists — usually costs 1 unit. A write operation that creates, updates, or deletes a resource usually costs 50 units. The one expensive outlier relevant to this system is `search.list`, which costs 100 units per call.

For the CRON job risk specifically: batching reduces costs — requesting 5 videos in one API call costs 1 unit total, whereas requesting them separately costs 5 units. This means a CRON job syncing 500 videos in batches of 50 costs only 10 units. The quota exposure is therefore low for the `videos.list` sync path. The concern would only arise if the CRON job also called `videoCategories.list` frequently or if there were a bug causing unbatched calls. Concretely: with a 10,000 unit/day budget and `videos.list` at 1 unit per batched call (up to 50 videos), you could sync up to 500,000 videos per day before hitting the quota on syncs alone.

If additional quota beyond the default is required, a compliance audit demonstrating adherence to YouTube API Services Terms of Service must be completed first. This audit process can take weeks and involves a detailed review of the application.

---

## Flutter Player Recommendations

For DASH manifest playback (the output of the yt-dlp architecture), the Flutter team needs a player that supports DASH natively, not just HLS. Two options to document:

**`better_player`** (pub.dev): supports HLS and DASH with track, subtitle, and audio track selection; alternative resolution support; cache support; picture-in-picture; HTTP headers support; and playlist support. Actively maintained community fork of `chewie`. This is the most full-featured option for this use case.

**Important caveat for iOS/macOS**: iOS and macOS use AVPlayer, which does not support DASH natively. HLS should be used for Apple platforms. This is a significant architectural note — if the platform targets iOS, the backend may need to generate HLS manifests (`.m3u8`) alongside DASH (`.mpd`), or the Flutter layer needs to handle this format negotiation. The backend team should be aware of this before finalising the manifest format.

---

## React Alternatives to Shaka

For the web/React side, the equivalent to Shaka for teams that prefer a higher-level API is **`react-player`** (already mentioned in the research doc) or **`video.js`** with the `videojs-http-streaming` plugin, which supports both DASH and HLS. Shaka itself has no official React wrapper but integrates straightforwardly with a `useRef` on a `<video>` element. The choice is for the frontend team, but the doc should note that any player consuming the DASH manifest must support the MPD format and handle `Content-Type: application/dash+xml`.

---

These findings translate into the following additions or corrections to the documentation:

- The poToken provider should be documented as a **required sidecar service** in the architecture diagram, not an optional add-on, since without it yt-dlp extractions will increasingly fail on datacenter IPs.
- The iOS/DASH incompatibility is a flag for the mobile team that needs to be in the NFRs or technical constraints section.
- Quota math for CRON jobs should be explicitly stated (batched `videos.list` = 1 unit per 50 videos, making the sync path essentially free at normal library sizes).
- Cookies should be noted as not required for normal operation but worth having a plan for if content management inadvertently admits age-restricted videos.

Ready to move to **Step 3: Diagrams** whenever you are. To proceed efficiently, I'll propose the sequence diagrams in plain text for your validation before generating any visuals — shall I start with the entity/class diagram or the sequence diagrams?
</task2>

<response2>
- For cookies, I think it is worthwhile having a system to detect if the link is valid and can 
be used with `yt-dlp` when adding links by either parent or admin. This is just something to keep 
in mind for other parts of the system
- For the poToken comment, I intend to leave it to the plugin with the HTTP server to handle it as 
it is supposed to do so. You can add a brief part of the documentation about it may be in the 
section of potential pitfalls
- For your point of the youtube quota it should be mentioned in the documentation, and also that 
we cannot go over the quota since the proposed option of a compliance audit demonstrating adherence 
to YouTube API Services Terms of Service is not possible at least in our current solution but mention 
it anyways
- Make sure to note this in the documentation of the Flutter part and also for the documentation on 
manifests and their format.
- Make sure to state the options for front-end and clearly state the current requirement
- For diagrams I don't want you to generate them right now but rather to give me the information 
needed so I can later give it as input to an AI to generate the diagram. Make sure to include 
relevant context. Start with sequence to validate flow then entity.
</response2>

<task3.sequence>

# Step 3: Sequence Diagram Descriptions

---

## Diagram 1 — User Entry & Home Screen Load

**Purpose:** Covers what happens from the moment the user opens the app to seeing the home screen with video thumbnails.

**Actors / Participants:**

- `Child` (the end user)
- `Mobile/Web Client`
- `NestJS API`
- `PostgreSQL DB`
- `Redis`

**Sequence:**

1. `Child` opens the application (authenticated session assumed — auth is out of scope for this module)
2. `Client` sends `GET /videos` with optional `categoryId` filter (default: none)
3. `NestJS` checks `Redis` for cached response under key `videos:home:{categoryId|all}`
4. **Cache hit:** return cached video list → go to step 8
5. **Cache miss:** `NestJS` queries `PostgreSQL` for videos, joining on `Category` and `WatchProgress` for the current child profile, making sure not all videos have already been watched by the child.
6. `NestJS` writes result to `Redis` with appropriate TTL
7. Response assembled: list of `{ id, title, thumbnail, duration, categoryId, progressSeconds }` — progress included for watched-indicator display
8. `Client` renders the home screen grid with category filter bar and watch progress overlays

**Notes for diagram generator:**

- The category filter bar populates from a separate `GET /categories` call that follows the same Redis-first pattern; you can show this as a parallel call or a prior call before the video list, the important thing is it's a separate request
- No YouTube API call happens here — all data is from the platform's own DB
- Show the Redis cache miss/hit as an `alt` block

---

## Diagram 2 — Search Flow

**Purpose:** User types a search query; the platform searches its own video library (not YouTube directly).

**Actors / Participants:**

- `Child`
- `Client`
- `NestJS API`
- `PostgreSQL DB`
- `Redis`

**Sequence:**

1. `Child` focuses the search bar — `Client` fetches and renders `GET /search/history` (returns previous search terms for the current child profile, read from DB, no cache needed)
2. `Child` submits a search term
3. `Client` sends `GET /search?q={term}&categoryId={optional}`
4. `NestJS` checks `Redis` for `search:{childProfileId}:{normalizedTerm}:{categoryId|all}`
5. **Cache hit:** return cached results → go to step 8
6. **Cache miss:** `NestJS` queries `PostgreSQL` — full-text or LIKE search on `title` within the curated video library; applies `categoryId` filter if present
7. `NestJS` writes result to `Redis` with TTL; writes the search term to `search_history` table in `PostgreSQL` (fire-and-forget, not in the critical path)
8. `Client` renders search results: `{ id, title, thumbnail, duration, progressSeconds }`

**Notes for diagram generator:**

- History write (step 7b) should be shown as an async side-effect, not blocking the response
- Show `alt` block for cache hit/miss
- The search is against the platform's own DB — make this explicit with a label; no arrow should go to YouTube

---

## Diagram 3 — Video Playback (Main Flow / Cold Path)

**Purpose:** User selects a video and the system goes through the full yt-dlp extraction path to produce a DASH manifest for the player.

**Actors / Participants:**

- `Child`
- `Client (Shaka Player)`
- `NestJS API`
- `Redis`
- `yt-dlp process`
- `YouTube CDN` (external)

**Sequence:**

1. `Child` taps a video
2. `Client` sends `GET /manifest/{videoId}`
3. `NestJS` checks `Redis` for `manifest:{videoId}`
4. **Warm path (cache hit):** return MPD manifest directly → go to step 13
5. **Cold path (cache miss):**
6. `NestJS` attempts `SET NX EX 30` on `lock:{videoId}` in `Redis`
7. **Lock acquired:** spawn `yt-dlp` process for `videoId`
8. **Lock not acquired (concurrent request):** poll `Redis` every 500ms up to 25s waiting for `manifest:{videoId}` to appear, then return it once available
9. `yt-dlp` returns JSON with available formats and CDN URLs
10. `NestJS` filters to target resolutions `[144p, 240p, 360p, 480p, 720p, 1080p]`; selects best audio stream
11. `NestJS` generates DASH MPD manifest with direct CDN URLs; parses CDN URL `expire` timestamp → sets Redis TTL = `expire - 10 minutes`
12. `NestJS` stores `yt-dlp:{videoId}` (raw formats) and `manifest:{videoId}` (MPD) in `Redis`; releases lock
13. `NestJS` returns MPD manifest with `Cache-Control: no-store`
14. `Client (Shaka)` loads manifest and begins streaming directly from `YouTube CDN`
15. `NestJS` saves `WatchProgress` record to `PostgreSQL` (initial entry or update timestamp) — shown as async, not blocking playback

**Notes for diagram generator:**

- The lock contention path (step 7b) and the main extraction path (steps 7a–12) should be in an `alt` block
- The CDN warm/cold paths should be in a separate outer `alt` block
- Shaka streams directly to the CDN after loading the manifest — there is **no proxying** in the happy path; make this visually clear with a direct arrow from Shaka to YouTube CDN
- yt-dlp is a subprocess, not a service — represent it as a `participant` of type process or boundary, not a full actor box if your tool supports it

---

## Diagram 4 — Video Playback Failure & Fallback

**Purpose:** A format fails during playback (expired CDN URL or IP ban). Covers client-side retry, backend fallback to proxy, and full re-extraction if needed.

**Actors / Participants:**

- `Client (Shaka Player)`
- `NestJS API`
- `Redis`
- `yt-dlp process`
- `YouTube CDN` (external)

**Sequence:**

1. `Shaka` encounters a stream error on one or more format(s)
2. `Shaka` internally retries (configured: 3 attempts, exponential backoff starting 1s) — this is internal to the client, no server involved
3. After exhausting retries for a format, client increments local `formatFailures[formatId]`
4. When `formatFailures[formatId] >= FAILURE_THRESHOLD (3)`: `Client` sends `POST /video/{videoId}/failure` with `{ formatIds: [failedIds] }`
5. `NestJS` increments `HINCRBY failures:{videoId} total N` in `Redis`
6. **Below threshold:**
   - Check `failover:{videoId}` in Redis
   - If exists: update failed format entries with proxy URLs
   - If not exists: copy `manifest:{videoId}`, update failed format entries with proxy URLs, store as `failover:{videoId}`
   - Return updated manifest immediately (proxy URLs only for failed formats; other resolutions unchanged)
7. **At or above threshold (CDN URLs considered fully dead):**
   - Delete all Redis keys: `yt-dlp:{videoId}`, `manifest:{videoId}`, `failover:{videoId}`, `failures:{videoId}`
   - Return `{ manifestUrl: '/manifest/{videoId}' }` — triggers cold re-extraction on next request
8. `Client (Shaka)` loads the returned manifest (either failover or fresh)
9. **Proxy path (from step 6):** subsequent stream requests for failed formats go to `NestJS` proxy endpoint → `NestJS` fetches from `YouTube CDN` → streams back to client
10. **If proxy also returns 403/410:** `NestJS` deletes all cache keys, returns 302 to `/manifest/{videoId}`, increments `yt-dlp:failures:count`, cold path re-extraction triggers

**Notes for diagram generator:**

- The threshold decision (step 6 vs 7) should be an `alt` block
- The proxy path (step 9) and the re-extraction path (step 10 failure) should each be separate `alt` or `opt` blocks
- Emphasize that in the fallback manifest, only the failed format entries point to the proxy — working resolutions still hit the CDN directly; this is key to the design

---

## Diagram 5 — CRON Sync Job

**Purpose:** Periodic job that keeps the platform's video metadata (titles, thumbnails, durations, categories) consistent with YouTube's actual data.

**Actors / Participants:**

- `CRON Scheduler` (host-level, e.g., node-cron or system cron)
- `NestJS API` (SyncService)
- `YouTube Data API` (external)
- `PostgreSQL DB`
- `Redis`

**Sequence:**

1. `CRON Scheduler` triggers `SyncService.run()` on schedule
2. `SyncService` queries `PostgreSQL` for all video IDs in the platform library
3. `SyncService` batches IDs into groups of 50 and calls `videos.list?part=snippet,contentDetails&id={batch}&key={API_KEY}` on the `YouTube Data API` (1 unit per batch)
4. For each video in the response:
   - Compare returned metadata with DB record
   - If changed: update `title`, `thumbnail`, `duration`, `categoryId` in `PostgreSQL`
   - If video returns 404 (deleted/privated on YouTube): flag video as `unavailable` in DB, do not delete
5. `SyncService` also calls `videoCategories.list` once per sync run to refresh the category list in `PostgreSQL` (idempotent upsert)
6. For any video whose metadata changed: delete `manifest:{videoId}` and `yt-dlp:{videoId}` from `Redis` to force re-extraction on next play request (stale manifests may reference wrong content)
7. Log sync result: `{ synced, updated, unavailable, quotaUsed }`

**Notes for diagram generator:**

- The batching loop (step 3) should be shown as a `loop` block with the label "for each batch of 50 video IDs"
- The per-video comparison (step 4) should be a `loop` inside or following the batch loop
- The unavailable/changed branching in step 4 should be an `alt` block
- The cache invalidation (step 6) is conditional on changes — show as `opt` block
- Quota math note for context (not necessarily in the diagram): 500 videos = 10 batches = 10 quota units, well within the 10,000/day limit. The bottleneck would only appear if `search.list` (100 units/call) were used in the sync job — it should not be.

---

**Recommended diagram format:** PlantUML `sequenceDiagram` or Mermaid `sequenceDiagram` — both support `alt`, `opt`, `loop`, and `par` blocks which are needed for the branching paths above. If the target tool is Mermaid, note that `par` (parallel) blocks have limited support in some renderers, so async side-effects (history write, WatchProgress save) can be shown as dashed arrows with a note instead.

Ready to move to the **entity/class diagram** descriptions whenever you are.
</task3.sequence>

<response3.sequence>
Great work, all that is missing is the sequence diagram for system failure when the failures of
yt-dlp exceed the limit and a mention of this case in the diagram. The behavior is described
in the parts that talk about notification.
</response3.sequence>

<task3.rest>

## Diagram 6 — Critical System Failure & Notification

**Purpose:** This covers the "Stop" state when `yt-dlp` is consistently failing (likely due to a breaking YouTube change or a total IP block), triggering human intervention.

**Actors / Participants:**

- `Client (Shaka Player)`
- `NestJS API (Health/Extraction Service)`
- `Redis`
- `Admin / Developer`
- `Notification Service (Email/Slack)`

**Sequence:**

1.  `NestJS` executes an extraction attempt that fails (Process exit error or malformed JSON).
2.  `NestJS` logs the failure: `HINCRBY yt-dlp:failures:count 1`.
3.  `NestJS` checks the new value of `yt-dlp:failures:count`.
4.  **Threshold Exceeded (e.g., Value > 5):**
    - `NestJS` updates system status to `DOWN`.
    - `NestJS` triggers `NotificationService.sendAlert()` with the current outbound IP and error logs.
5.  `Admin` receives a notification.
6.  **Simultaneous User Request:** A `Child` tries to load a new video.
7.  `Client` tries to get a video or is at home.
8.  `NestJS` sees system status is `DOWN`.
9.  `NestJS` returns a `503 Service Unavailable` with a specific error code (e.g., `VIDEO_SERVICE_DEGRADED`).
10. `Client` catches the 503 redirects to home and displays the "Videos are resting, try Stories or Games!" UI.
11. **Resolution:** `Admin` performs manual IP rotation or updates the `yt-dlp` container depending on the frequency of failures, then clicks "Reset Failure Count" in the Dashboard.
12. `NestJS` sets `yt-dlp:failures:count` back to `0` and marks status as `OPERATIONAL`.

---

## Entity & Class Diagram Specifications

To integrate the **Visual Content** module into your existing class diagram, we need to add several fields and new entities to handle progress tracking, search history, and the more detailed metadata required by the `yt-dlp` flow.

### 1. New & Enhanced Entities

| Entity            | Purpose                                                 | Key Fields to Add/Modify                                                                                                           |
| :---------------- | :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Video**         | Existing, but needs more detail for the manifest logic. | `duration_seconds: Integer`, `thumbnail_url: String`, `is_available: Boolean` (for 404 checks), `category_id: String`.             |
| **WatchProgress** | **New Entity.** Tracks where a child left off.          | `profile_id: UUID <FK>`, `video_id: UUID <FK>`, `last_position_seconds: Integer`, `is_completed: Boolean`, `updated_at: DateTime`. |
| **SearchHistory** | **New Entity.** Powers the search term suggestions.     | `profile_id: UUID <FK>`, `query_term: String`, `searched_at: DateTime`.                                                            |
| **SystemStatus**  | **New Entity (or Redis Config).** Tracks tool health.   | `yt_dlp_status: Enum(OK, DEGRADED, DOWN)`, `failure_count: Integer`, `last_rotation_at: DateTime`.                                 |

### 2. Class Diagram Relationships

Based on your provided SVG, here is how the new logic connects:

- **`ChildProfile` (1) — (0..\*) `WatchProgress`**: A child can have progress across many videos. This should be queried to show the "progress bar" on the home screen.
- **`ChildProfile` (1) — (0..\*) `SearchHistory`**: One-to-many relationship to store previous lookups.
- **`Video` (1) — (0..\*) `WatchProgress`**: Connects the progress record to the specific content.
- **`ManifestService` (New Class)**:
  - **Methods**: `getManifest(videoId)`, `generateMPD(ytDlpJson)`, `handleExtractionFailure(videoId, error)`.
  - **Dependencies**: Uses `CacheService` (Redis) and `yt-dlp` process.
- **`ProxyService` (New Class)**:
  - **Methods**: `streamThroughProxy(videoId, formatId, rangeHeader)`.
  - **Purpose**: The fallback mechanism for broken CDN links.

### 3. Proposed Updates to the Existing Diagram

- **`Content` Abstract Class**: Ensure it has `age_rating` and `is_approved` (which you already have).
- **`Video` Concrete Class**: Needs the `fetchYouTubeMetadata()` method (already in your SVG) but also a `getManifestUrl()` method for the frontend to call.
- **`Category`**: Your SVG shows categories; we will use the `yt_category_id` to map YouTube's native categories to your local ones.
  </task3.rest>

<response3.rest>
I think this is good for now. I think we should go to Functional and Non-Functional requirements.
Then we will go to documentation. Then finally legal considerations
</response3.rest>

<task4.f&nfr>

### 4. Functional Requirements (FR)

The Visual Content module provides a fully curated, ad-free YouTube playback experience inside the Kids Safe Home platform. All video metadata and recommendations are served from the platform’s own PostgreSQL database (populated and kept in sync via the YouTube Data API). Playback uses direct CDN streams extracted by yt-dlp (never the official YouTube IFrame Player API in the primary path).

**Home Page & Discovery**

- The system shall display a home page with a horizontal category filter bar (populated from the local `Category` entity, sourced from `videoCategories.list` and synced via CRON).
- The home page shall show a grid of video cards containing title, thumbnail, duration, and watch-progress overlay (derived from the `WatchProgress` entity linked to the current `ChildProfile`).
- Videos shall be filtered so that the child never sees _only_ already-watched content (if possible of course) (SQL filter or merged query on `is_completed = false` or `last_position_seconds < duration_seconds`).
- The system shall support category-based filtering on the home page and inside the player screen.

**Search**

- The system shall provide a search interface that queries the local curated video library (not YouTube’s `search.list` endpoint in the primary flow).
- Previous search terms for the current child profile shall be displayed (stored in the `SearchHistory` entity).
- Search results shall include title, thumbnail, duration, and progress indicator.

**Video Player**

- Selecting a video shall open a dedicated full-screen-capable player screen.
- The player shall support play/pause, seek, previous/next video navigation, windowed and full-screen modes, and display of the video title.
- Playback progress shall be automatically saved to the `WatchProgress` entity (initial record created on first play; updated on pause/seek/end and synced periodically).
- When the page is reloaded while a video is paused, the system shall display the video thumbnail with the saved progress indicator.
- At the end of a video the system shall automatically display its own curated recommendations instead of YouTube’s end-screen.
- External YouTube recommendations and ads shall never be shown (achieved by using yt-dlp + Shaka Player / better_player instead of the IFrame API).

**History & Progress**

- The system shall persistently track watch history and progress per `ChildProfile` via the `WatchProgress` entity.
- Progress shall be visible both on the home-page grid and inside the player.

**Content Management Integration (boundaries with Parent/Admin modules)**

- When a parent or admin adds a video (by YouTube link or library selection), the backend shall extract the video ID, call `videos.list` (backend-only, API key) to fetch title, thumbnail, duration, and category, then store it in the `Video` entity.
- When the parent adds a link the system should make sure it is queryable using `yt-dlp`
- A periodic CRON job shall sync metadata for all videos in the library (batched `videos.list` calls) and refresh categories via `videoCategories.list`.

**System Health & Graceful Degradation**

- The system shall expose a health endpoint that reflects the Redis `yt-dlp:failures:count` status (`OPERATIONAL` / `DEGRADED` / `DOWN`).
- When `yt-dlp:failures:count` exceeds the configured threshold (>5), the system shall return HTTP 503 with error code `VIDEO_SERVICE_DEGRADED` and the frontend shall display the message “Videos are resting — try Stories or Games!” while keeping other modules available.

---

### 5. Non-Functional Requirements (NFR)

**Performance & Responsiveness**

- The interface shall feel snappy across all interactions (home grid, search, player transitions).
- Video playback shall begin with minimal loading delay (warm-path Redis manifest hit < 200 ms target).
- All YouTube Data API calls (metadata, categories, CRON sync) shall be cached aggressively on the backend (Redis) to minimise latency.

**Quota & Reliability**

- YouTube Data API quota usage shall be tracked (via a simple Redis counter or database log incremented on every call). CRON jobs and parent/admin video-add flows shall support graceful failure: if quota is exhausted, the operation shall be queued or rejected with a clear admin notification instead of failing silently.
- The yt-dlp extraction path shall be protected by Redis locking (`lock:{videoId}`) to prevent duplicate cold-path executions under concurrent load.
- Manifests shall be cached in Redis with a TTL derived from the CDN `expire` parameter minus a 10-minute safety buffer.
- The system shall tolerate temporary YouTube defense mechanism by falling back to a per-format NestJS proxy only for failed resolutions; full re-extraction shall be triggered only when the entire CDN set is considered dead using a Redis counter.

**Stability & Maintainability**

- The platform shall minimise the number of components that require ongoing maintenance by relying on well-maintained external tools (yt-dlp, Redis, Shaka / better_player) wherever possible.
- The yt-dlp integration shall be decoupled (ManifestService + ProxyService) so that updates to yt-dlp or the poToken sidecar do not require changes to the rest of the application.
- Redis persistence shall be enabled (AOF with `appendfsync everysec`) because it is a hard dependency for caching, locking, and failure counting.

**Privacy & Experience**

- No external YouTube recommendations or advertisements shall ever be displayed.
- All YouTube Data API calls shall be performed server-side only (API key never exposed to the client).
- On iOS the backend must be prepared to serve HLS manifests in addition to DASH (because AVPlayer does not support MPD natively).

**Technical Constraints (derived from class diagram & architecture)**

- Video metadata (external_id, duration_seconds, thumbnail_url, category) shall be stored locally in the `Video` entity and kept consistent via CRON.
- System status (`SystemStatus` or Redis `yt-dlp:failures:count`) shall drive the degraded/down behaviour described above.
  </task4.f&nfr>

<task4.f&nfr.extra>

## 4. Requirements Specifications

### Functional Requirements (FR)

**FR1: Content Discovery & Curation**

- **FR1.1: Localized Library Search:** The system shall allow users to search for videos only within the curated database. Search results must include title, duration, and a "watched" progress indicator.
- **FR1.2: Category Filtering:** The home screen shall display a horizontal category bar (synced with YouTube's `videoCategories`). Selecting a category must filter the visible videos accordingly.
- **FR1.3: Search History:** The system shall store and display the last 10 search terms per child profile to facilitate quick re-discovery.
- **FR1.4: Recommendation Control:** The system shall display recommendations only from the platform’s curated library. It must explicitly prevent the display of YouTube’s native end-of-video recommendation overlays.

**FR2: Video Playback Experience**

- **FR2.1: Ad-Free Streaming:** The system shall provide an ad-free playback experience by extracting direct stream URLs and serving them via a custom DASH/HLS manifest.
- **FR2.2: Playback Controls:** The player shall support standard controls: Play, Pause, Seek (Scrubbing), Volume, and Full-screen toggle.
- **FR2.3: Playlist Navigation:** The player shall provide "Next" and "Previous" buttons to navigate through the current filtered list or playlist.
- **FR2.4: Resume Playback:** The system shall save the child's playback position (`last_position_seconds`) every 30 seconds and upon pausing/closing, allowing the child to resume exactly where they left off.

**FR3: Management & Sync**

- **FR3.1: Parental Ingestion:** Parents shall be able to add videos by pasting a YouTube URL. The system must automatically extract the ID and fetch metadata (title, duration, thumbnail) via the YouTube Data API.
- **FR3.2: Automated Metadata Sync:** The system shall run a daily CRON job to update local metadata and flag any videos that have been deleted or made private on YouTube.

---

### Non-Functional Requirements (NFR)

**NFR1: Performance & Latency**

- **NFR1.1: Extraction Latency:** Cold-path video extraction (via `yt-dlp`) should not exceed 5 seconds. Warm-path (cached) manifest delivery must occur in under 200ms.
- **NFR1.2: Streaming Continuity:** The frontend player (Shaka/BetterPlayer) must implement a multi-retry strategy (3 attempts with exponential backoff) before escalating to the backend failure endpoint.

**NFR2: Reliability & Availability**

- **NFR2.1: Failover Resilience:** If a direct CDN URL fails, the system must transparently update the manifest to proxy the specific failed format through the NestJS backend.
- **NFR2.2: Health Monitoring:** The system must track `yt-dlp` exit codes. If more than 5 failures occur, the system must notify admins and enter a "Degraded" state.
- **NFR2.3: Redis Persistence:** Redis must be configured with AOF (Append Only File) persistence to ensure that active stream manifests and locks are not lost during a service restart.

**NFR3: Scalability & Constraints**

- **NFR3.1: Quota Management:** All YouTube Data API calls must be batched (up to 50 IDs per call) to ensure the 10,000-unit daily limit is never exceeded.
- **NFR3.2: Platform Compatibility:** The backend must be capable of generating both DASH (`.mpd`) and HLS (`.m3u8`) manifests to ensure compatibility with both Android/Web and iOS/macOS devices.

**NFR4: Security & Compliance**

- **NFR4.1: API Key Protection:** The YouTube API Key must be stored as a server-side environment variable and never exposed to the client-side code.
- **NFR4.2: IP Rotation:** To mitigate IP bans, the system must utilize an IPv6 rotator at the infrastructure level, ensuring extraction requests are spread across a /64 CIDR block.

---

### Related System Components to Consider Later

- **Parental Dashboard:** For managing "Allowed Lists" and viewing usage statistics (time spent per category).
- **AI Recommendation Engine:** A future module to replace the current static/random recommendation logic with a profile-based affinity model.
  </task4.f&nfr.extra>

<response4>
Great, Now I need part of the documentation, mainly external API and the legal side. The rest should 
be done when the final document is drafted
</response4>

<task5>

## 5. External API & Integration Specifications

The system relies on a hybrid approach: the official YouTube Data API for metadata and community-maintained extractors for stream URLs.

### 5.1 YouTube Data API v3 (Official)

- **Purpose:** Fetching video metadata (titles, thumbnails, descriptions) and channel/playlist structures.
- **Authentication:** Server-side API Key stored in `.env`.
- **Quota Management:** \* The system implements a **Batch Processor** to group up to 50 video IDs per request.
  - **Strict Limit:** 10,000 units/day. The `YoutubeModule` must include a circuit breaker if the quota is exhausted to prevent service downtime.

### 5.2 Stream Extraction Layer (Piped/NewPipeExtractor)

- **Purpose:** To retrieve direct `.m4a` (audio) and `.mp4` (video) streams and generate DASH/HLS manifests.
- **Endpoint Strategy:** The backend acts as a proxy. Requests are routed through an **IPv6 Rotator**.
- **Data Flow:**
  1.  Client requests a video.
  2.  Backend queries the extractor with a specific IPv6 address from the `/64 CIDR` block.
  3.  Extractor returns raw stream URLs.
  4.  Backend constructs a manifest (`.mpd` or `.m3u8`) and serves it to the client.

---

## 6. Legal & Compliance Framework

Given the nature of the project (ad-blocking and third-party extraction), strict adherence to specific legal boundaries is necessary for the project's viability.

### 6.1 Terms of Service (ToS) Considerations

- **YouTube ToS:** Accessing YouTube through non-standard interfaces or blocking ads technically violates YouTube’s Terms of Service. This project is framed as a **Research/Private Proxy Tool** rather than a commercial product to mitigate direct litigation risk.
- **API Usage:** Use of the official API must comply with Google’s Developer Policy (no spoofing, no selling of API data).

### 6.2 Privacy & Child Safety (COPPA/GDPR-K)

- **Zero-Tracking Policy:** Since the target audience is children, the system **must not** store PII (Personally Identifiable Information).
- **Data Minimization:** Parental accounts are linked to "Allowed Lists," but no behavioral data of the child is sent back to Google or third-party trackers.
- **Local Storage:** Recommendation weights and usage stats are stored locally on the server/device to remain compliant with the Children's Online Privacy Protection Act (**COPPA**).

### 6.3 Intellectual Property

- **Content Rights:** The system does not host or redistribute content; it acts as a **dynamic manifest generator**.
- **Fair Use:** The project serves as an "accessibility and safety wrapper," providing a transformative interface for existing public content.

---

### Next Steps for the Final Draft

1.  **Drafting the Deployment Guide:** Configuring the IPv6 rotation on the server level.
    </task5>

<response5>
Ok time to draft the final document. You shouldn't generate the final diagrams I will generate them 
separately and save them under `diagrams/visual_content`. Also add the deployment guide and the 
requirement. The diagrams should be collapsible. The goal of the document is that the main parts 
are visible and easily distinguishable. The less important parts should be collapsible and not 
obstruct reading. Add a list of diagrams somewhere in the document for reference. Remove the text 
about them from the final document and only include the place that renders the final images
</response5>

Above is the context I had from a previous conversation with an LLM.
Do you understand the context so far? Can you precede with the final step?
