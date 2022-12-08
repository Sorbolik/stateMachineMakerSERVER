import requests, json
from models.stateMachine import StateMachine
from models.action import Action

BASE = "http://127.0.0.1:5000"

fromAtoB = Action("fromAtoB", "a", "b", 1)
fromAtoC = Action("fromAtoC", "a", "c", 2)
transitions = list[Action]()

transitions.append(fromAtoB)
transitions.append(fromAtoC)

# transitions.append({"actionName":"fromAtoB", "fromState":"a", "toState":"b", "cost":1})
# transitions.append({"actionName":"fromAtoC", "fromState":"a", "toState":"c", "cost":2})
# print(transitions)

firstStateMachine = StateMachine("first", "a", ["b", "c"], transitions, False)

jsonbody = {
    "name":firstStateMachine.get("name"),
    "initialState": firstStateMachine.get("initialState"),
    "endStates": firstStateMachine.get("endStates"),
    "actions": firstStateMachine.get("actions")
    }


responsePost = requests.post(BASE + "/statemachine/" + firstStateMachine.get("name"), None, jsonbody)
print("\n",responsePost.json())

responseGet = requests.get(BASE + "/statemachine/" + firstStateMachine.get("name"))
print("\n",responseGet.json())

# responseDelete = requests.delete(BASE + "/statemachine/" + firstStateMachine["name"])
# print("\n",responseDelete)