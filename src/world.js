import * as THREE from 'three';

const LEVELS = [
  { name: 'Riverside Roof', source: [0, 2], direction: 0, target: [4, 0], mirrors: [[2, 2, false], [2, 0, true]] },
  { name: 'Market Rooftops', source: [0, 4], direction: 0, target: [3, 3], mirrors: [[1, 4, false], [1, 1, false], [3, 1, false]] },
  { name: 'Island Lights', source: [0, 4], direction: 0, target: [3, 0], mirrors: [[1, 4, false], [1, 1, false], [3, 1, false]] },
];
const DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const PALETTE = { shirt: '#e16b4c', trousers: '#27555b', skin: '#98613e', asphalt: '#e9dfc9' };

export class EkoBeacon {
  constructor(host, callbacks = {}) {
    this.host = host; this.callbacks = callbacks; this.state = 'ready'; this.levelIndex = 0; this.moves = 0; this.levelMoves = 0; this.totalLevels = LEVELS.length;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#e8b662'); this.scene.fog = new THREE.Fog('#e8b662', 26, 70);
    this.camera = new THREE.PerspectiveCamera(43, 1, .1, 100); this.camera.position.set(0, 10.5, 14); this.camera.lookAt(0, .5, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.12; host.append(this.renderer.domElement);
    this.clock = new THREE.Clock(); this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.cellSize = 1.28; this.gridSize = 5;
    this.mirrors = []; this.tileMeshes = []; this.beamGroup = new THREE.Group(); this.scene.add(this.beamGroup);
    this.buildRooftop(); this.setPlayer({ style: {} }); this.loadLevel(0);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host); this.resize();
    this.renderer.domElement.addEventListener('pointerdown', (event) => this.pickMirror(event)); this.animate();
  }

