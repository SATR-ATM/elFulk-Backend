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
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q={query}
  &type=video
  &key={API_KEY}
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
