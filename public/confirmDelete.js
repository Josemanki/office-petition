const form = document.querySelector('#delete-form');

(() => {
  form.addEventListener('submit', (e) => {
    if (!confirm('Do you really want to delete your signature? We would love to have your support regarding the petition :)')) {
      e.preventDefault();
    }
  });
})();
