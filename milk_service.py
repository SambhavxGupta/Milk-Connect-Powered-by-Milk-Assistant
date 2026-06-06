print("MILK SERVICE START")

import json
print("1")

import os
print("2")

import gspread
print("3")

from dotenv import load_dotenv
print("4")

from datetime import datetime, timedelta, date
print("5")

from google.oauth2.service_account import Credentials
print("6")

load_dotenv()
print("7")

# =====================================================
# GOOGLE SHEET SETUP
# =====================================================

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]

google_creds_json = os.getenv(
    "GOOGLE_CREDS_JSON"
)
print("8")
print("GOOGLE_CREDS_JSON:", bool(google_creds_json))

if google_creds_json:

    creds_dict = json.loads(
        google_creds_json
    )

    creds = Credentials.from_service_account_info(
        creds_dict,
        scopes=SCOPES
    )

else:

    creds = Credentials.from_service_account_file(
        "service_account.json",
        scopes=SCOPES
    )

client = gspread.authorize(creds)
print("10")

SPREADSHEET_ID = os.getenv(
    "SPREADSHEET_ID"
)
print("9")
print("SPREADSHEET_ID:", SPREADSHEET_ID)

if not SPREADSHEET_ID:
    raise Exception(
        "SPREADSHEET_ID missing in .env file"
    )

spreadsheet = client.open_by_key(SPREADSHEET_ID)
sheet = spreadsheet.sheet1
print("11")

print("✅ Google Sheet connected successfully")
# =====================================================
# LOGGING
# =====================================================

def write_log(mobile, action, result):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    log_line = (
        f"{timestamp} | "
        f"{mobile} | "
        f"{action} | "
        f"{result}\n"
    )

    with open("logs.txt", "a", encoding="utf-8") as log_file:
        log_file.write(log_line)

    try:
        append_action_log(mobile, action, result)
    except Exception as e:
        print("Action log sheet write failed:", e)

# =====================================================
# HELPERS
# =====================================================


def normalize_mobile(value):

    try:
        return str(int(float(value)))

    except:
        return str(value).strip()


def find_column(headers, keywords):

    for idx, header in enumerate(headers):

        header_text = header.strip().lower()

        for keyword in keywords:

            if keyword in header_text:
                return idx

    return None

# =====================================================
# GET CUSTOMER INFO
# =====================================================

def get_customer_info(mobile):
    
    all_values = sheet.get_all_values()

    headers = all_values[0]

    name_col = find_column(
        headers,
        ["name"]
    )

    mobile_col = find_column(
        headers,
        ["mobile", "phone"]
    )

    status_col = find_column(
        headers,
        ["status"]
    )

    liter_col = find_column(
        headers,
        ["liter", "litre"]
    )

    flat_col = find_column(
        headers,
        ["flat"]
    )

    balance_col = find_column(
        headers,
        ["balance"]
    )
    
    pin_col = find_column(
    headers,
    ["login pin", "pin"]
    )

    if mobile_col is None:
        return None

    for row_idx, row in enumerate(all_values[1:], start=2):

        if len(row) <= mobile_col:
            continue

        row_mobile = normalize_mobile(
            row[mobile_col]
        )

        if row_mobile == mobile:

            return {
                "row": row_idx,

                "name": (
                    row[name_col].strip()
                    if name_col is not None and len(row) > name_col
                    else "Customer"
                ),

                "status": (
                    row[status_col].strip()
                    if status_col is not None and len(row) > status_col
                    else ""
                ),

                "liter": (
                    row[liter_col].strip()
                    if liter_col is not None and len(row) > liter_col
                    else "1"
                ),

                "flat_no": (
                    row[flat_col].strip()
                    if flat_col is not None and len(row) > flat_col
                    else ""
                ),

                "remaining_balance": (
                    row[balance_col].strip()
                    if balance_col is not None and len(row) > balance_col
                    else "0"
                ),
                "login_pin": (
                    row[pin_col].strip()
                    if pin_col is not None and len(row) > pin_col
                    else ""
                )   
            }

    return None
