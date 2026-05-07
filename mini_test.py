print("FILE STARTED")

from flask import Flask

print("FLASK IMPORTED")

import gspread
print("GSPREAD IMPORTED")

from google.oauth2.service_account import Credentials
print("GOOGLE AUTH IMPORTED")

app = Flask(__name__)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

print("LOADING CREDS")

creds = Credentials.from_service_account_file(
    "service_account.json",
    scopes=SCOPES
)

print("CREDS LOADED")

client = gspread.authorize(creds)

print("GSPREAD AUTH DONE")

sheet = client.open_by_key(
    "1JgDxQ8p-oM9d7lwvgMNsFIV_Mof7ZzWtckL8PW4zOck"
).sheet1

print("SHEET CONNECTED")

@app.route("/")
def home():
    return "WORKING"

print("STARTING SERVER")

app.run(port=5000)