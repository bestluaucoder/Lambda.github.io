# Lambda site

Static site for [ryknuq/Lambda](https://github.com/ryknuq/Lambda). No build step, no
dependencies:

| File | What it does |
| --- | --- |
| `index.html` | The whole page, plus the Open Graph tags used for link previews |
| `styles.css` | All styling |
| `app.js` | Reads the GitHub API and fills in the build card + the `.dll` button |
| `assets/icon.png` | Tab icon, 400×400 |
| `assets/banner.png` | The image Discord, Twitter and iMessage show when the link is posted |

## Publishing

Lives at:

```
https://lambdahvh.github.io
```

That is the root of the domain because the repo name matches the account that owns it
(`lambdahvh/lambdahvh.github.io`). Any other repo name would serve from a subpath instead.

Turn it on: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main` / `/ (root)` → Save**. First deploy takes about a minute; after that every push
republishes on its own. The repo has to be public for this to work on a free plan.

## Things worth knowing

- The build card and the `.dll` button fill themselves in from
  `api.github.com/repos/ryknuq/Lambda/releases/latest`. Lambda has no releases tagged yet, so
  they show the empty state for now. Publish a release with `Lambda.dll` attached and the page
  picks it up with no edit here.
- That API call is unauthenticated, which is 60 requests per hour per visitor IP. A visitor over
  the limit sees the card say so, and every link on the page still works. Do not add a token to
  raise it — anything in a static site is public.
- Change which repo it reads by editing `REPO` on line 1 of `app.js`.
- The link preview reads `og:title`, `og:description` and `og:image` from the top of
  `index.html`. Those URLs are absolute on purpose — relative ones do not work in a preview.
  Discord and Twitter cache a preview for a few hours, so use Discord's embed debugger or add
  `?1` to the link to force a re-fetch after changing them.
- The stripe colour down the left of the Discord embed comes from `theme-color`.
