const canvasDiv = document.querySelector('#canvas');
const hiddenInput = document.querySelector('#hidden');

if (canvasDiv) {
  // new position from mouse event
  const setPosition = (e) => {
    pos.x = e.clientX - canvas.offsetLeft;
    pos.y = e.clientY - canvas.offsetTop;
  };

  // resize canvas
  const resize = () => {
    ctx.canvas.width = canvasDiv.clientWidth - 2;
    ctx.canvas.height = 150;
  };

  const draw = (e) => {
    // mouse left button must be pressed
    if (e.buttons !== 1) return;

    ctx.beginPath(); // begin

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
  };

  const updateForm = () => {
    hiddenInput.value = canvas.toDataURL('image/png');
  };

  const canvas = document.createElement('canvas');
  canvasDiv.appendChild(canvas);
  document.body.style.margin = 0;
  canvas.style.border = '1px solid white';
  canvas.style.boxSizing = 'border-box';

  // last known position
  let pos = { x: 0, y: 0 };

  // get canvas 2D context and set him correct size
  let ctx = canvas.getContext('2d');
  resize();

  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mousedown', setPosition);
  canvas.addEventListener('mouseenter', setPosition);
  canvas.addEventListener('mouseup', updateForm);
  canvas.addEventListener('mouseleave', updateForm);
}
