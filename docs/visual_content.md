# Research

## Youtube Policy

The stopping of ads might go against the Youtube policy, you can find the relevant parts of the
Terms of Service in the next section.

### Terms of Service with relation to Ads

- [Youtube API Services Terms of Service: Developer Policies](https://developers.google.com/youtube/terms/developer-policies#i.-additional-prohibitions)

```text
I. Additional Prohibitions
...
You and your API Clients must not, and must not encourage, enable, or require others to:
...
5. modify, interfere with, replace, or block advertisements placed or served by YouTube or by YouTube API Services including in API Data, YouTube audiovisual content, or YouTube players;
```

- [Youtube Terms of Service](https://www.youtube.com/t/terms)
  This has a vague point that might apply to ads as well as they are part of the service offered by
  Youtube.

```text
## Your Use of the Service
...
### Google Accounts and YouTube Channels
...
#### Permissions and Restrictions
...
The following restrictions apply to your use of the Service. You are not allowed to:
...
2. circumvent, disable, fraudulently engage with, or otherwise interfere with the Service (or attempt to do any of these things), including security-related features or features that: (a) prevent or restrict the copying or other use of Content; or (b) limit the use of the Service or Content;
```

## Methods for adding Youtube videos to the application

### Web

### Mobile

# Technical Specs

## Functional Requirements

**Home Page**

- The system shall provide a home page for video content
- The home page shall display multiple categories that the user can use to filter content
- The home page shall display general video information: title, thumbnail, and duration

**Search**

- The system shall allow the user to search through video content
- The search interface shall display previous search terms

**Video Player**

- Upon selecting a video, the system shall transition to a dedicated player screen
- The player shall support pause, resume, and navigation to next and previous videos
- The player shall support both windowed and full screen view modes
- In full screen mode, the player shall display the video title and allow selection from recommended videos
- At the end of a video, recommendations shall appear automatically in full screen mode
- The player screen shall display additional recommendations, filterable by category
- When the page is reloaded while a video is paused, the system shall display the video thumbnail

**History**

- The system shall keep track of videos the user has previously watched

## Non-Functional Requirements

**Performance**

- The interface shall feel responsive and snappy across all interactions
- Video playback shall begin with minimal loading delay

**Privacy & Experience**

- The player shall not display ads or external YouTube recommendations
