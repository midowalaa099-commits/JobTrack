import http from 'node:http';
import fs from 'node:fs';
const port=Number(process.env.PORT || 4174);
http.createServer((request,response)=>{
  if(request.url==='/'||request.url==='/index.html') { response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream('index.html').pipe(response); }
  else { response.writeHead(404,{'Content-Type':'text/plain'});response.end('Not found'); }
}).listen(port,'127.0.0.1',()=>console.log(`JobTrack: http://127.0.0.1:${port}`));
