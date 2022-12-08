from flask_restful import Resource, abort
from flask import jsonify, request
from database.db import MongoManager
from bson import json_util
import json


# def abort_if_statemachine_not_present(name):
#     if name not in actual_state_machines:
#         abort(404, message ="the state machine with name: " + name + " not exists") 

# def abort_if_statemachine_name_exists(name):
#     if name in actual_state_machines:
#         abort(409, message ="the state machine with name: " + name + "already exists") 

class StateMachineAPI(Resource):
    def get(self, name):
        # abort_if_statemachine_not_present(name)
        print("GETTING: ", name)
        actualName = request.args.get("name")
        db = MongoManager().client
        collection_name = db["state_machine"].find_one({name: actualName})
        print(collection_name)
        return jsonify(collection_name)
    
    def post(self, name):
        # abort_if_statemachine_name_exists(name)
        args = request.get_json()
        print("CREATING NEW: ",name, args)
        db = MongoManager().client
        result = db["state_machine"].insert_one(args)

        return json_util.dumps(result.inserted_id)
    
    def put(self, name):
        # abort_if_statemachine_not_present(name)
        # args = state_machine_post_args.parse_args()
        print("UPDATING: ", name)
        # actual_state_machines[name] = args
        return "", 204

    def delete(self, name):
        # abort_if_statemachine_not_present(name)
        print("DELETING: ", name)
        actualName = request.args.get("name")
        db = MongoManager().client
        db["state_machine"].delete_one({name: actualName})
        # actual_state_machines.pop(name)
        return "", 204