# =====================================================
# FIND CUSTOMER ROW
# =====================================================


def find_customer_row(mobile):

    customer = get_customer_info(mobile)

    if customer:
        return customer["row"]

    return None

# =====================================================
# PARSE HEADER DATE
# =====================================================


def format_quantity(qty):
    try:
        number = float(str(qty).replace("L", "").replace("l", "").strip())
        if number.is_integer():
            return str(int(number))
        return str(number).rstrip("0").rstrip(".")
    except Exception:
        return str(qty).strip().replace("L", "").replace("l", "")


def parse_header_date(header):
    text = str(header).strip()
    if not text:
        return None

    current_year = datetime.now().year
    possible_formats = ["%d-%b-%Y", "%d-%B-%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"]
    values_to_try = [text]

    if text.count("-") == 1:
        values_to_try.append(f"{text}-{current_year}")

    for value in values_to_try:
        for fmt in possible_formats:
            try:
                return datetime.strptime(value, fmt).date()
            except Exception:
                pass

    return None


def parse_user_date(value):
    if isinstance(value, date):
        return value

    text = str(value).strip()
    possible_formats = ["%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%d-%b-%Y", "%d-%B-%Y"]

    for fmt in possible_formats:
        try:
            return datetime.strptime(text, fmt).date()
        except Exception:
            pass

    return None


def build_date_range(start_date_str, days):
    start_date = parse_user_date(start_date_str)
    if not start_date:
        return None, "❌ Invalid date format. Use DD-MM-YYYY"

    try:
        days = int(days)
    except Exception:
        return None, "❌ Invalid number of days."

    if days <= 0:
        return None, "❌ Days must be greater than 0."

    if days > 30:
        return None, "❌ Maximum limit is 30 days."

    return [start_date + timedelta(days=i) for i in range(days)], None


def parse_selected_dates(dates=None, start_date_str=None, days=None):
    if dates:
        parsed_dates = []

        for item in dates:
            parsed = parse_user_date(item)
            if parsed:
                parsed_dates.append(parsed)

        parsed_dates = sorted(set(parsed_dates))

        if not parsed_dates:
            return None, "❌ No valid dates selected."

        if len(parsed_dates) > 30:
            return None, "❌ Maximum limit is 30 selected dates."

        return parsed_dates, None

    return build_date_range(start_date_str, days)


def get_date_columns():
    headers = sheet.row_values(1)
    date_columns = {}

    for idx, header in enumerate(headers, start=1):
        parsed_date = parse_header_date(header)
        if parsed_date:
            date_columns[parsed_date] = idx

    return date_columns


def set_pause_style(cell):
    sheet.format(cell, {
        "backgroundColor": {"red": 1, "green": 0.8, "blue": 0.8},
        "textFormat": {
            "foregroundColor": {"red": 0.6, "green": 0, "blue": 0},
            "bold": True,
        },
    })


def set_quantity_style(cell):
    sheet.format(cell, {
        "backgroundColor": {"red": 0.82, "green": 0.9, "blue": 1},
        "textFormat": {
            "foregroundColor": {"red": 0, "green": 0.15, "blue": 0.55},
            "bold": True,
        },
    })


def reset_cell_style(cell):
    sheet.format(cell, {
        "backgroundColor": {"red": 1, "green": 1, "blue": 1},
        "textFormat": {
            "foregroundColor": {"red": 0, "green": 0, "blue": 0},
            "bold": False,
        },
    })


