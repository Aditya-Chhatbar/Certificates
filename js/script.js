const certificateData = Array.isArray(window.certificateData) ? window.certificateData : [];
const searchInput = document.getElementById('certificate-search');
const filtersContainer = document.getElementById('category-filters');
const resultCount = document.getElementById('result-count');
const timeline = document.getElementById('timeline');
let selectedCategory = 'All';

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : null;
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (year < 1 || month < 1 || month > 12 || (day !== null && (day < 1 || day > daysInMonth[month - 1]))) {
    return null;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day || 1);
  date.setUTCHours(0, 0, 0, 0);
  const options = day === null
    ? { year: 'numeric', month: 'long', timeZone: 'UTC' }
    : { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };

  return {
    year,
    month,
    day,
    timestamp: date.getTime(),
    label: new Intl.DateTimeFormat('en', options).format(date)
  };
}

function getDateInfo(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const range = /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/.exec(value);
  if (range) {
    const start = parseDate(range[1]);
    const end = parseDate(range[2]);
    if (!start || !end || end.timestamp < start.timestamp) {
      return undefined;
    }

    const label = start.year === end.year && start.month === end.month
      ? `${new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(start.timestamp))} ${start.day}–${end.day}, ${start.year}`
      : `${start.label} – ${end.label}`;

    return { year: start.year, timestamp: start.timestamp, label, isRange: true };
  }

  const date = parseDate(value);
  return date ? { ...date, isRange: false } : undefined;
}

function hasSafeCertificatePath(path) {
  return typeof path === 'string'
    && path.startsWith('certificates/')
    && /\.pdf$/i.test(path)
    && path.split('/').every((part) => part && part !== '.' && part !== '..' && !/[?#]/.test(part));
}

function validateCertificates(entries) {
  return entries.reduce((validEntries, entry, index) => {
    const dateInfo = getDateInfo(entry.date);
    const isValid = typeof entry.title === 'string'
      && entry.title.trim() !== ''
      && typeof entry.category === 'string'
      && entry.category.trim() !== ''
      && typeof entry.description === 'string'
      && Array.isArray(entry.skills)
      && entry.skills.every((skill) => typeof skill === 'string')
      && hasSafeCertificatePath(entry.certificate)
      && dateInfo !== undefined;

    if (!isValid) {
      console.error(`Certificate entry ${index + 1} is invalid and was skipped.`);
      return validEntries;
    }

    if (entry.verification && !/^https?:\/\/\S+$/i.test(entry.verification)) {
      console.error(`Certificate entry "${entry.title}" has an invalid verification URL; it was omitted.`);
      validEntries.push({ ...entry, dateInfo, verification: '' });
      return validEntries;
    }

    validEntries.push({ ...entry, dateInfo });
    return validEntries;
  }, []);
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function createLink(label, href) {
  const link = createElement('a', 'entry-link', label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function createCertificateEntry(certificate) {
  const item = createElement('li', 'timeline-item');
  const article = createElement('article', 'certificate-card');
  const copy = createElement('div', 'certificate-copy');
  const category = createElement('span', 'certificate-category', certificate.category);
  const title = createElement('h3', 'entry-title', certificate.title);
  const meta = createElement('p', 'entry-meta');
  const organization = createElement('span', '', certificate.organization || 'Organization not listed');
  const description = createElement('p', 'entry-description', certificate.description);
  const topicList = createElement('ul', 'topic-list');
  const viewerWrap = createElement('div', 'certificate-pdf-wrap');
  const verificationLink = certificate.verification
    ? createLink('Official verification', certificate.verification)
    : null;

  if (certificate.dateInfo && !certificate.dateInfo.isRange) {
    const date = createElement(
      'time',
      '',
      certificate.dateInfo.label
    );
    date.dateTime = certificate.date;
    meta.append(organization, createElement('span', 'entry-meta-separator', '/'), date);
  } else {
    const date = createElement(
      'span',
      '',
      certificate.dateInfo ? certificate.dateInfo.label : 'Completion date not listed'
    );
    meta.append(organization, createElement('span', 'entry-meta-separator', '/'), date);
  }

  certificate.skills.forEach((skill) => {
    topicList.append(createElement('li', 'topic-tag', skill));
  });

  const viewer = document.createElement('iframe');
  viewer.className = 'certificate-pdf';
  viewer.src = `./${certificate.certificate}#toolbar=1&navpanes=0&view=FitH`;
  viewer.title = `Certificate document for ${certificate.title}`;
  viewer.loading = 'eager';
  viewer.referrerPolicy = 'no-referrer';
  const fallback = createElement('p', 'pdf-fallback', 'This browser cannot display embedded PDFs. ');
  const fallbackLink = createElement('a', '', 'Open the certificate PDF');
  fallbackLink.href = `./${certificate.certificate}`;
  fallbackLink.target = '_blank';
  fallbackLink.rel = 'noopener noreferrer';
  fallback.append(fallbackLink);
  viewer.append(fallback);

  copy.append(category, title, meta, description, topicList);
  if (verificationLink) {
    copy.append(verificationLink);
  }
  viewerWrap.append(viewer);
  article.append(copy, viewerWrap);
  item.append(article);
  return item;
}

function renderFilters(certificates) {
  const categories = Array.from(new Set(certificates.map((item) => item.category)))
    .sort((left, right) => left.localeCompare(right));
  const filters = ['All', ...categories];

  filtersContainer.replaceChildren();
  filters.forEach((category) => {
    const button = createElement('button', 'filter-button', category);
    button.type = 'button';
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(category === selectedCategory));
    filtersContainer.append(button);
  });
}

function getFilteredCertificates(certificates) {
  const query = searchInput.value.trim().toLocaleLowerCase();

  return certificates
    .filter((certificate) => {
      const matchesCategory = selectedCategory === 'All' || certificate.category === selectedCategory;
      const searchableText = [
        certificate.title,
        certificate.organization || '',
        certificate.category,
        certificate.description,
        ...certificate.skills
      ].join(' ').toLocaleLowerCase();
      return matchesCategory && searchableText.includes(query);
    })
    .sort((left, right) => {
      if (!left.dateInfo && !right.dateInfo) {
        return left.originalIndex - right.originalIndex;
      }
      if (!left.dateInfo) {
        return 1;
      }
      if (!right.dateInfo) {
        return -1;
      }
      return right.dateInfo.timestamp - left.dateInfo.timestamp;
    });
}

function renderTimeline(certificates) {
  const matches = getFilteredCertificates(certificates);
  const resultLabel = matches.length === 1 ? 'certification' : 'certifications';
  resultCount.textContent = `${matches.length} ${resultLabel}`;
  timeline.replaceChildren();

  if (matches.length === 0) {
    timeline.append(
      createElement(
        'p',
        'empty-state',
        'No certifications match your search. Try another title, organization, topic, or category.'
      )
    );
    return;
  }

  const groups = new Map();
  matches.forEach((certificate) => {
    const year = certificate.dateInfo ? String(certificate.dateInfo.year) : 'Date not listed';
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year).push(certificate);
  });

  groups.forEach((entries, year) => {
    const group = createElement('section', 'timeline-year-group');
    const heading = createElement('h3', 'year-label', year);
    const list = createElement('ol', 'timeline-list');
    entries.forEach((certificate) => list.append(createCertificateEntry(certificate)));
    group.append(heading, list);
    timeline.append(group);
  });
}

function initializeTimeline() {
  const certificates = validateCertificates(certificateData)
    .map((certificate, index) => ({ ...certificate, originalIndex: index }));

  renderFilters(certificates);
  renderTimeline(certificates);

  searchInput.addEventListener('input', () => renderTimeline(certificates));
  filtersContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) {
      return;
    }
    selectedCategory = button.dataset.category;
    renderFilters(certificates);
    renderTimeline(certificates);
  });
}

