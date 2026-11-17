import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { api, Session } from './api';
import { Button, Card, s } from './ui';
import type { Run } from './screens';

export function DemoWallet({session,run,busy,onReady}:{session:Session;run:Run;busy:boolean;onReady?:(ready:boolean)=>void}) {
  const [card,setCard]=useState<{brand:string;last4:string}|null>(null);
  const [loaded,setLoaded]=useState(false);
  const load=async()=>{const data=await api<{card:typeof card}>('wallet/demo-card/',session.token);setCard(data.card);setLoaded(true);onReady?.(!!data.card);};
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    let active = true;
    void api<{card:typeof card}>("wallet/demo-card/",session.token).then(data => {
      if(active) {setCard(data.card);setLoaded(true);ready.current?.(!!data.card);}
    }).catch(() => {if(active) setLoaded(false);});
    return () => {active=false;};
  }, [session.token]);
  return <Card>
    <Text style={s.title}>Método de pago</Text>
    <Text style={s.body}>No ingreses datos bancarios. Usaremos una tarjeta ficticia y el cobro real será $0.</Text>
    {!loaded?<Button secondary label="Cargar método de pago" busy={busy} onPress={()=>void run(load)}/>:
      card?<><Text style={s.title}>{card.brand} · •••• {card.last4}</Text><Button secondary label="Quitar tarjeta" busy={busy} onPress={()=>void run(async()=>{await api('wallet/demo-card/',session.token,'DELETE',{});await load();})}/></>:
      <Button label="Usar tarjeta de demostración" busy={busy} onPress={()=>void run(async()=>{await api('wallet/demo-card/',session.token,'POST',{});await load();})}/>}
  </Card>;
}
