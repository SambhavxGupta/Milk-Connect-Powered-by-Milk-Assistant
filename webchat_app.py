from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time

from milk_service import (
    handle_pause,
    handle_resume,
    handle_modify_quantity,
    get_customer_calendar,
    submit_payment_request,
    get_payment_history,
    verify_customer_login,
    get_action_history,
    change_customer_pin,
    verify_admin_pin,
    get_admin_dashboard_data,
    update_payment_request_status,
    get_secure_payment_info,
    create_customer_token,
    verify_customer_token,
)

app = Flask(__name__)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": allowed_origins,
        }
    },
)

# =====================================================
# RATE LIMIT / LOCKOUT SECURITY
# =====================================================

FAILED_ATTEMPTS = {}

MAX_FAILED_ATTEMPTS = 5
LOCK_TIME_SECONDS = 10 * 60
ATTEMPT_WINDOW_SECONDS = 10 * 60


def get_client_ip():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.remote_addr or "unknown"


def get_attempt_record(key):
    now = time.time()

    record = FAILED_ATTEMPTS.get(key)

    if not record:
        record = {
            "count": 0,
            "first_attempt": now,
            "locked_until": 0,
        }

        FAILED_ATTEMPTS[key] = record

    if now - record["first_attempt"] > ATTEMPT_WINDOW_SECONDS:
        record["count"] = 0
        record["first_attempt"] = now
        record["locked_until"] = 0

    return record


def check_rate_limit(key):
    now = time.time()
    record = get_attempt_record(key)

    if record["locked_until"] > now:
        remaining_seconds = int(record["locked_until"] - now)
        remaining_minutes = max(1, remaining_seconds // 60)

        return {
            "allowed": False,
            "message": f"🔒 Too many failed attempts. Try again in {remaining_minutes} minute(s).",
        }

    return {
        "allowed": True,
        "message": "",
    }


def register_failed_attempt(key):
    now = time.time()
    record = get_attempt_record(key)

    record["count"] += 1

    if record["count"] >= MAX_FAILED_ATTEMPTS:
        record["locked_until"] = now + LOCK_TIME_SECONDS

        return {
            "locked": True,
            "message": "🔒 Too many failed attempts. This login is locked for 10 minutes.",
        }

    attempts_left = MAX_FAILED_ATTEMPTS - record["count"]

    return {
        "locked": False,
        "message": f"❌ Incorrect details. {attempts_left} attempt(s) left.",
    }


def clear_failed_attempts(key):
    if key in FAILED_ATTEMPTS:
        del FAILED_ATTEMPTS[key]

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# =====================================================
# AUTH HELPERS
# =====================================================

def require_customer_auth(data):
    mobile = data.get("mobile")
    token = data.get("auth_token") or data.get("token")

    result = verify_customer_token(token, mobile)

    if not result["success"]:
        return jsonify({
            "success": False,
            "message": result["message"],
            "result": result["message"],
        }), 401

    return None


# =====================================================
# BASIC HEALTH ROUTE
# =====================================================

@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Milk Connect backend is running.",
    })


# =====================================================
# CUSTOMER LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json or {}

    mobile = str(data.get("mobile", "")).strip()
    pin = str(data.get("pin", "")).strip()

    client_ip = get_client_ip()
    mobile_key = f"customer-login-mobile:{mobile}"
    ip_key = f"customer-login-ip:{client_ip}"

    mobile_limit = check_rate_limit(mobile_key)
    ip_limit = check_rate_limit(ip_key)

    if not mobile_limit["allowed"]:
        return jsonify({
            "success": False,
            "message": mobile_limit["message"],
        }), 429

    if not ip_limit["allowed"]:
        return jsonify({
            "success": False,
            "message": ip_limit["message"],
        }), 429

    result = verify_customer_login(mobile, pin)

    if not result["success"]:
        mobile_fail = register_failed_attempt(mobile_key)
        ip_fail = register_failed_attempt(ip_key)

        return jsonify({
            "success": False,
            "message": mobile_fail["message"] or ip_fail["message"] or result["message"],
        })

    clear_failed_attempts(mobile_key)
    clear_failed_attempts(ip_key)

    customer = result["customer"]

    customer_data = {
        "name": customer.get("name", "Customer"),
        "mobile": mobile,
        "flat_no": customer.get("flat_no", ""),
        "liter": customer.get("liter", "1"),
        "remaining_balance": customer.get("remaining_balance", "0"),
        "status": customer.get("status", ""),
    }

    return jsonify({
        "success": True,
        "message": result["message"],
        "auth_token": create_customer_token(mobile),

        "customer": customer_data,

        "name": customer_data["name"],
        "mobile": customer_data["mobile"],
        "flat_no": customer_data["flat_no"],
        "liter": customer_data["liter"],
        "remaining_balance": customer_data["remaining_balance"],
        "status": customer_data["status"],
    })


