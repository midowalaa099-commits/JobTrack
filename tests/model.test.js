import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { dateOnly, dateTime, normalizeApplication, putApplication, selectApplications, stats, needsFollowUp, parseBackup, toCSV, safeUrl, MAX_RECORDS } from '../src/model.js';
import { sampleApplications } from '../src/seed.js';
const base={id:'one',company:'Demo Company',role:'Backend Developer',stage:'applied',workMode:'remote',appliedDate:'2026-11-01',salaryMin:'12000',salaryMax:'20000'};

test('normalization rejects missing required fields and invalid enums',()=>{
  const record=normalizeApplication(base);
  assert.equal(record.salaryMin,12000);
  assert.equal(record.notes,'');
  for(const change of [{company:'x'},{role:''},{stage:'hired'},{workMode:'unknown'},{id:'unsafe" id'}])assert.throws(()=>normalizeApplication({...base,...change}));
});
test('dates reject impossible days, leap-year errors, and invalid times',()=>{
  assert(dateOnly('2028-02-29'));
  for(const value of ['2026-02-29','2026-02-30','2026-13-01','1999-12-31','2026-1-1'])assert.equal(dateOnly(value),false);
  assert(dateTime('2026-11-07T14:30'));
  for(const value of ['2026-11-07T24:00','2026-11-07T14:60','2026-02-30T12:00'])assert.equal(dateTime(value),false);
});
test('unsafe links and embedded credentials never become clickable job links',()=>{
  assert.equal(safeUrl('https://example.com/jobs/1'),'https://example.com/jobs/1');
  for(const value of ['javascript:alert(1)','data:text/html,hi','file:///etc/passwd','https://user:secret@example.com','example.com'])assert.throws(()=>safeUrl(value));
});
test('salary ranges validate integers, bounds, ordering, and optional empty values',()=>{
  assert.equal(normalizeApplication({...base,salaryMin:'',salaryMax:''}).salaryMin,null);
  for(const change of [{salaryMin:1.5},{salaryMin:-1},{salaryMax:10000001},{salaryMin:20001},{salaryMin:'not-a-number'}])assert.throws(()=>normalizeApplication({...base,...change}));
});
test('editing preserves creation time and does not duplicate or mutate existing records',()=>{
  const records=putApplication([],base,{now:'2026-11-01T10:00:00Z'});
  const updated=putApplication(records,{...records[0],role:'Senior Backend Developer'},{now:'2026-11-07T10:00:00Z'});
  assert.equal(updated.length,1);
  assert.equal(updated[0].createdAt,records[0].createdAt);
  assert.equal(updated[0].updatedAt,'2026-11-07T10:00:00Z');
  assert.equal(records[0].role,'Backend Developer');
});
test('search and combined filters return exact, sorted matches without mutating input',()=>{
  const samples=sampleApplications(new Date(2026,10,7));
  const remote=selectApplications(samples,{query:'laravel',mode:'remote'});
  assert.equal(remote.length,1);assert.equal(remote[0].company,'Cloudfield');
  assert.equal(selectApplications(samples,{quick:'offers'}).length,1);
  const sortBefore=samples.map(x=>x.id);
  selectApplications(samples,{sort:'company'});
  assert.deepEqual(samples.map(x=>x.id),sortBefore);
});
test('follow-up and interview counts exclude closed and saved applications',()=>{
  const today='2026-11-07';
  assert(needsFollowUp({...base,followUpDate:today},today));
  for(const stage of ['saved','rejected','archived'])assert.equal(needsFollowUp({...base,stage,followUpDate:today},today),false);
  const samples=sampleApplications(new Date(2026,10,7,12,0));
  const summary=stats(samples,new Date(2026,10,7,12,0));
  assert.deepEqual(summary,{total:10,active:6,interviews:2,responseRate:71,followups:2});
  assert.deepEqual(stats([],new Date(2026,10,7)),{total:0,active:0,interviews:0,responseRate:0,followups:0});
});
test('JSON backups round-trip and imports validate all records before accepting data',()=>{
  const samples=sampleApplications(new Date(2026,10,7));
  assert.deepEqual(parseBackup(JSON.stringify({schemaVersion:1,applications:samples})),samples);
  for(const data of [{schemaVersion:2,applications:[]},{schemaVersion:1,applications:[base,base]},{schemaVersion:1,applications:[base,{...base,id:'two',stage:'INVALID'}]}])assert.throws(()=>parseBackup(JSON.stringify(data)));
  assert.throws(()=>parseBackup('{invalid JSON'));
  assert.throws(()=>parseBackup('x'.repeat(1500001)));
  assert.equal(samples.length,10);
});
test('CSV quotes multiline values and neutralizes spreadsheet formula injection',()=>{
  const csv=toCSV([{...base,company:'=HYPERLINK("https://example.com")',role:' +SUM(1,2)',notes:'Line 1\nLine "2"'}]);
  assert(csv.startsWith('\uFEFF'));
  assert(csv.includes('"\'=HYPERLINK(""https://example.com"")"'));
  assert(csv.includes('"\' +SUM(1,2)"'));
  assert(csv.includes('"Line 1\nLine ""2"""'));
});
test('record limit allows edits while preventing an additional application',()=>{
  const records=Array.from({length:MAX_RECORDS},(_,i)=>({...normalizeApplication(base),id:'item-'+i}));
  assert.throws(()=>putApplication(records,{...base,id:'new'}));
  assert.equal(putApplication(records,{...base,id:'item-0'}).length,MAX_RECORDS);
});
test('standalone build has no unresolved modules, external assets, network calls, or build markers',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert(!html.includes('BUILD_SCRIPT')&&!html.includes('BUILD_STYLES'));
  assert(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(html));
  assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(html));
  const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  assert(!/^import /m.test(script));
  new vm.Script(script);
});
test('all five screens render with empty data, sample data, and failed storage',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  for(const stored of [null,JSON.stringify({schemaVersion:1,applications:[]}),'{corrupt']){
    const nodes={app:{innerHTML:''},dialog:{open:false,close(){this.open=false},showModal(){this.open=true},addEventListener(){}},toast:{textContent:''}};
    const sandbox={console,Intl,URL,structuredClone,crypto:{randomUUID:()=> 'new-id'},localStorage:{getItem:key=>key.includes('language')?null:stored,setItem(){}},document:{documentElement:{},activeElement:null,getElementById:id=>nodes[id],addEventListener(){}},location:{hash:'#overview'},window:{addEventListener(){},scrollTo(){}},setTimeout:()=>1,clearTimeout(){}};
    const context=vm.createContext(sandbox);vm.runInContext(script,context);
    for(const screen of ['overview','applications','board','interviews','settings']){
      sandbox.location.hash='#'+screen;vm.runInContext('render()',context);
      assert(nodes.app.innerHTML.includes('id="main"'),screen);
      assert(!nodes.app.innerHTML.includes('NaN'),screen);
    }
  }
});
