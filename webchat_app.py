from flask import Flask, request, jsonify
from flask_cors import CORS

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
CORS(app)


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

    mobile = data.get("mobile")
    pin = data.get("pin")

    result = verify_customer_login(mobile, pin)

    if not result["success"]:
        return jsonify({
            "success": False,
            "message": result["message"],
        })

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

    mobile = data.get("mobile")
    current_pin = data.get("current_pin")
    new_pin = data.get("new_pin")

    result = change_customer_pin(
        mobile=mobile,
        current_pin=current_pin,
        new_pin=new_pin,
    )

    return jsonify(result)


# =====================================================
# ADMIN
# =====================================================

@app.route("/api/admin-login", methods=["POST"])
def api_admin_login():
    data = request.json or {}

    pin = data.get("pin")

    if not verify_admin_pin(pin):
        return jsonify({
            "success": False,
            "message": "❌ Incorrect admin PIN.",
        })

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