# =====================================================
# CUSTOMER CALENDAR / DELIVERY ACTIONS
# =====================================================

@app.route("/api/calendar-data", methods=["POST"])
def api_calendar_data():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    calendar_data = get_customer_calendar(mobile)

    return jsonify(calendar_data)


@app.route("/api/pause", methods=["POST"])
def api_pause():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    dates = data.get("dates")

    result = handle_pause(
        mobile,
        start_date_str=data.get("start_date"),
        pause_days=data.get("days"),
        dates=dates,
    )

    return jsonify({
        "success": result.startswith("✅"),
        "result": result,
        "message": result,
    })


@app.route("/api/resume", methods=["POST"])
def api_resume():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    dates = data.get("dates")

    result = handle_resume(mobile, dates=dates)

    return jsonify({
        "success": result.startswith("✅"),
        "result": result,
        "message": result,
    })


@app.route("/api/change-quantity", methods=["POST"])
def api_change_quantity():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    quantity = data.get("quantity")
    dates = data.get("dates")

    result = handle_modify_quantity(
        mobile,
        quantity,
        dates=dates,
    )

    return jsonify({
        "success": result.startswith("✅"),
        "result": result,
        "message": result,
    })


# =====================================================
# CUSTOMER PAYMENT
# =====================================================

@app.route("/api/payment-info", methods=["POST"])
def api_payment_info():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    amount = data.get("amount")

    result = get_secure_payment_info(
        mobile=mobile,
        amount=amount,
    )

    return jsonify(result)


@app.route("/api/payment-request", methods=["POST"])
def api_payment_request():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    amount = data.get("amount")
    note = data.get("note", "")

    result = submit_payment_request(
        mobile=mobile,
        amount=amount,
        note=note,
    )

    return jsonify(result)


@app.route("/api/payment-history", methods=["POST"])
def api_payment_history():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    history = get_payment_history(mobile)

    return jsonify({
        "success": True,
        "history": history,
    })


# =====================================================
# CUSTOMER HISTORY / SECURITY
# =====================================================

@app.route("/api/action-history", methods=["POST"])
def api_action_history():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = data.get("mobile")
    history = get_action_history(mobile)

    return jsonify({
        "success": True,
        "history": history,
    })


@app.route("/api/change-pin", methods=["POST"])
def api_change_pin():
    data = request.json or {}

    auth_error = require_customer_auth(data)
    if auth_error:
        return auth_error

    mobile = str(data.get("mobile", "")).strip()
    current_pin = data.get("current_pin")
    new_pin = data.get("new_pin")

    change_pin_key = f"change-pin:{mobile}"

    limit = check_rate_limit(change_pin_key)

    if not limit["allowed"]:
        return jsonify({
            "success": False,
            "message": limit["message"],
        }), 429

    result = change_customer_pin(
        mobile=mobile,
        current_pin=current_pin,
        new_pin=new_pin,
    )

    if not result["success"] and "Current PIN is incorrect" in result.get("message", ""):
        fail = register_failed_attempt(change_pin_key)

        return jsonify({
            "success": False,
            "message": fail["message"],
        })

    if result["success"]:
        clear_failed_attempts(change_pin_key)

    return jsonify(result)


# =====================================================
# ADMIN
# =====================================================

@app.route("/api/admin-login", methods=["POST"])
def api_admin_login():
    data = request.json or {}

    pin = str(data.get("pin", "")).strip()

    client_ip = get_client_ip()
    admin_key = f"admin-login-ip:{client_ip}"

    limit = check_rate_limit(admin_key)

    if not limit["allowed"]:
        return jsonify({
            "success": False,
            "message": limit["message"],
        }), 429

    if not verify_admin_pin(pin):
        fail = register_failed_attempt(admin_key)

        return jsonify({
            "success": False,
            "message": fail["message"],
        })

    clear_failed_attempts(admin_key)

    return jsonify({
        "success": True,
        "message": "✅ Admin login successful.",
    })


@app.route("/api/admin-dashboard", methods=["POST"])
def api_admin_dashboard():
    data = request.json or {}

    pin = data.get("pin")

    if not verify_admin_pin(pin):
        return jsonify({
            "success": False,
            "message": "❌ Unauthorized admin access.",
        })

    dashboard = get_admin_dashboard_data()

    return jsonify({
        "success": True,
        "dashboard": dashboard,
    })


@app.route("/api/admin-payment-status", methods=["POST"])
def api_admin_payment_status():
    data = request.json or {}

    pin = data.get("pin")
    row = data.get("row")
    status = data.get("status")

    if not verify_admin_pin(pin):
        return jsonify({
            "success": False,
            "message": "❌ Unauthorized admin access.",
        })

    result = update_payment_request_status(
        row_number=row,
        status=status,
    )

    return jsonify(result)


# =====================================================
# SERVER START
# =====================================================

if __name__ == "__main__":
    print("🔥 Flask app starting...")
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False,
    )