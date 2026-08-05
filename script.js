/* =========================================
   IORBALDO - JAVASCRIPT INTERACTIONS
   ========================================= */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        initHeaderScroll();
        initMobileMenu();
        initSmoothScroll();
        initScrollReveal();
        initCounters();
        initHeroSlider();
        initHeroParallax();
        initContactForm();
        initActiveNav();
    });

    /* -------- HEADER SCROLL EFFECT -------- */
    function initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        const toggleHeader = () => {
            if (window.scrollY > 80) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        toggleHeader();
        window.addEventListener('scroll', throttle(toggleHeader, 16));
    }

    /* -------- MOBILE MENU -------- */
    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
        if (!hamburger || !navMenu || !mobileMenuBackdrop) return;

        const setMenuState = (isOpen) => {
            hamburger.classList.toggle('active', isOpen);
            navMenu.classList.toggle('active', isOpen);
            mobileMenuBackdrop.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        hamburger.addEventListener('click', () => {
            setMenuState(!navMenu.classList.contains('active'));
        });

        // Close menu on link click
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                setMenuState(false);
            });
        });

        mobileMenuBackdrop.addEventListener('click', () => {
            setMenuState(false);
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                setMenuState(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                setMenuState(false);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 960) {
                setMenuState(false);
            }
        });
    }

    /* -------- SMOOTH SCROLL -------- */
    function initSmoothScroll() {
        // Already handled by CSS scroll-behavior, but add backup for older browsers
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#' || href.length < 2) return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerHeight = document.getElementById('header')?.offsetHeight || 90;
                    const offset = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;
                    
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /* -------- SCROLL REVEAL (Fade In) -------- */
    function initScrollReveal() {
        const elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Stagger siblings
                    const parent = entry.target.parentElement;
                    const siblings = parent ? Array.from(parent.querySelectorAll('.reveal')) : [entry.target];
                    const delay = siblings.indexOf(entry.target) * 100;
                    
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -60px 0px'
        });

        elements.forEach(el => observer.observe(el));
    }

    /* -------- NUMBER COUNTERS -------- */
    function initCounters() {
        const counters = document.querySelectorAll('.number-counter');
        if (!counters.length) return;

        let countersStarted = false;

        const startCounters = () => {
            if (countersStarted) return;
            countersStarted = true;

            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'), 10) || 0;
                const duration = 2000; // ms
                const startTime = performance.now();

                const updateCounter = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Ease out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.round(eased * target);
                    
                    counter.textContent = current;

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };

                requestAnimationFrame(updateCounter);
            });
        };

        const numbersSection = document.querySelector('.numbers');
        if (!numbersSection) {
            startCounters();
            return;
        }

        if (!('IntersectionObserver' in window)) {
            startCounters();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startCounters();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.4 });

        observer.observe(numbersSection);
    }

    function initHeroSlider() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const slides = hero.querySelectorAll('.hero-slide');
        if (slides.length < 2) return;

        const brands = hero.querySelectorAll('.hero-brand');
        const mqMobile = window.matchMedia('(max-width: 768px)');

        const preloadCache = new Map();

        const preload = (src) => {
            if (!src) return Promise.resolve();
            if (preloadCache.has(src)) return preloadCache.get(src);

            const img = new Image();
            img.decoding = 'async';
            img.src = src;

            const promise = (typeof img.decode === 'function')
                ? img.decode().catch(() => {})
                : new Promise((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });

            preloadCache.set(src, promise);
            return promise;
        };

        const getSlideSrc = (slide) => {
            const useMobile = mqMobile.matches;
            return useMobile ? slide.getAttribute('data-mobile') : slide.getAttribute('data-desktop');
        };

        const applyHeroImages = () => {
            slides.forEach(slide => {
                const src = getSlideSrc(slide);
                if (!src) return;
                if (slide.dataset.currentSrc === src) return;

                preload(src).finally(() => {
                    slide.style.backgroundImage = `url("${src}")`;
                    slide.dataset.currentSrc = src;
                });
            });
        };

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            applyHeroImages();
            slides.forEach((s, i) => s.classList.toggle('active', i === 0));
            if (brands.length) {
                brands.forEach((b, i) => b.classList.toggle('active', i === 0));
            }
            return;
        }

        let currentIndex = 0;
        let timer = null;
        const intervalMs = 5200;
        let transitioning = false;

        const goTo = (index) => {
            if (transitioning) return;
            transitioning = true;

            const nextIndex = (index + slides.length) % slides.length;
            const nextSlide = slides[nextIndex];
            const nextSrc = getSlideSrc(nextSlide);

            preload(nextSrc).finally(() => {
                slides[currentIndex].classList.remove('active');
                if (brands[currentIndex]) brands[currentIndex].classList.remove('active');

                currentIndex = nextIndex;
                slides[currentIndex].classList.add('active');
                slides[currentIndex].style.backgroundPosition = 'center';
                if (brands[currentIndex]) brands[currentIndex].classList.add('active');

                const warmIndex = (currentIndex + 1) % slides.length;
                preload(getSlideSrc(slides[warmIndex]));

                setTimeout(() => {
                    transitioning = false;
                }, 980);
            });
        };

        const start = () => {
            if (timer) return;
            timer = setInterval(() => goTo(currentIndex + 1), intervalMs);
        };

        const stop = () => {
            if (!timer) return;
            clearInterval(timer);
            timer = null;
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else start();
        });

        applyHeroImages();
        preload(getSlideSrc(slides[0]));
        preload(getSlideSrc(slides[1]));

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(applyHeroImages, 120);
        });

        start();
    }

    /* -------- HERO PARALLAX (Leggero) -------- */
    function initHeroParallax() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        let ticking = false;

        const updateParallax = () => {
            const scrollY = window.scrollY;
            if (scrollY < window.innerHeight) {
                const offset = scrollY * 0.35;
                const target = hero.querySelector('.hero-slide.active') || hero;
                target.style.backgroundPosition = `center calc(50% + ${offset}px)`;
            }
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    /* -------- CONTACT FORM -------- */
    function initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Validate (basic)
            const requiredFields = form.querySelectorAll('[required]');
            let valid = true;
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    field.style.borderColor = '#e74c3c';
                } else {
                    field.style.borderColor = '';
                }
            });

            if (!valid) {
                shakeElement(form);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Apertura mail...
            `;

            const name = (form.querySelector('#name')?.value || '').trim();
            const surname = (form.querySelector('#surname')?.value || '').trim();
            const email = (form.querySelector('#email')?.value || '').trim();
            const phone = (form.querySelector('#phone')?.value || '').trim();
            const message = (form.querySelector('#message')?.value || '').trim();

            const to = 'info@iorbaldo.it';
            const subject = `Richiesta dal sito - ${name} ${surname}`.trim();
            const body = [
                `Nome: ${name}`,
                `Cognome: ${surname}`,
                `Email: ${email}`,
                `Telefono: ${phone || '-'}`,
                '',
                'Messaggio:',
                message
            ].join('\n');

            const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;

            setTimeout(() => {
                form.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 800);
        });
    }

    /* -------- ACTIVE NAV ON SCROLL -------- */
    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        if (!sections.length || !navLinks.length) return;

        const updateActive = () => {
            const scrollY = window.scrollY;
            const headerHeight = document.getElementById('header')?.offsetHeight || 90;
            const padding = headerHeight + 100;

            let currentSection = '';

            sections.forEach(section => {
                const top = section.offsetTop - padding;
                const height = section.offsetHeight;
                
                if (scrollY >= top && scrollY < top + height) {
                    currentSection = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                const href = link.getAttribute('href').replace('#', '');
                link.classList.toggle('active', href === currentSection);
            });
        };

        updateActive();
        window.addEventListener('scroll', throttle(updateActive, 100));
    }

    /* =========================================
       UTILITY FUNCTIONS
       ========================================= */

    // Throttle
    function throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Shake animation for invalid form
    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight; // trigger reflow
        el.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => {
            el.style.animation = '';
        }, 400);
    }

    // Simple toast notification
    function showToast(message) {
        const existing = document.querySelector('.custom-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            backgroundColor: '#243256',
            color: '#fff',
            padding: '16px 28px',
            borderRadius: '8px',
            boxShadow: '0 12px 30px rgba(36,50,86,0.4)',
            zIndex: '99999',
            fontSize: '0.95rem',
            fontWeight: '500',
            opacity: '0',
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            maxWidth: '90vw'
        });

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // Inject keyframe animations used above
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

})();
