from flask import Flask
from flask_restful import Api
from api.stateMachineAPI import StateMachineAPI

from flask.json import JSONEncoder
from bson import json_util

# define a custom encoder point to the json_util provided by pymongo (or its dependency bson)
class CustomJSONEncoder(JSONEncoder):
    def default(self, obj): return json_util.default(obj)

app = Flask(__name__)
app.json_encoder = CustomJSONEncoder
api = Api(app)

api.add_resource(StateMachineAPI, "/statemachine/<string:name>")

if __name__ == "__main__":
    app.run(debug = True)