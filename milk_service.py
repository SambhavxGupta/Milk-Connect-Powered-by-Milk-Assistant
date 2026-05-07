import json
import os
import gspread

from dotenv import load_dotenv
from datetime import datetime, timedelta, date
from google.oauth2.service_account import Credentials

load_dotenv()

# =====================================================
# GOOGLE SHEET SETUP
# =====================================================

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]

google_creds_json = os.getenv(
    "GOOGLE_CREDS_JSON"
)

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

SPREADSHEET_ID = os.getenv(
    "SPREADSHEET_ID"
)

if not SPREADSHEET_ID:
    raise Exception(
        "SPREADSHEET_ID missing in .env file"
    )

sheet = client.open_by_key(
    SPREADSHEET_ID
).sheet1

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
                "status": row[status_col].strip() if status_col is not None else "",
                "liter": row[liter_col].strip() if liter_col is not None else "1"
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

        if value == "Ab":

            cell = gspread.utils.rowcol_to_a1(
                row,
                idx
            )

            sheet.update_acell(
                cell,
                str(default_quantity)
            )

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