const test = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID,randomBytes} = require('node:crypto');
const {spawn} = require('node:child_process');
require('dotenv').config({quiet:true});
const {createPrismaClient} = require('../dist/database/client');
const {hashPassword} = require('../dist/modules/auth/password');
test('Employee persistence, RBAC, validation, history and concurrent edits', {timeout:90000}, async()=>{
  const db=createPrismaClient(process.env.DATABASE_URL); const suffix=randomBytes(6).toString('hex');
  const uid=randomUUID(),rid=randomUUID(),password=randomBytes(20).toString('hex');
  const employees=[],catalogs=[];let server,token;
  const base='http://127.0.0.1:3346/api/v1';
  async function request(route,method='GET',body,authenticated=true){const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json','X-HRM-Client':'admin',...(authenticated&&token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};}
  try {
    const permissions=['admin.access','employee.view','employee.create','employee.update','employee.catalog.manage'];
    for(const code of permissions)await db.permission.upsert({where:{code},update:{},create:{code,description:code}});
    await db.role.create({data:{id:rid,name:'Employee test '+suffix,permissions:{create:permissions.map(permissionCode=>({permissionCode}))}}});
    await db.user.create({data:{id:uid,username:'emp_test_'+suffix,displayName:'Employee test',passwordHash:await hashPassword(password),mustChangePassword:false,roles:{create:{roleId:rid}}}});
    server=spawn(process.execPath,['dist/main.js'],{windowsHide:true,env:{...process.env,PORT:'3346',JWT_ACCESS_SECRET:randomBytes(48).toString('hex')},stdio:'ignore'});
    let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
    token=(await request('/auth/login','POST',{username:'emp_test_'+suffix,password})).data.accessToken;assert.ok(token);
    assert.equal((await request('/employees','GET',undefined,false)).status,401);
    const cat=await request('/employee-catalogs','POST',{kind:'DEPARTMENT',code:'T_'+suffix,name:'Test department'});assert.equal(cat.status,201);catalogs.push(cat.data.id);
    const created=await request('/employees','POST',{code:'t_'+suffix,name:'Nguyễn Test',birthday:'1999-02-28',joinDate:'2026-09-16',departmentId:cat.data.id});assert.equal(created.status,201);employees.push(created.data.id);const first=created.data;
    assert.equal(first.code,'T_'+suffix.toUpperCase());assert.equal(first.birthday,'1999-02-28');assert.ok(!('user' in first));
    assert.equal((await request('/employees','POST',{code:'t_'+suffix,name:'Duplicate'})).status,409);
    assert.equal((await request('/employees','POST',{code:'BAD_'+suffix,name:'Date',birthday:'2025-02-30'})).status,400);
    assert.equal((await request('/employees','POST',{code:'BAD_'+suffix,name:'Kind',positionId:cat.data.id})).status,400);
    assert.equal((await request('/employees','POST',{code:'BAD_'+suffix,name:'Extra',salary:500})).status,400);
    const second=await request('/employees','POST',{code:'B_'+suffix,name:'Manager child',managerId:first.id});assert.equal(second.status,201);employees.push(second.data.id);
    // Sorting must happen before pagination, and group totals must not be page totals.
    const search='/employees?q='+suffix+'&pageSize=1';
    const ascending=await request(search+'&sortBy=code&sortDirection=asc');
    assert.equal(ascending.status,200);assert.equal(ascending.data.items[0].id,second.data.id);
    assert.equal((await request(search+'&sortBy=code&sortDirection=asc&page=2')).data.items[0].id,first.id);
    assert.equal((await request(search+'&sortBy=code&sortDirection=desc')).data.items[0].id,first.id);
    for(const field of ['name','department','position','jobTitle','manager','birthday','joinDate','gender','email','phone','address','status']) {
      assert.equal((await request(search+'&sortBy='+field)).status,200);
    }
    const grouped=await request(search+'&groupBy=status&sortBy=code');
    assert.equal(grouped.data.items.length,1);
    assert.deepEqual(grouped.data.groups,[{value:'WORKING',count:2}]);
    assert.deepEqual((await request(search+'&groupBy=status&page=2')).data.groups,grouped.data.groups);
    const departments=(await request(search+'&groupBy=departmentId')).data.groups;
    assert.equal(departments.find(g=>g.value===null).count,1);
    assert.equal(departments.find(g=>g.value===cat.data.id).count,1);
    for(const field of ['positionId','jobTitleId'])assert.deepEqual((await request(search+'&groupBy='+field)).data.groups,[{value:null,count:2}]);
    assert.deepEqual((await request(search+'&groupBy=status&departmentId='+cat.data.id)).data.groups,[{value:'WORKING',count:1}]);
    assert.equal((await request(search+'&sortBy=passwordHash')).status,400);
    assert.equal((await request(search+'&sortDirection=invalid')).status,400);
    assert.equal((await request(search+'&groupBy=email')).status,400);
    assert.equal((await request(search+'&groupBy=status&sortBy=name','GET',undefined,false)).status,401);
    assert.equal((await request('/employees/'+first.id,'PATCH',{version:0,managerId:second.data.id})).status,400);
    assert.equal((await request('/employees/'+first.id,'PATCH',{version:0,managerId:first.id})).status,400);
    const updated=await request('/employees/'+first.id,'PATCH',{version:0,status:'STOP_WORKING',name:'Updated name'});assert.equal(updated.status,200);assert.equal(updated.data.version,1);
    assert.equal((await request('/employees/'+first.id,'PATCH',{version:0,name:'Stale'})).status,409);
    assert.equal((await request('/employees/'+first.id,'PATCH',{version:1,name:null})).status,400);
    assert.equal((await request('/employees?pageSize=101')).status,400);
    const filtered=await request('/employees?q='+encodeURIComponent(first.code)+'&status=STOP_WORKING&departmentId='+cat.data.id);assert.equal(filtered.data.total,1);
    const history=await request('/employees/'+first.id+'/history');assert.equal(history.data.total,2);assert.equal(history.data.items[0].before.status,'WORKING');assert.equal(history.data.items[0].after.status,'STOP_WORKING');assert.equal(history.data.items[0].actorId,uid);
    await request('/employee-catalogs/'+cat.data.id,'PATCH',{active:false});
    assert.equal((await request('/employees','POST',{code:'BAD_'+suffix,name:'Inactive',departmentId:cat.data.id})).status,400);
    assert.equal((await request('/employees/'+first.id,'PATCH',{version:1,departmentId:cat.data.id,phone:'0900000000'})).status,200);
    assert.equal((await request('/employees/'+first.id,'DELETE')).status,404);
    await db.rolePermission.delete({where:{roleId_permissionCode:{roleId:rid,permissionCode:'employee.update'}}});
    assert.equal((await request('/employees/'+first.id,'PATCH',{version:2,name:'Forbidden'})).status,403);
    await db.rolePermission.delete({where:{roleId_permissionCode:{roleId:rid,permissionCode:'employee.view'}}});
    assert.equal((await request('/employees')).status,403);assert.equal((await request('/employees/'+first.id+'/history')).status,403);
    assert.equal(await db.employee.count({where:{id:{in:employees}}}),2);
  } finally {
    if(server)server.kill();
    await db.employeeHistory.deleteMany({where:{actorId:uid}});
    await db.employee.updateMany({where:{id:{in:employees}},data:{managerId:null}});
    await db.employee.deleteMany({where:{id:{in:employees}}});
    await db.employeeCatalog.deleteMany({where:{id:{in:catalogs}}});
    await db.user.deleteMany({where:{id:uid}});await db.role.deleteMany({where:{id:rid}});await db.$disconnect();
  }
});
