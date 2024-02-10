import snd_sdk

api = snd_sdk.SndAPI("http://127.0.0.1:7123")
response = api.get_templates()
print(response[0]['name'])