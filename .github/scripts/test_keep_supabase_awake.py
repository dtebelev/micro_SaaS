#!/usr/bin/env python3
"""Offline tests for the Supabase keepalive script. No network and no real tokens."""

import importlib.util
import io
import json
import os
import pathlib
import tempfile
import unittest
import urllib.request
from contextlib import redirect_stdout
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT = pathlib.Path(__file__).with_name("keep-supabase-awake.py")
WORKFLOW = ROOT / ".github" / "workflows" / "keep-supabase-awake.yml"

spec = importlib.util.spec_from_file_location("keep_supabase_awake", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

TOKEN_1 = "test-token-account-1-aaaaaaaaaaaa"
TOKEN_2 = "test-token-account-2-bbbbbbbbbbbb"
TOKEN_3 = "test-token-account-3-cccccccccccc"


def base_env(**extra):
    env = {"SUPABASE_TOKEN_1": TOKEN_1, "SUPABASE_TOKEN_2": TOKEN_2}
    env.update(extra)
    return env


def project(name, ref, status):
    return {"id": ref, "name": name, "status": status}


class FakeApi:
    def __init__(self, projects_by_token, query_code=201, restore_code=200):
        self.projects_by_token = projects_by_token
        self.query_code = query_code
        self.restore_code = restore_code
        self.calls = []

    def __call__(self, method, path, token, body=None):
        self.calls.append((method, path, token, body))
        if method == "GET" and path == "/projects":
            payload = self.projects_by_token.get(token, (200, []))
            return payload
        if path.endswith("/database/query"):
            return self.query_code, [{"keepalive": 1}]
        if path.endswith("/restore"):
            return self.restore_code, {"status": "RESTORING"}
        return 404, "unexpected path"


class KeepAwakeTest(unittest.TestCase):
    def test_healthy_projects_are_pinged_three_times_and_not_restored(self):
        api = FakeApi({
            TOKEN_1: (200, [project("naturonata-food-explorer", "abcdefghij1234567890", "ACTIVE_HEALTHY")]),
            TOKEN_2: (200, [project("charm-lite", "zzzzzzzzzz1234567890", "ACTIVE_HEALTHY")]),
        })
        out = mod.run(base_env(), api)
        self.assertEqual(out["problems"], [])
        queries = [call for call in api.calls if call[1].endswith("/database/query")]
        restores = [call for call in api.calls if call[1].endswith("/restore")]
        self.assertEqual(len(queries), 6)
        self.assertEqual(restores, [])
        self.assertEqual(queries[0][3], {"query": "select 1 as keepalive"})
        self.assertNotIn(TOKEN_1, mod.render(out, [TOKEN_1, TOKEN_2]))
        self.assertNotIn(TOKEN_2, mod.render(out, [TOKEN_1, TOKEN_2]))

    def test_missing_required_token_fails_and_still_checks_the_other_account(self):
        api = FakeApi({TOKEN_1: (200, [project("one", "abcdefghij1234567890", "ACTIVE_HEALTHY")])})
        out = mod.run({"SUPABASE_TOKEN_1": TOKEN_1, "SUPABASE_TOKEN_2": "  "}, api)
        self.assertTrue(any("SUPABASE_TOKEN_2 is not set" in problem for problem in out["problems"]))
        self.assertEqual(out["accounts"][0]["account"], "SUPABASE_TOKEN_1")
        self.assertNotIn(TOKEN_1, mod.render(out, [TOKEN_1]))

    def test_no_tokens_fails_without_calling_the_api(self):
        api = FakeApi({})
        out = mod.run({}, api)
        self.assertEqual(api.calls, [])
        self.assertTrue(any("SUPABASE_TOKEN_1 is not set" in problem for problem in out["problems"]))
        self.assertTrue(any("SUPABASE_TOKEN_2 is not set" in problem for problem in out["problems"]))
        self.assertNotIn("restore request", mod.render(out, []))

    def test_empty_optional_token_is_skipped_and_extra_token_is_used(self):
        api = FakeApi({
            TOKEN_1: (200, [project("one", "abcdefghij1234567890", "ACTIVE_HEALTHY")]),
            TOKEN_2: (200, [project("two", "bbbbbbbbbb1234567890", "ACTIVE_HEALTHY")]),
            TOKEN_3: (200, [project("three", "cccccccccc1234567890", "ACTIVE_HEALTHY")]),
        })
        env = base_env(SUPABASE_TOKEN_3=TOKEN_3, SUPABASE_TOKEN_4="")
        out = mod.run(env, api)
        self.assertEqual(out["problems"], [])
        accounts = [account["account"] for account in out["accounts"]]
        self.assertEqual(accounts, ["SUPABASE_TOKEN_1", "SUPABASE_TOKEN_2", "SUPABASE_TOKEN_3"])

    def test_token_numbers_sort_numerically(self):
        token_10 = "test-token-account-10-dddddddddddd"
        api = FakeApi({
            TOKEN_1: (200, [project("one", "abcdefghij1234567890", "ACTIVE_HEALTHY")]),
            TOKEN_2: (200, [project("two", "bbbbbbbbbb1234567890", "ACTIVE_HEALTHY")]),
            token_10: (200, [project("ten", "dddddddddd1234567890", "ACTIVE_HEALTHY")]),
        })
        out = mod.run(base_env(SUPABASE_TOKEN_10=token_10), api)
        self.assertEqual(
            [account["account"] for account in out["accounts"]],
            ["SUPABASE_TOKEN_1", "SUPABASE_TOKEN_2", "SUPABASE_TOKEN_10"],
        )

    def test_invalid_token_fails_and_is_redacted(self):
        api = FakeApi({TOKEN_1: (401, "bad " + TOKEN_1), TOKEN_2: (200, [project("two", "bbbbbbbbbb1234567890", "ACTIVE_HEALTHY")])})
        out = mod.run(base_env(), api)
        self.assertTrue(any("SUPABASE_TOKEN_1: cannot list projects (HTTP 401)" in problem for problem in out["problems"]))
        rendered = mod.render(out, [TOKEN_1, TOKEN_2])
        self.assertNotIn(TOKEN_1, rendered)
        self.assertIn("[redacted]", rendered)

    def test_paused_project_is_restored_and_still_fails_the_job(self):
        api = FakeApi({
            TOKEN_1: (200, [project("sleeping", "abcdefghij1234567890", "INACTIVE")]),
            TOKEN_2: (200, [project("also", "bbbbbbbbbb1234567890", "PAUSED")]),
        })
        out = mod.run(base_env(), api)
        restores = [call for call in api.calls if call[1].endswith("/restore")]
        self.assertEqual(len(restores), 2)
        self.assertEqual(restores[0][3], {})
        self.assertTrue(any("was paused (INACTIVE), restore requested" in problem for problem in out["problems"]))
        self.assertTrue(any("was paused (PAUSED), restore requested" in problem for problem in out["problems"]))
        self.assertNotIn("database/query", " ".join(call[1] for call in api.calls))

    def test_failed_restore_is_reported(self):
        api = FakeApi(
            {TOKEN_1: (200, [project("sleeping", "abcdefghij1234567890", "INACTIVE")]),
             TOKEN_2: (200, [project("two", "bbbbbbbbbb1234567890", "ACTIVE_HEALTHY")])},
            restore_code=500,
        )
        out = mod.run(base_env(), api)
        self.assertTrue(any("restore FAILED HTTP 500" in problem for problem in out["problems"]))

    def test_ping_failure_fails_the_job(self):
        api = FakeApi(
            {TOKEN_1: (200, [project("one", "abcdefghij1234567890", "ACTIVE_HEALTHY")]),
             TOKEN_2: (200, [project("two", "bbbbbbbbbb1234567890", "ACTIVE_HEALTHY")])},
            query_code=500,
        )
        out = mod.run(base_env(), api)
        self.assertTrue(any("ping failed (HTTP 500)" in problem for problem in out["problems"]))
        queries = [call for call in api.calls if call[1].endswith("/database/query")]
        self.assertEqual(len(queries), 2)

    def test_transitional_status_is_not_a_failure(self):
        api = FakeApi({
            TOKEN_1: (200, [
                project("coming", "aaaaaaaaaa1234567890", "COMING_UP"),
                project("restoring", "bbbbbbbbbb1234567890", "RESTORING"),
                project("restarting", "cccccccccc1234567890", "RESTARTING"),
            ]),
            TOKEN_2: (200, [project("ok", "dddddddddd1234567890", "ACTIVE_HEALTHY")]),
        })
        out = mod.run(base_env(), api)
        self.assertEqual(out["problems"], [])
        self.assertEqual([call for call in api.calls if "/projects/aaaaaaaaaa" in call[1]], [])

    def test_unexpected_status_and_bad_ref_fail_without_a_call(self):
        api = FakeApi({
            TOKEN_1: (200, [project("gone", "abcdefghij1234567890", "REMOVED")]),
            TOKEN_2: (200, [project("weird", "../not-a-ref", "ACTIVE_HEALTHY")]),
        })
        out = mod.run(base_env(), api)
        self.assertTrue(any("status REMOVED" in problem for problem in out["problems"]))
        self.assertTrue(any("unexpected project ref" in problem for problem in out["problems"]))
        self.assertEqual([call for call in api.calls if call[0] != "GET"], [])

    def test_non_list_and_empty_project_list_fail(self):
        api = FakeApi({TOKEN_1: (200, {"projects": []}), TOKEN_2: (200, [])})
        out = mod.run(base_env(), api)
        self.assertTrue(any("SUPABASE_TOKEN_1: cannot list projects (HTTP 200)" in problem for problem in out["problems"]))
        self.assertTrue(any("returned no projects" in problem for problem in out["problems"]))

    def test_retry_once_on_server_error_but_not_on_unauthorized(self):
        calls = {"n": 0}

        def flaky(method, path, token, body):
            calls["n"] += 1
            if calls["n"] == 1:
                return 500, "temporary"
            return 201, [{"keepalive": 1}]

        sleeps = []
        with mock.patch.object(mod, "_once", flaky):
            self.assertEqual(
                mod.http_call("POST", "/x", TOKEN_1, mod.QUERY, sleep=sleeps.append),
                (201, [{"keepalive": 1}]),
            )
        self.assertEqual(sleeps, [2])
        self.assertEqual(calls["n"], 2)

        def denied(method, path, token, body):
            calls["denied"] = calls.get("denied", 0) + 1
            return 401, "no"

        with mock.patch.object(mod, "_once", denied):
            self.assertEqual(mod.http_call("GET", "/projects", TOKEN_1), (401, "no"))
        self.assertEqual(calls["denied"], 1)

    def test_redirect_strips_token_when_the_host_changes(self):
        handler = mod._NoCrossHostAuth()
        req = urllib.request.Request(
            "https://api.supabase.com/v1/projects",
            headers={"Authorization": "Bearer " + TOKEN_1},
        )
        leaked = handler.redirect_request(req, None, 302, "Found", {}, "https://evil.example/steal")
        self.assertIsNone(leaked.get_header("Authorization"))
        kept = handler.redirect_request(req, None, 302, "Found", {}, "https://api.supabase.com/v1/projects/abcdefghij1234567890")
        self.assertEqual(kept.get_header("Authorization"), "Bearer " + TOKEN_1)

    def test_main_writes_summary_and_exits_red_without_printing_the_token(self):
        summary = tempfile.NamedTemporaryFile(delete=False)
        summary.close()
        api = FakeApi({TOKEN_1: (401, "nope " + TOKEN_1)})
        env = {
            "PATH": os.environ.get("PATH", ""),
            "SUPABASE_TOKEN_1": TOKEN_1,
            "GITHUB_STEP_SUMMARY": summary.name,
        }
        stdout = io.StringIO()
        with mock.patch.dict(os.environ, env, clear=True), mock.patch.object(mod, "http_call", api), redirect_stdout(stdout):
            with self.assertRaises(SystemExit) as raised:
                mod.main()
        self.assertEqual(raised.exception.code, 1)
        printed = stdout.getvalue()
        self.assertNotIn(TOKEN_1, printed)
        self.assertIn("::error::", printed)
        self.assertIn("SUPABASE_TOKEN_2 is not set", printed)
        saved = pathlib.Path(summary.name).read_text()
        self.assertNotIn(TOKEN_1, saved)
        self.assertIn("FAILED", saved)
        os.unlink(summary.name)

    def test_script_has_no_local_secret_file_or_log_path(self):
        text = SCRIPT.read_text()
        self.assertNotIn("box-secrets", text)
        self.assertNotIn("keepalive.log", text)
        self.assertNotIn("/workspace", text)

    def test_workflow_uses_secrets_and_drops_the_hard_coded_ping(self):
        import yaml

        text = WORKFLOW.read_text()
        self.assertNotIn("eyJ", text)
        self.assertNotIn("supabase.co", text)
        self.assertNotIn("curl ", text)
        data = yaml.load(text, Loader=yaml.BaseLoader)
        self.assertIn("workflow_dispatch", data["on"])
        self.assertEqual(data["on"]["schedule"][0]["cron"], "17 6 * * *")
        step = data["jobs"]["keepalive"]["steps"][1]
        for index in range(1, 9):
            key = f"SUPABASE_TOKEN_{index}"
            self.assertEqual(step["env"][key], f"${{{{ secrets.{key} }}}}")
        self.assertNotIn("SUPABASE_TOKEN_9", step["env"])
        self.assertIn(".github/scripts/keep-supabase-awake.py", step["run"])
        json.dumps(data)


if __name__ == "__main__":
    unittest.main()
