const PlaidInstitutionsGetAPI = require('./PlaidInstitutionsGetAPI');

async function fetchAllInstitutions(useProxy, proxyConfig) {
  const plaidAPI = new PlaidInstitutionsGetAPI(useProxy, proxyConfig);
  try {
    const allInstitutions = await plaidAPI.getAllInstitutions();
    console.log('Total institutions retrieved:', allInstitutions.length);
    return allInstitutions;
  } catch (error) {
    console.error('Failed to retrieve all institutions:', error.message);
    throw error;
  }
}

async function fetchInstitutionsByRoutingNumbers(useProxy, proxyConfig, routingNumbers) {
  const plaidAPI = new PlaidInstitutionsGetAPI(useProxy, proxyConfig);
  try {
    const institutions = await plaidAPI.getAllInstitutions(routingNumbers);
    console.log('Institutions with specified routing numbers retrieved:', institutions.length);
    return institutions;
  } catch (error) {
    console.error('Failed to retrieve institutions by routing numbers:', error.message);
    throw error;
  }
}

module.exports = {
  fetchAllInstitutions,
  fetchInstitutionsByRoutingNumbers
};
