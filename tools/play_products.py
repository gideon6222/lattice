#!/usr/bin/env python3
"""Create or update a game's one-time products (`store/products.json`) on Google Play,
through the Play Developer API (v3) `monetization.onetimeproducts`.

WHY ONETIMEPRODUCTS, NOT INAPPPRODUCTS. Since 2025 Play keeps one-time products in its
one-time product model (a product with purchase options and offers). The older
`inappproducts` service still works for products made with it, but a product in the new
model is managed only through `monetization.onetimeproducts` or the Console, and Candle
Gift's and Snowball's `remove_ads` were made in the Console in the new model (purchase
option "buy", backwards compatible, 2026-09-30). So every game uses the new service, and a
product made either way ends up the same shape.

What it does, per product in the file:
1. Read and check `store/products.json` (pure, before any network call).
2. Read the product from Play. A product that already exists keeps its own "buy" purchase
   option id and every other purchase option and listing it has, so a product made by
   hand in the Console is updated, never given a second option.
3. `pricing:convertRegionPrices` from the USD price: every region's price, the USD and EUR
   prices for regions Play adds later, and the regions version the next call must name.
4. `PATCH .../onetimeproducts/{id}?allowMissing=true`: create or update it, one "buy"
   purchase option, backwards compatible, available in every region.
5. `purchaseOptions:batchUpdateStates`: activate the option (deactivate when `active` is
   false), only when it is not in that state already.
6. Read it back and print each purchase option's state. A product that should be active
   and is not fails the run.

`--dry-run` does 1 to 3 (nothing it calls changes anything on Play) and prints what it
would send.

This script runs in a game repo's CI (`.github/workflows/listing-sync.yml` with the
`products` input), never inside the studio program, so like `play_listing.py` it MAY use
`google-auth` and `requests`. The studio's `listing` gate check loads `read_products` from
the studio's copy of this file, so the file's rules are checked before CI ever runs.

The file:
    [{"id": "remove_ads", "name": "Remove ads",
      "description": "Turns off the ads between runs.", "price_usd": "2.99", "active": true}]

Usage:
    python play_products.py --package PACKAGE --key KEY_PATH --store STORE_DIR [--dry-run]

Exit codes: 0 every product is in the state the file asks for (or, on --dry-run, every
request was built); 1 the file is wrong, the API refused a call (stderr carries its own
error body), or a product did not reach its state; 2 bad arguments.
"""
from __future__ import annotations

import argparse
import dataclasses
import json
import re
import sys
import time
from decimal import Decimal, InvalidOperation
from pathlib import Path

API_BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"

PRODUCTS_FILE = "products.json"
LANGUAGE = "en-US"
BUY_OPTION_ID = "buy"
FIELDS = ("id", "name", "description", "price_usd", "active")

# Play's own limits for a one-time product (OneTimeProductListing: title at most 55
# characters, description at most 200; a product id starts with a lowercase letter or a
# digit and holds only lowercase letters, digits, underscores and periods).
NAME_MAX = 55
DESCRIPTION_MAX = 200
ID_MAX = 139
_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_.]*$")
_PRICE_RE = re.compile(r"^\d+(\.\d{1,2})?$")

# Regions printed by a dry run as a sample of the conversion.
SAMPLE_REGIONS = ("US", "GB", "DE", "IN", "JP", "BR")


class ProductsError(Exception):
    """`store/products.json` cannot be used: missing, not JSON, or a product breaks one
    of Play's limits. Raised before any network call."""


class PlayApiError(Exception):
    """A Play API call did not return 2xx. Carries the response so main() can print its
    body verbatim: in CI that response is the only witness to what went wrong."""

    def __init__(self, response) -> None:
        self.response = response
        request = getattr(response, "request", None)
        where = f"{request.method} {request.url}" if request is not None else "request"
        super().__init__(f"{response.status_code} {where}: {response.text}")


# ── reading store/products.json (pure, no network) ─────────────────────────────────


@dataclasses.dataclass(frozen=True)
class Product:
    id: str
    name: str
    description: str
    price_usd: str
    active: bool


