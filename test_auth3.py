import urllib.request
import urllib.error

staff_token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LnN0YWZmQHZlbHZldGJyZXcudGVzdCIsImlkIjoyLCJyb2xlIjoiU1RBRkYiLCJpYXQiOjE3ODg2Mzg3OTAsImV4cCI6MTc4ODcyNTE5MH0.tLFZAIEcYO7r9ELTdwMiD64jldf5twURXRqURSLRc5g"
admin_token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LmFkbWluQHZlbHZldGJyZXcudGVzdCIsImlkIjoxLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODg2NDAxMzQsImV4cCI6MTc4ODcyNjUzNH0.fT_lTyhbDDFOlvxcrsjhxeXDWO_f3pRdmO5zHpImuDg"

url = 'https://api.velvetbrew.in/api/v1/customer/orders'

for role, token in [("STAFF", staff_token), ("ADMIN", admin_token)]:
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        print(f"{role} Success:", urllib.request.urlopen(req).read().decode()[:50])
    except urllib.error.HTTPError as e:
        print(f"{role} HTTPError:", e.code, e.read().decode())
