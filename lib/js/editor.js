try {
// Setup Editor
let editor = ace.edit("editorCode");
const defaultText = `uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform vec2 iMouse2;

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	vec2 uv = fragCoord.xy/iResolution.xy;
	fragColor = vec4(0.5 + 0.5*sin(uv.xyx+iTime + vec3(0, 2, 4)), 1.0);
}`
editor.setTheme("ace/theme/crimson_editor");
editor.session.setMode("ace/mode/glsl");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
});
editor.setValue(defaultText, -1);

//Boilerplate
const vertex_boil = `#version 300 es
in vec4 position;
void main()
    {gl_Position = vec4(position.xy,0.,1.);
}`
const preboiler = `#version 300 es
precision highp float;
out vec4 myOutputColor;
`;

const runFunc = `
void main() {
	mainImage(myOutputColor,vec2(gl_FragCoord.x, gl_FragCoord.y));
}`;

// Setup Canvas
let gl = document.getElementById("editorWindow").getContext('webgl2');
let canvas = document.getElementById("editorWindow");

let resY = canvas.clientHeight;
let resX = canvas.clientWidth;

let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX - canvas.offsetLeft;
    mouseY = resY - (event.clientY - canvas.offsetTop);
});

gl.canvas.width = gl.canvas.clientWidth;
gl.canvas.height = gl.canvas.clientHeight;

// Function to handle shader errors
function sendError(e) {
    let sel = /(?<=:)\d+/;

    let lineNum = e.match(sel)[0]-3;
    e = e.replace(sel, lineNum);

    editor.getSession().setAnnotations([{
        row: lineNum - 1,
        column: 0,
        text: e,
        type: "error"
      }]);
    }
function clearErrors() {
    editor.getSession().setAnnotations([]);
}
editor.getSession().on('change', clearErrors);

// Function To set the shader
let program;
function setShader(vsource, fsource) {
    let prog = gl.createProgram();

    vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsource);
    gl.compileShader(vs);
    if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
        alert(gl.getShaderInfoLog(vs));
    
    fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsource);
    gl.compileShader(fs);
    if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
        sendError(gl.getShaderInfoLog(fs));
    
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(prog));

    gl.useProgram(prog);

    //https://github.com/xem/MiniShadertoy/blob/gh-pages/index.html
    let buff = gl.ARRAY_BUFFER;
    gl.bindBuffer(buff,gl.createBuffer());
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0,2,gl.BYTE,0,0,0);
    gl.bufferData(buff,new Int8Array([-3,1,1,-3,1,1]),gl.STATIC_DRAW);

    program = prog;

    gl.uniform2f(gl.getUniformLocation(prog,"iResolution"), canvas.clientWidth, canvas.clientHeight);
}

setShader(vertex_boil, preboiler.concat(editor.getValue(), runFunc));
gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);

let startTs;
let setTs = true;

// Compile Code
let exec_btn = document.getElementById("editor__run");
exec_btn.addEventListener("click", () => {
    setShader(vertex_boil, preboiler.concat(editor.getValue(), runFunc));
    setTs = true;
});

// "Draw Loop"
function animate(ts){
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
    if(setTs){
        startTs = ts;
        setTs = false;
    }

    let timee = ts - startTs;

    let resY = canvas.clientHeight;
    let resX = canvas.clientWidth;
    gl.uniform2f(gl.getUniformLocation(program,"iResolution"), resX, resY);

    gl.uniform2f(gl.getUniformLocation(program,"iMouse"), mouseX, mouseY);
    gl.uniform1f(gl.getUniformLocation(program,"iTime"), timee / 1500);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);

    window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
}catch(e){
    alert(e);
}