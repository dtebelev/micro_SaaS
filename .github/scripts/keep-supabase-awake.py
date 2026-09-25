#!/usr/bin/env python3
"""Keep every Supabase project on the configured accounts from pausing.

Reads SUPABASE_TOKEN_1, SUPABASE_TOKEN_2, ... from the environment.
Empty values are ignored. Tokens 1 and 2 are required (one per Supabase
account). For each token this script lists projects with the Management
API, runs `select 1` on every healthy database, and asks Supabase to
restore a paused project. Exits 1 when a required token is missing, a
token is rejected, a project is paused, or a ping fails.

Tokens are never printed. Nothing is read from a local secrets file.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.supabase.com/v1"
USER_AGENT = "supabase-keepalive/2.0"
TIMEOUT_SECONDS = 60
QUERY = {"query": "select 1 as keepalive"}
# Supabase describes "a few" database requests a day as enough activity
# for a free-tier project to avoid the 7-day inactivity pause.
PINGS_PER_PROJECT = 3
RETRYABLE = {0, 429, 500, 502, 503, 504}
PAUSED = {"INACTIVE", "PAUSED"}
TRANSITIONAL = {"COMING_UP", "RESTORING", "RESTARTING"}
TOKEN_NAME = re.compile(r"^SUPABASE_TOKEN_([1-9]\d*)$")
PROJECT_REF = re.compile(r"^[a-z0-9]{8,40}$")
REQUIRED = (1, 2)


class _NoCrossHostAuth(urllib.request.HTTPRedirectHandler):
    """Do not send the access token if a redirect leaves api.supabase.com."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new_req = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new_req is None:
            return None
        old_host = urllib.parse.urlsplit(req.full_url).netloc
        new_host = urllib.parse.urlsplit(newurl).netloc
        if old_host != new_host:
            new_req.remove_header("Authorization")
        return new_req


def collect_tokens(env):
    """Return ([(name, value), ...], [missing required names])."""
    found = {}
    for key, raw in env.items():
        match = TOKEN_NAME.fullmatch(key)
        if not match or not isinstance(raw, str):
            continue
        value = raw.strip()
        if value:
            found[int(match.group(1))] = (key, value)
    missing = [f"SUPABASE_TOKEN_{i}" for i in REQUIRED if i not in found]
    ordered = [found[i] for i in sorted(found)]
    return ordered, missing


def redact(text, secrets):
    out = str(text)
    for secret in secrets:
        if secret:
            out = out.replace(secret, "[redacted]")
    return out


def one_line(value, secrets, limit=300):
    text = redact(value if isinstance(value, str) else json.dumps(value, ensure_ascii=False), secrets)
    return " ".join(text.split())[:limit]


def _once(method, path, token, body):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    opener = urllib.request.build_opener(_NoCrossHostAuth)
    try:
        with opener.open(req, timeout=TIMEOUT_SECONDS) as response:
            raw = response.read().decode() or "null"
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = raw[:300]
            return response.status, payload
    except urllib.error.HTTPError as err:
        raw = err.read().decode(errors="replace")[:300]
        return err.code, raw
    except Exception as err:
        return 0, type(err).__name__ + ": " + str(err)[:240]


def http_call(method, path, token, body=None, sleep=time.sleep):
    last = (0, "no attempt")
    for attempt in (1, 2):
        last = _once(method, path, token, body)
        if last[0] not in RETRYABLE or attempt == 2:
            return last
        sleep(2)
    return last


def _project_name(project):
    name = project.get("name")
    if isinstance(name, str) and name.strip():
        return " ".join(name.split())
    return "(unnamed)"


def _record_project(out, account, project, token, call, secrets):
    name = _project_name(project)
    ref = project.get("id")
    status = project.get("status")
    item = {"name": name, "ref": ref if isinstance(ref, str) else None, "status": status}
    label = f"{account}/{name}"

    if not isinstance(ref, str) or not PROJECT_REF.fullmatch(ref):
        item["note"] = "skipped (unexpected project ref)"
        out["problems"].append(f"{label}: unexpected project ref, skipped")
        return item

    if status == "ACTIVE_HEALTHY":
        for _ in range(PINGS_PER_PROJECT):
            code, body = call("POST", f"/projects/{ref}/database/query", token, QUERY)
            if code not in (200, 201):
                item["ping"] = f"HTTP {code}: {one_line(body, secrets)}"
                out["problems"].append(f"{label}: ping failed (HTTP {code})")
                return item
        item["ping"] = "ok"
        return item

    if status in PAUSED:
        code, body = call("POST", f"/projects/{ref}/restore", token, {})
        if code in (200, 201):
            item["restore"] = "requested"
            how = "requested"
        else:
            item["restore"] = f"HTTP {code}: {one_line(body, secrets)}"
            how = f"FAILED HTTP {code}"
        out["problems"].append(f"{label}: was paused ({status}), restore {how}")
        return item

    item["note"] = "skipped (status not active)"
    if status not in TRANSITIONAL:
        shown = status if isinstance(status, str) else type(status).__name__
        out["problems"].append(f"{label}: status {shown}")
    return item


