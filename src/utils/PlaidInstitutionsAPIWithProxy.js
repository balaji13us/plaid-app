require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const HttpsProxyAgent = require('https-proxy-agent');

class PlaidAPI {
  constructor(useProxy = false, proxyConfig = {}) {
    this.baseUrl = 'https://sandbox.plaid.com';
    this.clientId = process.env.PLAID_CLIENT_ID;
    this.secret = process.env.PLAID_SECRET;

    if (useProxy && proxyConfig.url) {
      this.axiosInstance = axios.create({
        httpsAgent: new HttpsProxyAgent({
          host: proxyConfig.url,
          port: proxyConfig.port,
          auth: proxyConfig.username && proxyConfig.password 
            ? `${proxyConfig.username}:${proxyConfig.password}` 
            : undefined,
        })
      });
    } else {
      this.axiosInstance = axios;
    }
  }

  async getInstitutions(count = 100, offset = 0) {
    try {
      const response = await this.axiosInstance.post(`${this.baseUrl}/institutions/get`, {
        client_id: this.clientId,
        secret: this.secret,
        count,
        offset,
        country_codes: ['US']
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching institutions:', error.response?.data || error.message);
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAllInstitutions() {
    const institutions = [];
    let offset = 0;
    const count = 5; //100; // Maximum per request in Plaid
    let totalInstitutions = 0;

    do {
      const result = await this.getInstitutions(count, offset);
      institutions.push(...result.institutions);
      //totalInstitutions = result.total;
      totalInstitutions = 20
      offset += count;

      // 30 SEC delay before the next request
      await this.sleep(30000);
    } while (offset < totalInstitutions);

    return institutions;
  }

  async saveRoutingNumbersToCSV(institutions) {
    const bank_routing_numbers = [];

    institutions.forEach(institution => {
      const { name, institution_id, routing_numbers } = institution;

      routing_numbers.forEach(routing_number => {
        bank_routing_numbers.push({
          name,
          institution_id,
          routing_number
        });
      });
    });

    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: 'bank_routing_numbers.csv',
      header: [
        { id: 'name', title: 'Bank Name' },
        { id: 'institution_id', title: 'Institution ID' },
        { id: 'routing_number', title: 'Routing Number' }
      ]
    });

    // Write data to CSV
    await csvWriter.writeRecords(bank_routing_numbers);
    console.log('bank_routing_numbers.csv file saved successfully.');
  }
}

(async () => {
  const useProxy = true; // Set this flag to enable or disable proxy
  const proxyConfig = {
    url: 'proxy-server-url.com',
    port: 8080,
    username: process.env.PROXY_USER_NAME,
    password: process.env.PROXY_USER_PASSWORD
  };

  const plaidAPI = new PlaidAPI(useProxy, proxyConfig);
  try {
    const allInstitutions = await plaidAPI.getAllInstitutions();
    console.log('Total institutions retrieved:', allInstitutions.length);

    await plaidAPI.saveRoutingNumbersToCSV(allInstitutions);
  } catch (error) {
    console.error('Failed to retrieve and save all institutions:', error.message);
  }
})();
