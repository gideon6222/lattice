#!/usr/bin/env python3
"""Push a game's `store/listing/` straight to the Google Play Developer API (v3,
`androidpublisher`), in place of `fastlane supply`.

WHY NOT FASTLANE. `supply` wraps this same API, but a metadata-only push -- exactly what
a listing sync is -- hits a known fastlane bug: even with `--skip_upload_apk true
--skip_upload_aab true --skip_upload_changelogs true` and no `changelogs/` directory
anywhere in the metadata tree, `supply` still fails with `[!] Could not find release for
version code '' to update changelog`. Measured twice on candle-gift, 2026-09-22, GitHub
Actions runs 35800713986 and 35800951019. This is fastlane issues 15638, 16071, 17097 and
18516, open for years, not a configuration problem here -- a metadata-only upload always
tries to attach a release. The usual workaround is to upload a binary just to give
`supply` a release to hang a changelog off of, which defeats the point of a
metadata-only sync. So this script calls the same API endpoints `supply` would, but only
the ones for listings and images. It never opens, edits or reads a release, and it never
uploads a changelog -- a changelog belongs to a release, and this script does not upload
a binary. Release notes (`store/release-notes/`) are untouched by this file entirely.

This script runs in a game repo's CI (`.github/workflows/listing-sync.yml`), never inside
the studio program itself, so unlike everything under `studio/` it MAY depend on
`google-auth` and `requests` (both installed by that workflow with pip before this runs).
It decides nothing about whether a file is within Play's limits -- `studio/checks/
listing.py` (the `listing` gate check, contract section 4 #11) already held everything
in `store/` to those limits before the workflow that calls this script ever ran. This
script just uploads what is on disk.

Usage:
    python play_listing.py --package PACKAGE --key KEY_PATH --store STORE_DIR [--dry-run]

Exit codes: 0 every step succeeded (edit committed, or validated on --dry-run); 1 the
store/ tree could not be read (a locale is missing a required field) or the API rejected
a call, in which case stderr carries the API's own error body; 2 bad arguments.
"""
from __future__ import annotations

import argparse
import dataclasses
import sys
import time
from pathlib import Path

# The images of a listing live UNDER that listing: `.../edits/{id}/listings/{language}/
# {imageType}`, not under an `images/` path of their own. Measured: the `images/` spelling
# answers 404 "Could not find handler for this request" from the upload host
# (com.gideon.candlegift, Actions run 35802837204, 2026-09-23). The upload host is also
# its own: androidpublisher.googleapis.com/upload/..., per the Upload URI in the API
# reference for edits.images.upload.
API_BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3"
UPLOAD_BASE = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"

# Order matters: this is the order images are cleared and uploaded in, and the order
# tests/test_unit_playapi.py expects read_store()'s output in.
IMAGE_TYPES = ("icon", "featureGraphic", "phoneScreenshots")


class ListingError(Exception):
    """The `store/` tree itself cannot be uploaded -- a locale is missing a required
    field. Raised by read_store(), before any network call, so a bad repo fails fast
    rather than mid-edit on Play's side."""


class PlayApiError(Exception):
    """A Play API call did not return 2xx. Carries the response so main() can print its
    body verbatim -- in CI that response is the only witness to what went wrong."""

    def __init__(self, response) -> None:
        self.response = response
        request = response.request
        super().__init__(
            f"{response.status_code} {request.method} {request.url}: {response.text}"
        )


# ── reading store/ into the shape the API wants (pure, no network) ─────────────────────


@dataclasses.dataclass(frozen=True)
class ImageUpload:
    locale: str
    image_type: str
    path: Path


@dataclasses.dataclass(frozen=True)
class LocaleListing:
    locale: str
    title: str
    short_description: str
    full_description: str
    images: tuple[ImageUpload, ...]

    def listing_body(self) -> dict:
        """The body `PUT /edits/{editId}/listings/{language}` wants."""
        return {
            "title": self.title,
            "shortDescription": self.short_description,
            "fullDescription": self.full_description,
        }


