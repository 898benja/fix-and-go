import { pdfBase64 } from './pdf-base64';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { api, Session } from './api';
import { Button, Card, Field, Notice, s } from './ui';
import type { Run } from './screens';

type Review = {status:'DRAFT'|'PENDING'|'APPROVED'|'REJECTED'; profession:string; professional_background:string;has_cv:boolean;has_photo:boolean;note:string};

export function ProviderVerification({session,run,busy}:{session:Session;run:Run;busy:boolean}) {
  const [review,setReview]=useState<Review|null>(null);
  const [rut,setRut]=useState('');
  const [profession,setProfession]=useState('');
  const [background,setBackground]=useState('');
  const [cv,setCv]=useState('');
  const [cvName,setCvName]=useState('');
  const [ack,setAck]=useState(false);
  const load=async()=>setReview(await api<Review>('auth/me/provider-profile/verification/',session.token));
  useEffect(()=>{void load().catch(()=>{});},[session.token]);
  async function pickCv(){
    const result=await DocumentPicker.getDocumentAsync({type:'application/pdf',copyToCacheDirectory:true,base64:true});
    if(result.canceled)return;
    const asset=result.assets[0];
    if(asset.size&&asset.size>3*1024*1024)throw new Error('El CV debe pesar menos de 3 MB.');
    const content=pdfBase64(Platform.OS==='web' ? asset.base64 : await new File(asset.uri).base64());
    if(!content||content.length>4200000)throw new Error('No pudimos leer el PDF. Elige uno de hasta 3 MB.');
    setCv(content);setCvName(asset.name);
  }
  return <Card>
    <Text style={s.title}>Validación profesional</Text>
    <Text style={s.body}>Tu perfil podrá recibir solicitudes cuando revisemos tus antecedentes. El RUT y el CV solo los ve administración.</Text>
    {review?.status==='PENDING'&&<View style={{backgroundColor:'#FFF1C8',borderRadius:18,padding:20,gap:8}}><Text style={{fontSize:23,fontWeight:'800',color:'#171717'}}>Estamos validando tus datos</Text><Text style={s.body}>Administración revisará tu postulación. Te avisaremos al correo registrado cuando tu cuenta sea aprobada o necesite correcciones.</Text></View>}
    {!!review&&<Notice tone={review.status==='APPROVED'?'success':review.status==='REJECTED'?'warning':'info'} title={{DRAFT:'Completa tu postulación',PENDING:'En revisión',APPROVED:'Perfil aprobado',REJECTED:'Requiere correcciones'}[review.status]} message={review.note||'La revisión de los documentos la realiza el equipo de FIX&GO.'}/>}
    <Button secondary label="Actualizar estado y foto" busy={busy} onPress={()=>void run(load)}/>
    {review?.status!=='APPROVED'&&review?.status!=='PENDING'&&<>
      <Field label="RUT chileno" value={rut} onChangeText={setRut} placeholder="12.345.678-5" autoCapitalize="characters"/>
      <Field label="Oficio o profesión" value={profession} onChangeText={setProfession} placeholder="Ejemplo: gasfitería"/>
      <Field label="Formación y experiencia" multiline value={background} onChangeText={setBackground} placeholder="Describe estudios, certificaciones y trabajos realizados"/>
      <Button secondary label={cvName||'Adjuntar CV en PDF · máximo 3 MB'} busy={busy} onPress={()=>void run(pickCv)}/>
      <Text style={s.body}>Agrega también una foto real de tu perfil en el apartado superior. No subas carnés, datos de salud ni antecedentes que no se solicitan.</Text>
      <Button secondary label={ack?'✓ Acepto la revisión de mis datos':'Acepto que FIX&GO revise estos datos para verificar mi postulación'} onPress={()=>setAck(!ack)}/>
      <Button label="Enviar antecedentes para revisión" busy={busy} disabled={!rut.trim()||!profession.trim()||!background.trim()||!cv||!ack||!review?.has_photo} onPress={()=>void run(async()=>{await api('auth/me/provider-profile/verification/',session.token,'POST',{rut,profession,professional_background:background,cv_base64:cv,privacy_acknowledged:ack});setCv('');setRut('');await load();})}/>
    </>}
  </Card>;
}
