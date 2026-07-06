print("MILK SERVICE START")

import json
print("1")

import os
print("2")

import hashlib

import secrets

import hmac

import gspread
print("3")

from dotenv import load_dotenv
print("4")

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

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

google_creds_json = os.getenv("GOOGLE_CREDS_JSON")

print("GOOGLE_CREDS_JSON:", bool(google_creds_json))

if google_creds_json:
    creds_dict = json.loads(google_creds_json)

    creds = Credentials.from_service_account_info(
        creds_dict,
        scopes=SCOPES,
    )
else:
    creds = Credentials.from_service_account_file(
        "service_account.json",
        scopes=SCOPES,
    )

client = gspread.authorize(creds)

SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")

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

def find_exact_column(headers, exact_names):
    exact_names = [str(name).strip().lower() for name in exact_names]

    for idx, header in enumerate(headers):
        header_text = str(header).strip().lower()

        if header_text in exact_names:
            return idx

    return None

# =====================================================
# SECURE PIN HASHING
# =====================================================

PIN_HASH_ITERATIONS = 200_000


def is_valid_pin(pin):
    pin = str(pin or "").strip()
    return len(pin) == 6 and pin.isdigit()


def hash_pin(pin, salt=None):
    pin = str(pin or "").strip()

    if salt is None:
        salt = secrets.token_hex(16)

    pin_hash = hashlib.pbkdf2_hmac(
        "sha256",
        pin.encode("utf-8"),
        salt.encode("utf-8"),
        PIN_HASH_ITERATIONS,
    ).hex()

    return salt, pin_hash


def verify_pin_hash(pin, salt, stored_hash):
    pin = str(pin or "").strip()
    salt = str(salt or "").strip()
    stored_hash = str(stored_hash or "").strip()

    if not pin or not salt or not stored_hash:
        return False

    _, calculated_hash = hash_pin(pin, salt)

    return hmac.compare_digest(calculated_hash, stored_hash)


def ensure_pin_security_columns():
    headers = sheet.row_values(1)

    login_pin_col = find_exact_column(headers, ["login pin"])

    current_col_count = sheet.col_count

    def ensure_column(column_name):
        nonlocal headers, current_col_count

        existing_col = find_exact_column(headers, [column_name])
        if existing_col is not None:
            return existing_col

        new_col_number = len(headers) + 1

        if new_col_number > current_col_count:
            cols_to_add = new_col_number - current_col_count
            sheet.add_cols(cols_to_add)
            current_col_count = new_col_number

        sheet.update_cell(1, new_col_number, column_name)
        headers.append(column_name)

        return new_col_number - 1

    pin_salt_col = ensure_column("PIN Salt")
    pin_hash_col = ensure_column("PIN Hash")

    return {
        "login_pin_col": login_pin_col,
        "pin_salt_col": pin_salt_col,
        "pin_hash_col": pin_hash_col,
    }


def save_customer_pin_hash(customer, new_pin):
    cols = ensure_pin_security_columns()

    salt, pin_hash = hash_pin(new_pin)

    row = customer["row"]

    sheet.update_cell(row, cols["pin_salt_col"] + 1, salt)
    sheet.update_cell(row, cols["pin_hash_col"] + 1, pin_hash)

    if cols["login_pin_col"] is not None:
        sheet.update_cell(row, cols["login_pin_col"] + 1, "SET")

    return {
        "salt": salt,
        "pin_hash": pin_hash,
    }


def customer_pin_matches(customer, entered_pin):
    entered_pin = str(entered_pin or "").strip()

    pin_salt = str(customer.get("pin_salt", "")).strip()
    pin_hash = str(customer.get("pin_hash", "")).strip()
    old_login_pin = str(customer.get("login_pin", "")).strip()

    if pin_salt and pin_hash:
        return verify_pin_hash(entered_pin, pin_salt, pin_hash)

    if old_login_pin and old_login_pin.upper() != "SET":
        return hmac.compare_digest(old_login_pin, entered_pin)

    return False


def customer_has_any_pin(customer):
    pin_salt = str(customer.get("pin_salt", "")).strip()
    pin_hash = str(customer.get("pin_hash", "")).strip()
    old_login_pin = str(customer.get("login_pin", "")).strip()

    return bool((pin_salt and pin_hash) or (old_login_pin and old_login_pin.upper() != "SET"))

# =====================================================
# GET CUSTOMER INFO
# =====================================================

