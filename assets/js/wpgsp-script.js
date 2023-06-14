const seek = document.querySelector('.wpgsp-audio-seek');
const seekWidth = seek.clientWidth;
const count = Math.floor(seekWidth / 10);
alert(count)


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  

for(i = 0; i < count; i++){
  let bar = document.createElement('div');
  bar.className = 'wpgsp-bar';
  bar.style.height = getRandomInt(0, 60) + 'px';
  seek.append(bar);
}