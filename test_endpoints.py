import urllib.request
import urllib.error
import json

urls = [
    'https://api.velvetbrew.in/api/v1/orders',
    'https://api.velvetbrew.in/api/v1/admin/orders'
]

for url in urls:
    req = urllib.request.Request(
        url,
        headers={'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LnN0YWZmQHZlbHZldGJyZXcudGVzdCIsImlkIjoyLCJyb2xlIjoiU1RBRkYiLCJpYXQiOjE3ODg2Mzg3OTAsImV4cCI6MTc4ODcyNTE5MH0.tLFZAIEcYO7r9ELTdwMiD64jldf5twURXRqURSLRc5g'}
    )
    try:
        print(f"URL: {url} -> Success:", urllib.request.urlopen(req).read().decode()[:100])
    except urllib.error.HTTPError as e:
        print(f"URL: {url} -> HTTPError:", e.code)
