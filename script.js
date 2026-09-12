document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { links.classList.remove('open'); });
  });

  var track = document.querySelector('.gallery-track');
  var prevNav = document.querySelector('.carousel-prev');
  var nextNav = document.querySelector('.carousel-next');
  if (track && prevNav && nextNav) {
    var slides = Array.prototype.slice.call(track.querySelectorAll('.gallery-slide'));
    var currentIndex = function () {
      var trackRect = track.getBoundingClientRect();
      var center = trackRect.left + trackRect.width / 2;
      var closest = 0, closestDist = Infinity;
      slides.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var dist = Math.abs((r.left + r.width / 2) - center);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    };
    prevNav.addEventListener('click', function () {
      var idx = Math.max(0, currentIndex() - 1);
      slides[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    nextNav.addEventListener('click', function () {
      var idx = Math.min(slides.length - 1, currentIndex() + 1);
      slides[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  var lightbox = document.getElementById('lightbox');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.gallery-slide'));
  if (!lightbox || !tiles.length) return;

  var lbImg = lightbox.querySelector('.lightbox-img');
  var lbCaption = lightbox.querySelector('.lightbox-caption');
  var closeBtn = lightbox.querySelector('.lightbox-close');
  var prevBtn = lightbox.querySelector('.lightbox-prev');
  var nextBtn = lightbox.querySelector('.lightbox-next');
  var current = 0;

  function show(index) {
    current = (index + tiles.length) % tiles.length;
    var img = tiles[current].querySelector('img');
    lbImg.src = img.dataset.full || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = img.alt;
  }

  function open(index) {
    show(index);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  tiles.forEach(function (tile, i) {
    tile.addEventListener('click', function () { open(i); });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(current - 1); });
  nextBtn.addEventListener('click', function () { show(current + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
});