def check_products(data) -> list[str]:
    """Every way `data` (the parsed file) breaks the file's shape or Play's limits, as
    one sentence each. Empty when it is fine."""
    if not isinstance(data, list) or not data:
        return ["store/products.json must be a non-empty JSON list of products"]
    faults: list[str] = []
    seen: set[str] = set()
    for index, item in enumerate(data):
        where = f"product {index + 1}"
        if not isinstance(item, dict):
            faults.append(f"{where} is not an object")
            continue
        missing = [f for f in FIELDS if f not in item]
        extra = sorted(set(item) - set(FIELDS))
        if missing:
            faults.append(f"{where} has no {', '.join(missing)}")
        if extra:
            faults.append(f"{where} has unknown keys {', '.join(extra)}")
        pid = item.get("id")
        if isinstance(pid, str) and pid:
            where = pid
            if not _ID_RE.match(pid) or len(pid) > ID_MAX:
                faults.append(f"{pid}: id must start with a lowercase letter or digit and hold only lowercase letters, digits, _ and . (at most {ID_MAX})")
            if pid in seen:
                faults.append(f"{pid}: id appears twice")
            seen.add(pid)
        elif "id" in item:
            faults.append(f"{where}: id must be a non-empty string")
        for key, limit in (("name", NAME_MAX), ("description", DESCRIPTION_MAX)):
            value = item.get(key)
            if key not in item:
                continue
            if not isinstance(value, str) or not value.strip():
                faults.append(f"{where}: {key} must be non-empty text")
            elif len(value.strip()) > limit:
                faults.append(f"{where}: {key} is {len(value.strip())} characters, over {limit}")
        price = item.get("price_usd")
        if "price_usd" in item:
            if not isinstance(price, str) or not _PRICE_RE.match(price) or Decimal(price) <= 0:
                faults.append(f"{where}: price_usd must be a string such as \"2.99\", above zero")
        if "active" in item and not isinstance(item.get("active"), bool):
            faults.append(f"{where}: active must be true or false")
    return faults


