from pymongo import MongoClient

class MongoManager:
    class __MongoManager:
        def __init__(self):
            # Initialise mongo client
               # Provide the mongodb atlas url to connect python to mongodb using pymongo
            CONNECTION_STRING = "mongodb+srv://Sborbolik:Gambadilegno1@sorbolikkone.6ft9sf2.mongodb.net/?retryWrites=false&w=majority&authSource=admin"
            # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
            self.client = MongoClient(CONNECTION_STRING)['search_algorithms']
    __instance = None

    def __init__(self):
        if not MongoManager.__instance:
            MongoManager.__instance = MongoManager.__MongoManager()

    def __getattr__(self, item):
        return getattr(self.__instance, item)