def get_customer_info(mobile):
    mobile = normalize_mobile(mobile)

    all_values = sheet.get_all_values()

    if not all_values:
        return None

    headers = all_values[0]
    print(headers)
    name_col = find_column(headers, ["name"])
    mobile_col = find_column(headers, ["mobile", "phone"])
    status_col = find_column(headers, ["status"])
    liter_col = find_column(headers, ["liter", "litre"])
    flat_col = find_column(headers, ["flat"])
    balance_col = find_column(headers, ["balance"])

    pin_col = find_exact_column(headers, ["login pin"])
    print("PIN COLUMN =", pin_col)
    pin_salt_col = find_exact_column(headers, ["pin salt"])
    pin_hash_col = find_exact_column(headers, ["pin hash"])
    print("PIN COLUMN:", pin_col)
    print("PIN SALT COLUMN:", pin_salt_col)
    print("PIN HASH COLUMN:", pin_hash_col)

    if mobile_col is None:
        return None

    for row_idx, row in enumerate(all_values[1:], start=2):
        if len(row) <= mobile_col:
            continue

        row_mobile = normalize_mobile(row[mobile_col])

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
                ),

                "pin_salt": (
                    row[pin_salt_col].strip()
                    if pin_salt_col is not None and len(row) > pin_salt_col
                    else ""
                ),

                "pin_hash": (
                    row[pin_hash_col].strip()
                    if pin_hash_col is not None and len(row) > pin_hash_col
                    else ""
                ),
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
    ensure_pin_security_columns()

    mobile = normalize_mobile(mobile)
    entered_pin = str(pin or "").strip()

    if not is_valid_pin(entered_pin):
        return {
            "success": False,
            "message": "❌ PIN must be exactly 6 digits.",
        }

    customer = get_customer_info(mobile)
    print("=================================")
    print("MOBILE:", mobile)
    print("CUSTOMER:", customer)
    print("ENTERED PIN:", entered_pin)
    print("=================================")
    print("=" * 50)
    print(customer)
    print("=" * 50)
    print("Customer:", customer)
    print("Entered PIN:", pin)

    if not customer:
        return {
            "success": False,
            "message": "❌ Customer not found.",
        }

    if not customer_has_any_pin(customer):
        return {
            "success": False,
            "message": "❌ Login PIN is not set for this customer. Please contact admin.",
        }
    print("Stored Login PIN:", customer.get("login_pin"))
    print("Stored Salt:", customer.get("pin_salt"))
    print("Stored Hash:", customer.get("pin_hash"))
    print("PIN MATCH:", customer_pin_matches(customer, entered_pin))
    if not customer_pin_matches(customer, entered_pin):
        return {
            "success": False,
            "message": "❌ Incorrect PIN.",
        }

    # Auto-migrate old plain PIN to secure hash after successful login.
    if not customer.get("pin_salt") or not customer.get("pin_hash"):
        save_customer_pin_hash(customer, entered_pin)

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
    ensure_pin_security_columns()

    mobile = normalize_mobile(mobile)
    customer = get_customer_info(mobile)

    if not customer:
        return {
            "success": False,
            "message": "❌ Customer not found.",
        }

    current_pin = str(current_pin or "").strip()
    new_pin = str(new_pin or "").strip()

    if not customer_has_any_pin(customer):
        return {
            "success": False,
            "message": "❌ PIN is not set for this customer. Please contact admin.",
        }

    if not is_valid_pin(current_pin):
        return {
            "success": False,
            "message": "❌ Current PIN must be exactly 6 digits.",
        }

    if not customer_pin_matches(customer, current_pin):
        return {
            "success": False,
            "message": "❌ Current PIN is incorrect.",
        }

    if not is_valid_pin(new_pin):
        return {
            "success": False,
            "message": "❌ New PIN must be exactly 6 digits.",
        }

    if current_pin == new_pin:
        return {
            "success": False,
            "message": "⚠️ New PIN cannot be same as current PIN.",
        }

    save_customer_pin_hash(customer, new_pin)

    write_log(
        mobile,
        "CHANGE_PIN",
        "Customer changed login PIN securely"
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
        "customers": customers,
    }
    
# =====================================================
# ADMIN PAYMENT VERIFICATION
# =====================================================

def update_payment_request_status(row_number, status):
    allowed_statuses = ["Pending", "Verified", "Rejected"]

    if status not in allowed_statuses:
        return {
            "success": False,
            "message": "❌ Invalid payment status.",
        }

    try:
        row_number = int(row_number)
    except Exception:
        return {
            "success": False,
            "message": "❌ Invalid payment row.",
        }

    if row_number < 2:
        return {
            "success": False,
            "message": "❌ Invalid payment row.",
        }

    payment_sheet = get_payment_sheet()
    headers = payment_sheet.row_values(1)
    row = payment_sheet.row_values(row_number)

    status_col = find_column(headers, ["status"])
    mobile_col = find_column(headers, ["mobile"])
    amount_col = find_column(headers, ["amount"])

    if status_col is None:
        return {
            "success": False,
            "message": "❌ Status column not found.",
        }

    mobile = (
        row[mobile_col].strip()
        if mobile_col is not None and len(row) > mobile_col
        else ""
    )

    amount = (
        row[amount_col].strip()
        if amount_col is not None and len(row) > amount_col
        else ""
    )

    payment_sheet.update_cell(row_number, status_col + 1, status)

    if mobile:
        write_log(
            normalize_mobile(mobile),
            "PAYMENT_STATUS",
            f"Payment request ₹{amount} marked as {status}"
        )

    return {
        "success": True,
        "message": f"✅ Payment marked as {status}.",
    }
    