def read_products(store_dir: Path) -> tuple[Product, ...]:
    """`store/products.json` as Products, or ProductsError naming every fault."""
    path = Path(store_dir) / PRODUCTS_FILE
    if not path.is_file():
        raise ProductsError(f"no {PRODUCTS_FILE} under {store_dir}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise ProductsError(f"store/{PRODUCTS_FILE} is not JSON: {exc}") from exc
    faults = check_products(data)
    if faults:
        raise ProductsError("; ".join(faults))
    return tuple(
        Product(d["id"], d["name"].strip(), d["description"].strip(), d["price_usd"], d["active"])
        for d in data
    )


def usd_money(price_usd: str) -> dict:
    """A Money for a USD price: "2.99" is units "2", nanos 990000000."""
    try:
        amount = Decimal(price_usd)
    except InvalidOperation as exc:
        raise ProductsError(f"price {price_usd!r} is not a number") from exc
    units = int(amount)
    nanos = int(((amount - units) * 1_000_000_000).to_integral_value())
    return {"currencyCode": "USD", "units": str(units), "nanos": nanos}


def buy_option_id(existing: dict | None) -> str:
    """The purchase option this script owns: an existing product's backwards-compatible
    buy option, else its first buy option, else "buy"."""
    options = (existing or {}).get("purchaseOptions") or []
    buys = [o for o in options if "buyOption" in o and o.get("purchaseOptionId")]
    for option in buys:
        if option["buyOption"].get("legacyCompatible"):
            return option["purchaseOptionId"]
    return buys[0]["purchaseOptionId"] if buys else BUY_OPTION_ID


def regions_version(converted: dict) -> str:
    version = ((converted or {}).get("regionVersion") or {}).get("version")
    if not version:
        raise ProductsError("Play's price conversion named no regions version")
    return version


def regional_configs(converted: dict, base: dict) -> list[dict]:
    """Every region Play converted the price to, available, with the US held at exactly
    the file's price."""
    prices = {code: entry["price"] for code, entry in (converted.get("convertedRegionPrices") or {}).items()}
    prices["US"] = base
    return [
        {"regionCode": code, "price": prices[code], "availability": "AVAILABLE"}
        for code in sorted(prices)
    ]


def product_body(package: str, product: Product, converted: dict, existing: dict | None = None) -> dict:
    """The OneTimeProduct the PATCH sends. An existing product keeps its other purchase
    options and its listings in other languages."""
    base = usd_money(product.price_usd)
    other = converted.get("convertedOtherRegionsPrice") or {}
    if "usdPrice" not in other or "eurPrice" not in other:
        raise ProductsError("Play's price conversion gave no price for regions it adds later")
    option_id = buy_option_id(existing)
    ours = {
        "purchaseOptionId": option_id,
        "buyOption": {"legacyCompatible": True, "multiQuantityEnabled": False},
        "regionalPricingAndAvailabilityConfigs": regional_configs(converted, base),
        "newRegionsConfig": {
            "usdPrice": other["usdPrice"],
            "eurPrice": other["eurPrice"],
            "availability": "AVAILABLE",
        },
    }
    kept_options = [
        {k: v for k, v in o.items() if k != "state"}
        for o in (existing or {}).get("purchaseOptions") or []
        if o.get("purchaseOptionId") != option_id
    ]
    kept_listings = [
        listing for listing in (existing or {}).get("listings") or []
        if listing.get("languageCode") != LANGUAGE
    ]
    return {
        "packageName": package,
        "productId": product.id,
        "listings": [{"languageCode": LANGUAGE, "title": product.name, "description": product.description}] + kept_listings,
        "purchaseOptions": [ours] + kept_options,
    }


def patch_params(version: str) -> dict:
    return {
        "allowMissing": "true",
        "updateMask": "listings,purchaseOptions",
        "regionsVersion.version": version,
    }


def option_state(product_json: dict | None, option_id: str) -> str | None:
    for option in (product_json or {}).get("purchaseOptions") or []:
        if option.get("purchaseOptionId") == option_id:
            return option.get("state")
    return None


def state_request(package: str, product: Product, option_id: str, current: str | None) -> dict | None:
    """The batchUpdateStates body that puts the option where the file wants it, or None
    when it is there already."""
    if product.active and current == "ACTIVE":
        return None
    if not product.active and current != "ACTIVE":
        return None
    key = "activatePurchaseOptionRequest" if product.active else "deactivatePurchaseOptionRequest"
    return {"requests": [{key: {"packageName": package, "productId": product.id, "purchaseOptionId": option_id}}]}


def product_url(package: str, product_id: str) -> str:
    """The PATCH (upsert) path, spelled `onetimeproducts` as its reference page has it."""
    return f"{API_BASE}/applications/{package}/onetimeproducts/{product_id}"


def get_url(package: str, product_id: str) -> str:
    """The GET path, spelled `oneTimeProducts` as its reference page has it. The lowercase
    spelling answered 404 for a product that existed, so every run read it as missing
    (wrecking-crew and stillwater, Actions runs 36829185487 and 36829189143, 2026-09-30)."""
    return f"{API_BASE}/applications/{package}/oneTimeProducts/{product_id}"


def states_url(package: str, product_id: str) -> str:
    return f"{API_BASE}/applications/{package}/oneTimeProducts/{product_id}/purchaseOptions:batchUpdateStates"


def convert_url(package: str) -> str:
    return f"{API_BASE}/applications/{package}/pricing:convertRegionPrices"


# ── the API calls ────────────────────────────────────────────────────────────────────

RETRY_STATUSES = frozenset({429, 500, 502, 503, 504})
RETRY_ATTEMPTS = 4
RETRY_BACKOFF_SECONDS = 2.0


def _send(call, *args, **kwargs):
    """One call, retried on the statuses that mean "ask again", never on a 4xx (the same
    rule as play_listing.py, after a 503 threw away a whole listing edit)."""
    delay = RETRY_BACKOFF_SECONDS
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        response = call(*args, **kwargs)
        if response.status_code not in RETRY_STATUSES or attempt == RETRY_ATTEMPTS:
            return response
        print(f"  {response.status_code} from Play, retrying in {delay:.0f}s (attempt {attempt} of {RETRY_ATTEMPTS})")
        time.sleep(delay)
        delay *= 2
    return response


def _check(response) -> dict:
    if not response.ok:
        raise PlayApiError(response)
    return response.json() if response.content else {}


def get_product(session, package: str, product_id: str) -> dict | None:
    response = _send(session.get, get_url(package, product_id))
    if response.status_code == 404:
        return None
    return _check(response)


def convert_price(session, package: str, price_usd: str) -> dict:
    return _check(_send(session.post, convert_url(package), json={"price": usd_money(price_usd)}))


def _authorized_session(key_path: Path):
    # Imported here so the pure parts stay importable where google-auth is not installed
    # (the studio's tests and its listing check load this file).
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2 import service_account

    credentials = service_account.Credentials.from_service_account_file(str(key_path), scopes=[SCOPE])
    return AuthorizedSession(credentials)


def _sample(body: dict) -> str:
    configs = body["purchaseOptions"][0]["regionalPricingAndAvailabilityConfigs"]
    by_code = {c["regionCode"]: c["price"] for c in configs}
    parts = []
    for code in SAMPLE_REGIONS:
        price = by_code.get(code)
        if price:
            amount = Decimal(price.get("units") or 0) + Decimal(price.get("nanos") or 0) / Decimal(1_000_000_000)
            parts.append(f"{code} {amount.normalize():f} {price.get('currencyCode', '')}")
    return ", ".join(parts)


def state_after(answer: dict | None, product_id: str, option_id: str) -> str | None:
    """The option's state in batchUpdateStates' answer (`oneTimeProducts`, one per request)."""
    for item in (answer or {}).get("oneTimeProducts") or []:
        if item.get("productId") in (None, product_id):
            state = option_state(item, option_id)
            if state:
                return state
    return None


READ_BACK_TRIES = 6
READ_BACK_WAIT_SECONDS = 10.0


def read_back(session, package: str, product_id: str, option_id: str, sleep=time.sleep) -> dict | None:
    """The product as Play now reads it. Right after a create Play can answer without the
    new purchase option, so it asks again for up to a minute until the option is there
    (wrecking-crew and stillwater, Actions runs 36827786390 and 36827789679, 2026-09-30:
    created and activated, then read back with no purchase options)."""
    product = None
    for attempt in range(READ_BACK_TRIES):
        product = get_product(session, package, product_id)
        if option_state(product, option_id):
            return product
        if attempt + 1 < READ_BACK_TRIES:
            print(f"{product_id}: Play does not show purchase option {option_id!r} yet, reading again in {READ_BACK_WAIT_SECONDS:.0f}s")
            sleep(READ_BACK_WAIT_SECONDS)
    return product


def run(session, package: str, store_dir: Path, dry_run: bool, sleep=time.sleep) -> bool:
    """Sync every product. True when each one ended where the file asks (always True on a
    dry run that got this far)."""
    products = read_products(store_dir)  # raises ProductsError before any network call
    all_good = True
    for product in products:
        existing = get_product(session, package, product.id)
        converted = convert_price(session, package, product.price_usd)
        version = regions_version(converted)
        body = product_body(package, product, converted, existing)
        option_id = body["purchaseOptions"][0]["purchaseOptionId"]
        regions = len(body["purchaseOptions"][0]["regionalPricingAndAvailabilityConfigs"])
        verb = "update" if existing else "create"
        print(f"{product.id}: {verb}, \"{product.name}\", USD {product.price_usd} in {regions} regions "
              f"(regions version {version}; {_sample(body)}), purchase option {option_id!r}, backwards compatible")
        if dry_run:
            want = "active" if product.active else "inactive"
            print(f"{product.id}: dry run, would {verb} it and make it {want}; nothing was sent")
            continue

        saved = _check(_send(session.patch, product_url(package, product.id), params=patch_params(version), json=body))
        state = option_state(saved, option_id)
        print(f"{product.id}: {verb}d, and Play answered with purchase option {option_id!r} {state}")
        states = state_request(package, product, option_id, state)
        if states is not None:
            answer = _check(_send(session.post, states_url(package, product.id), json=states))
            state = state_after(answer, product.id, option_id) or state
            print(f"{product.id}: {'activated' if product.active else 'deactivated'} purchase option "
                  f"{option_id!r}, and Play answered {state}")

        # The verdict is what Play reads back, never what a write answered.
        final = read_back(session, package, product.id, option_id, sleep)
        for option in (final or {}).get("purchaseOptions") or []:
            print(f"{product.id}: read back, purchase option {option.get('purchaseOptionId')!r} is {option.get('state')}")
        state = option_state(final, option_id)
        if product.active and state != "ACTIVE":
            print(f"{product.id}: should be ACTIVE but Play reads it back as {state}", file=sys.stderr)
            all_good = False
        else:
            print(f"{product.id}: product is {'active' if state == 'ACTIVE' else 'inactive'} on Play (read back)")
    return all_good


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True, help="Android package name")
    parser.add_argument("--key", required=True, type=Path, help="path to the service account JSON")
    parser.add_argument("--store", required=True, type=Path, help="the repo's store/ directory")
    parser.add_argument("--dry-run", action="store_true", help="read and convert only; change nothing on Play")
    args = parser.parse_args(argv)
    try:
        read_products(args.store)  # a bad file fails before the key is even read
        ok = run(_authorized_session(args.key), args.package, args.store, args.dry_run)
    except ProductsError as exc:
        print(f"play_products: {exc}", file=sys.stderr)
        return 1
    except PlayApiError as exc:
        print(f"play_products: Play API error: {exc}", file=sys.stderr)
        return 1
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
