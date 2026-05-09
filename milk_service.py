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

sheet = client.open_by_key(
    SPREADSHEET_ID
).sheet1
print("11")

print("✅ Google Sheet connected successfully")
# =====================================================
# LOGGING
# =====================================================

def write_log(mobile, action, result):

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    log_line = (
        f"{timestamp} | "
        f"{mobile} | "
        f"{action} | "
        f"{result}\n"
    )

    with open("logs.txt", "a", encoding="utf-8") as log_file:

        log_file.write(log_line)

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


def parse_header_date(header):

    try:

        current_year = datetime.now().year

        return datetime.strptime(
            f"{header.strip()}-{current_year}",
            "%d-%b-%Y"
        ).date()

    except:

        return None

# =====================================================
# GET DATE COLUMNS
# =====================================================


def get_date_columns():

    headers = sheet.row_values(1)

    date_columns = {}

    for idx, header in enumerate(headers, start=1):

        parsed_date = parse_header_date(header)

        if parsed_date:
            date_columns[parsed_date] = idx

    return date_columns

# =====================================================
# SHOW DELIVERY CALENDAR
# =====================================================


def show_delivery_calendar(mobile):

    row = find_customer_row(mobile)

    if not row:
        return "❌ Customer not found."

    headers = sheet.row_values(1)

    values = sheet.row_values(row)

    output = []

    output.append(
        f"📅 Delivery Calendar ({date.today().strftime('%B %Y')})"
    )

    output.append("")

    date_row = []
    value_row = []

    for idx, header in enumerate(headers):

        parsed = parse_header_date(header)

        if parsed:

            date_row.append(
                parsed.strftime("%d")
            )

            if idx < len(values):

                value = values[idx]

                if value == "":
                    value = "-"

                value_row.append(str(value))

    output.append(" ".join(date_row))
    output.append(" ".join(value_row))

    return "\n".join(output)

# =====================================================
# HANDLE PAUSE
# =====================================================

def handle_pause(
    mobile,
    start_date_str,
    pause_days
):

    customer = get_customer_info(mobile)

    if not customer:
        return "❌ Customer not found."

    row = customer["row"]

    try:

        start_date = datetime.strptime(
            start_date_str,
            "%d-%m-%Y"
        ).date()

    except:

        return "❌ Invalid date format. Use DD-MM-YYYY"

    if start_date < date.today():
        return "❌ Cannot pause past dates."

    try:

        pause_days = int(pause_days)

    except:

        return "❌ Invalid number of days."

    if pause_days <= 0:
        return "❌ Pause days must be greater than 0."

    if pause_days > 30:
        return "❌ Maximum pause limit is 30 days."

    date_columns = get_date_columns()

    updated = False

    for i in range(pause_days):

        current_date = start_date + timedelta(days=i)

        if current_date in date_columns:

            col = date_columns[current_date]

            cell = gspread.utils.rowcol_to_a1(
                row,
                col
            )

            sheet.update_acell(
                cell,
                "Ab"
            )

            sheet.format(cell, {
                "backgroundColor": {
                    "red": 1,
                    "green": 0.8,
                    "blue": 0.8
                },
                "textFormat": {
                    "foregroundColor": {
                        "red": 0.6,
                        "green": 0,
                        "blue": 0
                    },
                    "bold": True
                }
            })

            updated = True

    if updated:

        write_log(
            mobile,
            "PAUSE",
            f"{pause_days} days from {start_date}"
        )

        return "✅ Pause successfully applied."

    return "❌ No matching dates found."

# =====================================================
# HANDLE RESUME
# =====================================================

def handle_resume(mobile):

    customer = get_customer_info(mobile)

    if not customer:
        return "❌ Customer not found."

    row = customer["row"]

    default_quantity = customer["liter"]

    values = sheet.row_values(row)

    updated = False

    for idx, value in enumerate(values, start=1):

        if str(value).strip().lower() == "ab":

            cell = gspread.utils.rowcol_to_a1(
                row,
                idx
            )

            sheet.update_acell(
                cell,
                str(default_quantity)
            )

            sheet.format(cell, {
                "backgroundColor": {
                    "red": 1,
                    "green": 1,
                    "blue": 1
                },
                "textFormat": {
                    "foregroundColor": {
                        "red": 0,
                        "green": 0,
                        "blue": 0
                    },
                    "bold": False
                }
            })

            updated = True

    if updated:

        write_log(
            mobile,
            "RESUME",
            "SUCCESS"
        )

        return "✅ Milk resumed successfully."

    return "✅ No paused entries found."
# =====================================================
# GET CUSTOMER CALENDAR DATA
# =====================================================

def get_customer_calendar(mobile):

    customer = get_customer_info(mobile)

    if not customer:
        return {
            "paused_days": []
        }

    row = customer["row"]

    headers = sheet.row_values(1)
    values = sheet.row_values(row)

    paused_days = []

    for idx, header in enumerate(headers):

        parsed = parse_header_date(header)

        if not parsed:
            continue

        if idx >= len(values):
            continue

        value = str(values[idx]).strip()

        if value.lower() == "ab":
            paused_days.append(parsed.day)

    return {
        "paused_days": paused_days
    }
    
    
# =====================================================
# HANDLE MODIFY QUANTITY
# =====================================================


def handle_modify_quantity(
    mobile,
    qty
):

    customer = get_customer_info(mobile)

    if not customer:
        return "❌ Customer not found."

    row = customer["row"]

    try:

        qty = float(qty)

    except:

        return "❌ Invalid quantity."

    if qty <= 0:
        return "❌ Quantity must be greater than 0."

    date_columns = get_date_columns()

    updated = False

    today = date.today()

    for current_date, col in date_columns.items():

        if current_date < today:
            continue

        cell = gspread.utils.rowcol_to_a1(
            row,
            col
        )

        current_value = sheet.acell(cell).value

        if current_value == "Ab":
            continue

        if current_value is None:
            continue

        sheet.update_acell(
            cell,
            str(qty)
        )

        updated = True

    if updated:
    
        write_log(
            mobile,
            "CHANGE_QTY",
            f"{qty}L"
        )

        return f"✅ Quantity updated to {qty}L"

    return "❌ Quantity update failed."