def show_delivery_calendar(mobile):
    row = find_customer_row(mobile)
    if not row:
        return "❌ Customer not found."

    headers = sheet.row_values(1)
    values = sheet.row_values(row)
    output = [f"📅 Delivery Calendar ({date.today().strftime('%B %Y')})", ""]
    date_row = []
    value_row = []

    for idx, header in enumerate(headers):
        parsed = parse_header_date(header)
        if parsed:
            date_row.append(parsed.strftime("%d"))
            if idx < len(values):
                value_row.append(str(values[idx] or "-"))

    output.append(" ".join(date_row))
    output.append(" ".join(value_row))
    return "\n".join(output)


def handle_pause(mobile, start_date_str=None, pause_days=None, dates=None):
    customer = get_customer_info(mobile)
    if not customer:
        return "❌ Customer not found."

    selected_dates, error = parse_selected_dates(
        dates=dates,
        start_date_str=start_date_str,
        days=pause_days,
    )
    if error:
        return error

    today = date.today()

    if any(selected_date <= today for selected_date in selected_dates):
        return "❌ Cannot edit today's or past delivery. Please choose tomorrow or later."

    row = customer["row"]
    date_columns = get_date_columns()
    updated_dates = []

    for selected_date in selected_dates:
        col = date_columns.get(selected_date)
        if not col:
            continue

        cell = gspread.utils.rowcol_to_a1(row, col)
        sheet.update_acell(cell, "Ab")
        set_pause_style(cell)
        updated_dates.append(selected_date.strftime("%d-%m-%Y"))

    if updated_dates:
        write_log(mobile, "PAUSE", ", ".join(updated_dates))
        return f"✅ Paused {len(updated_dates)} selected date(s)."

    return "❌ No matching dates found in sheet."


def handle_resume(mobile, dates=None):
    customer = get_customer_info(mobile)
    if not customer:
        return "❌ Customer not found."

    row = customer["row"]
    default_quantity = format_quantity(customer["liter"])
    values = sheet.row_values(row)
    updated_dates = []

    if dates:
        selected_dates, error = parse_selected_dates(dates=dates)
        if error:
            return error

        today = date.today()

        if any(selected_date <= today for selected_date in selected_dates):
            return "❌ Cannot edit today's or past delivery. Please choose tomorrow or later."

        date_columns = get_date_columns()

        for selected_date in selected_dates:
            col = date_columns.get(selected_date)
            if not col:
                continue

            cell = gspread.utils.rowcol_to_a1(row, col)
            sheet.update_acell(cell, default_quantity)
            reset_cell_style(cell)
            updated_dates.append(selected_date.strftime("%d-%m-%Y"))

    else:
        for idx, value in enumerate(values, start=1):
            if str(value).strip().lower() == "ab":
                cell = gspread.utils.rowcol_to_a1(row, idx)
                sheet.update_acell(cell, default_quantity)
                reset_cell_style(cell)
                updated_dates.append(cell)

    if updated_dates:
        write_log(mobile, "RESUME", ", ".join(updated_dates))
        return f"✅ Resumed {len(updated_dates)} selected date(s)."

    return "✅ No paused entries found."


def get_customer_calendar(mobile):
    customer = get_customer_info(mobile)
    if not customer:
        return {
            "paused_days": [],
            "quantity_days": {},
            "dates": {},
            "total_milk": "0",
            "remaining_milk": "0",
        }

    row = customer["row"]
    default_quantity = format_quantity(customer["liter"])
    headers = sheet.row_values(1)
    values = sheet.row_values(row)

    paused_days = []
    quantity_days = {}
    dates_data = {}
    total_milk = 0.0
    remaining_milk = 0.0
    current_month = date.today().month
    current_year = date.today().year
    today = date.today()

    for idx, header in enumerate(headers):
        parsed = parse_header_date(header)
        if not parsed:
            continue

        value = str(values[idx]).strip() if idx < len(values) else ""
        if not value:
            value = default_quantity

        date_key = parsed.strftime("%d-%m-%Y")
        day = parsed.day
        status = "default"
        quantity = default_quantity

        if value.lower() == "ab":
            status = "paused"
            quantity = "0"
            paused_days.append(day)
        else:
            quantity = format_quantity(value)

            if quantity != default_quantity:
                status = "changed"
                quantity_days[str(day)] = quantity

            if parsed.month == current_month and parsed.year == current_year:
                try:
                    total_milk += float(quantity)

                    if parsed > today:
                        remaining_milk += float(quantity)
                except Exception:
                    pass

        dates_data[date_key] = {
            "day": day,
            "date": date_key,
            "value": value,
            "status": status,
            "quantity": quantity,
        }

    return {
        "paused_days": paused_days,
        "quantity_days": quantity_days,
        "dates": dates_data,
        "total_milk": format_quantity(total_milk),
        "remaining_milk": format_quantity(remaining_milk),
        "default_quantity": default_quantity,
        "remaining_balance": customer.get("remaining_balance", "0"),
    }


