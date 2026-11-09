# Valida um XML do eSocial contra o esquema oficial em docs/esocial/xsd (menos a assinatura, que o contador faz).
# Uso: python -I scripts/valida-xsd.py <evento.xsd> <arquivo.xml>   → imprime OK ou os erros e sai com 1
import sys, os
from lxml import etree
xsd_nome, xml_path = sys.argv[1], sys.argv[2]
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'esocial', 'xsd')
doc = etree.parse(os.path.join(base, xsd_nome))
for el in doc.iter('{http://www.w3.org/2001/XMLSchema}element'):
    if el.get('ref') == 'ds:Signature': el.set('minOccurs', '0')
cwd = os.getcwd(); os.chdir(base)
try: schema = etree.XMLSchema(doc)
finally: os.chdir(cwd)
xml = etree.parse(xml_path)
if schema.validate(xml): print('OK'); sys.exit(0)
for e in schema.error_log: print(f'{e.line}: {e.message}')
sys.exit(1)
