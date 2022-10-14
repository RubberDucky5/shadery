// Setup Editor
let editor = ace.edit("editorCode");
const defaultText = "uniform vec2 iResolution;\nuniform float iTime;\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / iResolution;\n  vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx + vec3(0,2,4));\n    gl_FragColor = vec4(col, 0);\n}";
editor.setTheme("ace/theme/crimson_editor");
editor.session.setMode("ace/mode/glsl");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
});
editor.setValue(defaultText, -1);

//Boilerplate
const vertex = "#ifdef GL_ES\nprecision highp float;\n#endif\nattribute vec3 aPosition;\nvoid main() {\n  vec4 positionVec4 = vec4(aPosition, 1.0);\n  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;\n  gl_Position = positionVec4;\n} "
const preboiler = "#ifdef GL_ES\nprecision mediump float;\n#endif\n";

// Setup Canvas
let gl = document.getElementById("editorWindow").getContext('webgl');