def handle_modify_quantity(mobile, qty, dates=None):
    customer = get_customer_info(mobile)
    if not customer:
        return "❌ Customer not found."

    try:
        qty = float(qty)
    except Exception:
        return "❌ Invalid quantity."

    if qty <= 0:
        return "❌ Quantity must be greater than 0."

    qty_text = format_quantity(qty)
    row = customer["row"]
    date_columns = get_date_columns()
    values = sheet.row_values(row)
    today = date.today()

    if dates:
        selected_dates, error = parse_selected_dates(dates=dates)
        if error:
            return error
    else:
        selected_dates = sorted([d for d in date_columns.keys() if d > today])

    if any(selected_date <= today for selected_date in selected_dates):
        return "❌ Cannot edit today's or past delivery. Please choose tomorrow or later."

    updated_dates = []
    skipped_paused = 0

    for selected_date in selected_dates:
        col = date_columns.get(selected_date)
        if not col:
            continue

        current_value = values[col - 1] if len(values) >= col else ""
        if str(current_value).strip().lower() == "ab":
            skipped_paused += 1
            continue

        cell = gspread.utils.rowcol_to_a1(row, col)
        sheet.update_acell(cell, qty_text)
        set_quantity_style(cell)
        updated_dates.append(selected_date.strftime("%d-%m-%Y"))

    if updated_dates:
        write_log(mobile, "CHANGE_QTY", f"{qty_text}L on {', '.join(updated_dates)}")
        if skipped_paused:
            return f"✅ Quantity changed on {len(updated_dates)} date(s). {skipped_paused} paused date(s) skipped."
        return f"✅ Quantity changed to {qty_text}L on {len(updated_dates)} date(s)."

    if skipped_paused:
        return "❌ Selected date(s) are paused. Resume first, then change quantity."

    return "❌ Quantity update failed. No matching dates found."
# =====================================================
# PAYMENT REQUESTS
# =====================================================

PAYMENT_SHEET_NAME = "Payment_Requests"

PAYMENT_HEADERS = [
    "Timestamp",
    "Name",
    "Mobile",
    "Amount",
    "Status",
    "Note",
]


def get_payment_sheet():
    try:
        payment_sheet = spreadsheet.worksheet(PAYMENT_SHEET_NAME)
    except gspread.WorksheetNotFound:
        payment_sheet = spreadsheet.add_worksheet(
            title=PAYMENT_SHEET_NAME,
            rows=1000,
            cols=len(PAYMENT_HEADERS),
        )
        payment_sheet.append_row(PAYMENT_HEADERS)

        payment_sheet.format("A1:F1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.85, "green": 1, "blue": 0.35},
        })

    headers = payment_sheet.row_values(1)

    if headers != PAYMENT_HEADERS:
        payment_sheet.update("A1:F1", [PAYMENT_HEADERS])

    apply_payment_status_dropdown(payment_sheet)

    return payment_sheet

