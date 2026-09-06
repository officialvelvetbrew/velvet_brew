import urllib.request, json
data = {'orderStatus':'ACCEPTED'}
req = urllib.request.Request('https://api.velvetbrew.in/api/v1/customer/orders?orderNumber=VB-20260902-11B9DC', data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'}, method='PATCH')
try:
  urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
  print(e.read().decode())
