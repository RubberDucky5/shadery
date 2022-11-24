try {
// Setup Editor
let editor = ace.edit("editorCode");
const defaultText = `void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	vec2 uv = fragCoord.xy/iResolution.xy;
	fragColor = vec4(0.5 + 0.5*sin(uv.xyx+iTime + vec3(0, 2, 4)), 1.0);
}`
editor.setTheme("ace/theme/one_dark");
editor.session.setMode("ace/mode/glsl");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
});
editor.setValue(defaultText, -1);

function loadFromURL (url){
    let params = new URLSearchParams(url.search);
    let data = params.get("data");
    console.log(data);
    if(data != null)
        editor.setValue(atob(data));
}
let u = new URL(window.location.href);
loadFromURL(u);


//Boilerplate
const vertex_boil = `#version 300 es
in vec4 position;
void main()
    {gl_Position = vec4(position.xy,0.,1.);
}`
const preboiler = `#version 300 es
precision highp float;
out vec4 myOutputColor;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform vec2 iMouse2;
uniform bool internal_paused;
`;

const runFunc = `
void main() {
	mainImage(myOutputColor,vec2(gl_FragCoord.x, gl_FragCoord.y));
}`;

// Setup Canvas
let gl = document.getElementById("editorWindow").getContext('webgl2');
let canvas = document.getElementById("editorWindow");
let resY = canvas.clientHeight;


let mouseX = 0;
let mouseY = 0;
let dmouseX = 0;
let dmouseY = 0;
let isMouseDown = false;
canvas.addEventListener('mousemove', (event) => {
    if(isMouseDown){
        dmouseX -= mouseX - (event.clientX - canvas.offsetLeft);
        dmouseY -= mouseY - ((resY / 2) - event.clientY - canvas.offsetTop);
    }

    mouseX = event.clientX - canvas.offsetLeft;
    mouseY = (resY / 2) - event.clientY - canvas.offsetTop;
});
window.addEventListener('mousedown', (event) => {
    isMouseDown = true;
});
window.addEventListener('mouseup', (event) => {
    isMouseDown = false;
});



gl.canvas.width = gl.canvas.clientWidth;
gl.canvas.height = gl.canvas.clientHeight;

// Function to handle shader errors
function sendError(e) {
    let sel = /(?<=:)\d+/g;

    let lineNum = e.match(sel)[0]-8;
    e = e.replaceAll(sel, lineNum);

    editor.getSession().setAnnotations([{
        row: lineNum - 1,
        column: 0,
        text: e,
        type: "error"
      }]);
      editor.gotoLine(lineNum, 0, true);
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
function compile(f) {
    setShader(vertex_boil, preboiler.concat(editor.getValue(), runFunc));
    setTs = true;
    dmouseX = 0;
    dmouseY = 0;
}
let dwnload = document.getElementById("dwnload");
function save(){
    let b = new Blob([editor.getValue()], {type: "text/plain"});
    dwnload.href = URL.createObjectURL(b);
    dwnload.click();
}
function loadAndSet (file) {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
        editor.setValue(event.target.result);
    });

    reader.readAsText(file);
}


let exec_btn = document.getElementById("editor__run");
let clickExec = () => {exec_btn.blur();exec_btn.click();exec_btn.focus({focusVisible: true});}
exec_btn.addEventListener("click", compile);
editor.commands.addCommand({
    name: 'Run',
    bindKey: {win: 'Ctrl-Enter', mac: 'Command-Enter'},
    exec: clickExec,
    readOnly: true
});

let save_btn = document.getElementById("editor__save");
save_btn.addEventListener("click", save);

let load_btn = document.getElementById("editor__load");
load_btn.addEventListener("change", (event) => {
    loadAndSet(event.target.files[0]);
});

let pause_btn = document.getElementById("editor__pause");
pause_btn.addEventListener("click", () => {
    setShader(vertex_boil, preboiler.concat(defaultText, runFunc));
});

let share_btn = document.getElementById("editor__share");
share_btn.addEventListener("click", () => {
    let url = location.href;
    url = new URL(url);
    let params = new URLSearchParams(url.search);
    params.set('data', btoa(editor.getValue()));
    url.search = params.toString();
    window.location.href = url.toString();
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

    gl.uniform2f(gl.getUniformLocation(program,"iMouse"), mouseX, mouseY);
    gl.uniform2f(gl.getUniformLocation(program,"iMouse2"), dmouseX, dmouseY);
    gl.uniform1f(gl.getUniformLocation(program,"iTime"), timee / 1500);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);

    window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
}catch(e){
    alert(e);
}