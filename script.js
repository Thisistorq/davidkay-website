// Netlify's invite/"forgot password" emails link to the site's own root
// (not to admin.html), landing here with #invite_token=/#recovery_token=
// in the URL. Send it straight on to the admin panel, which knows how to
// turn that into a "set your password" step.
if (/[#&](invite_token|recovery_token)=/.test(location.hash)) {
  location.replace('/admin.html' + location.hash);
}

document.addEventListener('DOMContentLoaded', function () {
  var copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

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

  var revealTiles = Array.prototype.slice.call(document.querySelectorAll('.photo-tile, .slide-in-left'));
  if (revealTiles.length) {
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealTiles.forEach(function (tile) { revealObserver.observe(tile); });
    } else {
      revealTiles.forEach(function (tile) { tile.classList.add('is-visible'); });
    }
  }

  var lightbox = document.getElementById('lightbox');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.photo-tile'));
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
