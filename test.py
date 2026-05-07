from flask import Flask

print("STARTED")

app = Flask(__name__)

@app.route("/")
def home():
    return "WORKING"

app.run(port=5000)