  mat(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .82, ...extra }); }
  box(parent, size, position, color, extra = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.mat(color, extra)); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }

  buildRooftop() {
    this.scene.add(new THREE.HemisphereLight('#fff1d0', '#86775d', 2.15));
    const sun = new THREE.DirectionalLight('#fff0cb', 3.1); sun.position.set(-7, 13, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); this.scene.add(sun);
    this.box(this.scene, [36, .5, 32], [0, -.45, 0], '#d7c7a6');
    this.box(this.scene, [32, .42, 28], [0, -.08, 0], '#e7ddc8');
    this.box(this.scene, [33, .52, .5], [0, .16, -14], '#a86249'); this.box(this.scene, [33, .52, .5], [0, .16, 14], '#a86249');
    this.box(this.scene, [.5, .52, 28], [-16, .16, 0], '#b97556'); this.box(this.scene, [.5, .52, 28], [16, .16, 0], '#b97556');
    // Low Lagos rooftops and water tanks frame the puzzle without competing with it.
    for (const [x, z, width, height, color] of [[-11,-8,5,4,'#d8875f'],[10,-9,6,5,'#d7a14f'],[-11,8,6,4,'#688b82'],[11,8,5,5,'#cd7758']]) {
      this.box(this.scene, [width, height, 4], [x, height / 2 - .3, z], color);
      this.box(this.scene, [width + .4, .28, 4.4], [x, height + .02, z], '#8f5544');
      for (let wx = x - width / 2 + .8; wx < x + width / 2 - .4; wx += 1.5) this.box(this.scene, [.55, .72, .08], [wx, 1.4, z + 2.04], '#427174');
    }
    for (const [x,z] of [[-6,-10],[7,-12],[-13,2],[13,1]]) this.addTank(x,z);
    this.addPalm(-8,-5); this.addPalm(9,4);
    const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(.65, 18, 12), new THREE.MeshBasicMaterial({ color: '#ffdf91' })); sunOrb.position.set(-8, 7, -11); this.scene.add(sunOrb);

    this.board = new THREE.Group(); this.scene.add(this.board);
    const boardWidth = this.gridSize * this.cellSize;
    this.box(this.board, [boardWidth + .35, .38, boardWidth + .35], [0, .42, 0], '#76644f');
    for (let row=0; row<this.gridSize; row++) for (let col=0; col<this.gridSize; col++) {
      const tile = this.box(this.board, [this.cellSize - .055, .08, this.cellSize - .055], [this.cellX(col), .66, this.cellZ(row)], (row + col) % 2 ? '#efe5d2' : '#e4d7bf');
      tile.userData = { col, row }; this.tileMeshes.push(tile);
    }
    this.board.position.y = 0;
    this.playerPlinth = new THREE.Group(); this.scene.add(this.playerPlinth);
    this.box(this.playerPlinth, [1.15, .25, 1.15], [0, .13, 0], '#c37a51');
    this.playerPlinth.position.set(-5.0, 0, 4.3);
    this.addRoofMarkings();
  }

  cellX(col) { return (col - (this.gridSize - 1) / 2) * this.cellSize; }
  cellZ(row) { return (row - (this.gridSize - 1) / 2) * this.cellSize; }

  addTank(x,z) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(.67,.67,1.65,12), this.mat('#397b79')); tank.position.set(x,1.05,z); tank.castShadow = true; this.scene.add(tank);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.12,12), this.mat('#265b5c')); lid.position.set(x,1.93,z); this.scene.add(lid);
    this.box(this.scene,[1.8,.16,1.25],[x,.1,z],'#8a6648');
  }
  addPalm(x,z) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,3.2,7), this.mat('#805b3f')); trunk.position.set(x,1.6,z); trunk.castShadow = true; this.scene.add(trunk);
    for (let i=0;i<6;i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(.27,1.8,5),this.mat(i%2?'#557e4d':'#70934e')); const a=i*Math.PI/3; leaf.position.set(x+Math.cos(a)*.66,3.22,z+Math.sin(a)*.66); leaf.rotation.z=Math.cos(a)*1.1; leaf.rotation.x=Math.sin(a)*.55; this.scene.add(leaf); }
  }
  addRoofMarkings() {
    for (let i=0;i<6;i++) this.box(this.scene,[.06,.02,3.2],[-8+i*3.2,.19,0],i%2?'#d6b783':'#cfb083');
  }

  loadLevel(index) {
    this.levelIndex = index; this.level = LEVELS[index]; this.levelMoves = 0; this.mirrors = [];
    for (const old of this.board.children.filter((child) => child.userData.isDynamic)) this.board.remove(old);
    for (const old of [...this.beamGroup.children]) this.beamGroup.remove(old);
    this.targetRing?.parent?.remove(this.targetRing); this.sourceCore?.parent?.remove(this.sourceCore);
    const source = this.level.source; const target = this.level.target;
    this.sourceCore = new THREE.Mesh(new THREE.CylinderGeometry(.28,.38,.25,10), this.mat('#df8c42',{emissive:'#502311',emissiveIntensity:.4}));
    this.sourceCore.position.set(this.cellX(source[0]),.9,this.cellZ(source[1])); this.board.add(this.sourceCore); this.sourceCore.userData.isDynamic=true;
    const sourceTop = new THREE.Mesh(new THREE.CircleGeometry(.18,10),new THREE.MeshBasicMaterial({color:'#ffe07b',side:THREE.DoubleSide})); sourceTop.rotation.x=-Math.PI/2; sourceTop.position.set(this.cellX(source[0]),1.04,this.cellZ(source[1])); this.board.add(sourceTop); sourceTop.userData.isDynamic=true;
    this.targetRing = new THREE.Group(); this.targetRing.userData.isDynamic=true;
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,.6,8),this.mat('#e2a64d',{emissive:'#8c4d12',emissiveIntensity:.5})); beacon.position.y=1.05; this.targetRing.add(beacon);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(.28,.045,8,16),new THREE.MeshBasicMaterial({color:'#f7c85e'})); glow.rotation.x=Math.PI/2; glow.position.y=1.38; this.targetRing.add(glow);
    this.targetRing.position.set(this.cellX(target[0]),0,this.cellZ(target[1])); this.board.add(this.targetRing);
    this.mirrorMeshes = [];
    for (const [col,row,slash] of this.level.mirrors) this.makeMirror(col,row,slash);
    this.selectedIndex = 0; this.selectMirror(0); this.traceBeam();
    this.callbacks.onTick?.({level:index+1,moves:this.moves,time:this.elapsedSeconds()});
  }

  makeMirror(col,row,slash) {
    const group = new THREE.Group(); group.position.set(this.cellX(col),.78,this.cellZ(row)); group.userData.isDynamic=true;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(.93,.13,.93),this.mat('#b78b55')); frame.position.y=.03; group.add(frame);
    const reflective = new THREE.Mesh(new THREE.BoxGeometry(.82,.1,.12),this.mat('#89b8b4',{metalness:.62,roughness:.28,emissive:'#153b38',emissiveIntensity:.24})); reflective.position.y=.13; reflective.castShadow=true; group.add(reflective);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:'#fff3bd'})); spark.position.set(.27,.22,0); group.add(spark);
    this.board.add(group); const mirror={col,row,slash,group,reflective,ring:null}; this.mirrors.push(mirror); this.mirrorMeshes.push(group); this.orientMirror(mirror); return mirror;
  }

  orientMirror(mirror) { mirror.reflective.rotation.y=mirror.slash ? -Math.PI/4 : Math.PI/4; mirror.reflective.material.color.set(mirror.slash?'#91c7c0':'#83b6b0'); }
  selectMirror(index) {
    if (!this.mirrors.length) return;
    this.selectedIndex=(index+this.mirrors.length)%this.mirrors.length;
    this.mirrors.forEach((mirror,i)=>{
      mirror.group.scale.setScalar(i===this.selectedIndex?1.05:1);
      mirror.group.children[0].material.color.set(i===this.selectedIndex?'#f0c85f':'#b78b55');
    });
  }
  selectRelative(delta) { if (this.state==='active') this.selectMirror(this.selectedIndex+delta); }

  pickMirror(event) {
    if (this.state!=='active') return;
    const rect=this.renderer.domElement.getBoundingClientRect(); this.pointer.x=(event.clientX-rect.left)/rect.width*2-1; this.pointer.y=-((event.clientY-rect.top)/rect.height*2-1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.7); const point=new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane,point)) return;
    const col=Math.round(point.x/this.cellSize+(this.gridSize-1)/2); const row=Math.round(point.z/this.cellSize+(this.gridSize-1)/2);
    const index=this.mirrors.findIndex((mirror)=>mirror.col===col&&mirror.row===row);
    if (index>=0) { this.selectMirror(index); this.rotateSelected(); }
  }

  rotateSelected() {
    if (this.state!=='active'||!this.mirrors.length) return;
    const mirror=this.mirrors[this.selectedIndex]; mirror.slash=!mirror.slash; this.orientMirror(mirror); this.moves++; this.levelMoves++; this.traceBeam();
    this.callbacks.onTick?.({level:this.levelIndex+1,moves:this.moves,time:this.elapsedSeconds()});
    if (this.solved) {
      const stats={level:this.levelIndex+1,moves:this.levelMoves,time:this.elapsedSeconds()};
      if (this.levelIndex===this.totalLevels-1) { this.state='complete'; this.callbacks.onComplete?.({levels:this.totalLevels,time:this.elapsedSeconds()}); }
      else { this.state='solved'; this.callbacks.onLevelSolved?.(stats); }
    }
  }

  traceBeam() {
    for (const child of [...this.beamGroup.children]) this.beamGroup.remove(child);
    const {source,target}=this.level; let [col,row]=source; let direction=this.level.direction; const path=[[col,row]]; const seen=new Set(); let solved=false;
    for (let step=0;step<42;step++) {
      const [dx,dy]=DIRECTIONS[direction]; col+=dx; row+=dy;
      if (col<0||row<0||col>=this.gridSize||row>=this.gridSize) break;
      path.push([col,row]);
      if (col===target[0]&&row===target[1]) { solved=true; break; }
      const mirror=this.mirrors.find((item)=>item.col===col&&item.row===row);
      if (mirror) direction=mirror.slash ? (3-direction+4)%4 : (1-direction+4)%4;
      const key=`${col}:${row}:${direction}`; if(seen.has(key)) break; seen.add(key);
    }
    this.solved=solved;
    for(let i=0;i<path.length-1;i++) {
      const [x1,y1]=path[i],[x2,y2]=path[i+1]; const start=new THREE.Vector3(this.cellX(x1),1.18,this.cellZ(y1)); const end=new THREE.Vector3(this.cellX(x2),1.18,this.cellZ(y2));
      const length=start.distanceTo(end); const beam=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,length,8),new THREE.MeshBasicMaterial({color:solved?'#fff0a5':'#ffd05e'}));
      beam.position.copy(start).add(end).multiplyScalar(.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()); this.beamGroup.add(beam);
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.078,8,6),new THREE.MeshBasicMaterial({color:solved?'#fff6cd':'#ffe18b'})); dot.position.copy(end); this.beamGroup.add(dot);
    }
    this.targetRing.children[0].material.emissive.set(solved?'#eacb55':'#8c4d12');
    this.targetRing.children[0].material.emissiveIntensity=solved?1.8:.5;
  }

  setPlayer(player) {
    if(this.avatar) this.scene.remove(this.avatar);
    this.style=player?.style||{}; const style=this.style; const shirt=style.primaryColor||PALETTE.shirt; const trousers=style.secondaryColor||PALETTE.trousers; const skin=style.skinColor||PALETTE.skin; const hair=style.hairColor||'#211a18';
    const avatar=new THREE.Group(); avatar.position.set(-5,0,4.35); avatar.rotation.y=.35; this.scene.add(avatar); this.avatar=avatar;
    const body=style.body==='female';
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.57,4,8),this.mat(shirt)); torso.position.y=1.17; torso.castShadow=true; avatar.add(torso);
    this.box(avatar,body?[.73,.43,.42]:[.72,.56,.42],[0,.5,0],trousers);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.33,14,11),this.mat(skin)); head.position.y=1.98; head.scale.set(1,1.12,.9); avatar.add(head);
    this.box(avatar,[.055,.03,.03],[-.12,2.05,.29],'#31241e'); this.box(avatar,[.055,.03,.03],[.12,2.05,.29],'#31241e');
    const hairType=style.hair||'short';
    if(hairType!=='bald') {
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.34,13,8,0,Math.PI*2,0,Math.PI*.53),this.mat(hair)); cap.position.y=2.04; avatar.add(cap);
      if(hairType==='afro') for(let i=0;i<8;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),this.mat(hair));const a=i*Math.PI/4;puff.position.set(Math.cos(a)*.24,2.16,Math.sin(a)*.2);avatar.add(puff);}
      if(hairType==='braids'||hairType==='dreads') for(let s of [-1,1]) for(let i=0;i<3;i++){const braid=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.37,7),this.mat(hair));braid.position.set(s*.25,1.81,(i-1)*.13);avatar.add(braid);}
      if(hairType==='bun'){const bun=new THREE.Mesh(new THREE.SphereGeometry(.15,8,6),this.mat(hair));bun.position.set(0,2.29,-.22);avatar.add(bun);}
      if(hairType==='ponytail'){const tail=new THREE.Mesh(new THREE.CylinderGeometry(.07,.045,.48,7),this.mat(hair));tail.position.set(0,1.8,-.27);tail.rotation.x=-.25;avatar.add(tail);}
    }
    const hat=style.hat||'none';
    if(hat!=='none') {
      const hatColor=hat==='crown'?'#f0c64c':shirt; const top=new THREE.Mesh(new THREE.CylinderGeometry(hat==='tophat'?.24:.31,.31,hat==='tophat'?.45:.17,9),this.mat(hatColor));top.position.y=2.38;avatar.add(top);
      if(hat==='cap')this.box(avatar,[.45,.06,.27],[0,2.34,.2],hatColor);
      if(hat==='crown')for(let i=0;i<3;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.08,.17,5),this.mat(hatColor));spike.position.set((i-1)*.16,2.54,0);avatar.add(spike);}
    }
    const accessory=style.accessory||'none';
    if(accessory==='glasses'){for(let x of [-.12,.12])this.box(avatar,[.16,.1,.035],[x,2.05,.31],'#29444a');this.box(avatar,[.09,.025,.03],[0,2.05,.32],'#29444a');}
    if(accessory==='scarf')this.box(avatar,[.75,.13,.46],[0,1.63,0],'#e8bc50');
    if(accessory==='backpack')this.box(avatar,[.48,.62,.22],[0,1.13,-.34],'#b85339');
    if(accessory==='beard')this.box(avatar,[.4,.16,.18],[0,1.78,.14],hair);
    if(accessory==='earrings')for(let x of [-.34,.34]){const e=new THREE.Mesh(new THREE.SphereGeometry(.05,7,5),this.mat('#f5d260',{metalness:.35}));e.position.set(x,1.91,0);avatar.add(e);}
  }

  start() { this.moves=0; this.startedAt=performance.now(); this.state='active'; this.loadLevel(0); this.callbacks.onTick?.({level:1,moves:0,time:0}); }
  nextLevel() { if(this.state!=='solved')return; this.state='active'; this.loadLevel(this.levelIndex+1); }
  elapsedSeconds() { return this.startedAt?Math.floor((performance.now()-this.startedAt)/1000):0; }

  animate=()=>{
    requestAnimationFrame(this.animate);const dt=Math.min(this.clock.getDelta(),.05);const t=this.clock.elapsedTime;
    if(this.sourceCore)this.sourceCore.rotation.y+=dt*.7;
    if(this.targetRing)this.targetRing.children[1].rotation.z=t*.45;
    if(this.avatar)this.avatar.position.y=.025+Math.sin(t*1.8)*.025;
    if(this.state==='active'&&Math.floor(t)!==this.lastTick){this.lastTick=Math.floor(t);this.callbacks.onTick?.({level:this.levelIndex+1,moves:this.moves,time:this.elapsedSeconds()});}
    this.renderer.render(this.scene,this.camera);
  };
  resize() {
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    this.camera.aspect=w/h;this.camera.fov=w/h<.9?51:43;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);
  }
}
