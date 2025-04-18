let mongoUri;

if (!process.env.DB_CONNECTION_STRING) {
  const dbConnection = process.env.DB_CONNECTION;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbDatabase = process.env.DB_DATABASE;
  const dbUser = process.env.DB_USER || '';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbAuthSource = process.env.DB_AUTH_SOURCE;
  mongoUri = `${dbConnection}://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}?authSource=${dbAuthSource}`;
} else {
  mongoUri = process.env.DB_CONNECTION_STRING;
}
// console.log(mongoUri);
module.exports = {
  mongo_uri: mongoUri
}