def apply_payment_status_dropdown(payment_sheet):
    spreadsheet.batch_update({
        "requests": [
            {
                "setDataValidation": {
                    "range": {
                        "sheetId": payment_sheet.id,
                        "startRowIndex": 1,
                        "endRowIndex": 1000,
                        "startColumnIndex": 4,
                        "endColumnIndex": 5,
                    },
                    "rule": {
                        "condition": {
                            "type": "ONE_OF_LIST",
                            "values": [
                                {"userEnteredValue": "Pending"},
                                {"userEnteredValue": "Verified"},
                                {"userEnteredValue": "Rejected"},
                            ],
                        },
                        "strict": True,
                        "showCustomUi": True,
                    },
                }
            }
        ]
    })


def get_payment_history(mobile):
    payment_sheet = get_payment_sheet()
    rows = payment_sheet.get_all_records()

    history = []

    for row in rows:
        if normalize_mobile(row.get("Mobile", "")) == normalize_mobile(mobile):
            history.append({
                "timestamp": row.get("Timestamp", ""),
                "name": row.get("Name", ""),
                "mobile": row.get("Mobile", ""),
                "amount": row.get("Amount", ""),
                "status": row.get("Status", ""),
                "note": row.get("Note", ""),
            })

    history.reverse()

    return history

# =====================================================
# LOGIN WITH PIN
# =====================================================

def verify_customer_login(mobile, pin):
    customer = get_customer_info(mobile)

    if not customer:
        return {
            "success": False,
            "message": "❌ Customer not found.",
        }

    saved_pin = str(customer.get("login_pin", "")).strip()
    entered_pin = str(pin or "").strip()

    if not saved_pin:
        return {
            "success": False,
            "message": "❌ Login PIN is not set for this customer. Please contact admin.",
        }

    if saved_pin != entered_pin:
        return {
            "success": False,
            "message": "❌ Incorrect PIN.",
        }

    return {
        "success": True,
        "message": "✅ Login successful.",
        "customer": customer,
    }
    
# =====================================================
# PAYMENT REQUESTS
# =====================================================

PAYMENT_SHEET_NAME = "Payment_Requests"

PAYMENT_HEADERS = [
    "Timestamp",
    "Name",
    "Mobile",
    "Amount",
    "Status",
    "Note",
]


def apply_payment_status_dropdown(payment_sheet):
    spreadsheet.batch_update({
        "requests": [
            {
                "setDataValidation": {
                    "range": {
                        "sheetId": payment_sheet.id,
                        "startRowIndex": 1,
                        "endRowIndex": 1000,
                        "startColumnIndex": 4,
                        "endColumnIndex": 5,
                    },
                    "rule": {
                        "condition": {
                            "type": "ONE_OF_LIST",
                            "values": [
                                {"userEnteredValue": "Pending"},
                                {"userEnteredValue": "Verified"},
                                {"userEnteredValue": "Rejected"},
                            ],
                        },
                        "strict": True,
                        "showCustomUi": True,
                    },
                }
            }
        ]
    })


def get_payment_sheet():
    try:
        payment_sheet = spreadsheet.worksheet(PAYMENT_SHEET_NAME)
    except gspread.WorksheetNotFound:
        payment_sheet = spreadsheet.add_worksheet(
            title=PAYMENT_SHEET_NAME,
            rows=1000,
            cols=len(PAYMENT_HEADERS),
        )
        payment_sheet.append_row(PAYMENT_HEADERS)

        payment_sheet.format("A1:F1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.85, "green": 1, "blue": 0.35},
        })

    headers = payment_sheet.row_values(1)

    if headers != PAYMENT_HEADERS:
        payment_sheet.update("A1:F1", [PAYMENT_HEADERS])

    apply_payment_status_dropdown(payment_sheet)

    return payment_sheet


