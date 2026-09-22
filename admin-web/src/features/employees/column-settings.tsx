'use client';
import { useEffect, useState } from 'react';
import { Button, Drawer, Input, Switch } from 'antd';

export const employeeColumns = [
  ['code','Mã nhân sự'], ['name','Họ và tên'], ['department','Phòng ban'],
  ['position','Vị trí công việc'], ['jobTitle','Chức danh'], ['joinDate','Ngày vào làm'],
  ['status','Trạng thái'], ['manager','Quản lý trực tiếp'], ['birthday','Ngày sinh'],
  ['gender','Giới tính'], ['email','Email'], ['phone','Điện thoại'], ['address','Địa chỉ'],
] as const;
export type ColumnKey = typeof employeeColumns[number][0];
export type ColumnPreferences = {order:ColumnKey[];visible:ColumnKey[]};
export const defaultColumns = ():ColumnPreferences => ({order:employeeColumns.map(([key])=>key),visible:employeeColumns.slice(0,8).map(([key])=>key)});
export function parseColumns(raw:string|null):ColumnPreferences {
  const defaults=defaultColumns();
  try {
    const value:unknown=JSON.parse(raw ?? 'null');
    if (!value || typeof value!=='object' || !('order' in value) || !('visible' in value) || !Array.isArray(value.order) || !Array.isArray(value.visible)) return defaults;
    const valid=(key:unknown):key is ColumnKey=>typeof key==='string' && defaults.order.includes(key as ColumnKey);
    const order=[...new Set([...value.order.filter(valid),...defaults.order])];
    const visible=[...new Set(value.visible.filter(valid))];
    return {order,visible:visible.length?visible:defaults.visible};
  } catch {return defaults;}
}
export function useEmployeeColumns(userId:string|undefined) {
  const [stored,setStored]=useState<{userId:string|undefined;value:ColumnPreferences}>({userId:undefined,value:defaultColumns()});
  useEffect(()=>{
    let value=defaultColumns();
    try {if(userId)value=parseColumns(localStorage.getItem('hrm:employee-columns:v1:'+userId));} catch { /* Storage can be disabled. */ }
    // Load only preferences, never employee data, when the authenticated account changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStored({userId,value});
  },[userId]);
  const value=stored.userId===userId?stored.value:defaultColumns();
  function update(next:ColumnPreferences) {
    setStored({userId,value:next});
    try {if(userId)localStorage.setItem('hrm:employee-columns:v1:'+userId,JSON.stringify(next));} catch { /* Keep in-memory behavior. */ }
  }
  return [value,update] as const;
}
export function ColumnSettings({open,onClose,value,onChange}:{open:boolean;onClose:()=>void;value:ColumnPreferences;onChange:(value:ColumnPreferences)=>void}) {
  const [search,setSearch]=useState('');
  const [dragged,setDragged]=useState<ColumnKey|null>(null);
  function move(key:ColumnKey,target:ColumnKey) {
    if(key===target)return;
    const order=value.order.filter(item=>item!==key);
    order.splice(value.order.indexOf(target),0,key);
    onChange({...value,order});
  }
  return <Drawer title="Chọn cột hiển thị" placement="left" open={open} onClose={onClose} size={380}
    footer={<Button onClick={()=>onChange(defaultColumns())}>Mặc định</Button>}>
    <Input.Search aria-label="Tìm cột" placeholder="Tìm trường thông tin" value={search} onChange={event=>setSearch(event.target.value)} allowClear/>
    <p className="column-settings-help">Kéo để đổi thứ tự hoặc dùng nút lên/xuống. Giữ ít nhất một cột hiển thị.</p>
    {value.order.filter(key=>employeeColumns.find(([id])=>id===key)![1].toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))).map(key=>{
      const label=employeeColumns.find(([id])=>id===key)![1], index=value.order.indexOf(key), checked=value.visible.includes(key);
      return <div key={key} className={'column-setting-row'+(dragged===key?' is-dragging':'')} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();if(dragged)move(dragged,key);setDragged(null);}}>
        <span className="column-drag-handle" draggable onDragStart={event=>{setDragged(key);event.dataTransfer.setData('text/plain',key);}} onDragEnd={()=>setDragged(null)} aria-label={'Kéo cột '+label}>⠿</span>
        <span className="column-setting-label">{label}</span>
        <Button size="small" type="text" aria-label={'Đưa '+label+' lên'} disabled={index===0} onClick={()=>move(key,value.order[index-1])}>↑</Button>
        <Button size="small" type="text" aria-label={'Đưa '+label+' xuống'} disabled={index===value.order.length-1} onClick={()=>move(key,value.order[index+1])}>↓</Button>
        <Switch size="small" aria-label={'Hiển thị '+label} checked={checked} disabled={checked&&value.visible.length===1} onChange={enabled=>onChange({...value,visible:enabled?[...value.visible,key]:value.visible.filter(item=>item!==key)})}/>
      </div>;
    })}
  </Drawer>;
}
