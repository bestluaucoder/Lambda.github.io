const REPO = "ryknuq/Lambda";
const API = `https://api.github.com/repos/${REPO}`;

const pick = (r) => document.querySelector(`[data-role="${r}"]`);
const put = (r, v) => { const el = pick(r); if (el) el.textContent = v; };

const size = (n) => {
  if (!n) return "—";
  const kb = n / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

const when = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const flag = (cls, text) => {
  const el = pick("state");
  if (!el) return;
  el.classList.remove("on", "off");
  if (cls) el.classList.add(cls);
  el.textContent = text;
};

const kill = (label) => {
  const b = pick("dll");
  if (!b) return;
  b.classList.add("act-off");
  b.setAttribute("aria-disabled", "true");
  b.removeAttribute("href");
  put("size", label);
};

const revive = () => {
  const b = pick("dll");
  if (!b) return;
  b.classList.remove("act-off");
  b.removeAttribute("aria-disabled");
};

async function get(path) {
  const res = await fetch(API + path, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
async function repoInfo() {
  try {
    const r = await get("");
    put("p-branch", r.default_branch || "—");
    put("stars", `${r.stargazers_count} stars`);
  } catch {
    put("p-branch", "—");
  }
}

async function commitInfo() {
  try {
    const list = await get("/commits?per_page=1");
    const top = Array.isArray(list) ? list[0] : null;
    if (top) put("p-sha", top.sha.slice(0, 7));
  } catch {
    put("p-sha", "—");
  }
}

async function releaseInfo() {
  let rel = null;
  try {
    rel = await get("/releases/latest");
  } catch (e) {
    if (e.message === "403") {
      flag("off", "rate limited");
      put("note", "GitHub is rate limiting this address. Every link above still works.");
      kill("open releases");
      return;
    }
    try {
      const all = await get("/releases");
      rel = Array.isArray(all) && all.length ? all[0] : null;
    } catch { rel = null; }
  }

  if (!rel) {
    flag("off", "none yet");
    put("tag", "none yet");
    put("note", "No release is tagged yet. Publish one with Lambda.dll attached and this card fills itself in.");
    kill("none yet");
    return;
  }
  const tag = rel.tag_name || rel.name || "latest";
  put("tag", tag);
  put("p-tag", tag);
  put("p-date", when(rel.published_at));
  flag("on", "published");

  const assets = rel.assets || [];
  const dll = assets.find((a) => /\.dll$/i.test(a.name));
  const pack = assets.find((a) => /\.(zip|7z|rar)$/i.test(a.name));
  const file = dll || pack;

  if (!file) {
    put("p-asset", "none attached");
    put("note", `${tag} has no binary attached. Edit the release and upload Lambda.dll.`);
    kill("no binary");
    return;
  }

  put("p-asset", file.name);
  put("p-size", size(file.size));
  put("p-dl", String(file.download_count || 0));
  put("size", size(file.size));

  const b = pick("dll");
  if (b) {
    revive();
    b.href = file.browser_download_url;
    b.setAttribute("download", file.name);
    if (!dll) b.firstChild.textContent = "Download build ";
  }

  put("note", `${file.name} from ${tag}, published ${when(rel.published_at)}.`);
}

repoInfo();
commitInfo();
releaseInfo();
