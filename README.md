# Lambda site

Static site for [ryknuq/Lambda](https://github.com/ryknuq/Lambda). No build step, no
dependencies. Four files:

| File | What it does |
| --- | --- |
| `index.html` | The whole page |
| `styles.css` | All styling |
| `app.js` | Reads the GitHub API and fills in the build card + the `.dll` button |
| `favicon.svg` | Tab icon |

## Publishing

This repo is `bestluaucoder/Lambda.github.io`, so GitHub treats it as a project site and it
serves from a subpath:

```
https://bestluaucoder.github.io/Lambda.github.io/
```

That works — every path in the page is relative. If you want the clean root URL
`https://bestluaucoder.github.io` instead, the repo has to be named exactly
`bestluaucoder.github.io`; the name must match the account, and `Lambda.github.io` does not.
Renaming this repo in Settings is enough, no re-push needed.

Turn it on: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main` / `/ (root)` → Save**. First deploy takes about a minute; after that every push
republishes on its own.

## Things worth knowing

- The build card and the `.dll` button fill themselves in from
  `api.github.com/repos/ryknuq/Lambda/releases/latest`. Lambda has no releases tagged yet, so
  they show the empty state for now. Publish a release with `Lambda.dll` attached and the page
  picks it up with no edit here.
- That API call is unauthenticated, which is 60 requests per hour per visitor IP. A visitor over
  the limit sees the card say so, and every link on the page still works. Do not add a token to
  raise it — anything in a static site is public.
- Change which repo it reads by editing `REPO` on line 1 of `app.js`.
- To use your own λ icon instead of `favicon.svg`, drop the PNG in beside `index.html` and point
  the `<link rel="icon">` in `index.html` at it.