@dataclasses.dataclass(frozen=True)
class ListingPlan:
    locales: tuple[LocaleListing, ...]

    def image_uploads(self) -> list[ImageUpload]:
        """Every image to upload, in locale order then IMAGE_TYPES order, matching the
        order main() clears and uploads them in."""
        uploads: list[ImageUpload] = []
        for locale in self.locales:
            uploads.extend(locale.images)
        return uploads


_REQUIRED_TEXT_FIELDS = (
    "title.txt",
    "short_description.txt",
    "full_description.txt",
)


def _read_required(locale_dir: Path, locale: str, filename: str) -> str:
    path = locale_dir / filename
    if not path.is_file():
        raise ListingError(f"{locale}: missing {filename}")
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise ListingError(f"{locale}: {filename} is empty")
    return text


def _locale_images(locale: str, images_dir: Path) -> tuple[ImageUpload, ...]:
    uploads: list[ImageUpload] = []
    icon = images_dir / "icon.png"
    if icon.is_file():
        uploads.append(ImageUpload(locale, "icon", icon))
    feature_graphic = images_dir / "featureGraphic.png"
    if feature_graphic.is_file():
        uploads.append(ImageUpload(locale, "featureGraphic", feature_graphic))
    screenshots_dir = images_dir / "phoneScreenshots"
    if screenshots_dir.is_dir():
        for shot in sorted(screenshots_dir.glob("*.png")):
            uploads.append(ImageUpload(locale, "phoneScreenshots", shot))
    return tuple(uploads)


def read_store(store_dir: Path) -> ListingPlan:
    """Turn `store/listing/<locale>/` on disk into the payload the Play API wants. Pure
    and network-free, so tests call it directly. Refuses (ListingError) a locale that is
    missing title.txt, short_description.txt or full_description.txt -- those three are
    required by every `PUT .../listings/{language}` call, so a locale without one of
    them cannot be uploaded at all, as distinct from `studio/checks/listing.py`'s job of
    holding present files to Play's *limits* (length, image size), which this script
    does not re-check."""
    listing_dir = store_dir / "listing"
    if not listing_dir.is_dir():
        raise ListingError(f"no listing/ under {store_dir}")

    locales: list[LocaleListing] = []
    for locale_dir in sorted(p for p in listing_dir.iterdir() if p.is_dir()):
        locale = locale_dir.name
        title, short_description, full_description = (
            _read_required(locale_dir, locale, filename)
            for filename in _REQUIRED_TEXT_FIELDS
        )
        images = _locale_images(locale, locale_dir / "images")
        locales.append(
            LocaleListing(locale, title, short_description, full_description, images)
        )

    if not locales:
        raise ListingError(f"no locale folders under {listing_dir}")

    return ListingPlan(tuple(locales))


def finish_action(dry_run: bool) -> str:
    """`validate` for --dry-run (Play checks the edit and discards it, publishing
    nothing), `commit` otherwise. A pure decision, tested without a network call."""
    return "validate" if dry_run else "commit"


# ── the API calls (network; not exercised by tests) ────────────────────────────────────


def _authorized_session(key_path: Path):
    # Imported here, not at module scope, so read_store(), listing_body() and
    # finish_action() stay importable and testable even where google-auth and requests
    # are not installed (they are only guaranteed present in the CI job that installs
    # them with pip -- contract: the studio program itself stays standard library only).
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2 import service_account

    credentials = service_account.Credentials.from_service_account_file(
        str(key_path), scopes=[SCOPE]
    )
    return AuthorizedSession(credentials)


RETRY_STATUSES = frozenset({429, 500, 502, 503, 504})
RETRY_ATTEMPTS = 4
RETRY_BACKOFF_SECONDS = 2.0


def _send(call, *args, **kwargs):
    """One API call, retried on the statuses that mean "ask again", never on the ones
    that mean "you asked wrongly".

    Play answered the commit with a plain 503 after every image had already gone up
    (com.gideon.candlegift, Actions run 35803017806, 2026-09-23), which threw away a
    complete, correct edit for a hiccup on Google's side. 4xx is never retried: a bad
    request does not become a good one by being sent again.
    """
    delay = RETRY_BACKOFF_SECONDS
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        response = call(*args, **kwargs)
        if response.status_code not in RETRY_STATUSES or attempt == RETRY_ATTEMPTS:
            return response
        print(
            f"  {response.status_code} from Play, retrying in {delay:.0f}s "
            f"(attempt {attempt} of {RETRY_ATTEMPTS})"
        )
        time.sleep(delay)
        delay *= 2
    return response  # unreachable; the loop returns on its last attempt