# =====================================================
# SECURE PAYMENT INFO
# =====================================================

def get_secure_payment_info(mobile, amount):
    from urllib.parse import quote

    customer = get_customer_info(mobile)

    if not customer:
        return {
            "success": False,
            "message": "❌ Customer not found.",
        }

    upi_id = os.getenv("PAYMENT_UPI_ID", "").strip()
    payee_name = os.getenv("PAYMENT_PAYEE_NAME", "Milk Connect").strip()

    if not upi_id:
        return {
            "success": False,
            "message": "❌ Payment UPI ID is not configured.",
        }

    try:
        amount_value = float(str(amount).replace("₹", "").replace(",", "").strip())
    except Exception:
        amount_value = 0

    if amount_value <= 0:
        return {
            "success": False,
            "message": "❌ Invalid payment amount.",
        }

    note = f"Milk bill payment by {customer.get('name', 'Customer')}"

    upi_link = (
        f"upi://pay?"
        f"pa={quote(upi_id)}"
        f"&pn={quote(payee_name)}"
        f"&am={amount_value}"
        f"&cu=INR"
        f"&tn={quote(note)}"
    )

    return {
        "success": True,
        "upi_id": upi_id,
        "payee_name": payee_name,
        "amount": format_quantity(amount_value),
        "upi_link": upi_link,
        "verify_message": f"Before paying, confirm receiver name: {payee_name}",
    }
# =====================================================
# CUSTOMER SESSION TOKENS
# =====================================================

def get_session_serializer():
    secret_key = os.getenv("APP_SECRET_KEY", "").strip()

    if not secret_key:
        secret_key = "dev-secret-change-before-launch"

    return URLSafeTimedSerializer(
        secret_key,
        salt="milk-connect-customer-session"
    )


def create_customer_token(mobile):
    serializer = get_session_serializer()

    return serializer.dumps({
        "type": "customer",
        "mobile": normalize_mobile(mobile),
    })


def verify_customer_token(token, mobile=None):
    if not token:
        return {
            "success": False,
            "message": "❌ Login session missing. Please login again.",
        }

    max_age = int(os.getenv("SESSION_TOKEN_MAX_AGE_SECONDS", "2592000"))
    serializer = get_session_serializer()

    try:
        data = serializer.loads(token, max_age=max_age)
    except SignatureExpired:
        return {
            "success": False,
            "message": "❌ Login session expired. Please login again.",
        }
    except BadSignature:
        return {
            "success": False,
            "message": "❌ Invalid login session. Please login again.",
        }
    except Exception:
        return {
            "success": False,
            "message": "❌ Session verification failed. Please login again.",
        }

    if data.get("type") != "customer":
        return {
            "success": False,
            "message": "❌ Invalid customer session.",
        }

    token_mobile = normalize_mobile(data.get("mobile", ""))

    if mobile and token_mobile != normalize_mobile(mobile):
        return {
            "success": False,
            "message": "❌ Session does not match this customer.",
        }

    return {
        "success": True,
        "mobile": token_mobile,
    }
    
# =====================================================
# ADMIN SESSION TOKENS
# =====================================================

def create_admin_token():
    serializer = get_session_serializer()

    return serializer.dumps({
        "type": "admin",
    })


def verify_admin_token(token):
    if not token:
        return {
            "success": False,
            "message": "❌ Admin session missing. Please login again.",
        }

    max_age = int(os.getenv("ADMIN_TOKEN_MAX_AGE_SECONDS", "86400"))
    serializer = get_session_serializer()

    try:
        data = serializer.loads(token, max_age=max_age)
    except SignatureExpired:
        return {
            "success": False,
            "message": "❌ Admin session expired. Please login again.",
        }
    except BadSignature:
        return {
            "success": False,
            "message": "❌ Invalid admin session. Please login again.",
        }
    except Exception:
        return {
            "success": False,
            "message": "❌ Admin session verification failed.",
        }

    if data.get("type") != "admin":
        return {
            "success": False,
            "message": "❌ Invalid admin session.",
        }

    return {
        "success": True,
    }
    
# =====================================================
# ADMIN AUDIT LOGS
# =====================================================

ADMIN_AUDIT_SHEET_NAME = "Admin_Audit_Logs"

