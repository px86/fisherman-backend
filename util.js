const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomString(length = 6) {
  let str = '';
  for (let i=0; i<length; ++i) {
    const indx = Math.floor(Math.random() * chars.length);
    str += chars[indx];
  }
  return str;
}

async function genUniqueURL(collection) {
  let length = 6;
  let url = randomString(length);
  let result = await collection.findOne({ url });
  while (result != null ) {
    url = randomString(length+1);
    result = await collection.findOne({ url });
  }
  return url;
}

module.exports = { randomString, genUniqueURL };
