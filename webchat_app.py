from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import uuid

from milk_service import (
    show_delivery_calendar,
    handle_pause,
    handle_resume,
    handle_modify_quantity,
    get_customer_info,
    get_customer_calendar,
    submit_payment_request,
    get_payment_history,
    verify_customer_login,
    get_action_history,
    change_customer_pin,
    verify_admin_pin,
    get_admin_dashboard_data,
    update_payment_request_status,
)


app = Flask(__name__)
CORS(app)

SESSIONS = {}


def get_session(session_id):
    if session_id not in SESSIONS:
        SESSIONS[session_id] = {
            "state": "AUTH",
            "data": {}
        }
    return SESSIONS[session_id]


def menu_text():
    return (
        "👋 Welcome to Milk Assistant\n\n"
        "1️⃣ View delivery calendar\n"
        "2️⃣ Pause milk\n"
        "3️⃣ Resume milk\n"
        "4️⃣ Change quantity\n\n"
        "Reply with a number."
    )


def route_message(session, message):
    msg = message.strip()
    state = session["state"]

    if state == "AUTH":
        if not (msg.isdigit() and len(msg) == 10):
            return "📞 Enter your 10-digit registered mobile number:"

        customer = get_customer_info(msg)

        if not customer:
            return "❌ Mobile number not registered."

        if customer["status"].lower() == "inactive":
            return "❌ Your account is inactive."

        session["data"]["mobile"] = msg
        session["state"] = "MENU"

        return f"✅ Mobile number verified: {msg}\n\n" + menu_text()

    if state == "MENU":
        mobile = session["data"]["mobile"]

        if msg == "1":
            return show_delivery_calendar(mobile) + "\n\n" + menu_text()

        if msg == "2":
            session["state"] = "PAUSE_START"
            return "📅 Enter pause start date (DD-MM-YYYY):"

        if msg == "3":
            result = handle_resume(mobile)
            return result + "\n\n" + menu_text()

        if msg == "4":
            session["state"] = "CHANGE_QTY"
            return "🥛 Enter new quantity in litres:"

        return "❌ Invalid option.\n\n" + menu_text()

    if state == "PAUSE_START":
        session["data"]["pause_start"] = msg
        session["state"] = "PAUSE_DAYS"
        return "⏸️ Pause for how many days?"

    if state == "PAUSE_DAYS":
        mobile = session["data"]["mobile"]

        result = handle_pause(
            mobile,
            session["data"]["pause_start"],
            msg
        )

        session["state"] = "MENU"
        return result + "\n\n" + menu_text()

    if state == "CHANGE_QTY":
        mobile = session["data"]["mobile"]

        result = handle_modify_quantity(mobile, msg)

        session["state"] = "MENU"
        return result + "\n\n" + menu_text()

    session["state"] = "MENU"
    return menu_text()


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/action-history", methods=["POST"])
def api_action_history():
    data = request.json or {}

    mobile = data.get("mobile")

    history = get_action_history(mobile)

    return jsonify({
        "success": True,
        "history": history,
    })

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}

    session_id = data.get("session_id")

    if not session_id:
        session_id = str(uuid.uuid4())

    session = get_session(session_id)

    reply = route_message(
        session,
        data.get("message", "")
    )

    return jsonify({
        "session_id": session_id,
        "reply": reply
    })


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

        # New format
        "customer": customer_data,

        # Old/direct format also kept so frontend does not crash
        "name": customer_data["name"],
        "mobile": customer_data["mobile"],
        "flat_no": customer_data["flat_no"],
        "liter": customer_data["liter"],
        "remaining_balance": customer_data["remaining_balance"],
        "status": customer_data["status"],
    })
    
@app.route("/api/change-pin", methods=["POST"])
def api_change_pin():
    data = request.json or {}

    mobile = data.get("mobile")
    current_pin = data.get("current_pin")
    new_pin = data.get("new_pin")

    result = change_customer_pin(
        mobile=mobile,
        current_pin=current_pin,
        new_pin=new_pin,
    )

    return jsonify(result)    
    
@app.route("/api/pause", methods=["POST"])
def api_pause():
    data = request.json or {}

    mobile = data.get("mobile")
    dates = data.get("dates")

    result = handle_pause(
        mobile,
        start_date_str=data.get("start_date"),
        pause_days=data.get("days"),
        dates=dates,
    )

    return jsonify({"result": result})


@app.route("/api/resume", methods=["POST"])
def api_resume():
    data = request.json or {}

    mobile = data.get("mobile")
    dates = data.get("dates")

    result = handle_resume(mobile, dates=dates)

    return jsonify({"result": result})

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


@app.route("/api/change-quantity", methods=["POST"])
def api_change_quantity():
    data = request.json or {}

    mobile = data.get("mobile")
    quantity = data.get("quantity")
    dates = data.get("dates")

    result = handle_modify_quantity(
        mobile,
        quantity,
        dates=dates,
    )

    return jsonify({"result": result})
@app.route("/api/calendar-data", methods=["POST"])
def api_calendar_data():
    data = request.json or {}

    mobile = data.get("mobile")

    calendar_data = get_customer_calendar(mobile)

    return jsonify(calendar_data)
@app.route("/api/payment-request", methods=["POST"])
def api_payment_request():
    data = request.json or {}

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

    mobile = data.get("mobile")

    history = get_payment_history(mobile)

    return jsonify({
        "success": True,
        "history": history,
    })

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

if __name__ == "__main__":
    print("🔥 Flask app starting...")
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )