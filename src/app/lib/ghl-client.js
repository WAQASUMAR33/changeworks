import axios from 'axios';

class GHLClient {
  constructor() {
    // Use the correct GHL API endpoint from documentation
    const baseURL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
    
    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    // Validate API key
    if (!process.env.GHL_API_KEY) {
      console.error('GHL_API_KEY is not set in environment variables');
    } else if (process.env.GHL_API_KEY.length < 200) {
      console.warn('GHL API key seems short. Agency API keys are typically 250+ characters. You may need an Agency API key to create sub-accounts.');
    }
  }

  async createSubAccount(data) {
    try {
      // Build request data according to GHL API documentation
      const requestData = {
        name: data.businessName,
        phone: data.phone || '',
        companyId: data.companyId || process.env.GHL_COMPANY_ID, // REQUIRED field
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'GB',
        postalCode: data.postalCode || '',
        website: data.website || '',
        timezone: data.timezone || 'Europe/London',
        prospectInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        },
        ...(data.settings && { settings: data.settings }),
        ...(data.social && { social: data.social }),
        ...(data.twilio && { twilio: data.twilio }),
        ...(data.mailgun && { mailgun: data.mailgun }),
        ...(data.snapshotId && { snapshotId: data.snapshotId })
      };

      console.log('=== GHL API REQUEST ===');
      console.log('URL:', `${this.client.defaults.baseURL}/locations/`);
      console.log('Headers:', this.client.defaults.headers);
      console.log('Request Data:', JSON.stringify(requestData, null, 2));

      const response = await this.client.post('/locations/', requestData);

      console.log('=== GHL API SUCCESS RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('Response Headers:', response.headers);

      return {
        success: true,
        data: response.data,
        locationId: response.data.id || response.data.locationId
      };
    } catch (error) {
      console.error('=== GHL API ERROR RESPONSE ===');
      console.error('Error Message:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Request Config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || 500,
        details: error.response?.data || null,
        fullError: {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  }

  async getSubAccount(locationId) {
    try {
      const response = await this.client.get(`/locations/${locationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || 500
      };
    }
  }

  async updateSubAccount(locationId, data) {
    try {
      const response = await this.client.put(`/locations/${locationId}`, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || 500
      };
    }
  }

  async deleteSubAccount(locationId) {
    try {
      const response = await this.client.delete(`/locations/${locationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || 500
      };
    }
  }
}

export default GHLClient;