def submit_payment_request(mobile, amount, note=""):
    customer = get_customer_info(mobile)

    if not customer:
        return {
            "success": False,
            "message": "❌ Customer not found.",
        }

    try:
        amount_value = float(str(amount).replace("₹", "").replace(",", "").strip())
    except Exception:
        return {
            "success": False,
            "message": "❌ Invalid payment amount.",
        }

    if amount_value <= 0:
        return {
            "success": False,
            "message": "❌ Payment amount must be greater than 0.",
        }

    payment_sheet = get_payment_sheet()
    rows = payment_sheet.get_all_records()

    for row in rows:
        row_mobile = normalize_mobile(row.get("Mobile", ""))
        row_status = str(row.get("Status", "")).strip().lower()

        try:
            row_amount = float(str(row.get("Amount", 0)).replace("₹", "").replace(",", "").strip())
        except Exception:
            row_amount = 0

        if (
            row_mobile == normalize_mobile(mobile)
            and row_status == "pending"
            and row_amount == amount_value
        ):
            return {
                "success": False,
                "message": "⚠️ You already have a pending payment request for this amount.",
            }

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    payment_sheet.append_row([
        timestamp,
        customer["name"],
        mobile,
        amount_value,
        "Pending",
        note or "Customer clicked I have paid",
    ])

    write_log(
        mobile,
        "PAYMENT_REQUEST",
        f"₹{amount_value} payment request submitted"
    )

    return {
        "success": True,
        "message": "✅ Payment request submitted. Admin will verify it soon.",
    }


def get_payment_history(mobile):
    payment_sheet = get_payment_sheet()
    rows = payment_sheet.get_all_records()

    history = []

    for row in rows:
        if normalize_mobile(row.get("Mobile", "")) == normalize_mobile(mobile):
            history.append({
                "timestamp": row.get("Timestamp", ""),
                "name": row.get("Name", ""),
                "mobile": row.get("Mobile", ""),
                "amount": row.get("Amount", ""),
                "status": row.get("Status", ""),
                "note": row.get("Note", ""),
            })

    history.reverse()

    return history

# =====================================================
# ACTION LOGS
# =====================================================

ACTION_LOG_SHEET_NAME = "Action_Logs"

ACTION_LOG_HEADERS = [
    "Timestamp",
    "Name",
    "Mobile",
    "Action",
    "Details",
]


def get_action_log_sheet():
    try:
        action_sheet = spreadsheet.worksheet(ACTION_LOG_SHEET_NAME)
    except gspread.WorksheetNotFound:
        action_sheet = spreadsheet.add_worksheet(
            title=ACTION_LOG_SHEET_NAME,
            rows=1000,
            cols=len(ACTION_LOG_HEADERS),
        )

        action_sheet.append_row(ACTION_LOG_HEADERS)

        action_sheet.format("A1:E1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.85, "green": 1, "blue": 0.35},
        })

    headers = action_sheet.row_values(1)

    if headers != ACTION_LOG_HEADERS:
        action_sheet.update("A1:E1", [ACTION_LOG_HEADERS])

    return action_sheet


def append_action_log(mobile, action, details):
    action_sheet = get_action_log_sheet()
    customer = get_customer_info(mobile)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    name = customer["name"] if customer else "Unknown"

    action_sheet.append_row([
        timestamp,
        name,
        mobile,
        action,
        details,
    ])


def get_action_history(mobile):
    action_sheet = get_action_log_sheet()
    rows = action_sheet.get_all_records()

    history = []

    for row in rows:
        if normalize_mobile(row.get("Mobile", "")) == normalize_mobile(mobile):
            history.append({
                "timestamp": row.get("Timestamp", ""),
                "name": row.get("Name", ""),
                "mobile": row.get("Mobile", ""),
                "action": row.get("Action", ""),
                "details": row.get("Details", ""),
            })

    history.reverse()

    return history
# =====================================================
# CHANGE CUSTOMER PIN
# =====================================================

