require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const HttpsProxyAgent = require('https-proxy-agent');

class PlaidIntitutionsGetAPI {
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

  async getInstitutions(count = 100, offset = 0, routing_numbers = []) {
    try {
      const requestBody = {
        client_id: this.clientId,
        secret: this.secret,
        count,
        offset,
        country_codes: ['US']
      };

      if (routing_numbers.length > 0) {
        requestBody.routing_numbers = routing_numbers;
      }

      const response = await this.axiosInstance.post(`${this.baseUrl}/institutions/get`, requestBody);
      return response.data;
    } catch (error) {
      console.error('Error fetching institutions:', error.response?.data || error.message);
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAllInstitutions(routing_numbers = []) {
    const institutions = [];
    let offset = 0;
    const count = 100;
    let totalInstitutions = 0;

    do {
      const result = await this.getInstitutions(count, offset, routing_numbers);
      institutions.push(...result.institutions);
      totalInstitutions = result.total;
      offset += count;

      // 1-minute delay before the next request
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

    const csvWriter = createObjectCsvWriter({
      path: 'bank_routing_numbers.csv',
      header: [
        { id: 'name', title: 'Bank Name' },
        { id: 'institution_id', title: 'Institution ID' },
        { id: 'routing_number', title: 'Routing Number' }
      ]
    });

    await csvWriter.writeRecords(bank_routing_numbers);
    console.log('bank_routing_numbers.csv file saved successfully.');
  }
}

module.exports = PlaidIntitutionsGetAPI;
