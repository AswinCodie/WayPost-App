import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LocationCoordinates } from '../types';
import { UNLOCK_RADIUS_METERS } from '../lib/location';
interface LocationContextType { coordinates: LocationCoordinates; isLocating:boolean; permissionStatus:'prompt'|'granted'|'denied'|'unsupported'; errorMessage?:string; unlockRadiusMeters:number; requestRealLocation:()=>void; isSimulated:boolean; activePresetName:string; presets: never[]; setPreset:(id:string)=>void; setCustomCoordinates:(coords:LocationCoordinates,label?:string)=>void; toggleSimulationMode:()=>void; }
const LocationContext=createContext<LocationContextType|undefined>(undefined);
export const LocationProvider:React.FC<{children:React.ReactNode}>=({children})=>{
 const [coordinates,setCoordinates]=useState<LocationCoordinates>({latitude:0,longitude:0}); const [isLocating,setIsLocating]=useState(false); const [permissionStatus,setPermissionStatus]=useState<LocationContextType['permissionStatus']>('prompt'); const [errorMessage,setErrorMessage]=useState<string>(); const watchRef=useRef<number|null>(null);
 const stop=useCallback(()=>{if(watchRef.current!==null){navigator.geolocation.clearWatch(watchRef.current);watchRef.current=null;}},[]);
 const handlePosition=useCallback((p:GeolocationPosition)=>{setCoordinates({latitude:p.coords.latitude,longitude:p.coords.longitude});setPermissionStatus('granted');setErrorMessage(undefined);setIsLocating(false);},[]);
 const handleError=useCallback((e:GeolocationPositionError)=>{setIsLocating(false);setPermissionStatus(e.code===e.PERMISSION_DENIED?'denied':'prompt');setErrorMessage(e.code===e.PERMISSION_DENIED?'Location permission was denied.':e.code===e.TIMEOUT?'Location request timed out. Try again.':'Your location is currently unavailable.');},[]);
 const requestRealLocation=useCallback(()=>{if(!navigator.geolocation){setPermissionStatus('unsupported');setErrorMessage('Geolocation is not supported by this browser.');return;} stop();setIsLocating(true);setErrorMessage(undefined);navigator.geolocation.getCurrentPosition((p)=>{handlePosition(p);watchRef.current=navigator.geolocation.watchPosition(handlePosition,handleError,{enableHighAccuracy:true,maximumAge:5000,timeout:15000});},handleError,{enableHighAccuracy:true,maximumAge:0,timeout:15000});},[handleError,handlePosition,stop]);
 useEffect(()=>()=>stop(),[stop]);
 return <LocationContext.Provider value={{coordinates,isLocating,permissionStatus,errorMessage,unlockRadiusMeters:UNLOCK_RADIUS_METERS,requestRealLocation,isSimulated:false,activePresetName:'',presets:[],setPreset:()=>{},setCustomCoordinates:()=>{},toggleSimulationMode:()=>{}}}>{children}</LocationContext.Provider>;
};
export const useLocation=()=>{const c=useContext(LocationContext);if(!c)throw new Error('useLocation must be used within LocationProvider');return c;};
