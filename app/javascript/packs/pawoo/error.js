import ready from '../../mastodon/ready';

ready(() => {
  const json = JSON.parse(document.getElementById('pawoo_maintenance_images').textContent);
  const image = document.querySelector('img');
  const statusCode = Number(image.dataset.pawooStatusCode);
  const defaultUrl = '/oops.png';

  const imageUrls = json.reduce((urls, data) => {
    if (data.statuses.indexOf(statusCode) > -1) {
      urls.push(...data.images);
    }
    return urls;
  }, []);

  const imageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
  image.setAttribute('src', imageUrl || defaultUrl);
});
