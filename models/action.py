class Action(dict):
    def __init__(self ,actionName:str = None, fromState:str = None, toState:str = None, cost:int = 1):
        # self.actionName = actionName
        # self.fromState = fromState
        # self.toState = toState
        # self.cost = cost
        dict.__init__(self, actionName=actionName, fromState=fromState, toState= toState, cost=cost)