def change_customer_pin(mobile, current_pin, new_pin):
    customer = get_customer_info(mobile)

    if not customer:
        return {
            "success": False,
            "message": "❌ Customer not found.",
        }

    current_pin = str(current_pin or "").strip()
    new_pin = str(new_pin or "").strip()
    saved_pin = str(customer.get("login_pin", "")).strip()

    if not saved_pin:
        return {
            "success": False,
            "message": "❌ PIN is not set for this customer. Please contact admin.",
        }

    if current_pin != saved_pin:
        return {
            "success": False,
            "message": "❌ Current PIN is incorrect.",
        }

    if len(new_pin) != 6 or not new_pin.isdigit():
        return {
            "success": False,
            "message": "❌ New PIN must be exactly 6 digits.",
        }

    if new_pin == saved_pin:
        return {
            "success": False,
            "message": "⚠️ New PIN cannot be same as current PIN.",
        }

    all_values = sheet.get_all_values()
    headers = all_values[0]

    pin_col = find_column(headers, ["login pin", "pin"])

    if pin_col is None:
        return {
            "success": False,
            "message": "❌ Login PIN column not found in Google Sheet.",
        }

    sheet.update_cell(customer["row"], pin_col + 1, new_pin)

    write_log(
        mobile,
        "CHANGE_PIN",
        "Customer changed login PIN"
    )

    return {
        "success": True,
        "message": "✅ PIN changed successfully.",
    }
# =====================================================
# ADMIN PANEL
# =====================================================

def verify_admin_pin(pin):
    saved_admin_pin = os.getenv("ADMIN_PIN", "").strip()
    entered_pin = str(pin or "").strip()

    if not saved_admin_pin:
        return False

    return entered_pin == saved_admin_pin


def safe_number(value):
    try:
        text = (
            str(value)
            .replace("₹", "")
            .replace(",", "")
            .replace("L", "")
            .replace("l", "")
            .strip()
        )

        if not text or text.lower() in ["ab", "nan", "#div/0!", "#value!"]:
            return 0.0

        return float(text)
    except Exception:
        return 0.0


def get_all_customers_for_admin():
    all_values = sheet.get_all_values()

    if not all_values:
        return []

    headers = all_values[0]

    name_col = find_column(headers, ["name"])
    mobile_col = find_column(headers, ["mobile", "phone"])
    status_col = find_column(headers, ["status"])
    liter_col = find_column(headers, ["liter", "litre"])
    flat_col = find_column(headers, ["flat"])
    balance_col = find_column(headers, ["balance"])

    customers = []

    for row_idx, row in enumerate(all_values[1:], start=2):
        if mobile_col is None or len(row) <= mobile_col:
            continue

        mobile = normalize_mobile(row[mobile_col])

        if not mobile:
            continue

        name = (
            row[name_col].strip()
            if name_col is not None and len(row) > name_col
            else "Customer"
        )

        status = (
            row[status_col].strip()
            if status_col is not None and len(row) > status_col
            else ""
        )

        liter = (
            row[liter_col].strip()
            if liter_col is not None and len(row) > liter_col
            else "0"
        )

        flat_no = (
            row[flat_col].strip()
            if flat_col is not None and len(row) > flat_col
            else ""
        )

        balance = (
            row[balance_col].strip()
            if balance_col is not None and len(row) > balance_col
            else "0"
        )

        customers.append({
            "row": row_idx,
            "name": name,
            "mobile": mobile,
            "status": status,
            "liter": format_quantity(liter),
            "flat_no": flat_no,
            "remaining_balance": balance,
        })

    return customers