ADMIN_AUDIT_HEADERS = [
    "Timestamp",
    "Action",
    "Details",
    "IP Address",
    "Status",
]


def get_admin_audit_sheet():
    try:
        audit_sheet = spreadsheet.worksheet(ADMIN_AUDIT_SHEET_NAME)
    except gspread.WorksheetNotFound:
        audit_sheet = spreadsheet.add_worksheet(
            title=ADMIN_AUDIT_SHEET_NAME,
            rows=1000,
            cols=len(ADMIN_AUDIT_HEADERS),
        )

        audit_sheet.append_row(ADMIN_AUDIT_HEADERS)

        audit_sheet.format("A1:E1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.85, "green": 1, "blue": 0.35},
        })

    headers = audit_sheet.row_values(1)

    if headers != ADMIN_AUDIT_HEADERS:
        audit_sheet.update("A1:E1", [ADMIN_AUDIT_HEADERS])

    return audit_sheet


def append_admin_audit_log(action, details="", ip_address="", status="Success"):
    try:
        audit_sheet = get_admin_audit_sheet()

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        audit_sheet.append_row([
            timestamp,
            action,
            details,
            ip_address,
            status,
        ])

        return True
    except Exception as e:
        print("Admin audit log failed:", e)
        return False
    
    
    
    # =====================================================
# BACKUP / RECOVERY
# =====================================================

def create_main_sheet_backup():
    try:
        source_sheet = sheet
        source_title = source_sheet.title

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        backup_title = f"Backup_{source_title}_{timestamp}"

        # Google Sheet tab names should not be too long
        if len(backup_title) > 90:
            backup_title = backup_title[:90]

        values = source_sheet.get_all_values()

        if not values:
            return {
                "success": False,
                "message": "❌ No data found to backup.",
            }

        row_count = max(len(values) + 10, 100)
        col_count = max(max(len(row) for row in values) + 5, 20)

        backup_sheet = spreadsheet.add_worksheet(
            title=backup_title,
            rows=row_count,
            cols=col_count,
        )

        backup_sheet.update("A1", values)

        backup_sheet.format("A1:Z1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.85, "green": 1, "blue": 0.35},
        })

        append_admin_audit_log(
            action="MAIN_SHEET_BACKUP_CREATED",
            details=f"Backup created: {backup_title}",
            ip_address="server",
            status="Success",
        )

        return {
            "success": True,
            "message": f"✅ Backup created: {backup_title}",
            "backup_name": backup_title,
        }

    except Exception as e:
        print("Backup failed:", e)

        append_admin_audit_log(
            action="MAIN_SHEET_BACKUP_FAILED",
            details=str(e),
            ip_address="server",
            status="Failed",
        )

        return {
            "success": False,
            "message": "❌ Backup failed. Please try again.",
        }
        
        
        
        # =====================================================
# AUTOMATIC DAILY BACKUP
# =====================================================

def create_daily_backup_if_needed():
    try:
        source_sheet = sheet
        source_title = source_sheet.title

        today_text = datetime.now().strftime("%Y-%m-%d")
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")

        backup_prefix = f"AutoBackup_{source_title}_{today_text}"

        existing_sheet_titles = [
            worksheet.title
            for worksheet in spreadsheet.worksheets()
        ]

        already_exists = any(
            title.startswith(backup_prefix)
            for title in existing_sheet_titles
        )

        if already_exists:
            return {
                "success": True,
                "created": False,
                "message": "✅ Daily backup already exists.",
            }

        values = source_sheet.get_all_values()

        if not values:
            return {
                "success": False,
                "created": False,
                "message": "❌ No data found to backup.",
            }

        backup_title = f"AutoBackup_{source_title}_{timestamp}"

        if len(backup_title) > 90:
            backup_title = backup_title[:90]

        row_count = max(len(values) + 10, 100)
        col_count = max(max(len(row) for row in values) + 5, 20)

        backup_sheet = spreadsheet.add_worksheet(
            title=backup_title,
            rows=row_count,
            cols=col_count,
        )

        backup_sheet.update("A1", values)

        backup_sheet.format("A1:Z1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.85, "green": 1, "blue": 0.35},
        })

        append_admin_audit_log(
            action="AUTO_DAILY_BACKUP_CREATED",
            details=f"Automatic daily backup created: {backup_title}",
            ip_address="server",
            status="Success",
        )

        return {
            "success": True,
            "created": True,
            "message": f"✅ Automatic daily backup created: {backup_title}",
            "backup_name": backup_title,
        }

    except Exception as e:
        print("Automatic daily backup failed:", e)

        append_admin_audit_log(
            action="AUTO_DAILY_BACKUP_FAILED",
            details=str(e),
            ip_address="server",
            status="Failed",
        )

        return {
            "success": False,
            "created": False,
            "message": "❌ Automatic daily backup failed.",
        }
        