def run(env=None, call=None):
    if env is None:
        env = os.environ
    if call is None:
        call = http_call
    tokens, missing = collect_tokens(env)
    secrets = [value for _, value in tokens]
    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
    out = {"time": now, "accounts": [], "problems": []}

    for name in missing:
        out["problems"].append(
            f"{name} is not set. Add it under GitHub Settings → Secrets and variables → Actions."
        )

    for name, token in tokens:
        account = {"account": name, "projects": []}
        try:
            code, projects = call("GET", "/projects", token)
        except Exception as err:
            account["error"] = one_line(type(err).__name__ + ": " + str(err), secrets)
            out["problems"].append(f"{name}: cannot list projects ({account['error']})")
            out["accounts"].append(account)
            continue
        if code != 200 or not isinstance(projects, list):
            account["error"] = f"list projects HTTP {code}: {one_line(projects, secrets)}"
            out["problems"].append(f"{name}: cannot list projects (HTTP {code})")
            out["accounts"].append(account)
            continue
        if not projects:
            account["error"] = "token worked but returned no projects"
            out["problems"].append(f"{name}: token worked but returned no projects")
            out["accounts"].append(account)
            continue
        for project in projects:
            if not isinstance(project, dict):
                out["problems"].append(f"{name}: unexpected project entry")
                continue
            try:
                account["projects"].append(
                    _record_project(out, name, project, token, call, secrets)
                )
            except Exception as err:
                out["problems"].append(f"{name}: {one_line(type(err).__name__ + ': ' + str(err), secrets)}")
        account["projects"].sort(key=lambda item: (item.get("name") or "", item.get("ref") or ""))
        out["accounts"].append(account)
    return out


def human_summary(out):
    project_count = sum(len(account.get("projects") or []) for account in out["accounts"])
    lines = [
        f"Supabase keepalive — {out['time']}",
        f"Checked {len(out['accounts'])} account(s), {project_count} project(s).",
        "",
    ]
    if not out["accounts"]:
        lines.append("No account could be checked.")
        lines.append("")
    for account in out["accounts"]:
        lines.append(account["account"])
        if account.get("error"):
            lines.append(f"  error: {account['error']}")
        projects = account.get("projects") or []
        if not projects and not account.get("error"):
            lines.append("  (no projects)")
        for item in projects:
            bits = [f"  - {item.get('name')} ({item.get('ref')})"]
            if item.get("ping") == "ok":
                bits.append(f"running, database ping ok ({PINGS_PER_PROJECT}× select 1)")
            elif "ping" in item:
                bits.append("database ping FAILED: " + str(item["ping"]))
            elif item.get("restore") == "requested":
                bits.append(f"paused ({item.get('status')}), restore requested")
            elif "restore" in item:
                bits.append(f"paused ({item.get('status')}), restore FAILED: {item['restore']}")
            elif item.get("note"):
                bits.append(f"{item['note']} [{item.get('status')}]")
            lines.append(" — ".join(bits) if len(bits) > 1 else bits[0])
        lines.append("")
    if out["problems"]:
        lines.append(f"FAILED — {len(out['problems'])} problem(s). This job is red so GitHub emails you.")
        for problem in out["problems"]:
            lines.append(f"  - {problem}")
        lines.append("")
        if any("was paused" in problem for problem in out["problems"]):
            lines.append(
                "A paused project was still sent a restore request when the token could do that. "
                "The next green run is the one where every project is healthy and the database ping succeeds."
            )
        lines.append(
            "Red means a project was paused, a database ping failed, or a token is missing or was rejected."
        )
    else:
        lines.append(
            "OK — every required token was accepted, and every healthy project answered select 1. "
            "No paused projects."
        )
    return "\n".join(lines)


def render(out, secrets):
    body = human_summary(out) + "\n\n```json\n" + json.dumps(out, ensure_ascii=False, indent=2) + "\n```\n"
    return redact(body, secrets)


def write_summary(text):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(text)
        if not text.endswith("\n"):
            handle.write("\n")


def github_errors(problems):
    for problem in problems:
        safe = problem.replace("%", "%25").replace("\r", "").replace("\n", "%0A")
        print(f"::error::{safe}")


def main():
    out = run()
    secrets = [value for _, value in collect_tokens(os.environ)[0]]
    text = render(out, secrets)
    print(text)
    try:
        write_summary(text)
    except OSError as err:
        print(f"Could not write the GitHub step summary ({type(err).__name__}). The log above is complete.")
    github_errors([redact(problem, secrets) for problem in out["problems"]])
    sys.exit(1 if out["problems"] else 0)


if __name__ == "__main__":
    main()
