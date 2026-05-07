from flask import Flask, request, jsonify, render_template
import uuid

from milk_service import (
    show_delivery_calendar,
    handle_pause,
    handle_resume,
    handle_modify_quantity,
    get_customer_info,
    write_log
)
app = Flask(__name__)

print("🚀 STARTING WEBCHAT APP")

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

    # AUTH
    if state == "AUTH":

        if not (msg.isdigit() and len(msg) == 10):
            return "📞 Enter your 10-digit registered mobile number:"

        customer = get_customer_info(msg)

        if not customer:
            return "❌ Mobile number not registered."

        status = customer["status"].lower()

        if status == "inactive":
            return "❌ Your account is inactive."

        session["data"]["mobile"] = msg

        session["state"] = "MENU"

        return (
            f"✅ Mobile number verified: {msg}\n\n"
            + menu_text()
        )

    # MENU
    elif state == "MENU":

        mobile = session["data"]["mobile"]

        if msg == "1":

            return (
                show_delivery_calendar(mobile)
                + "\n\n"
                + menu_text()
            )

        elif msg == "2":

            session["state"] = "PAUSE_START"

            return "📅 Enter pause start date (DD-MM-YYYY):"

        elif msg == "3":

            result = handle_resume(mobile)

            return result + "\n\n" + menu_text()

        elif msg == "4":

            session["state"] = "CHANGE_QTY"

            return "🥛 Enter new quantity in litres:"

        return "❌ Invalid option.\n\n" + menu_text()

    # PAUSE START
    elif state == "PAUSE_START":

        session["data"]["pause_start"] = msg

        session["state"] = "PAUSE_DAYS"

        return "⏸️ Pause for how many days?"

    # PAUSE DAYS
    elif state == "PAUSE_DAYS":

        mobile = session["data"]["mobile"]

        result = handle_pause(
            mobile,
            session["data"]["pause_start"],
            msg
        )

        session["state"] = "MENU"

        return result + "\n\n" + menu_text()

    # CHANGE QUANTITY
    elif state == "CHANGE_QTY":

        mobile = session["data"]["mobile"]

        result = handle_modify_quantity(
            mobile,
            msg
        )

        session["state"] = "MENU"

        return result + "\n\n" + menu_text()

    # FALLBACK
    session["state"] = "MENU"

    return menu_text()


@app.route("/")
def home():

    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():

    data = request.json

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


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )