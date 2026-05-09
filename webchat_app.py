from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import uuid

from milk_service import (
    show_delivery_calendar,
    handle_pause,
    handle_resume,
    handle_modify_quantity,
    get_customer_info,
)

from milk_service import (
    show_delivery_calendar,
    handle_pause,
    handle_resume,
    handle_modify_quantity,
    get_customer_info,
    get_customer_calendar,
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

    mobile = data.get("mobile", "").strip()

    if not mobile:
        return jsonify({
            "success": False,
            "message": "Mobile number required"
        }), 400

    customer = get_customer_info(mobile)

    if not customer:
        return jsonify({
            "success": False,
            "message": "Customer not found"
        }), 404

    if customer["status"].lower() == "inactive":
        return jsonify({
            "success": False,
            "message": "Account inactive"
        }), 403

    return jsonify({
        "success": True,
        "customer": {
            "name": customer.get("name", "Customer"),
            "mobile": mobile,
            "status": customer.get("status", ""),
            "liter": customer.get("liter", "1"),
            "flat_no": customer.get("flat_no", ""),
            "remaining_balance": customer.get("remaining_balance", "0")
        }
    })

@app.route("/api/pause", methods=["POST"])
def api_pause():

    data = request.json or {}

    mobile = data.get("mobile")
    start_date = data.get("start_date")
    days = data.get("days")

    result = handle_pause(
        mobile,
        start_date,
        days
    )

    return jsonify({
        "result": result
    })


@app.route("/api/resume", methods=["POST"])
def api_resume():

    data = request.json or {}

    mobile = data.get("mobile")

    result = handle_resume(mobile)

    return jsonify({
        "result": result
    })


@app.route("/api/change-quantity", methods=["POST"])
def api_change_quantity():

    data = request.json or {}

    mobile = data.get("mobile")
    quantity = data.get("quantity")

    result = handle_modify_quantity(
        mobile,
        quantity
    )

    return jsonify({
        "result": result
    })
@app.route("/api/calendar-data", methods=["POST"])
def api_calendar_data():
    data = request.json or {}

    mobile = data.get("mobile")

    calendar_data = get_customer_calendar(mobile)

    return jsonify(calendar_data)

if __name__ == "__main__":
    print("🔥 Flask app starting...")
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )