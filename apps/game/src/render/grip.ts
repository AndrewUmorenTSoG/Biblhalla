/** Authored hand coordinates are relative to the atlas frame, before its pivot. */
export function handGrip(frame:any){return {x:(frame.gripX??frame.w*.74)-frame.pivotX,y:(frame.gripY??frame.h*.56)-frame.pivotY};}
export function needsCarriedWeapon(frameName:string,weapon:string){return weapon!=='unarmed'&&/^(motion_|run_|air_|land$|defence_)/.test(frameName);}
