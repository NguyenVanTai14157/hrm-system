const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');
const {spawn}=require('node:child_process');
const path=require('node:path');
require('dotenv').config({quiet:true});
const {createPrismaClient}=require('../dist/database/client');
const {hashPassword}=require('../dist/modules/auth/password');
(async()=>{
 const db=createPrismaClient(process.env.DATABASE_URL),uid=randomUUID(),rid=randomUUID(),suffix=randomBytes(5).toString('hex'),username='ui_'+suffix,password=randomBytes(20).toString('hex'),children=[];
 let browser;const root=path.resolve(__dirname,'../..');
 function launch(cwd,args,env={}){const p=spawn(process.execPath,args,{cwd,windowsHide:true,env:{...process.env,...env},stdio:'ignore'});children.push(p);}
 async function ready(url){for(let i=0;i<120;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error('Startup timeout');}
 try {
  await db.role.create({data:{id:rid,name:'UI '+suffix,permissions:{create:['admin.access','employee.view','employee.create','employee.update','employee.catalog.manage'].map(permissionCode=>({permissionCode}))}}});
  await db.user.create({data:{id:uid,username,displayName:'UI tester',passwordHash:await hashPassword(password),mustChangePassword:false,roles:{create:{roleId:rid}}}});
  launch(path.join(root,'backend'),['dist/main.js'],{PORT:'3347',CORS_ORIGINS:'http://localhost:3300'});
  launch(path.join(root,'admin-web'),['../node_modules/next/dist/bin/next','start','-p','3300']);
  await Promise.all([ready('http://localhost:3347/api/v1/health'),ready('http://localhost:3300')]);
  browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext();
  await context.route('http://localhost:3002/**',r=>r.continue({url:r.request().url().replace(':3002/',':3347/')}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3300/login');await page.locator('#username').fill(username);await page.locator('#password').fill(password);await page.locator('button[type=submit]').click();await page.waitForURL('http://localhost:3300/');
  await page.goto('http://localhost:3300/hrm/employees');await page.getByRole('button',{name:'Thêm nhân sự mới',exact:true}).click();
  let dialog=page.getByRole('dialog');await dialog.getByLabel('Mã nhân sự',{exact:true}).fill('UI_'+suffix);await dialog.getByLabel('Họ và tên',{exact:true}).fill('Hồ sơ kiểm tra '+suffix);await dialog.getByLabel('Ngày sinh',{exact:true}).fill('2000-02-29');await dialog.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await dialog.waitFor({state:'hidden'});
  let row=page.getByRole('row').filter({hasText:'UI_'+suffix.toUpperCase()});await row.getByRole('button',{name:'Sửa',exact:true}).click();dialog=page.getByRole('dialog');assert.equal(await dialog.getByLabel('Ngày sinh',{exact:true}).inputValue(),'2000-02-29');await dialog.getByLabel('Họ và tên',{exact:true}).fill('Đã sửa '+suffix);await dialog.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await dialog.waitFor({state:'hidden'});
  row=page.getByRole('row').filter({hasText:'UI_'+suffix.toUpperCase()});await row.getByRole('button',{name:'Xem',exact:true}).click();await page.getByText('Cập nhật hồ sơ · UI tester',{exact:true}).waitFor();await page.locator('.ant-drawer-close').click();await page.getByRole('dialog',{name:'Chi tiết hồ sơ nhân sự'}).waitFor({state:'hidden'});
  // Sort through the header and verify the actual server query.
  let responsePromise=page.waitForResponse(r=>r.url().includes('/employees?')&&r.url().includes('sortBy=code'));
  responsePromise.catch(()=>{});
  await page.getByRole('columnheader',{name:/Mã nhân sự/}).click();
  assert.equal((await responsePromise).status(),200);
  await page.getByRole('button',{name:'Bộ lọc nhân sự',exact:true}).click();
  await page.getByRole('menuitem',{name:'Chọn cột hiển thị',exact:true}).click();
  const settings=page.getByRole('dialog',{name:'Chọn cột hiển thị',exact:true});
  await settings.getByRole('switch',{name:'Hiển thị Email',exact:true}).click();
  await settings.locator('.column-setting-row').filter({hasText:'Họ và tên'}).locator('.column-drag-handle').dragTo(settings.locator('.column-setting-row').filter({hasText:'Mã nhân sự'}));
  await settings.getByRole('button',{name:'Đưa Họ và tên xuống',exact:true}).click();
  await settings.getByRole('button',{name:'Đưa Họ và tên lên',exact:true}).click();
  await settings.locator('.ant-drawer-close').click();await settings.waitFor({state:'hidden'});
  assert.ok(await page.getByRole('columnheader',{name:/Email/}).isVisible());
  let preference=await page.evaluate(id=>JSON.parse(localStorage.getItem('hrm:employee-columns:v1:'+id)),uid);
  assert.equal(preference.order[0],'name');assert.ok(preference.visible.includes('email'));
  await page.reload();await page.getByRole('columnheader',{name:/Email/}).waitFor();
  // Group label counts come from all filtered rows, not just this page.
  await page.getByRole('button',{name:'Bộ lọc nhân sự',exact:true}).click();
  await page.screenshot({path:path.join(root,'.npm-cache/employees-options-menu.png'),animations:'disabled'});
  await page.getByText('Nhóm dữ liệu',{exact:true}).hover();
  responsePromise=page.waitForResponse(r=>r.url().includes('/employees?')&&r.url().includes('groupBy=positionId'));
  responsePromise.catch(()=>{});
  await page.locator('.ant-dropdown-menu-item:visible').filter({hasText:/^Vị trí$/}).click();
  const groupedData=await (await responsePromise).json();assert.ok(groupedData.groups.length>0);
  await page.getByRole('button',{name:'Bộ lọc nhân sự',exact:true}).click();
  await page.getByRole('menuitem',{name:'Chọn cột hiển thị',exact:true}).click();
  await settings.getByRole('button',{name:'Mặc định',exact:true}).click();
  await settings.locator('.ant-drawer-close').click();await settings.waitFor({state:'hidden'});
  assert.equal(await page.getByRole('columnheader',{name:/Email/}).count(),0);
  preference=await page.evaluate(id=>JSON.parse(localStorage.getItem('hrm:employee-columns:v1:'+id)),uid);
  assert.equal(preference.order[0],'code');
  await page.evaluate(id=>{
    localStorage.setItem('hrm:employee-columns:v1:'+id,'invalid-json');
    localStorage.setItem('hrm:employee-columns:v1:another-account',JSON.stringify({order:['email'],visible:['email']}));
  },uid);
  await page.reload();await page.getByRole('columnheader',{name:/Mã nhân sự/}).waitFor();
  assert.equal(await page.getByRole('columnheader',{name:/Email/}).count(),0);
  await page.screenshot({path:path.join(root,'.npm-cache/employees-list-options.png'),fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.getByRole('button',{name:'Thêm nhân sự mới',exact:true}).click();await page.getByRole('dialog').getByLabel('Mã nhân sự',{exact:true}).fill('MOBILE_CHECK');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(root,'.npm-cache/employees-mobile.png'),fullPage:true,animations:'disabled'});assert.deepEqual(errors,[]);
  console.log('Employee browser checks passed: login, create, edit, dates, history, server sort/group, column preferences/reload/default, mobile layout.');
 } finally {
  if(browser)await browser.close();for(const p of children)p.kill();
  const ids=(await db.employee.findMany({where:{code:'UI_'+suffix.toUpperCase()},select:{id:true}})).map(r=>r.id);
  await db.employeeHistory.deleteMany({where:{actorId:uid}});await db.employee.deleteMany({where:{id:{in:ids}}});await db.user.deleteMany({where:{id:uid}});await db.role.deleteMany({where:{id:rid}});await db.$disconnect();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});

