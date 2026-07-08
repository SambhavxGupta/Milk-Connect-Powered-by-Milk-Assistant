from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
import re
from datetime import datetime, date

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
    create_admin_token,
    verify_admin_token,
    append_admin_audit_log,
    create_main_sheet_backup,
    create_daily_backup_if_needed,
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
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"

    # API-only CSP. Full frontend CSP is handled by hosting headers later.
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; "
        "frame-ancestors 'none'; "
        "base-uri 'none'; "
        "form-action 'none';"
    )

    return response

# =====================================================
# STRICT INPUT VALIDATION
# =====================================================

def clean_mobile(value):
    return re.sub(r"\D", "", str(value or "").strip())


def is_valid_mobile(value):
    mobile = clean_mobile(value)
    return len(mobile) == 10 and mobile.isdigit()


def is_valid_pin_value(value):
    pin = str(value or "").strip()
    return len(pin) == 6 and pin.isdigit()


def parse_positive_number(value):
    try:
        number = float(
            str(value or "")
            .replace("₹", "")
            .replace(",", "")
            .replace("L", "")
            .replace("l", "")
            .strip()
        )
        return number
    except Exception:
        return None


def validate_amount(value):
    amount = parse_positive_number(value)

    if amount is None or amount <= 0:
        return False, "❌ Invalid amount."

    if amount > 100000:
        return False, "❌ Amount is too high. Please contact admin."

    return True, ""


def validate_quantity(value):
    quantity = parse_positive_number(value)

    if quantity is None or quantity <= 0:
        return False, "❌ Invalid milk quantity."

    if quantity > 20:
        return False, "❌ Quantity is too high. Please contact admin."

    # Allow 0.5 steps only: 0.5, 1, 1.5, 2...
    if (quantity * 10) % 5 != 0:
        return False, "❌ Quantity must be in 0.5L steps."

    return True, ""


def validate_dates_list(dates):
    if not isinstance(dates, list):
        return False, "❌ Dates must be sent as a list."

    if len(dates) == 0:
        return False, "❌ No dates selected."

    if len(dates) > 30:
        return False, "❌ Maximum 30 dates allowed."

    today = date.today()

    for item in dates:
        try:
            parsed = datetime.strptime(str(item), "%d-%m-%Y").date()
        except Exception:
            return False, "❌ Invalid date format. Use DD-MM-YYYY."

        if parsed <= today:
            return False, "❌ Cannot edit today's or past delivery."

    return True, ""


def validation_error(message, status_code=400):
    return jsonify({
        "success": False,
        "message": message,
        "result": message,
    }), status_code


# =====================================================
# AUTH HELPERS
# =====================================================

def get_bearer_token():
    auth_header = request.headers.get("Authorization", "")

    if auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "").strip()

    return ""

def require_customer_auth(data):
    mobile = data.get("mobile")
    token = (
        get_bearer_token()
        or data.get("auth_token")
        or data.get("token")
    )

    result = verify_customer_token(token, mobile)

    if not result["success"]:
        return jsonify({
            "success": False,
            "message": result["message"],
            "result": result["message"],
        }), 401

    return None

