/* Hintergrund-Shader, Glyphen, Balken-Punkt-Zahlen, Tzolkin-Rad. */
(function (global) {
  const GOLD = "#e4c37a";
  const GOLD_DIM = "#9a7540";

  /* ---------------- WebGL / Canvas Hintergrund ---------------- */
  function startBackground(canvas) {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true, premultipliedAlpha: false });
    if (gl) return startGL(canvas, gl);
    return start2D(canvas);
  }

  function resize(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== (w * dpr) || canvas.height !== (h * dpr)) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    return { w: canvas.width, h: canvas.height, dpr };
  }

  function startGL(canvas, gl) {
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}";
    const fs = [
      "precision highp float;",
      "uniform vec2 r; uniform float t;",
      "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);",
      "return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}",
      "float fbm(vec2 p){float a=0.;float w=0.5;for(int i=0;i<5;i++){a+=w*noise(p);p*=2.03;w*=0.5;}return a;}",
      "void main(){",
      "vec2 uv=gl_FragCoord.xy/r; vec2 p=(gl_FragCoord.xy-0.5*r)/min(r.x,r.y);",
      "float rad=length(p); float ang=atan(p.y,p.x);",
      "vec3 col=vec3(0.027,0.022,0.016);",
      "col+=vec3(0.07,0.045,0.02)*smoothstep(1.1,0.05,rad)*0.8;",
      "float rays=pow(max(0.,sin(ang*10.0+t*0.15)), 12.0)*smoothstep(0.9,0.15,rad);",
      "col+=vec3(0.35,0.24,0.08)*rays*0.18;",
      "float stone=fbm(p*4.0+vec2(0.0,t*0.02));",
      "col+=vec3(0.08,0.05,0.02)*stone*smoothstep(1.2,0.2,rad);",
      "float ring=abs(rad-0.42-0.012*sin(t*0.25));",
      "col+=vec3(0.85,0.65,0.28)*0.35*smoothstep(0.03,0.0,ring);",
      "float ring2=abs(rad-0.28);",
      "col+=vec3(0.7,0.5,0.2)*0.18*smoothstep(0.02,0.0,ring2);",
      "float ticks=smoothstep(0.018,0.0,abs(mod(ang+t*0.03+3.14159,6.28318/20.0)-3.14159/20.0));",
      "col+=vec3(0.8,0.6,0.25)*ticks*smoothstep(0.08,0.0,abs(rad-0.42))*0.7;",
      "float fog=fbm(uv*2.0+vec2(t*0.03,-t*0.02));",
      "col+=vec3(0.05,0.07,0.07)*fog*0.35;",
      "float scan=sin(gl_FragCoord.y*1.7+t*2.0)*0.015;",
      "col+=scan;",
      "float vig=smoothstep(1.15,0.35,rad);",
      "col*=vig;",
      "gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n");

    function shader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vsh = shader(gl.VERTEX_SHADER, vs);
    const fsh = shader(gl.FRAGMENT_SHADER, fs);
    if (!vsh || !fsh) return start2D(canvas);
    const prog = gl.createProgram();
    gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return start2D(canvas);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    let alive = true;
    function frame(ts) {
      if (!alive) return;
      const s = resize(canvas);
      gl.viewport(0, 0, s.w, s.h);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uR, s.w, s.h);
      gl.uniform1f(uT, ts * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function stop() { alive = false; };
  }

  function start2D(canvas) {
    const ctx = canvas.getContext("2d");
    let alive = true;
    function frame(ts) {
      if (!alive) return;
      const s = resize(canvas);
      const w = s.w, h = s.h;
      ctx.setTransform(1,0,0,1,0,0);
      const g = ctx.createRadialGradient(w/2,h*0.45,0,w/2,h*0.45,Math.max(w,h)*0.7);
      g.addColorStop(0, "#1a140c"); g.addColorStop(0.5, "#0c0a07"); g.addColorStop(1, "#050403");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
      const t = ts * 0.001;
      ctx.save();
      ctx.translate(w/2, h*0.42);
      const R = Math.min(w,h)*0.28;
      ctx.strokeStyle = "rgba(212,170,80,0.35)";
      ctx.lineWidth = 2 * s.dpr;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0,0, R*(0.7+i*0.18), 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.rotate(t*0.05);
      for (let i = 0; i < 20; i++) {
        const a = i*Math.PI/10;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*R*0.85, Math.sin(a)*R*0.85);
        ctx.lineTo(Math.cos(a)*R*1.05, Math.sin(a)*R*1.05);
        ctx.strokeStyle = i%5===0 ? "rgba(228,195,122,0.8)" : "rgba(154,117,64,0.5)";
        ctx.lineWidth = (i%5===0?2.5:1.2)*s.dpr;
        ctx.stroke();
      }
      ctx.restore();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function stop() { alive = false; };
  }

  /* ---------------- Glyphen ---------------- */
  function stroke(ctx, fn, opts) {
    const o = opts || {};
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = o.stroke || GOLD;
    ctx.fillStyle = o.fill || "rgba(228,195,122,0.08)";
    ctx.lineWidth = o.width || 2.2;
    ctx.shadowColor = o.glow || "rgba(228,195,122,0.45)";
    ctx.shadowBlur = o.blur != null ? o.blur : 8;
    fn(ctx);
    ctx.restore();
  }

  const GLYPHS = [
    // 0 Imix – Quelle / Wasserlilie
    function (c) {
      c.beginPath(); c.ellipse(0, 0.15, 0.55, 0.38, 0, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(0, 0.05, 0.18, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(-0.7, 0.55); c.quadraticCurveTo(0, 0.2, 0.7, 0.55); c.stroke();
      c.beginPath(); c.moveTo(0, -0.7); c.lineTo(0, -0.15); c.stroke();
    },
    // 1 Ik' – Wind
    function (c) {
      c.beginPath(); c.moveTo(-0.15, -0.7); c.lineTo(-0.15, 0.7); c.stroke();
      c.beginPath(); c.moveTo(-0.15, -0.15); c.lineTo(0.65, -0.15); c.stroke();
      c.beginPath(); c.moveTo(0.15, -0.5); c.quadraticCurveTo(0.8, -0.7, 0.7, 0.05); c.stroke();
      c.beginPath(); c.moveTo(0.2, 0.2); c.quadraticCurveTo(0.85, 0.0, 0.6, 0.55); c.stroke();
    },
    // 2 Ak'b'al – Nacht / Haus
    function (c) {
      c.beginPath(); c.moveTo(0, -0.75); c.lineTo(0.65, -0.15); c.lineTo(0.65, 0.65); c.lineTo(-0.65, 0.65); c.lineTo(-0.65, -0.15); c.closePath(); c.stroke();
      c.beginPath(); c.arc(0, 0.15, 0.28, 0.2*Math.PI, 1.6*Math.PI); c.stroke();
    },
    // 3 K'an – Samen
    function (c) {
      c.beginPath(); c.moveTo(0, -0.7); c.lineTo(0.55, 0); c.lineTo(0, 0.7); c.lineTo(-0.55, 0); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(0, -0.35); c.lineTo(0.28, 0); c.lineTo(0, 0.35); c.lineTo(-0.28, 0); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-0.25, -0.35); c.lineTo(0.25, 0.35); c.moveTo(0.25, -0.35); c.lineTo(-0.25, 0.35); c.stroke();
    },
    // 4 Chikchan – Schlange
    function (c) {
      c.beginPath();
      c.moveTo(-0.7, 0.45);
      c.bezierCurveTo(-0.3, -0.8, 0.3, 0.8, 0.55, -0.15);
      c.stroke();
      c.beginPath(); c.arc(0.58, -0.22, 0.12, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(0.7, -0.3); c.lineTo(0.85, -0.5); c.moveTo(0.7, -0.15); c.lineTo(0.88, -0.1); c.stroke();
    },
    // 5 Kimi – Wandel (stilisierter Schädel-Kreis, geometrisch)
    function (c) {
      c.beginPath(); c.arc(0, -0.1, 0.5, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(-0.18, -0.18, 0.1, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(0.18, -0.18, 0.1, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(-0.28, 0.35); c.lineTo(-0.28, 0.55); c.lineTo(0.28, 0.55); c.lineTo(0.28, 0.35); c.stroke();
      c.beginPath(); c.moveTo(-0.1, 0.35); c.lineTo(-0.1, 0.55); c.moveTo(0.1, 0.35); c.lineTo(0.1, 0.55); c.stroke();
    },
    // 6 Manik' – Hand
    function (c) {
      c.beginPath();
      c.moveTo(-0.45, 0.55); c.lineTo(-0.45, -0.05);
      c.quadraticCurveTo(-0.45, -0.55, 0, -0.65);
      c.quadraticCurveTo(0.45, -0.55, 0.45, -0.05);
      c.lineTo(0.45, 0.55);
      c.stroke();
      for (let i = 0; i < 4; i++) {
        const x = -0.28 + i * 0.18;
        c.beginPath(); c.moveTo(x, -0.2); c.lineTo(x, -0.75); c.stroke();
      }
    },
    // 7 Lamat – Stern / Venus
    function (c) {
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI/2 + i*Math.PI/4;
        const rr = i%2===0 ? 0.75 : 0.32;
        const x = Math.cos(a)*rr, y = Math.sin(a)*rr;
        if (i===0) c.moveTo(x,y); else c.lineTo(x,y);
      }
      c.closePath(); c.stroke();
      c.beginPath(); c.arc(0,0,0.14,0,Math.PI*2); c.stroke();
    },
    // 8 Muluk – Wasser / Jade
    function (c) {
      c.beginPath(); c.arc(0, 0.05, 0.55, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(0, -0.85); c.quadraticCurveTo(0.35, -0.4, 0, 0.0); c.quadraticCurveTo(-0.35, -0.4, 0, -0.85); c.stroke();
      c.beginPath(); c.moveTo(-0.35, 0.25); c.quadraticCurveTo(0, 0.05, 0.35, 0.25); c.quadraticCurveTo(0, 0.5, -0.35, 0.25); c.stroke();
    },
    // 9 Ok – Weg / Hund (spitzes Ohr, Führung)
    function (c) {
      c.beginPath();
      c.moveTo(-0.15, 0.65); c.lineTo(-0.4, 0.05); c.lineTo(-0.15, -0.35);
      c.lineTo(-0.45, -0.75); c.lineTo(0.1, -0.4); c.lineTo(0.5, -0.15);
      c.quadraticCurveTo(0.65, 0.25, 0.2, 0.65);
      c.closePath(); c.stroke();
      c.beginPath(); c.arc(0.15, -0.05, 0.08, 0, Math.PI*2); c.stroke();
    },
    // 10 Chuwen – Spiel / Weben
    function (c) {
      c.beginPath();
      c.arc(0, 0, 0.25, 0, Math.PI*1.7);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, 0.48, 0.4, Math.PI*2.1);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, 0.7, -0.5, Math.PI*1.5);
      c.stroke();
    },
    // 11 Eb' – Schwelle / Treppe
    function (c) {
      c.beginPath();
      c.moveTo(-0.7, 0.65);
      c.lineTo(-0.25, 0.65); c.lineTo(-0.25, 0.2);
      c.lineTo(0.2, 0.2); c.lineTo(0.2, -0.25);
      c.lineTo(0.65, -0.25); c.lineTo(0.65, -0.7);
      c.stroke();
      c.beginPath(); c.moveTo(-0.7, 0.65); c.lineTo(0.65, -0.7); c.stroke();
    },
    // 12 B'en – Schilf
    function (c) {
      for (let i = -1; i <= 1; i++) {
        const x = i * 0.32;
        c.beginPath(); c.moveTo(x, 0.7); c.quadraticCurveTo(x + 0.12, 0, x, -0.7); c.stroke();
        c.beginPath(); c.moveTo(x, -0.25); c.quadraticCurveTo(x + 0.28, -0.45, x + 0.12, -0.7); c.stroke();
      }
    },
    // 13 Ix – Erde / Jaguar
    function (c) {
      c.beginPath(); c.ellipse(0, 0.05, 0.55, 0.48, 0, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(-0.4, -0.35); c.lineTo(-0.55, -0.75); c.lineTo(-0.1, -0.4); c.stroke();
      c.beginPath(); c.moveTo(0.4, -0.35); c.lineTo(0.55, -0.75); c.lineTo(0.1, -0.4); c.stroke();
      c.beginPath(); c.arc(-0.18, -0.02, 0.08, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(0.18, -0.02, 0.08, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(-0.4, 0.25, 0.05, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(0.42, 0.22, 0.05, 0, Math.PI*2); c.stroke();
    },
    // 14 Men – Adler
    function (c) {
      c.beginPath();
      c.moveTo(-0.85, 0.15); c.quadraticCurveTo(-0.4, -0.55, 0, -0.15);
      c.quadraticCurveTo(0.4, -0.55, 0.85, 0.15);
      c.stroke();
      c.beginPath(); c.moveTo(-0.15, -0.1); c.lineTo(0, 0.2); c.lineTo(0.15, -0.1); c.stroke();
      c.beginPath(); c.moveTo(0, 0.2); c.lineTo(0, 0.65); c.stroke();
      c.beginPath(); c.moveTo(-0.25, 0.65); c.lineTo(0, 0.45); c.lineTo(0.25, 0.65); c.stroke();
    },
    // 15 K'ib' – Klärung / zwei Augen
    function (c) {
      c.beginPath(); c.moveTo(0, -0.8); c.quadraticCurveTo(0.5, -0.2, 0, 0.75); c.quadraticCurveTo(-0.5, -0.2, 0, -0.8); c.stroke();
      c.beginPath(); c.arc(-0.0, -0.15, 0.22, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(0, -0.15, 0.08, 0, Math.PI*2); c.stroke();
    },
    // 16 Kab'an – Bewegung / Erde
    function (c) {
      c.beginPath(); c.arc(0, 0, 0.62, 0, Math.PI*2); c.stroke();
      c.beginPath();
      c.moveTo(-0.5, 0.1); c.lineTo(-0.2, -0.2); c.lineTo(0.05, 0.2); c.lineTo(0.35, -0.15); c.lineTo(0.55, 0.15);
      c.stroke();
      c.beginPath(); c.moveTo(-0.15, 0.45); c.lineTo(0.2, 0.45); c.stroke();
    },
    // 17 Etz'nab' – Feuerstein
    function (c) {
      c.beginPath(); c.moveTo(0, -0.8); c.lineTo(0.35, 0.15); c.lineTo(0, 0.75); c.lineTo(-0.35, 0.15); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(0, -0.8); c.lineTo(0, 0.75); c.stroke();
      c.beginPath(); c.moveTo(-0.7, -0.15); c.lineTo(0.7, 0.15); c.stroke();
    },
    // 18 Kawak – Sturm
    function (c) {
      c.beginPath();
      c.moveTo(-0.65, -0.15);
      c.quadraticCurveTo(-0.6, -0.65, -0.15, -0.6);
      c.quadraticCurveTo(0.05, -0.95, 0.4, -0.6);
      c.quadraticCurveTo(0.85, -0.55, 0.7, -0.1);
      c.lineTo(-0.65, -0.15);
      c.stroke();
      c.beginPath(); c.moveTo(0.05, -0.05); c.lineTo(-0.15, 0.25); c.lineTo(0.15, 0.28); c.lineTo(-0.05, 0.75); c.stroke();
      c.beginPath();
      c.moveTo(-0.45, 0.25); c.lineTo(-0.45, 0.5);
      c.moveTo(-0.25, 0.35); c.lineTo(-0.25, 0.62);
      c.moveTo(0.4, 0.3); c.lineTo(0.4, 0.58);
      c.stroke();
    },
    // 19 Ajaw – Sonne
    function (c) {
      c.beginPath(); c.arc(0, 0, 0.34, 0, Math.PI*2); c.stroke();
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8;
        const inner = i % 2 === 0 ? 0.44 : 0.40;
        const outer = i % 2 === 0 ? 0.78 : 0.62;
        c.beginPath();
        c.moveTo(Math.cos(a)*inner, Math.sin(a)*inner);
        c.lineTo(Math.cos(a)*outer, Math.sin(a)*outer);
        c.stroke();
      }
      c.beginPath(); c.arc(0, 0, 0.16, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(-0.16, 0); c.lineTo(0.16, 0); c.stroke();
      c.beginPath(); c.moveTo(0, -0.16); c.lineTo(0, 0.16); c.stroke();
    }
  ];

  function drawGlyph(ctx, index, x, y, size, opts) {
    ctx.save();
    ctx.translate(x, y);
    const scale = size / 2;
    const o = opts || {};
    const blur = (o.blur != null ? o.blur : 8) / scale;
    const width = (o.width != null ? o.width : 2.2) / scale;
    ctx.scale(scale, scale);
    stroke(ctx, GLYPHS[((index % 20) + 20) % 20], Object.assign({}, o, { width: width, blur: blur }));
    ctx.restore();
  }

  /* Maya-Balken und -Punkte (1–13) */
  function drawBarsDots(ctx, n, x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color || GOLD;
    ctx.shadowColor = "rgba(228,195,122,0.4)";
    ctx.shadowBlur = 6;
    const bars = Math.floor(n / 5);
    const dots = n % 5;
    const bw = 36 * scale, bh = 7 * scale, gap = 8 * scale;
    let y0 = 0;
    if (dots) {
      const dw = 8 * scale;
      const total = dots * dw * 2;
      let x0 = -total / 2 + dw;
      for (let i = 0; i < dots; i++) {
        ctx.beginPath();
        ctx.arc(x0 + i * dw * 2, y0, dw * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      y0 += 14 * scale;
    }
    for (let i = 0; i < bars; i++) {
      roundRect(ctx, -bw / 2, y0, bw, bh, 2 * scale);
      ctx.fill();
      y0 += gap;
    }
    ctx.restore();
    return y0;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawWheel(canvas, tz, t) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.48;
    const time = t || 0;

    // outer ring
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(228,195,122,0.35)"; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(228,195,122,0.2)"; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // 260 micro-ticks on outer rim
    for (let i = 0; i < 260; i++) {
      const a = -Math.PI / 2 + (i / 260) * Math.PI * 2;
      const isCur = i + 1 === tz.kin;
      const r0 = R * (isCur ? 0.88 : 0.92);
      const r1 = R * 0.98;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.strokeStyle = isCur ? "rgba(255,230,170,1)" : (i % 13 === 0 ? "rgba(228,195,122,0.55)" : "rgba(228,195,122,0.18)");
      ctx.lineWidth = isCur ? 2.4 : 1;
      ctx.stroke();
    }

    // 20 signs, current at top
    const rot = -tz.signIndex * (Math.PI * 2 / 20);
    for (let i = 0; i < 20; i++) {
      const a = -Math.PI / 2 + rot + i * Math.PI * 2 / 20;
      const rx = cx + Math.cos(a) * R * 0.78;
      const ry = cy + Math.sin(a) * R * 0.78;
      const cur = i === tz.signIndex;
      drawGlyph(ctx, i, rx, ry, cur ? R * 0.22 : R * 0.15, {
        stroke: cur ? "#ffe7ad" : GOLD_DIM,
        width: cur ? 1.8 : 1.2,
        blur: cur ? 10 : 0
      });
    }

    // 13 tones inner
    const rotN = -(tz.number - 1) * (Math.PI * 2 / 13);
    ctx.font = "600 " + Math.max(9, R * 0.07) + "px Cinzel, serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 1; i <= 13; i++) {
      const a = -Math.PI / 2 + rotN + (i - 1) * Math.PI * 2 / 13;
      const rx = cx + Math.cos(a) * R * 0.56;
      const ry = cy + Math.sin(a) * R * 0.56;
      const cur = i === tz.number;
      ctx.fillStyle = cur ? "#ffe7ad" : "rgba(212,170,80,0.55)";
      ctx.shadowColor = cur ? "rgba(228,195,122,0.8)" : "transparent";
      ctx.shadowBlur = cur ? 8 : 0;
      ctx.fillText(String(i), rx, ry);
    }

    // center
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(12,10,7,0.85)";
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(228,195,122,0.45)"; ctx.lineWidth = 1.2; ctx.stroke();
    drawGlyph(ctx, tz.signIndex, cx, cy - R * 0.02, R * 0.32, { width: 2, blur: 8 });
  }

  global.ChronosGfx = { startBackground, drawGlyph, drawBarsDots, drawWheel, GOLD };
})(window);
