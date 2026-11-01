"""Isolated real-page regression. Requires Playwright in the browser test runtime.

Run: python scripts/browser/mission-reflection-recovery.py --base-url <preview-url>
No real credentials, Supabase writes, or application test-only routes are used.
"""
import argparse
import asyncio
import base64
import copy
import json
import time
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright, expect


COURSE = "10000000-0000-4000-8000-000000000001"
MODULE = "20000000-0000-4000-8000-000000000001"
NEXT_MODULE = "20000000-0000-4000-8000-000000000002"
ACCOUNT = "30000000-0000-4000-8000-000000000001"
EMPTY = {
    "checkedPracticeIds": [], "selectedDecision": None, "evidenceConfirmed": False,
    "evidenceUploads": [], "feedback": "",
}
MISSION = {
    "kind": "workplace-mission", "version": 1, "objective": "Praktik aman",
    "learn": ["Periksa alat"], "practice": ["Periksa kondisi"], "evidence": ["Foto hasil"],
    "scenario": "Alat siap", "feedbackPrompt": "Apa hasilnya?", "repeatAfterDays": 3,
}


async def verify(base_url, output):
    user = {
        "id": ACCOUNT, "aud": "authenticated", "role": "authenticated",
        "email": "fixture@example.test", "app_metadata": {}, "user_metadata": {},
        "created_at": "2026-01-01T00:00:00Z",
    }
    payload = base64.urlsafe_b64encode(json.dumps({
        "sub": ACCOUNT, "exp": int(time.time()) + 3600, "role": "authenticated",
    }).encode()).decode().rstrip("=")
    session = {
        "access_token": f"eyJhbGciOiJIUzI1NiJ9.{payload}.fixture-not-a-credential",
        "refresh_token": "fixture-not-a-credential", "token_type": "bearer",
        "expires_at": int(time.time()) + 3600, "expires_in": 3600, "user": user,
    }
    rows = [{
        "id": f"40000000-0000-4000-8000-00000000000{index + 1}",
        "course_id": COURSE, "module_id": module, "user_id": ACCOUNT,
        "status": "in_progress", "mission_revision": 4 if index == 0 else 12,
        "mission_progress": {**EMPTY, "feedback": "Refleksi awal" if index == 0 else "Refleksi modul berikut"},
    } for index, module in enumerate([MODULE, NEXT_MODULE])]
    calls, unexpected, errors = [], [], []
    reads = 0
    conflict_next = True
    remote = {
        "evidenceId": "evidence-1", "fileName": "latest-server.png", "mimeType": "image/png",
        "sizeBytes": 68, "storagePath": f"{ACCOUNT}/{COURSE}/{MODULE}/evidence-1/latest-server.png",
        "uploadedAt": "2026-01-01T00:00:00Z",
    }

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        context = await browser.new_context(service_workers="block")
        # Seed only the Supabase client's requested auth storage key. Every network
        # request using this synthetic session is intercepted below before navigation.
        await context.add_init_script("""
            (() => {
              const get = Storage.prototype.getItem;
              Storage.prototype.getItem = function(key) {
                if (this === localStorage && /^sb-.*-auth-token$/.test(key) && !get.call(this, key)) {
                  this.setItem(key, JSON.stringify(SESSION));
                }
                return get.call(this, key);
              };
              Object.defineProperty(navigator, "clipboard", { configurable: true,
                value: { writeText: async text => { window.__copiedReflection = text; } } });
            })();
        """.replace("SESSION", json.dumps(session)))

        async def route_request(route):
            nonlocal reads, conflict_next
            request = route.request
            url = urlparse(request.url)
            if not url.hostname or not url.hostname.endswith(".supabase.co"):
                await route.continue_()
                return
            path = url.path
            body, status = None, 200
            if path == "/auth/v1/user":
                body = user
            elif path == "/auth/v1/token":
                body = session
            elif path == "/rest/v1/courses":
                body = {"id": COURSE, "title": "Fixture pemulihan", "user_id": "fixture-author"}
            elif path == "/rest/v1/course_modules":
                body = [{
                    "id": module, "course_id": COURSE, "module_number": index + 1,
                    "title": "Praktik" if index == 0 else "Praktik berikut",
                    "duration_seconds": 600,
                } for index, module in enumerate([MODULE, NEXT_MODULE])]
            elif path == "/rest/v1/module_content":
                body = [{
                    "id": f"content-{index}", "module_id": module, "content_type": "worksheet",
                    "content_data": MISSION, "order_index": 1,
                } for index, module in enumerate([MODULE, NEXT_MODULE])]
            elif path == "/rest/v1/learner_progress":
                assert request.method == "GET", "Progress must save through the revision-checked RPC"
                reads += 1
                body = copy.deepcopy(rows)
            elif path == "/rest/v1/rpc/save_mission_progress":
                change = request.post_data_json
                calls.append(change)
                assert change["p_course_id"] == COURSE
                assert change["p_module_id"] == MODULE
                if conflict_next:
                    conflict_next = False
                    rows[0]["mission_revision"] += 1
                    rows[0]["mission_progress"] = {
                        **EMPTY, "feedback": "Refleksi dari perangkat lain",
                        "checkedPracticeIds": ["practice-1"], "selectedDecision": "Keputusan server",
                        "evidenceUploads": [remote], "evidenceConfirmed": True,
                    }
                    body, status = {"code": "40001", "message": "Fixture revision conflict"}, 409
                else:
                    assert change["p_expected_revision"] == rows[0]["mission_revision"]
                    rows[0]["mission_revision"] += 1
                    rows[0]["mission_progress"] = change["p_mission_progress"]
                    body = copy.deepcopy(rows[0])
            elif path in ("/rest/v1/profiles", "/rest/v1/user_profiles"):
                body = {"id": ACCOUNT, "role": "learner", "onboarding_completed": True}
            elif path in ("/rest/v1/mission_reviews", "/rest/v1/mission_evidence_reviews"):
                body = None
            elif path in (
                "/rest/v1/module_quizzes", "/rest/v1/mission_review_comments",
                "/rest/v1/rpc/reconcile_mission_evidence",
                "/rest/v1/rpc/get_mission_review_submissions",
            ):
                body = []
            elif path.startswith("/storage/v1/object/sign/"):
                if request.method == "POST":
                    body = {"signedURL": "/object/sign/mission-evidence/fixture-image"}
                else:
                    await route.fulfill(content_type="image/png", body=base64.b64decode(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="
                    ))
                    return
            else:
                unexpected.append(f"{request.method} {path}")
                body, status = {"message": "Unexpected isolated fixture request"}, 501
            await route.fulfill(status=status, content_type="application/json", body=json.dumps(body))

        await context.route("**/*", route_request)
        page = await context.new_page()
        page.set_default_navigation_timeout(90000)
        page.set_default_timeout(15000)
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(f"{base_url.rstrip('/')}/course/{COURSE}", wait_until="networkidle")
        editor = page.get_by_role("textbox", name="Catatan refleksi", exact=True)
        await expect(editor).to_have_value("Refleksi awal")
        assert reads >= 1, "Authenticated progress fixture was not requested"
        assert not calls

        await editor.fill("Draf lokal untuk dibandingkan")
        await editor.blur()
        panel = page.get_by_role("region", name="Pemulihan refleksi")
        await expect(panel).to_be_visible()
        await expect(page.get_by_role("textbox", name="Draf refleksi lokal")).to_have_value("Draf lokal untuk dibandingkan")
        await expect(page.get_by_role("textbox", name="Refleksi versi server")).to_have_value("Refleksi dari perangkat lain")
        await expect(page.get_by_text("latest-server.png", exact=True)).to_be_visible()
        await expect(editor).to_have_value("Refleksi dari perangkat lain")
        assert len(calls) == 1 and calls[0]["p_expected_revision"] == 4
        server_snapshot = copy.deepcopy(rows[0]["mission_progress"])
        await page.get_by_role("button", name="Salin draf lokal", exact=True).click()
        await expect(page.get_by_text("Draf refleksi disalin.", exact=True)).to_be_visible()
        assert await page.evaluate("window.__copiedReflection") == "Draf lokal untuk dibandingkan"
        output.mkdir(parents=True, exist_ok=True)
        await panel.screenshot(path=str(output / "comparison.png"))
        await page.get_by_role("button", name="Pulihkan draf ke editor", exact=True).click()
        await editor.fill("Refleksi dipulihkan dan diperbaiki")
        await editor.blur()
        assert len(calls) == 1, "Restoring/editing must not autosave"
        await page.get_by_role("button", name="Simpan ulang refleksi", exact=True).click()
        await expect(page.get_by_text("Refleksi disimpan ulang. Bukti terbaru tetap dipertahankan.", exact=True)).to_be_visible()
        assert len(calls) == 2 and calls[1]["p_expected_revision"] == 5
        assert calls[1]["p_mission_progress"] == {
            **server_snapshot, "feedback": "Refleksi dipulihkan dan diperbaiki",
        }, "Recovery may replace text only, never the newer server evidence/checklist/decision"
        await expect(panel).to_have_count(0)
        await expect(editor).to_have_value("Refleksi dipulihkan dan diperbaiki")
        await page.reload(wait_until="networkidle")
        await expect(editor).to_have_value("Refleksi dipulihkan dan diperbaiki")
        await expect(panel).to_have_count(0)

        conflict_next = True
        await editor.fill("Draf privat modul pertama")
        await editor.blur()
        await expect(panel).to_be_visible()
        await page.get_by_role("button", name="Salin draf lokal", exact=True).click()
        await expect(page.get_by_text("Draf refleksi disalin.", exact=True)).to_be_visible()
        await page.get_by_role("button", name="Pulihkan draf ke editor", exact=True).click()
        await page.get_by_role("button", name="Berikutnya", exact=True).click()
        await expect(editor).to_have_value("Refleksi modul berikut")
        await expect(panel).to_have_count(0)
        await expect(page.get_by_text("Draf refleksi disalin.", exact=True)).to_have_count(0)
        await expect(page.get_by_role("button", name="Simpan ulang refleksi", exact=True)).to_have_count(0)
        assert len(calls) == 3, "Switching modules must not save the restored draft"
        await page.screenshot(path=str(output / "module-isolation.png"), full_page=True)
        assert not unexpected, f"Missing fixture routes: {unexpected}"
        assert not errors, f"Browser exceptions: {errors}"
        print("PASS: compare/copy/restore, text-only revision-checked save, reload, module isolation; no real Supabase requests")
        await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--output", default="generated-artifacts/reflection-recovery")
    options = parser.parse_args()
    asyncio.run(verify(options.base_url, Path(options.output)))
