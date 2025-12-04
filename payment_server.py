import time
import random
import string
import hashlib
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, request

app = Flask(__name__)

# ==========================================
# 请在此处填写您的配置信息
# ==========================================
APP_ID = 'wxeb879461c0d86911'          # 小程序ID
MCH_ID = '1734138680'          # 商户号
API_KEY = '004c404a36b2e36d293a513cbf87abd3'        # 商户API密钥 (32位)
APP_SECRET = 'eaafcbc114f0f40acd4554062bba657c'  # 小程序密钥
NOTIFY_URL = 'https://your.domain.com/notify' # 支付回调地址
# ==========================================

def generate_nonce_str(length=32):
    """生成随机字符串"""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def calculate_sign(params, api_key):
    """生成签名 (MD5)"""
    # 1. 字典序排序
    sorted_keys = sorted(params.keys())
    # 2. 拼接字符串
    string_a = '&'.join([f"{k}={params[k]}" for k in sorted_keys if params[k] is not None and params[k] != ''])
    # 3. 拼接API密钥
    string_sign_temp = f"{string_a}&key={api_key}"
    # 4. MD5加密并转大写
    return hashlib.md5(string_sign_temp.encode('utf-8')).hexdigest().upper()

def to_xml(params):
    """字典转XML"""
    xml = ["<xml>"]
    for k, v in params.items():
        if v is not None:
            xml.append(f"<{k}>{v}</{k}>")
    xml.append("</xml>")
    return "".join(xml)

def parse_xml(xml_str):
    """XML转字典"""
    root = ET.fromstring(xml_str)
    return {child.tag: child.text for child in root}

@app.route('/get_pay_params', methods=['POST'])
def get_pay_params():
    """
    获取支付参数接口
    前端请求示例:
    POST /get_pay_params
    {
        "code": "USER_LOGIN_CODE", // 优先使用 code
        "openid": "USER_OPENID",   // 也可以直接传 openid
        "total_fee": 1
    }
    """
    data = request.json or {}
    code = data.get('code')
    openid = data.get('openid')
    total_fee = data.get('total_fee', 1)

    # 如果有 code，先换取 openid
    if code:
        try:
            url = f"https://api.weixin.qq.com/sns/jscode2session?appid={APP_ID}&secret={APP_SECRET}&js_code={code}&grant_type=authorization_code"
            res = requests.get(url)
            res_data = res.json()
            if 'openid' in res_data:
                openid = res_data['openid']
                print(f"Got OpenID from code: {openid}")
            else:
                return jsonify({'error': f"Failed to get OpenID: {res_data.get('errmsg')}"}), 400
        except Exception as e:
            return jsonify({'error': f"Network error getting OpenID: {str(e)}"}), 500

    if not openid:
        return jsonify({'error': 'Missing openid or code'}), 400

    # 1. 统一下单
    unified_order_params = {
        'appid': APP_ID,
        'mch_id': MCH_ID,
        'nonce_str': generate_nonce_str(),
        'body': 'Test Payment 0.01',
        'out_trade_no': f"ORDER_{int(time.time())}_{random.randint(1000, 9999)}",
        'total_fee': total_fee,
        'spbill_create_ip': request.remote_addr or '127.0.0.1',
        'notify_url': NOTIFY_URL,
        'trade_type': 'JSAPI',
        'openid': openid
    }
    
    # 签名
    sign = calculate_sign(unified_order_params, API_KEY)
    unified_order_params['sign'] = sign
    
    # 转XML并发送请求
    xml_data = to_xml(unified_order_params)
    print(f"Sending XML to WeChat: {xml_data}")
    
    try:
        response = requests.post('https://api.mch.weixin.qq.com/pay/unifiedorder', data=xml_data.encode('utf-8'))
        response.encoding = 'utf-8'
        print(f"WeChat Response: {response.text}")
        
        res_data = parse_xml(response.text)
        
        if res_data.get('return_code') != 'SUCCESS':
            return jsonify({'error': f"WeChat Error: {res_data.get('return_msg')}"}), 400
            
        if res_data.get('result_code') != 'SUCCESS':
             return jsonify({'error': f"Business Error: {res_data.get('err_code_des')}"}), 400
             
        prepay_id = res_data.get('prepay_id')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # 2. 生成前端调起支付所需的参数

    # 2. 生成前端调起支付所需的参数
    timestamp = str(int(time.time()))
    nonce_str = generate_nonce_str()
    package = f"prepay_id={prepay_id}"
    sign_type = 'MD5'

    pay_params = {
        'appId': APP_ID,
        'timeStamp': timestamp,
        'nonceStr': nonce_str,
        'package': package,
        'signType': sign_type
    }

    # 生成签名
    pay_sign = calculate_sign(pay_params, API_KEY)
    pay_params['paySign'] = pay_sign
    
    # 注意：uni.requestPayment 不需要 appId，但签名需要参与
    # 返回给前端的数据
    return jsonify(pay_params)

@app.route('/api/create_order', methods=['POST'])
def create_order():
    data = request.json
    openid = data.get('openid')
    address = data.get('address')
    products = data.get('products')
    total_price = data.get('total_price')

    if not openid or not products:
        return jsonify({'code': 400, 'msg': 'Missing required fields'}), 400

    order_id = f"{int(time.time())}{random.randint(1000, 9999)}"
    
    new_order = {
        'order_id': order_id,
        'openid': openid,
        'address': address,
        'products': products,
        'total_price': total_price,
        'status': 0, # 0: Unpaid
        'create_time': time.strftime('%Y-%m-%d %H:%M:%S'),
        'tracking_number': '',
        'carrier_name': ''
    }

    orders = load_orders()
    orders.append(new_order)
    save_orders(orders)

    return jsonify({'code': 0, 'msg': 'Order created', 'order_id': order_id})

@app.route('/api/get_orders', methods=['GET'])
def get_orders():
    openid = request.args.get('openid')
    status = request.args.get('status')
    
    if not openid:
        return jsonify({'code': 400, 'msg': 'Missing openid'}), 400

    orders = load_orders()
    user_orders = [o for o in orders if o['openid'] == openid]

    if status is not None:
        status = int(status)
        # Frontend tabs: 0=All, 1=Pending Ship (Paid), 2=Pending Receipt (Shipped), 3=Completed
        # Backend status: 0=Unpaid, 1=Paid, 2=Shipped, 3=Completed
        
        # Mapping logic if needed, but for now let's keep it simple:
        # If frontend requests specific status, filter by it.
        # Note: Frontend "All" usually means everything.
        pass 

    # Reverse to show newest first
    user_orders.reverse()
    
    return jsonify({'code': 0, 'data': user_orders})

@app.route('/api/pay_order', methods=['POST'])
def pay_order():
    data = request.json
    order_id = data.get('order_id')
    
    orders = load_orders()
    for order in orders:
        if order['order_id'] == order_id:
            order['status'] = 1 # Paid, wait for shipping
            save_orders(orders)
            return jsonify({'code': 0, 'msg': 'Payment successful'})
            
    return jsonify({'code': 404, 'msg': 'Order not found'}), 404

if __name__ == '__main__':
    print("Starting server on port 5000...")
    print(f"Please update APP_ID, MCH_ID, API_KEY in the file.")
    app.run(host='0.0.0.0', port=5001, debug=True)