def _check(response) -> dict:
    if not response.ok:
        raise PlayApiError(response)
    return response.json() if response.content else {}


def open_edit(session, package_name: str) -> str:
    url = f"{API_BASE}/applications/{package_name}/edits"
    return _check(_send(session.post, url))["id"]


def put_listing(session, package_name: str, edit_id: str, locale: LocaleListing) -> None:
    url = f"{API_BASE}/applications/{package_name}/edits/{edit_id}/listings/{locale.locale}"
    _check(_send(session.put, url, json=locale.listing_body()))


def clear_images(
    session, package_name: str, edit_id: str, locale: str, image_type: str
) -> None:
    """Remove the images of one type before uploading the new set.

    A 404 is treated as "there were none", which is a success. Be careful with that
    tolerance: the 404 seen on 2026-09-23 (Actions run 35802436736) was NOT an empty
    image type, it was this call pointed at the wrong path, and the fix was the URL
    above. Whether Play answers 404 for a genuinely empty type is unverified, so this
    stays deliberately forgiving: a delete that removes nothing must never be what stops
    a game's first sync.
    """
    url = (
        f"{API_BASE}/applications/{package_name}/edits/{edit_id}/listings/"
        f"{locale}/{image_type}"
    )
    response = _send(session.delete, url)
    if response.status_code == 404:
        return
    _check(response)


def upload_image(session, package_name: str, edit_id: str, upload: ImageUpload) -> None:
    url = (
        f"{UPLOAD_BASE}/applications/{package_name}/edits/{edit_id}/listings/"
        f"{upload.locale}/{upload.image_type}?uploadType=media"
    )
    body = upload.path.read_bytes()
    response = _send(session.post, url, data=body, headers={"Content-Type": "image/png"})
    _check(response)


def finish_edit(session, package_name: str, edit_id: str, dry_run: bool) -> None:
    action = finish_action(dry_run)
    url = f"{API_BASE}/applications/{package_name}/edits/{edit_id}:{action}"
    _check(_send(session.post, url))


# ── entry point ─────────────────────────────────────────────────────────────────────


def _run(package: str, key_path: Path, store_dir: Path, dry_run: bool) -> None:
    plan = read_store(store_dir)  # raises ListingError before any network call

    session = _authorized_session(key_path)
    edit_id = open_edit(session, package)
    print(f"opened edit {edit_id} for {package}")

    for locale in plan.locales:
        put_listing(session, package, edit_id, locale)
        print(f"set title/short/full description for {locale.locale}")

    for locale in plan.locales:
        images_by_type: dict[str, list[ImageUpload]] = {}
        for upload in locale.images:
            images_by_type.setdefault(upload.image_type, []).append(upload)
        for image_type in IMAGE_TYPES:
            uploads = images_by_type.get(image_type)
            if not uploads:
                continue
            clear_images(session, package, edit_id, locale.locale, image_type)
            print(f"cleared existing {image_type} for {locale.locale}")
            for upload in uploads:
                upload_image(session, package, edit_id, upload)
                print(f"uploaded {upload.path.name} as {image_type} for {locale.locale}")

    finish_edit(session, package, edit_id, dry_run)
    if dry_run:
        print(f"validated edit {edit_id} against Play (dry run); nothing was published")
    else:
        print(f"committed edit {edit_id}; store/listing is now live on Play")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True, help="Android package name")
    parser.add_argument(
        "--key", required=True, type=Path, help="path to the service account JSON"
    )
    parser.add_argument(
        "--store", required=True, type=Path, help="the repo's store/ directory"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="validate the edit against Play and discard it; publish nothing",
    )
    args = parser.parse_args(argv)

    try:
        _run(args.package, args.key, args.store, args.dry_run)
    except ListingError as exc:
        print(f"play_listing: {exc}", file=sys.stderr)
        return 1
    except PlayApiError as exc:
        print(f"play_listing: Play API error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
