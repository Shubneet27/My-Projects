const svg = document.getElementById("drawingArea");
let drawing = false, path;

function getPos(evt) {
  const rect = svg.getBoundingClientRect();
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

svg.addEventListener("mousedown", e => {
  drawing = true;
  const {x,y} = getPos(e);
  path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke","blue");
  path.setAttribute("fill","none");
  path.setAttribute("stroke-width","2");
  path.setAttribute("d",`M ${x} ${y}`);
  svg.appendChild(path);
});
svg.addEventListener("mousemove", e => {
  if(!drawing) return;
  const {x,y} = getPos(e);
  let d = path.getAttribute("d");
  d += ` L ${x} ${y}`;
  path.setAttribute("d", d);
});

window.addEventListener("mouseup", () => drawing=false);