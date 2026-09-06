import urllib.request
import urllib.error

req = urllib.request.Request(
    'https://api.velvetbrew.in/api/v1/customer/orders',
    headers={'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LnN0YWZmQHZlbHZldGJyZXcudGVzdCIsImlkIjoyLCJyb2xlIjoiU1RBRkYiLCJpYXQiOjE3ODg2Mzg3OTAsImV4cCI6MTc4ODcyNTE5MH0.tLFZAIEcYO7r9ELTdwMiD64jldf5twURXRqURSLRc5g'}
)
try:
    print("Success:", urllib.request.urlopen(req).read().decode()[:200])
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode())
