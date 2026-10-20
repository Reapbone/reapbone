#!/usr/bin/env python3
"""Generate a no-dependency GitHub profile stats SVG using real public data.

Environment: GITHUB_USERNAME (default Reapbone), GITHUB_TOKEN (optional locally).
The GitHub Actions runner supplies its scoped token automatically.
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

USER = os.environ.get("GITHUB_USERNAME", "Reapbone")
API = "https://api.github.com"
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "stats.svg"


def get_json(path: str):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "reapbone-github-profile",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API}{path}", headers=headers)
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.load(res)


def render(user, count, stars, followers):
    updated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    username = escape(user)
    numbers = [f"{n:,}" for n in (count, stars, followers)]
    labels = ["PUBLIC REPOS", "EARNED STARS", "FOLLOWERS"]
    xs = [184, 551, 916]
    cards = []
    for idx, (x, label, val) in enumerate(zip(xs, labels, numbers)):
        accent = "#64ecc0" if idx == 2 else "#a28cff"
        cards.append(f'<text x="{x}" y="64" fill="{accent}" font-size="17" letter-spacing="2">{label}</text>'
                     f'<text x="{x}" y="125" fill="#fafaff" font-size="48" font-weight="bold">{val}</text>')
    cards_xml = "".join(cards)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="175" viewBox="0 0 1100 175" role="img" aria-label="GitHub public statistics for {username}: {count} public repositories, {stars} earned stars, {followers} followers">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#121224"/><stop offset="1" stop-color="#101e25"/></linearGradient></defs>
<style>@keyframes bright{{50%{{opacity:.45}}}}.orb{{animation:bright 3.2s ease-in-out infinite}}@media(prefers-reduced-motion:reduce){{*{{animation:none!important}}}}</style>
<rect width="1100" height="175" rx="18" fill="url(#bg)"/><rect x="1" y="1" width="1098" height="173" rx="17" fill="none" stroke="#484361"/>
<circle cx="31" cy="25" r="5" fill="#58eec0" class="orb"/>
<g font-family="Arial,Helvetica,sans-serif" text-anchor="middle">{cards_xml}</g>
<path d="M367 42V134M733 42V134" stroke="#484361"/>
<text x="550" y="162" text-anchor="middle" font-family="Consolas,monospace" font-size="11" letter-spacing="1" fill="#77758e">LIVE PUBLIC GITHUB DATA · UPDATED {updated}</text></svg>'''


def main():
    encoded = urllib.parse.quote(USER, safe="")
    profile = get_json(f"/users/{encoded}")
    if not isinstance(profile, dict) or "public_repos" not in profile:
        raise RuntimeError("Invalid GitHub API user response")

    # Count stars of original, owned, public repositories, not stars GIVEN.
    stars = 0
    page = 1
    while True:
        repos = get_json(f"/users/{encoded}/repos?type=owner&per_page=100&page={page}")
        if not isinstance(repos, list):
            raise RuntimeError("Invalid GitHub API repository response")
        stars += sum(int(r.get("stargazers_count", 0)) for r in repos if not r.get("fork", False))
        if len(repos) < 100:
            break
        page += 1
        if page > 30:
            raise RuntimeError("Public repo pagination unusually large; refusing incomplete totals")

    OUTPUT.write_text(render(USER, profile["public_repos"], stars, profile["followers"]), encoding="utf-8")
    print(f"Updated {OUTPUT}: {profile['public_repos']} repos / {stars} earned stars / {profile['followers']} followers")


if __name__ == "__main__":
    main()
