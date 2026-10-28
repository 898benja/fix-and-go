import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { api, options, Option, Page, Provider, Session } from './api';
import { Button, Card, Chips, Field, s } from './ui';
import ServiceMap from './ServiceMap';
import { Point, validPoint } from './map-contract';
import type { Run } from './screens';

export function Explore({session,run,busy,onChoose}:{session:Session;run:Run;busy:boolean;onChoose:(p:Provider)=>void}) {
  const [point,setPoint]=useState<Point|null>(null);
  const [latitude,setLatitude]=useState('');
  const [longitude,setLongitude]=useState('');
  const [radius,setRadius]=useState(10);
  const [categories,setCategories]=useState<Option[]>([]);
  const [category,setCategory]=useState(0);
  const [search,setSearch]=useState('');
  const [page,setPage]=useState<Page<Provider>|null>(null);
  const [number,setNumber]=useState(1);
  const [selected,setSelected]=useState<number|null>(null);
  const [searched,setSearched]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  // Cambiar parámetros invalida resultados anteriores para no mostrar cercanía obsoleta.
  const revision=useRef(0);
  const invalidate=()=>{revision.current++;setPage(null);setSelected(null);setSearched(false);};
  const choosePoint=(p:Point)=>{invalidate();setPoint(p);setLatitude(String(p.latitude));setLongitude(String(p.longitude));};
  const load=(n=1)=>run(async()=>{
    const version=revision.current;
    const q=new URLSearchParams({page:String(n),search:search.trim()});
    if(category)q.set('category',categories.find(c=>c.id===category)!.slug);
    if(point){q.set('latitude',String(point.latitude));q.set('longitude',String(point.longitude));q.set('radius_km',String(radius));}
    const data=await api<Page<Provider>>(`providers/?${q}`,session.token);
    if(version!==revision.current)return;
    setPage(data);setNumber(n);setSearched(true);
  });
  useEffect(()=>{void run(async()=>{
    const version=revision.current;
    const [cats,providers]=await Promise.all([options('categories/'),api<Page<Provider>>('providers/',session.token)]);
    setCategories(cats);
    if(version===revision.current){setPage(providers);setSearched(true);}
  });},[]);
  const markers=(page?.results??[]).filter(p=>p.latitude!=null&&p.longitude!=null&&p.map_visible)
    .map(p=>({id:p.id,name:p.display_name,description:`${p.categories.map(c=>c.name).join(' · ')}${p.distance_km!=null ? ` · ${p.distance_km} km en línea recta` : ''}`,latitude:p.latitude!,longitude:p.longitude!}));
  const rows=selected ? page?.results.filter(p=>p.id===selected) : page?.results;
  return <>
    <Text style={s.heading}>Encuentra ayuda cerca de ti</Text>
    <Text style={s.body}>Toca el mapa donde necesitas el servicio y busca prestadores. Los puntos son zonas de atención publicadas, no ubicaciones en vivo.</Text>
    <ServiceMap point={point} markers={markers} onPoint={choosePoint} onSelect={setSelected}/>
    <Card>
      <Text style={s.title}>{point ? 'Ubicación seleccionada' : 'Indica dónde necesitas ayuda'}</Text>
      <Text style={s.body}>Toca el mapa y pulsa Buscar. Confirmarás la dirección al solicitar el servicio.</Text>
      <Button secondary label={advanced ? 'Ocultar ubicación manual' : 'Ingresar ubicación manual'} onPress={()=>setAdvanced(!advanced)}/>
      {advanced&&<>
      <Field label="Latitud" value={latitude} onChangeText={v=>{invalidate();setPoint(null);setLatitude(v);}} keyboardType="numbers-and-punctuation" placeholder="-33.4489"/>
      <Field label="Longitud" value={longitude} onChangeText={v=>{invalidate();setPoint(null);setLongitude(v);}} keyboardType="numbers-and-punctuation" placeholder="-70.6693"/>
      <Button secondary label="Usar estas coordenadas" onPress={()=>void run(async()=>{
        const p={latitude:Number(latitude.replace(',','.')),longitude:Number(longitude.replace(',','.'))};
        if(!validPoint(p))throw new Error('Ingresa un punto válido dentro del área de Santiago.');
        choosePoint(p);
      })}/>
      </>}
      <Text style={s.label}>Buscar a una distancia de</Text>
      <Chips items={[3,5,10,20,30].map(id=>({id,name:`${id} km`}))} selected={[radius]} onSelect={v=>{invalidate();setRadius(v);}}/>
      <Text style={s.label}>Especialidad</Text>
      <Chips items={[{id:0,name:'Todas'},...categories]} selected={[category]} onSelect={v=>{invalidate();setCategory(v);}}/>
      <Field label="Nombre o especialidad" value={search} onChangeText={v=>{invalidate();setSearch(v);}}/>
      <Button label={point ? 'Buscar cerca de este punto' : 'Ver catálogo sin ubicación'} busy={busy} onPress={()=>void load()}/>
      {point&&<Button secondary label="Quitar ubicación" onPress={()=>{invalidate();setPoint(null);setLatitude('');setLongitude('');}}/>}
    </Card>
    {page&&<Text style={s.title}>{page.count} prestadores {point ? `en ${radius} km` : 'en el catálogo'}</Text>}
    {selected&&<Button secondary label="Ver todos los resultados" onPress={()=>setSelected(null)}/>}
    {searched&&page?.count===0&&<Text style={s.body}>No hay prestadores publicados en esta zona con estos filtros. Amplía el radio o cambia la especialidad.</Text>}
    {rows?.map(p=><Card key={p.id}>
      <Text style={s.title}>{p.display_name}</Text>
      <Text style={s.body}>{p.categories.map(c=>c.name).join(' · ')}</Text>
      <Text style={s.body}>{p.description}</Text>
      <Text style={s.label}>{p.distance_km!=null ? `${p.distance_km} km en línea recta · ` : ''}{p.communes.map(c=>c.name).join(', ')}</Text>
      <Button label="Ver y solicitar" disabled={busy} onPress={()=>onChoose({...p,...(point ? {requested_point:point} : {})})}/>
    </Card>)}
    {page&&<View style={{gap:8}}><Text style={s.body}>Página {number}. El mapa muestra los prestadores de esta página. Cercanía no garantiza disponibilidad ni cobertura de tu comuna.</Text>
      {number>1&&<Button secondary label="Anterior" busy={busy} onPress={()=>void load(number-1)}/>}
      {page.next&&<Button secondary label="Siguiente" busy={busy} onPress={()=>void load(number+1)}/>}
    </View>}
  </>;
}