def get_pending_payment_requests_for_admin():
    payment_sheet = get_payment_sheet()
    rows = payment_sheet.get_all_values()

    if len(rows) <= 1:
        return []

    headers = rows[0]

    timestamp_col = find_column(headers, ["timestamp"])
    name_col = find_column(headers, ["name"])
    mobile_col = find_column(headers, ["mobile"])
    amount_col = find_column(headers, ["amount"])
    status_col = find_column(headers, ["status"])
    note_col = find_column(headers, ["note"])

    pending = []

    for row_idx, row in enumerate(rows[1:], start=2):
        status = (
            row[status_col].strip()
            if status_col is not None and len(row) > status_col
            else ""
        )

        if status.lower() != "pending":
            continue

        amount = (
            row[amount_col].strip()
            if amount_col is not None and len(row) > amount_col
            else "0"
        )

        pending.append({
            "row": row_idx,
            "timestamp": row[timestamp_col].strip()
            if timestamp_col is not None and len(row) > timestamp_col
            else "",
            "name": row[name_col].strip()
            if name_col is not None and len(row) > name_col
            else "",
            "mobile": row[mobile_col].strip()
            if mobile_col is not None and len(row) > mobile_col
            else "",
            "amount": amount,
            "status": status,
            "note": row[note_col].strip()
            if note_col is not None and len(row) > note_col
            else "",
        })

    pending.reverse()
    return pending


def get_tomorrow_delivery_for_admin():
    tomorrow = date.today() + timedelta(days=1)
    date_columns = get_date_columns()
    tomorrow_col = date_columns.get(tomorrow)

    customers = get_all_customers_for_admin()
    all_values = sheet.get_all_values()

    deliveries = []
    total_milk = 0.0
    paused_count = 0

    if not tomorrow_col:
        return {
            "tomorrow_date": tomorrow.strftime("%d-%m-%Y"),
            "total_milk": "0",
            "paused_count": 0,
            "deliveries": [],
            "message": "Tomorrow date column not found in sheet.",
        }

    for customer in customers:
        status = str(customer.get("status", "")).strip().lower()

        if status in ["inactive"]:
            continue

        row_index = customer["row"]

        if len(all_values) < row_index:
            continue

        row = all_values[row_index - 1]

        value = row[tomorrow_col - 1].strip() if len(row) >= tomorrow_col else ""

        if not value:
            value = customer.get("liter", "0")

        if str(value).strip().lower() == "ab":
            paused_count += 1

            deliveries.append({
                "name": customer["name"],
                "flat_no": customer["flat_no"],
                "mobile": customer["mobile"],
                "quantity": "0",
                "status": "Paused",
            })

            continue

        quantity = safe_number(value)

        if quantity <= 0:
            continue

        total_milk += quantity

        deliveries.append({
            "name": customer["name"],
            "flat_no": customer["flat_no"],
            "mobile": customer["mobile"],
            "quantity": format_quantity(quantity),
            "status": "Delivery",
        })

    return {
        "tomorrow_date": tomorrow.strftime("%d-%m-%Y"),
        "total_milk": format_quantity(total_milk),
        "paused_count": paused_count,
        "deliveries": deliveries,
        "message": "OK",
    }


def get_admin_dashboard_data():
    customers = get_all_customers_for_admin()
    pending_payments = get_pending_payment_requests_for_admin()
    tomorrow_delivery = get_tomorrow_delivery_for_admin()

    active_count = 0
    inactive_count = 0
    paused_count = 0
    testing_count = 0
    total_balance = 0.0

    for customer in customers:
        status = str(customer.get("status", "")).strip().lower()

        if status == "active":
            active_count += 1
        elif status == "inactive":
            inactive_count += 1
        elif status == "paused":
            paused_count += 1
        elif status == "testing":
            testing_count += 1

        total_balance += safe_number(customer.get("remaining_balance", 0))

    pending_amount = sum(
        safe_number(payment.get("amount", 0))
        for payment in pending_payments
    )

    return {
        "total_customers": len(customers),
        "active_customers": active_count,
        "inactive_customers": inactive_count,
        "paused_customers": paused_count,
        "testing_customers": testing_count,
        "total_balance": format_quantity(total_balance),
        "pending_payment_count": len(pending_payments),
        "pending_payment_amount": format_quantity(pending_amount),
        "tomorrow_delivery": tomorrow_delivery,
        "pending_payments": pending_payments,
    }