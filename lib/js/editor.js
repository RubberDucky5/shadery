// Setup Editor
let editor = ace.edit("editorCode");
const defaultText = "#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform vec2 iResolution;\nuniform float iTime;\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / iResolution;\n  vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx + vec3(0,2,4));\n    gl_FragColor = vec4(col, 0);\n}";
editor.setTheme("ace/theme/crimson_editor");
editor.session.setMode("ace/mode/glsl");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
});
editor.setValue(defaultText, -1);

// Setup Canvas
let ctx = document.getElementById("editorWindow").getContext('webgl2');
