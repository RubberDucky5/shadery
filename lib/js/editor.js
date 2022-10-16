// Setup Editor
let editor = ace.edit("editorCode");
const defaultText = `uniform vec2 iResolution;
uniform float iTime;

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
	mainImage(myOutputColor,gl_FragCoord.xy);
}`;

// Setup Canvas
let gl = document.getElementById("editorWindow").getContext('webgl2');
let canvas = document.getElementById("editorWindow");

gl.canvas.width = gl.canvas.clientWidth();
gl.canvas.height = gl.canvas.clientHeight();

// Function To set the shader
let program;
function setShader(vsource, fsource) {
    let prog = gl.createProgram();

    vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsource);
    gl.compileShader(vs);
    if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(vs));
    
    fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsource);
    gl.compileShader(fs);
    if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(fs));
    
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

    gl.uniform2f(gl.getUniformLocation(prog,"iResolution"), canvas.width, canvas.height);
}

setShader(vertex_boil, preboiler.concat(editor.getValue(), runFunc));
gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);

let startTs;
let setTs = true;

let exec_btn = document.getElementById("editor__run");
exec_btn.addEventListener("click", () => {
    setShader(vertex_boil, preboiler.concat(editor.getValue(), runFunc));
    setTs = true;
});


function animate(ts){
    if(setTs){
        startTs = ts;
        setTs = false;
    }

    let timee = ts - startTs;

    gl.uniform1f(gl.getUniformLocation(program,"iTime"), timee / 1500);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);

    window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
