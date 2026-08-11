document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.add('has-navigated');
  });
});

const localTime = document.querySelector('#local-time');

function updateLocalTime() {
  if (!localTime) return;
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  localTime.textContent = `Lahore · ${time} local`;
}

updateLocalTime();
window.setInterval(updateLocalTime, 60_000);

async function hydrateCourseCards() {
  const cards = [...document.querySelectorAll('[data-course-url]')];
  if (!cards.length) return;

  await Promise.all(cards.map(async (card) => {
    try {
      const response = await fetch(card.dataset.courseUrl, {
        headers: { Accept: 'text/html' },
        mode: 'cors',
      });
      if (!response.ok) throw new Error(`Certificate request failed: ${response.status}`);

      const html = await response.text();
      const documentFromCertificate = new DOMParser().parseFromString(html, 'text/html');
      const lines = (documentFromCertificate.body?.innerText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const valueAfter = (label) => {
        const index = lines.findIndex((line) => line.toLowerCase() === label.toLowerCase());
        return index >= 0 ? lines[index + 1] : '';
      };

      const title = valueAfter('Course Completed');
      const provider = valueAfter('Offered By');
      const date = valueAfter('Completion Date');
      const student = valueAfter('Student');
      if (title) card.querySelector('[data-course-title]').textContent = title;
      if (provider) card.querySelector('[data-course-provider]').textContent = provider;
      if (date) card.querySelector('[data-course-date]').textContent = `Completed ${date}`;
      if (student) card.querySelector('[data-course-student]').textContent = `Student: ${student}`;
      card.dataset.courseFetchState = 'updated';
    } catch {
      // The verified HTML remains the fallback when Skilljar blocks cross-origin fetches.
      card.dataset.courseFetchState = 'fallback';
    }
  }));
}

hydrateCourseCards();
