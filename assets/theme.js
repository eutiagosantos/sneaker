(function () {
  'use strict';

  function initMobileMenu() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var toggle = header.querySelector('[data-menu-toggle]');
    var menu = header.querySelector('[data-mobile-menu]');
    var closeBtn = header.querySelector('[data-menu-close]');

    if (!toggle || !menu) return;

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    menu.addEventListener('click', function (event) {
      if (event.target === menu) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) closeMenu();
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    if (slides.length < 2) return;

    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;
    var timer;

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, 6000);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
    }

    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');

    if (prev) {
      prev.addEventListener('click', function () {
        goTo(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        goTo(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goTo(Number(dot.getAttribute('data-hero-dot')));
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function initProductRails() {
    document.querySelectorAll('[data-product-rail]').forEach(function (rail) {
      var track = rail.querySelector('[data-rail-track]');
      var prev = rail.querySelector('[data-rail-prev]');
      var next = rail.querySelector('[data-rail-next]');
      if (!track) return;

      var step = function () {
        return Math.max(track.clientWidth * 0.8, 220);
      };

      if (prev) {
        prev.addEventListener('click', function () {
          track.scrollBy({ left: -step(), behavior: 'smooth' });
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          track.scrollBy({ left: step(), behavior: 'smooth' });
        });
      }
    });
  }

  function initProductGallery() {
    var section = document.querySelector('[data-product-section]');
    if (!section) return;

    var items = Array.prototype.slice.call(section.querySelectorAll('.product__media-item'));
    var thumbs = Array.prototype.slice.call(section.querySelectorAll('[data-thumb-index]'));
    if (!items.length || !thumbs.length) return;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var index = Number(thumb.getAttribute('data-thumb-index'));
        items.forEach(function (item, i) {
          item.classList.toggle('is-active', i === index);
        });
        thumbs.forEach(function (btn, i) {
          btn.classList.toggle('is-active', i === index);
        });
      });
    });
  }

  function initVariantSelector() {
    var section = document.querySelector('[data-product-section]');
    if (!section) return;

    var jsonEl = section.querySelector('[data-product-json]');
    var form = section.querySelector('form[action*="/cart/add"]');
    if (!jsonEl || !form) return;

    var product;
    try {
      product = JSON.parse(jsonEl.textContent);
    } catch (error) {
      return;
    }

    var optionSelects = Array.prototype.slice.call(form.querySelectorAll('[data-option-index]'));
    var variantInput = form.querySelector('[data-product-variant-id]');
    var submit = form.querySelector('[type="submit"]');
    var priceContainer = section.querySelector('[id^="price-"]');

    if (!optionSelects.length || !variantInput) return;

    function currentOptions() {
      return optionSelects
        .sort(function (a, b) {
          return Number(a.getAttribute('data-option-index')) - Number(b.getAttribute('data-option-index'));
        })
        .map(function (select) {
          return select.value;
        });
    }

    function findVariant(options) {
      return product.variants.find(function (variant) {
        return options.every(function (option, index) {
          return variant['option' + (index + 1)] === option;
        });
      });
    }

    function formatMoney(cents) {
      try {
        return (cents / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'BRL'
        });
      } catch (error) {
        return 'R$ ' + (cents / 100).toFixed(2).replace('.', ',');
      }
    }

    function updatePrice(variant) {
      if (!priceContainer || !variant) return;
      var html = '<div class="price';
      if (variant.compare_at_price > variant.price) {
        var discount = Math.round(((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price);
        html +=
          '<div class="price__container price--on-sale">' +
          '<span class="price__sale"><span class="price-item price-item--sale">' +
          formatMoney(variant.price) +
          '</span></span>' +
          '<span class="price__compare"><s class="price-item price-item--regular">' +
          formatMoney(variant.compare_at_price) +
          '</s></span>' +
          '<span class="price__badge price__badge--sale">-' +
          discount +
          '%</span></div>';
      } else {
        html +=
          '<div class="price__container"><span class="price__regular"><span class="price-item price-item--regular">' +
          formatMoney(variant.price) +
          '</span></span></div>';
      }
      html += '</div>';
      priceContainer.innerHTML = html;
    }

    function onChange() {
      var variant = findVariant(currentOptions());
      if (!variant) {
        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Indisponível';
        }
        return;
      }

      variantInput.value = variant.id;
      updatePrice(variant);

      if (submit) {
        submit.disabled = !variant.available;
        submit.textContent = variant.available ? 'Adicionar ao carrinho' : 'Esgotado';
      }

      if (variant && history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    optionSelects.forEach(function (select) {
      select.addEventListener('change', onChange);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initProductRails();
    initProductGallery();
    initVariantSelector();
  });
})();
