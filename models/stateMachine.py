class StateMachine(dict):
    def __init__(self ,name = None, initialState: str = None, endStates: list = [], actions: list = [], isUnitary: bool = False):
        dict.__init__(self ,name = name, initialState= initialState, endStates=endStates, actions= actions, isUnitary= isUnitary)