def require_admin_auth(data):
    token = (
        get_bearer_token()
        or data.get("admin_token")
        or data.get("auth_token")
        or data.get("token")
    )

    result = verify_admin_token(token)

    if not result["success"]:
        return jsonify({
            "success": False,
            "message": result["message"],
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

    mobile = clean_mobile(mobile)

    print("LOGIN ATTEMPT")
    print("Mobile:", mobile)
    print("PIN:", pin)

    if not is_valid_mobile(mobile):
        return validation_error("❌ Enter a valid 10-digit mobile number.")

    if not is_valid_pin_value(pin):
        return validation_error("❌ PIN must be exactly 6 digits.")

    client_ip = get_client_ip()
    mobile_key = f"customer-login-mobile:{mobile}"
    

    mobile_limit = check_rate_limit(mobile_key)
   

    if not mobile_limit["allowed"]:
        return jsonify({
            "success": False,
            "message": mobile_limit["message"],
        }), 429


    result = verify_customer_login(mobile, pin)
    
    print("LOGIN RESULT:", result)
    print("VERIFY RESULT:", result)
    if not result["success"]:
        mobile_fail = register_failed_attempt(mobile_key)
        

        return jsonify({
            "success": False,
            "message": mobile_fail["message"] or result["message"],
        })

    clear_failed_attempts(mobile_key)
    

    customer = result["customer"]

    customer_data = {
        "name": customer.get("name", "Customer"),
        "mobile": mobile,
        "flat_no": customer.get("flat_no", ""),
        "liter": customer.get("liter", "1"),
        "remaining_balance": customer.get("remaining_balance", "0"),
        "month_end_balance": customer.get("month_end_balance", "0"),
        "pending_payments": customer.get("pending_payments", "0"),
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
        "month_end_balance": customer_data["month_end_balance"],
        "pending_payments": customer_data["pending_payments"],
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
    
    valid_dates, date_error = validate_dates_list(dates)
    if not valid_dates:
         return validation_error(date_error)

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

    valid_dates, date_error = validate_dates_list(dates)
    if not valid_dates:
        return validation_error(date_error)

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
    valid_quantity, quantity_error = validate_quantity(quantity)
    if not valid_quantity:
        return validation_error(quantity_error)

    valid_dates, date_error = validate_dates_list(dates)
    if not valid_dates:
        return validation_error(date_error)
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

    valid_amount, amount_error = validate_amount(amount)
    if not valid_amount:
        return validation_error(amount_error)

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

    valid_amount, amount_error = validate_amount(amount)
    if not valid_amount:
        return validation_error(amount_error)

    if len(str(note)) > 300:
        return validation_error("❌ Payment note is too long.")

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
    
    if not is_valid_pin_value(current_pin):
        return validation_error("❌ Current PIN must be exactly 6 digits.")

    if not is_valid_pin_value(new_pin):
        return validation_error("❌ New PIN must be exactly 6 digits.")

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

@app.route("/api/admin-dashboard", methods=["POST"])
def api_admin_dashboard():
    data = request.json or {}

    auth_error = require_admin_auth(data)
    if auth_error:
        return auth_error

    try:
        backup_result = create_daily_backup_if_needed()

        if backup_result.get("created"):
            append_admin_audit_log(
                action="AUTO_BACKUP_TRIGGERED_FROM_DASHBOARD",
                details=backup_result.get("message", ""),
                ip_address=get_client_ip(),
                status="Success",
            )

    except Exception as e:
        print("Auto backup skipped because of error:", e)

        try:
            append_admin_audit_log(
                action="AUTO_BACKUP_SKIPPED_ERROR",
                details=str(e),
                ip_address=get_client_ip(),
                status="Failed",
            )
        except Exception as log_error:
            print("Auto backup error log failed:", log_error)

    dashboard = get_admin_dashboard_data()

    append_admin_audit_log(
        action="ADMIN_DASHBOARD_OPENED",
        details="Admin dashboard data loaded",
        ip_address=get_client_ip(),
        status="Success",
    )

    return jsonify({
        "success": True,
        "dashboard": dashboard,
    })

@app.route("/api/admin-create-backup", methods=["POST"])
def api_admin_create_backup():
    data = request.json or {}

    auth_error = require_admin_auth(data)
    if auth_error:
        return auth_error

    result = create_main_sheet_backup()

    append_admin_audit_log(
        action="ADMIN_CREATED_BACKUP",
        details=result.get("message", ""),
        ip_address=get_client_ip(),
        status="Success" if result.get("success") else "Failed",
    )

    return jsonify(result)

@app.route("/api/admin-audit-log", methods=["POST"])
def api_admin_audit_log():
    data = request.json or {}

    auth_error = require_admin_auth(data)
    if auth_error:
        return auth_error

    action = data.get("action", "ADMIN_ACTION")
    details = data.get("details", "")

    append_admin_audit_log(
        action=action,
        details=details,
        ip_address=get_client_ip(),
        status="Success",
    )

    return jsonify({
        "success": True,
        "message": "✅ Admin action logged.",
    })

@app.route("/api/admin-login", methods=["POST"])
def api_admin_login():
    data = request.json or {}

    pin = str(data.get("pin", "")).strip()
    
    if not is_valid_pin_value(pin):
        return validation_error("❌ Admin PIN must be exactly 6 digits.")

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
        
        append_admin_audit_log(
        action="ADMIN_LOGIN_FAILED",
        details="Incorrect admin PIN entered",
        ip_address=client_ip,
        status="Failed",
    )


        return jsonify({
            "success": False,
            "message": fail["message"],
        })

    clear_failed_attempts(admin_key)
    
    append_admin_audit_log(
    action="ADMIN_LOGIN_SUCCESS",
    details="Admin logged in successfully",
    ip_address=client_ip,
    status="Success",
)

    return jsonify({
        "success": True,
        "message": "✅ Admin login successful.",
        "admin_token": create_admin_token(),
    })

@app.route("/api/admin-payment-status", methods=["POST"])
def api_admin_payment_status():
    data = request.json or {}

    auth_error = require_admin_auth(data)
    if auth_error:
        return auth_error

    row = data.get("row")
    status = data.get("status")
    
    try:
        row = int(row)
    except Exception:
        return validation_error("❌ Invalid payment row.")

    if row < 2:
        return validation_error("❌ Invalid payment row.")

    if status not in ["Pending", "Verified", "Rejected"]:
        return validation_error("❌ Invalid payment status.")

    result = update_payment_request_status(
        row_number=row,
        status=status,
    )
    append_admin_audit_log(
    action="ADMIN_PAYMENT_STATUS_UPDATE",
    details=f"Payment row {row} marked as {status}",
    ip_address=get_client_ip(),
    status="Success" if result.get("success") else "Failed",
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
