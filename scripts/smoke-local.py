"""Recorrido HTTP real de dos roles; usa exclusivamente las cuentas ficticias locales."""
import base64,io,json,re,urllib.request,urllib.error
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
pairs=re.findall(r'Correo: (.+)\nContraseña: (.+)',(root/'.local/accesos.txt').read_text())
passed=[]
def call(path,method='GET',data=None,token=None,expected=200):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Token '+token
 req=urllib.request.Request('http://127.0.0.1:8000/api/v1/'+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=15) as r:status=r.status;body=r.read()
 except urllib.error.HTTPError as e:status=e.code;body=e.read()
 value=json.loads(body) if body else None
 assert status==expected,(path,status,value)
 return value
def check(label):passed.append(label);print('PASS',label)
call('health/');check('salud API y base de datos')
p=call('auth/login/','POST',dict(zip(('email','password'),pairs[0])))
c=call('auth/login/','POST',dict(zip(('email','password'),pairs[1])))
pt,ct=p['token'],c['token'];check('sesiones independientes')
cat=next(x for x in call('categories/')['results'] if x['slug']=='agua-gasfiteria')['id']
comm=next(x for x in call('communes/')['results'] if x['slug']=='santiago')['id']
sr=call('requests/','POST',{'provider_id':p['user']['id'],'category_id':cat,'commune_id':comm,'address':'Dirección ficticia QA, Santiago','description':'Revisión de filtración y reparación de grifería para QA.','latitude':-33.4489,'longitude':-70.6693},ct,201)
x=f"requests/{sr['id']}/";check('solicitud con ubicación')
call(x+'quote/','POST',{'description':'Cambio de sello y revisión de conexión.','price':500},pt,201);check('cotización de $500')
call(x+'quote/accept/','POST',{},ct);check('aceptación')
e=call(x+'materials/','POST',{'description':'Sello de prueba','quantity':1,'unit_price':200},pt,201)
call(x+'checkout/','POST',{},ct,409);check('material pendiente bloquea pago')
call(x+f"materials/{e['id']}/decision/",'POST',{'decision':'APPROVED'},ct)
call(x+'messages/',token=ct,expected=403);check('chat bloqueado antes de pago')
call('wallet/demo-card/','POST',{},ct)
o=call(x+'checkout/','POST',{},ct,201);assert o['total']==700
call(x+'payment/demo-result/','POST',{'outcome':'approved'},ct)
a=call(x+'checkout/','POST',{},ct);assert a['id']==o['id'];check('pago y reintento sin duplicación')
call(x+'messages/','POST',{'text':'Mensaje sintético de coordinación QA.'},ct,201)
assert call(x+'messages/',token=pt)['count']==1;check('chat entre ambos roles')
call(x+'start/','POST',{},pt)
call(x+'complete/','POST',{},ct,409);check('cierre bloqueado sin evidencia')
im=Image.new('RGB',(96,96),'#FFC448');b=io.BytesIO();im.save(b,format='PNG')
call(x+'evidence/','POST',{'image_base64':base64.b64encode(b.getvalue()).decode(),'caption':'Imagen sintética QA.'},pt,201)
call(x+'complete/','POST',{},ct);check('foto y cierre')
call(x+'rating/','POST',{'score':5,'comment':'Valoración sintética del recorrido QA.'},ct,201)
assert call(x+'receipt/',token=ct)['total']==700;check('valoración y comprobante sin dinero real')
call(x+'quote/','POST',{'description':'Acción no autorizada','price':500},ct,403);check('permisos por rol')
print(json.dumps({'request_id':sr['id'],'passed':len(passed),'checks':passed},ensure_ascii=False))