function initializeNavigation() {
  const header = document.querySelector('.site-header');
  const menuButton = document.getElementById('nav-toggle');
  const menu = document.getElementById('site-nav');
  const sectionLinks = Array.from(menu.querySelectorAll('a[href^="#"]'));
  const mobileViewport = window.matchMedia('(max-width: 760px)');

  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
  }

  function syncMenuToViewport() {
    menuButton.hidden = !mobileViewport.matches;
    if (mobileViewport.matches) {
      closeMenu();
    } else {
      menu.hidden = false;
      menuButton.setAttribute('aria-expanded', 'false');
    }
  }

  function updateCurrentSection() {
    const threshold = header.offsetHeight + 96;
    let activeLink = sectionLinks[0];

    sectionLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section && section.getBoundingClientRect().top <= threshold) {
        activeLink = link;
      }
    });

    sectionLinks.forEach((link) => {
      const isCurrent = link === activeLink;
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    menu.hidden = isExpanded;
    menuButton.setAttribute('aria-expanded', String(!isExpanded));
    menuButton.setAttribute('aria-label', isExpanded ? 'Open navigation menu' : 'Close navigation menu');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]') && mobileViewport.matches) {
      closeMenu();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener('resize', syncMenuToViewport);
  if (typeof mobileViewport.addEventListener === 'function') {
    mobileViewport.addEventListener('change', syncMenuToViewport);
  } else {
    mobileViewport.addListener(syncMenuToViewport);
  }
  window.addEventListener('scroll', updateCurrentSection, { passive: true });
  syncMenuToViewport();
  updateCurrentSection();
}

initializeTimeline();
initializeNavigation();
