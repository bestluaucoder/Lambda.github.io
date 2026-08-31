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

const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.round(m)} min ago`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.round(d)}d ago`;
  return when(iso);
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

const note = (el, text) => {
  const li = document.createElement("li");
  li.className = "feed-wait";
  li.textContent = text;
  el.replaceChildren(li);
};

async function commitInfo() {
  const feed = pick("feed");
  try {
    const list = await get("/commits?per_page=10");
    if (!Array.isArray(list) || !list.length) throw new Error("empty");
    put("p-sha", list[0].sha.slice(0, 7));
    if (!feed) return;
    const real = list.filter((c) => !c.parents || c.parents.length < 2).slice(0, 5);
    const rows = real.map((c) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = c.html_url;
      a.target = "_blank";
      a.rel = "noopener";
      const sha = document.createElement("span");
      sha.className = "feed-sha";
      sha.textContent = c.sha.slice(0, 7);
      const msg = document.createElement("span");
      msg.className = "feed-msg";
      msg.textContent = c.commit.message.split("\n")[0];
      const at = document.createElement("span");
      at.className = "feed-when";
      at.textContent = ago(c.commit.author.date);
      a.append(sha, msg, at);
      li.append(a);
      return li;
    });
    feed.replaceChildren(...rows);
  } catch {
    put("p-sha", "—");
    if (feed) note(feed, "GitHub is not answering right now — the log is one click away on the repo.");
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

function dial() {
  const box = pick("dial");
  if (!box) return;
  const svg = box.querySelector("svg");
  const live = pick("d-live");
  const ghost = pick("d-ghost");
  const ghost2 = pick("d-ghost2");
  const wedge = pick("d-wedge");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GAP = 58;
  const R = 96;
  const spot = (deg, r) => {
    const a = deg * Math.PI / 180;
    return [150 + r * Math.sin(a), 150 - r * Math.cos(a)];
  };
  const norm = (deg) => (((deg + 180) % 360 + 360) % 360) - 180;
  const point = (el, deg, r) => {
    const [x, y] = spot(deg, r);
    el.setAttribute("x2", x.toFixed(1));
    el.setAttribute("y2", y.toFixed(1));
  };

  let real = 0;
  let mode = "desync";
  let tick = 0;
  let spin = 0;
  let timer = null;

  const draw = () => {
    const twin = mode === "jitter" && calm;
    const flip = mode === "jitter" && tick % 2 === 0 ? 1 : -1;
    const fake = mode === "spin" ? norm(real + spin) : norm(real + GAP * (twin ? -1 : flip));
    const delta = norm(fake - real);
    point(live, real, 100);
    point(ghost, fake, 92);
    ghost2.classList.toggle("is-off", !twin);
    if (twin) point(ghost2, norm(real + GAP), 92);
    const [x1, y1] = spot(real, R);
    const [x2, y2] = spot(fake, R);
    wedge.setAttribute("d", `M 150 150 L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 ${delta < 0 ? 0 : 1} ${x2.toFixed(1)} ${y2.toFixed(1)} Z`);
    put("d-real", `${Math.round(real)}°`);
    put("d-fake", `${Math.round(fake)}°`);
    put("d-gap", `${Math.abs(Math.round(delta))}°`);
    put("d-side", delta < 0 ? "left" : "right");
    box.setAttribute("aria-valuenow", String(Math.round(real)));
  };

  const pulse = () => {
    if (timer) { clearInterval(timer); timer = null; }
    if (calm || mode === "desync") return;
    timer = setInterval(() => {
      tick += 1;
      spin = (spin + 22) % 360;
      draw();
    }, 130);
  };

  const aim = (e) => {
    const r = svg.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = (r.top + r.height / 2) - e.clientY;
    real = norm(Math.atan2(dx, dy) * 180 / Math.PI);
    draw();
  };

  let held = false;
  box.addEventListener("pointerdown", (e) => {
    held = true;
    aim(e);
    if (box.setPointerCapture) box.setPointerCapture(e.pointerId);
  });
  box.addEventListener("pointermove", (e) => { if (held) aim(e); });
  box.addEventListener("pointerup", () => { held = false; });
  box.addEventListener("pointercancel", () => { held = false; });

  box.addEventListener("keydown", (e) => {
    const step = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -5
      : e.key === "ArrowRight" || e.key === "ArrowUp" ? 5 : 0;
    if (!step) return;
    e.preventDefault();
    real = norm(real + step);
    draw();
  });

  const modes = document.querySelectorAll(".dsy-mode");
  for (const b of modes) {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      spin = 0;
      tick = 0;
      for (const o of modes) o.classList.toggle("is-on", o === b);
      pulse();
      draw();
    });
  }

  draw();
}

repoInfo();
commitInfo();
releaseInfo();
dial();
