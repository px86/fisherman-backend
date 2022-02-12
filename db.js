const mongodb = require('mongodb');

async function initCollection(client, dbName, collectionName) {
  try {
    const collection = await client.db(dbName).collection(collectionName);
    return collection;
  } catch (err) {
    console.error(`ERROR: could not initialize collection: ${err}`)
    client.close();
    process.exit(1);
  }
}

async function initDatabase(data) {
  const { dbURI, dbName, collectionName } = data;
  try {
    const client_options = {
      maxPoolSize: 50,
      wtimeoutMS: 2500
    };
    const client = await mongodb.MongoClient.connect(dbURI, client_options);
    const collection =  initCollection(client, dbName, collectionName);
    if (collection) return collection;
    else throw new Error();
  } catch (err) {
    console.error(`ERROR: could not connect to mongodb: ${err}`)
    process.exit(1);
  }
}

module.exports = initDatabase;
