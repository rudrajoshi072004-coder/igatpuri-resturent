"""Minimal Razorpay gateway helper using only the standard library.

Creates Razorpay Orders and verifies the payment signature returned by Razorpay
Checkout, so we can confirm a payment was genuinely completed before marking an
order as paid. Requires RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in settings.
"""

import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request

from django.conf import settings

RAZORPAY_API = "https://api.razorpay.com/v1"


class RazorpayError(Exception):
    pass


def is_configured() -> bool:
    return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def _auth_header() -> str:
    token = base64.b64encode(
        f"{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}".encode()
    ).decode()
    return f"Basic {token}"


def create_order(amount_paise: int, receipt: str, notes: dict | None = None) -> dict:
    """Create a Razorpay Order and return the API response dict."""
    if not is_configured():
        raise RazorpayError("Razorpay keys are not configured.")

    payload = {
        "amount": int(amount_paise),
        "currency": "INR",
        "receipt": receipt[:40],
        "payment_capture": 1,
    }
    if notes:
        payload["notes"] = notes

    request = urllib.request.Request(
        f"{RAZORPAY_API}/orders",
        data=json.dumps(payload).encode(),
        method="POST",
    )
    request.add_header("Authorization", _auth_header())
    request.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(request, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="ignore")
        raise RazorpayError(f"Razorpay order creation failed ({exc.code}): {detail}")
    except urllib.error.URLError as exc:
        raise RazorpayError(f"Could not reach Razorpay: {exc.reason}")


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify the checkout signature: HMAC_SHA256(order_id|payment_id, secret)."""
    if not (order_id and payment_id and signature):
        return False
    message = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), message, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
