import urllib.request, json
data = {
    'customer': {'fullName':'Test','mobile':'9999999999','email':''},
    'items': [{'menuId':54,'menuName':'Passion Fruit Mojito','quantity':1,'price':129,'totalPrice':129,'total_price':129}],
    'paymentMethod':'COD',
    'paymentMode':'COD',
    'payment_method':'COD',
    'payment_mode':'COD',
    'specialInstructions':'',
    'subtotal':129,
    'tax':0,
    'discount':20,
    'totalAmount':109,
    'total':109,
    'orderStatus':'PENDING',
    'paymentStatus':'PENDING'
}
req = urllib.request.Request('https://api.velvetbrew.in/api/v1/customer/orders', data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
print(urllib.request.urlopen(req).read().decode())
