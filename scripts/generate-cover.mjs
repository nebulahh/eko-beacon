import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1600, H = 1000, pixels = Buffer.alloc(W * H * 4);
const color = (hex) => [1, 3, 5].map((n) => parseInt(hex.slice(n, n + 2), 16)).concat(255);
function rect(x, y, w, h, hex) {
  const c = color(hex), x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(H, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) pixels.set(c, (py * W + px) * 4);
}
function poly(points, hex) {
  const c = color(hex), ys = points.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H, Math.ceil(Math.max(...ys)));
  for (let y = y0; y < y1; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) { const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length]; if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
    xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) rect(xs[i], y, xs[i + 1] - xs[i] + 1, 1, hex);
  }
}
function circle(cx, cy, r, hex) { const c = color(hex); for (let y = -r; y <= r; y++) { const dx = Math.sqrt(r * r - y * y); rect(cx - dx, cy + y, dx * 2, 1, hex); } }
const glyphs = { L:['10000','10000','10000','10000','10000','10000','11111'], A:['01110','10001','10001','11111','10001','10001','10001'], G:['01111','10000','10000','10111','10001','10001','01110'], O:['01110','10001','10001','10001','10001','10001','01110'], S:['01111','10000','10000','01110','00001','00001','11110'], D:['11110','10001','10001','10001','10001','10001','11110'], H:['10001','10001','10001','11111','10001','10001','10001'], T:['11111','00100','00100','00100','00100','00100','00100'], R:['11110','10001','10001','11110','10100','10010','10001'], E:['11111','10000','10000','11110','10000','10000','11111'], U:['10001','10001','10001','10001','10001','10001','01110'], N:['10001','11001','11001','10101','10011','10011','10001'], B:['11110','10001','10001','11110','10001','10001','11110'], C:['01111','10000','10000','10000','10000','10000','01111'], K:['10001','10010','10100','11000','10100','10010','10001'], P:['11110','10001','10001','11110','10000','10000','10000'], Z:['11111','00001','00010','00100','01000','10000','11111'] };
function word(value, x, y, scale, hex, spacing = 2) { let at = x; for (const letter of value) { if (letter === ' ') { at += 4 * scale; continue; } const g = glyphs[letter]; for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) if (g[row][col] === '1') rect(at + col * scale, y + row * scale, scale, scale, hex); at += (5 + spacing) * scale; } }

for (let y = 0; y < H; y++) {
  const t = y / H, r = Math.round(248 - t * 19), g = Math.round(194 - t * 56), b = Math.round(112 - t * 52);
  rect(0, y, W, 1, `#${[r,g,b].map((v)=>v.toString(16).padStart(2,'0')).join('')}`);
}
circle(1300, 176, 86, '#ffe295');
poly([[0,485],[220,355],[420,480],[680,310],[930,490],[1160,348],[1400,480],[1600,365],[1600,750],[0,750]], '#ba7047');
const buildings = [['#d97848',50,465,180,250],['#e8ae52',255,405,215,310],['#689080',505,467,200,250],['#e3875c',995,422,190,300],['#d4aa63',1225,475,170,245],['#607f70',1430,410,185,310]];
for (const [c,x,y,w,h] of buildings) { rect(x,y,w,h,c); rect(x-8,y-14,w+16,17,'#874c3e'); for (let wx=x+25; wx<x+w-12; wx+=46) for (let wy=y+35; wy<y+h-25; wy+=52) { rect(wx,wy,21,27,'#354f52'); rect(wx+3,wy+3,15,19,'#9bc1b5'); } }
for (const x of [70,400,1110,1500]) { rect(x-7,460,14,210,'#80553b'); for (let i=0;i<6;i++) { const a=i*Math.PI/3; poly([[x,470],[x+Math.cos(a)*110-18,450+Math.sin(a)*78],[x+Math.cos(a)*125,450+Math.sin(a)*92],[x+Math.cos(a)*15,480]],i%2?'#51814e':'#71945a'); } }
rect(0,725,W,275,'#836b50');
// Rooftop puzzle board with a visible sunbeam and turned mirrors.
rect(620,490,720,465,'#655748'); rect(635,505,690,435,'#bfae8d');
const bx=665, by=525, cw=126, ch=78;
for(let row=0;row<5;row++)for(let col=0;col<5;col++)rect(bx+col*cw,by+row*ch,cw-3,ch-3,(row+col)%2?'#d8c8a8':'#eadfc5');
for(let i=0;i<5;i++){rect(bx+i*cw,by,3,390,'#856e55');rect(bx,by+i*ch,630,3,'#856e55');}
// Routed light: east, north, east into the beacon.
rect(705,825,375,10,'#ffcd55');rect(1070,585,10,250,'#ffcd55');rect(1070,585,195,10,'#ffcd55');
poly([[910,798],[960,848],[950,858],[900,808]],'#407b78');poly([[1048,625],[1098,575],[1108,585],[1058,635]],'#407b78');
circle(705,830,16,'#fff0a0');rect(1248,550,24,48,'#ca7d43');circle(1260,544,25,'#ffe17d');
// A styled rooftop signal keeper beside the board.
circle(455,665,42,'#8a5439');rect(414,630,84,42,'#211b19');rect(410,708,90,100,'#e76b47');rect(414,802,82,91,'#283c49');
poly([[414,720],[375,774],[390,785],[429,750]],'#8a5439');poly([[496,720],[535,766],[521,778],[482,745]],'#8a5439');poly([[430,880],[412,934],[433,940],[453,891]],'#8a5439');poly([[480,880],[500,934],[522,927],[501,873]],'#8a5439');
rect(430,659,12,7,'#211b19');rect(468,659,12,7,'#211b19');
// Foreground color band and title card.
rect(0,55,680,300,'#332c27');rect(0,55,12,300,'#ffd05c');word('EKO',48,88,12,'#fff6dd',2);word('BEACON',48,183,11,'#ffd05c',2);
rect(50,278,310,2,'#f8e7c9');word('PUZZLE',50,298,4,'#fff1d1',1);
const raw = Buffer.alloc((W * 4 + 1) * H); for (let y=0;y<H;y++) pixels.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4);
const crcTable = new Uint32Array(256); for (let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
function crc(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),len=Buffer.alloc(4),check=Buffer.alloc(4);len.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([len,name,data,check]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:8})),chunk('IEND',Buffer.alloc(0))]);
writeFileSync(new URL('../cover.png', import.meta.url), png);
