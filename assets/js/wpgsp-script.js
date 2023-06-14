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
    let html_to_insert = '<div class="wpgsp-bar" style="height: ' + getRandomInt(0, 60) + 'px"></div>';
    seek.insertAdjacentHTML('beforeend', html_to_insert);
}